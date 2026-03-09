import { createServer } from 'http'
import { existsSync, createReadStream } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Server } from 'socket.io'
import { allData, newTestamentEvents, oldTestamentEvents } from '../../frontend/src/data/csvjson.js'

const PORT = Number(process.env.PORT || 4000)
const ROUND_PLAN_DEFAULT = [4, 4, 4, 5, 5, 6]
const PVP_MODES = {
  CLASSIC: 'classic',
  RACE_THREE: 'race_three'
}
const RACE_THREE_PROBLEM_COUNT = 3
const RACE_THREE_POINTS_PER_COMPLETION = 5
const CLASSIC_PVP_TIMER_BY_DIFFICULTY = {
  4: 30,
  5: 50,
  6: 90
}
const RACE_PVP_ROUND_SECONDS = 90
const CLASSIC_MAX_TIME_BONUS_BY_DIFFICULTY = {
  4: 15,
  5: 20,
  6: 25
}
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendBuildDir = path.resolve(__dirname, '../../frontend/build')
const frontendIndexPath = path.join(frontendBuildDir, 'index.html')

const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase()

  if(ext === '.html'){ return 'text/html; charset=utf-8' }
  if(ext === '.js'){ return 'application/javascript; charset=utf-8' }
  if(ext === '.css'){ return 'text/css; charset=utf-8' }
  if(ext === '.json'){ return 'application/json; charset=utf-8' }
  if(ext === '.svg'){ return 'image/svg+xml' }
  if(ext === '.png'){ return 'image/png' }
  if(ext === '.jpg' || ext === '.jpeg'){ return 'image/jpeg' }
  if(ext === '.ico'){ return 'image/x-icon' }
  if(ext === '.txt'){ return 'text/plain; charset=utf-8' }
  if(ext === '.webmanifest'){ return 'application/manifest+json; charset=utf-8' }

  return 'application/octet-stream'
}

const tryServeStaticFile = (req, res) => {
  if(!existsSync(frontendBuildDir)){
    return false
  }

  const requestPath = decodeURIComponent((req.url || '/').split('?')[0])
  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath
  const requestedFilePath = path.normalize(path.join(frontendBuildDir, normalizedPath))

  if(!requestedFilePath.startsWith(frontendBuildDir)){
    return false
  }

  if(!existsSync(requestedFilePath)){
    return false
  }

  res.writeHead(200, { 'Content-Type': getContentType(requestedFilePath) })
  createReadStream(requestedFilePath).pipe(res)
  return true
}

const server = createServer((req, res) => {
  if(req.url === '/health'){
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  const servedStatic = tryServeStaticFile(req, res)
  if(servedStatic){
    return
  }

  if(existsSync(frontendIndexPath)){
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    createReadStream(frontendIndexPath).pipe(res)
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Bible Timeline PvP server running')
})
const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

const rooms = new Map()

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

const isOrderCorrect = (correctOrder, submittedOrder) => {
  if(!Array.isArray(correctOrder) || !Array.isArray(submittedOrder)){
    return false
  }

  if(correctOrder.length !== submittedOrder.length){
    return false
  }

  return correctOrder.every((value, index) => Number(value) === Number(submittedOrder[index]))
}

const calculateClassicRoundPoints = ({ isCorrect, difficultyLevel, timerSeconds, endsAt, submittedAt }) => {
  if(!isCorrect){
    return 0
  }

  const safeDifficulty = Math.min(6, Math.max(4, Number(difficultyLevel) || 4))
  const difficultyWeight = safeDifficulty - 3
  const correctnessPoints = difficultyWeight * 5

  const safeTimerSeconds = Number(timerSeconds)
  const fallbackTimer = CLASSIC_PVP_TIMER_BY_DIFFICULTY[safeDifficulty] || 30
  const totalRoundMs = Math.max(1, (Number.isFinite(safeTimerSeconds) && safeTimerSeconds > 0 ? safeTimerSeconds : fallbackTimer) * 1000)
  const safeEndsAt = Number(endsAt)
  const safeSubmittedAt = Number(submittedAt)
  const referenceSubmittedAt = Number.isFinite(safeSubmittedAt) ? safeSubmittedAt : Date.now()
  const remainingMs = Math.max(0, (Number.isFinite(safeEndsAt) ? safeEndsAt : referenceSubmittedAt) - referenceSubmittedAt)
  const speedRatio = Math.min(1, remainingMs / totalRoundMs)
  const maxBonus = CLASSIC_MAX_TIME_BONUS_BY_DIFFICULTY[safeDifficulty] || 15
  const speedBonus = Math.round(maxBonus * speedRatio)

  return Math.max(0, Math.round(correctnessPoints + speedBonus))
}

const getClassicTimerSecondsForDifficulty = (difficultyLevel) => {
  const safeDifficulty = Math.min(6, Math.max(4, Number(difficultyLevel) || 4))
  return CLASSIC_PVP_TIMER_BY_DIFFICULTY[safeDifficulty] || 30
}

const pickDataByCategory = (category) => {
  if(category === 1){ return oldTestamentEvents }
  if(category === 2){ return newTestamentEvents }
  return allData
}

const createRoomCode = () => {
  let tries = 0
  while(tries < 1000){
    const code = String(randomInt(100000, 999999))
    if(!rooms.has(code)){
      return code
    }
    tries += 1
  }

  return null
}

const randomUniqueIndexes = (size, maxExclusive) => {
  const values = new Set()
  while(values.size < size){
    values.add(randomInt(0, maxExclusive - 1))
  }
  return [...values]
}

const shuffle = (arr) => {
  const copy = [...arr]
  for(let i = copy.length - 1; i > 0; i -= 1){
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

const createRoundChallenges = ({ source, roomCode, roundNumber, difficultyLevel, challengeCount }) => {
  const itemCount = Math.min(difficultyLevel, source.length)

  return Array.from({ length: challengeCount }, (_, index) => {
    const indexes = randomUniqueIndexes(itemCount, source.length)
    const events = indexes.map((idx) => source[idx]).filter(Boolean)

    return {
      challengeId: `${roomCode}-${roundNumber}-challenge-${index + 1}`,
      events: shuffle(events),
      correctOrder: [...events].sort((a, b) => a.id - b.id).map((item) => item.id)
    }
  })
}

const emitRoomState = (room) => {
  const payload = {
    roomCode: room.code,
    hostPlayerId: room.hostPlayerId,
    status: room.status,
    players: room.players.map((player) => ({
      playerId: player.playerId,
      name: player.name,
      avatar: player.avatar,
      avatarEmoji: player.avatarEmoji,
      uid: player.uid,
      ready: player.ready,
      connected: player.connected,
      totalPoints: player.totalPoints
    })),
    settings: {
      category: room.settings.category,
      maxPlayers: room.settings.maxPlayers,
      pvpMode: room.settings.pvpMode,
      roundPlan: room.roundPlan
    },
    activeRound: room.activeRound
      ? {
          roundId: room.activeRound.roundId,
          roundNumber: room.activeRound.roundNumber,
          totalRounds: room.activeRound.totalRounds,
          difficultyLevel: room.activeRound.difficultyLevel,
          endsAt: room.activeRound.endsAt,
          events: room.activeRound.events,
          challenges: room.activeRound.challenges,
          progressByPlayer: Object.fromEntries(room.activeRound.progressByPlayer || new Map())
        }
      : null
  }

  io.to(room.code).emit('room_state', payload)
}

const getLeaderboard = (room, roundPointsMap = new Map()) => {
  return [...room.players]
    .map((player) => ({
      playerId: player.playerId,
      name: player.name,
      avatar: player.avatar,
      avatarEmoji: player.avatarEmoji,
      uid: player.uid,
      roundPoints: roundPointsMap.get(player.playerId) || 0,
      totalPoints: player.totalPoints
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
}

const closeRoomForEveryone = (room, reason = 'Room closed') => {
  if(!room){
    return
  }

  if(room.roundTimeout){
    clearTimeout(room.roundTimeout)
    room.roundTimeout = null
  }

  io.to(room.code).emit('room_closed', {
    roomCode: room.code,
    reason
  })

  rooms.delete(room.code)
}

const endRound = (room, reason) => {
  if(!room.activeRound){
    return
  }

  if(room.roundTimeout){
    clearTimeout(room.roundTimeout)
    room.roundTimeout = null
  }

  const roundPoints = new Map()

  room.players.forEach((player) => {
    const points = room.activeRound.roundPoints.get(player.playerId) || 0
    roundPoints.set(player.playerId, points)
  })

  room.status = 'round_results'
  const leaderboard = getLeaderboard(room, roundPoints)
  const payload = {
    roomCode: room.code,
    reason,
    pvpMode: room.settings.pvpMode,
    roundNumber: room.activeRound.roundNumber,
    totalRounds: room.activeRound.totalRounds,
    leaderboard
  }

  io.to(room.code).emit('round_ended', payload)
  room.lastRoundPayload = payload

  const isLastRound = room.roundIndex === room.roundPlan.length - 1
  if(isLastRound){
    room.status = 'finished'
    const finalPayload = {
      roomCode: room.code,
      category: room.settings.category,
      pvpMode: room.settings.pvpMode,
      leaderboard: getLeaderboard(room)
    }
    io.to(room.code).emit('match_ended', finalPayload)
  }

  room.activeRound = null

  emitRoomState(room)
}

const startRound = (room) => {
  if(room.roundIndex >= room.roundPlan.length){
    room.status = 'finished'
    const finalPayload = {
      roomCode: room.code,
      category: room.settings.category,
      pvpMode: room.settings.pvpMode,
      leaderboard: getLeaderboard(room)
    }
    io.to(room.code).emit('match_ended', finalPayload)
    emitRoomState(room)
    return
  }

  room.status = 'in_round'

  const difficultyLevel = room.roundPlan[room.roundIndex]
  const timerSeconds = room.settings.pvpMode === PVP_MODES.CLASSIC
    ? getClassicTimerSecondsForDifficulty(difficultyLevel)
    : RACE_PVP_ROUND_SECONDS
  const source = pickDataByCategory(room.settings.category)

  const isRaceMode = room.settings.pvpMode === PVP_MODES.RACE_THREE
  const challengeCount = isRaceMode ? RACE_THREE_PROBLEM_COUNT : 1
  const challenges = createRoundChallenges({
    source,
    roomCode: room.code,
    roundNumber: room.roundIndex + 1,
    difficultyLevel,
    challengeCount
  })
  const singleChallenge = challenges[0]

  const now = Date.now()
  const activeRound = {
    roundId: `${room.code}-${room.roundIndex + 1}-${now}`,
    roundNumber: room.roundIndex + 1,
    totalRounds: room.roundPlan.length,
    difficultyLevel,
    timerSeconds,
    startsAt: now,
    endsAt: now + timerSeconds * 1000,
    events: singleChallenge?.events || [],
    challenges: challenges.map((challenge) => ({
      challengeId: challenge.challengeId,
      events: challenge.events
    })),
    challengeAnswers: new Map(challenges.map((challenge) => [challenge.challengeId, challenge.correctOrder])),
    completedByPlayer: new Map(),
    progressByPlayer: new Map(),
    submissions: new Map(),
    roundPoints: new Map()
  }

  room.activeRound = activeRound

  const payload = {
    roomCode: room.code,
    roundId: activeRound.roundId,
    roundNumber: activeRound.roundNumber,
    totalRounds: activeRound.totalRounds,
    pvpMode: room.settings.pvpMode,
    difficultyLevel: activeRound.difficultyLevel,
    timerSeconds,
    endsAt: activeRound.endsAt,
    events: activeRound.events,
    challenges: activeRound.challenges
  }

  io.to(room.code).emit('round_started', payload)
  io.to(room.code).emit('match_started', { roomCode: room.code })
  emitRoomState(room)

  room.roundTimeout = setTimeout(() => {
    endRound(room, 'timer_ended')
  }, timerSeconds * 1000)
}

io.on('connection', (socket) => {
  socket.on('create_room', (payload, callback) => {
    const roomCode = createRoomCode()
    if(!roomCode){
      callback?.({ ok: false, error: 'Could not allocate room code' })
      return
    }

    const playerId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`
    const hostName = payload?.host?.name || 'Host'

    const room = {
      code: roomCode,
      hostPlayerId: playerId,
      status: 'lobby',
      settings: {
        category: payload?.settings?.category || 2,
        maxPlayers: Math.min(20, Math.max(2, Number(payload?.settings?.maxPlayers) || 4)),
        pvpMode: payload?.settings?.pvpMode === PVP_MODES.RACE_THREE ? PVP_MODES.RACE_THREE : PVP_MODES.CLASSIC
      },
      roundPlan:
        Array.isArray(payload?.settings?.roundPlan) && payload.settings.roundPlan.length > 0
          ? payload.settings.roundPlan
              .map((level) => Number(level) || 4)
              .map((level) => Math.min(6, Math.max(4, level)))
          : ROUND_PLAN_DEFAULT,
      players: [
        {
          playerId,
          socketId: socket.id,
          name: hostName,
          avatar: payload?.host?.avatar || '',
          avatarEmoji: payload?.host?.avatarEmoji || '🕺🐶',
          uid: payload?.host?.uid || null,
          ready: true,
          connected: true,
          totalPoints: 0
        }
      ],
      roundIndex: 0,
      activeRound: null,
      roundTimeout: null,
      lastRoundPayload: null
    }

    rooms.set(roomCode, room)
    socket.join(roomCode)

    callback?.({ ok: true, roomCode, playerId })
    emitRoomState(room)
  })

  socket.on('join_room', (payload, callback) => {
    const roomCode = String(payload?.roomCode || '').trim()
    const room = rooms.get(roomCode)

    if(!room){
      callback?.({ ok: false, error: 'Room not found' })
      return
    }

    if(room.status !== 'lobby'){
      callback?.({ ok: false, error: 'Match already started' })
      return
    }

    if(room.players.length >= room.settings.maxPlayers){
      callback?.({ ok: false, error: 'Room is full' })
      return
    }

    const playerId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`

    room.players.push({
      playerId,
      socketId: socket.id,
      name: payload?.player?.name || 'Player',
      avatar: payload?.player?.avatar || '',
      avatarEmoji: payload?.player?.avatarEmoji || '🕺🐶',
      uid: payload?.player?.uid || null,
      ready: true,
      connected: true,
      totalPoints: 0
    })

    socket.join(roomCode)

    callback?.({ ok: true, roomCode, playerId })
    emitRoomState(room)
  })

  socket.on('get_room_state', (payload) => {
    const roomCode = String(payload?.roomCode || '').trim()
    const room = rooms.get(roomCode)
    if(room){
      emitRoomState(room)
      if(room.lastRoundPayload && room.status === 'round_results'){
        socket.emit('round_ended', room.lastRoundPayload)
      }
    }
  })

  socket.on('set_ready', (payload) => {
    const room = rooms.get(String(payload?.roomCode || '').trim())
    if(!room || room.status !== 'lobby'){
      return
    }

    const player = room.players.find((item) => item.playerId === payload?.playerId)
    if(!player){
      return
    }

    player.ready = Boolean(payload?.ready)
    emitRoomState(room)
  })

  socket.on('start_match', (payload) => {
    const room = rooms.get(String(payload?.roomCode || '').trim())
    if(!room || room.status !== 'lobby'){
      return
    }

    if(room.hostPlayerId !== payload?.playerId){
      socket.emit('room_error', { roomCode: room.code, error: 'Only host can start the match' })
      return
    }

    const hasEnoughPlayers = room.players.length > 1
    if(!hasEnoughPlayers){
      socket.emit('room_error', { roomCode: room.code, error: 'At least 2 players are required' })
      return
    }

    room.roundIndex = 0
    startRound(room)
  })

  socket.on('submit_order', (payload) => {
    const room = rooms.get(String(payload?.roomCode || '').trim())
    if(!room || room.status !== 'in_round' || !room.activeRound){
      return
    }

    if(room.settings.pvpMode !== PVP_MODES.CLASSIC){
      return
    }

    if(room.activeRound.roundId !== payload?.roundId){
      return
    }

    const player = room.players.find((item) => item.playerId === payload?.playerId)
    if(!player){
      return
    }

    const firstChallenge = room.activeRound.challenges[0]
    const correctOrder = room.activeRound.challengeAnswers.get(firstChallenge?.challengeId) || []
    const submittedOrder = Array.isArray(payload?.submittedOrder) ? payload.submittedOrder.map((item) => Number(item)) : []
    const isCorrect = isOrderCorrect(correctOrder, submittedOrder)
    const submittedAt = Date.now()
    const existingSubmission = room.activeRound.submissions.get(player.playerId)
    const previousPoints = room.activeRound.roundPoints.get(player.playerId) || 0
    const canAwardPoints = isCorrect && previousPoints === 0
    const pointsAwarded = canAwardPoints
      ? calculateClassicRoundPoints({
          isCorrect,
          difficultyLevel: room.activeRound.difficultyLevel,
          timerSeconds: room.activeRound.timerSeconds,
          endsAt: room.activeRound.endsAt,
          submittedAt
        })
      : 0

    if(pointsAwarded > 0){
      room.activeRound.roundPoints.set(player.playerId, pointsAwarded)
      player.totalPoints += pointsAwarded
    }

    room.activeRound.submissions.set(player.playerId, {
      isCorrect,
      submittedOrder,
      submittedAt,
      pointsAwarded,
      attemptCount: (existingSubmission?.attemptCount || 0) + 1
    })

    socket.emit('problem_feedback', {
      roomCode: room.code,
      roundId: room.activeRound.roundId,
      playerId: player.playerId,
      isCorrect,
      pointsAwarded,
      timerSeconds: room.activeRound.timerSeconds,
      difficultyLevel: room.activeRound.difficultyLevel
    })

    emitRoomState(room)

    const allPlayersCorrect = room.players.every((entry) => room.activeRound.submissions.get(entry.playerId)?.isCorrect === true)
    if(allPlayersCorrect){
      endRound(room, 'all_correct_submitted')
    }
  })

  socket.on('submit_problem_order', (payload) => {
    const room = rooms.get(String(payload?.roomCode || '').trim())
    if(!room || room.status !== 'in_round' || !room.activeRound){
      return
    }

    if(room.settings.pvpMode !== PVP_MODES.RACE_THREE){
      return
    }

    if(room.activeRound.roundId !== payload?.roundId){
      return
    }

    const player = room.players.find((item) => item.playerId === payload?.playerId)
    if(!player){
      return
    }

    const challengeId = String(payload?.challengeId || '').trim()
    if(!challengeId || !room.activeRound.challengeAnswers.has(challengeId)){
      return
    }

    const completedCountBefore = room.activeRound.progressByPlayer.get(player.playerId) || 0
    const expectedChallenge = room.activeRound.challenges[completedCountBefore]
    const expectedChallengeId = expectedChallenge?.challengeId

    if(expectedChallengeId && challengeId !== expectedChallengeId){
      socket.emit('problem_feedback', {
        roomCode: room.code,
        roundId: room.activeRound.roundId,
        challengeId,
        playerId: player.playerId,
        isCorrect: false,
        completedCount: completedCountBefore,
        totalChallenges: room.activeRound.challenges.length,
        error: 'Complete the current active problem first'
      })
      return
    }

    const submittedOrder = Array.isArray(payload?.submittedOrder) ? payload.submittedOrder.map((item) => Number(item)) : []
    const correctOrder = room.activeRound.challengeAnswers.get(challengeId)
    const isCorrect = isOrderCorrect(correctOrder, submittedOrder)

    if(!isCorrect){
      socket.emit('problem_feedback', {
        roomCode: room.code,
        roundId: room.activeRound.roundId,
        challengeId,
        playerId: player.playerId,
        isCorrect: false,
        completedCount: room.activeRound.progressByPlayer.get(player.playerId) || 0,
        totalChallenges: room.activeRound.challenges.length
      })
      return
    }

    const completedSet = room.activeRound.completedByPlayer.get(player.playerId) || new Set()
    if(completedSet.has(challengeId)){
      socket.emit('problem_feedback', {
        roomCode: room.code,
        roundId: room.activeRound.roundId,
        challengeId,
        playerId: player.playerId,
        isCorrect: true,
        pointsAwarded: 0,
        completedCount: completedSet.size,
        totalChallenges: room.activeRound.challenges.length
      })
      return
    }

    completedSet.add(challengeId)
    room.activeRound.completedByPlayer.set(player.playerId, completedSet)

    const completedCount = completedSet.size
    room.activeRound.progressByPlayer.set(player.playerId, completedCount)

    const previousPoints = room.activeRound.roundPoints.get(player.playerId) || 0
    const nextPoints = previousPoints + RACE_THREE_POINTS_PER_COMPLETION
    room.activeRound.roundPoints.set(player.playerId, nextPoints)
    player.totalPoints += RACE_THREE_POINTS_PER_COMPLETION

    socket.emit('problem_feedback', {
      roomCode: room.code,
      roundId: room.activeRound.roundId,
      challengeId,
      playerId: player.playerId,
      isCorrect: true,
      pointsAwarded: RACE_THREE_POINTS_PER_COMPLETION,
      completedCount,
      totalChallenges: room.activeRound.challenges.length
    })

    io.to(room.code).emit('race_progress_update', {
      roomCode: room.code,
      roundId: room.activeRound.roundId,
      playerId: player.playerId,
      completedCount,
      totalChallenges: room.activeRound.challenges.length
    })

    emitRoomState(room)

    if(completedCount >= room.activeRound.challenges.length){
      endRound(room, 'player_finished')
    }
  })

  socket.on('next_round', (payload) => {
    const room = rooms.get(String(payload?.roomCode || '').trim())
    if(!room || room.status !== 'round_results'){
      return
    }

    if(room.hostPlayerId !== payload?.playerId){
      socket.emit('room_error', { roomCode: room.code, error: 'Only host can continue' })
      return
    }

    room.roundIndex += 1
    startRound(room)
  })

  socket.on('leave_room', (payload) => {
    const roomCode = String(payload?.roomCode || '').trim()
    const room = rooms.get(roomCode)
    if(!room){
      return
    }

    const playerId = payload?.playerId
    if(!playerId){
      return
    }

    if(room.hostPlayerId === playerId){
      closeRoomForEveryone(room, 'Host left the game')
      return
    }

    room.players = room.players.filter((player) => player.playerId !== playerId)
    socket.leave(roomCode)

    if(room.players.length === 0){
      closeRoomForEveryone(room, 'Room is empty')
      return
    }

    emitRoomState(room)
  })

  socket.on('disconnect', () => {
    rooms.forEach((room, roomCode) => {
      const disconnectedPlayer = room.players.find((player) => player.socketId === socket.id)
      if(!disconnectedPlayer){
        return
      }

      if(disconnectedPlayer.playerId === room.hostPlayerId){
        closeRoomForEveryone(room, 'Host disconnected')
        return
      }

      let changed = false

      room.players.forEach((player) => {
        if(player.socketId === socket.id){
          player.connected = false
          changed = true
        }
      })

      if(changed){
        emitRoomState(room)
      }

      if(room.players.every((player) => !player.connected)){
        if(room.roundTimeout){
          clearTimeout(room.roundTimeout)
        }
        rooms.delete(roomCode)
      }
    })
  })
})

server.listen(PORT, () => {
  console.log(`PvP websocket server running on port ${PORT}`)
})
