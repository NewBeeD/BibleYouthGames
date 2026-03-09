import { io } from 'socket.io-client'

const SERVER_URL = process.env.PVP_SERVER_URL || 'http://localhost:4000'
const ROUND_COUNT = 6

const createClient = (name) => {
  const socket = io(SERVER_URL, { transports: ['websocket'], autoConnect: true })
  return {
    name,
    socket,
    playerId: null,
    roomCode: null,
    roundsSeen: 0,
    roundEndedCount: 0,
    finalBoard: null
  }
}

const waitForConnect = (client) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`Connect timeout for ${client.name}`)), 6000)
    client.socket.once('connect', () => {
      clearTimeout(timeoutId)
      resolve()
    })
    client.socket.once('connect_error', (error) => {
      clearTimeout(timeoutId)
      reject(error)
    })
  })
}

const emitAck = (socket, event, payload) => {
  return new Promise((resolve) => {
    socket.emit(event, payload, (response) => resolve(response))
  })
}

const waitFor = (socket, event, timeoutMs = 7000, predicate = () => true) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      socket.off(event, handler)
      reject(new Error(`Timeout waiting for ${event}`))
    }, timeoutMs)

    const handler = (payload) => {
      if(!predicate(payload)){
        return
      }

      clearTimeout(timeoutId)
      socket.off(event, handler)
      resolve(payload)
    }

    socket.on(event, handler)
  })
}

const bindAutoPlay = (client, allClients) => {
  client.socket.on('round_started', (payload) => {
    if(payload?.roomCode !== client.roomCode){
      return
    }

    client.roundsSeen += 1
    console.log(`${client.name}: round_started ${payload.roundNumber}/${payload.totalRounds}`)

    const submitDelayMs = client.name === 'Host' ? 140 : 240

    setTimeout(() => {
      client.socket.emit('submit_order', {
        roomCode: client.roomCode,
        playerId: client.playerId,
        roundId: payload.roundId,
        isCorrect: true,
        submittedOrder: payload.correctOrder
      })
    }, submitDelayMs)
  })

  client.socket.on('round_ended', (payload) => {
    if(payload?.roomCode !== client.roomCode){
      return
    }

    client.roundEndedCount += 1
    console.log(`${client.name}: round_ended ${payload.roundNumber}/${payload.totalRounds} reason=${payload.reason}`)

    if(client.name === 'Host' && payload.roundNumber < ROUND_COUNT){
      setTimeout(() => {
        client.socket.emit('next_round', {
          roomCode: client.roomCode,
          playerId: client.playerId
        })
      }, 120)
    }
  })

  client.socket.on('match_ended', (payload) => {
    if(payload?.roomCode !== client.roomCode){
      return
    }

    client.finalBoard = payload
    console.log(`${client.name}: match_ended`) 
  })

  client.socket.on('room_error', (payload) => {
    if(payload?.roomCode === client.roomCode){
      console.log(`${client.name}: room_error ${payload?.error || 'unknown'}`)
    }
  })
}

const main = async () => {
  const host = createClient('Host')
  const joiner = createClient('Joiner')
  const clients = [host, joiner]

  try {
    await Promise.all(clients.map(waitForConnect))

    bindAutoPlay(host, clients)
    bindAutoPlay(joiner, clients)

    const created = await emitAck(host.socket, 'create_room', {
      host: { name: 'Host', avatar: '', uid: 'host-smoke' },
      settings: { category: 2, maxPlayers: 2, roundPlan: [4, 4, 4, 5, 5, 6] }
    })

    if(!created?.ok){
      throw new Error(`create_room failed: ${created?.error || 'unknown error'}`)
    }

    host.roomCode = created.roomCode
    host.playerId = created.playerId

    const joined = await emitAck(joiner.socket, 'join_room', {
      roomCode: host.roomCode,
      player: { name: 'Joiner', avatar: '', uid: 'joiner-smoke' }
    })

    if(!joined?.ok){
      throw new Error(`join_room failed: ${joined?.error || 'unknown error'}`)
    }

    joiner.roomCode = joined.roomCode
    joiner.playerId = joined.playerId

    host.socket.emit('set_ready', { roomCode: host.roomCode, playerId: host.playerId, ready: true })
    joiner.socket.emit('set_ready', { roomCode: joiner.roomCode, playerId: joiner.playerId, ready: true })

    await waitFor(host.socket, 'room_state', 7000, (payload) => {
      if(payload?.roomCode !== host.roomCode){
        return false
      }

      return payload.players?.length === 2 && payload.players.every((player) => player.ready)
    })

    host.socket.emit('start_match', { roomCode: host.roomCode, playerId: host.playerId })

    await waitFor(host.socket, 'match_ended', 300000, (payload) => payload?.roomCode === host.roomCode)
    await new Promise((resolve) => setTimeout(resolve, 300))

    const checks = [
      host.roundsSeen === ROUND_COUNT,
      joiner.roundsSeen === ROUND_COUNT,
      host.roundEndedCount === ROUND_COUNT,
      joiner.roundEndedCount === ROUND_COUNT,
      Array.isArray(host.finalBoard?.leaderboard) && host.finalBoard.leaderboard.length === 2
    ]

    if(checks.some((ok) => !ok)){
      throw new Error(`Smoke assertions failed: ${JSON.stringify({
        hostRounds: host.roundsSeen,
        joinerRounds: joiner.roundsSeen,
        hostRoundEnded: host.roundEndedCount,
        joinerRoundEnded: joiner.roundEndedCount,
        leaderboardSize: host.finalBoard?.leaderboard?.length || 0
      })}`)
    }

    console.log('PVP_SMOKE_OK')
    console.log(JSON.stringify({
      roomCode: host.roomCode,
      rounds: host.roundsSeen,
      leaderboard: host.finalBoard.leaderboard
    }))
  }
  finally {
    clients.forEach((client) => {
      client.socket.removeAllListeners()
      client.socket.disconnect()
    })
  }
}

main().catch((error) => {
  console.error('PVP_SMOKE_FAIL')
  console.error(String(error))
  process.exitCode = 1
})
