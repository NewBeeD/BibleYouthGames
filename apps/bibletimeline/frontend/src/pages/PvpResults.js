import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Avatar, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, Stack, Typography } from '@mui/material'
import { getPvpSocket } from '../modules/pvpSocket'
import { auth } from '../firebaseAuth/firebaseSDK'
import { upsertPvpCategoryStats } from '../modules/firebaseScores'
import { PvpConnectionBadge } from '../components/PvpConnectionBadge'

export const PvpResults = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const roomCode = location.state?.roomCode
  const playerId = location.state?.playerId

  const [results, setResults] = useState(location.state?.roundResults || null)
  const [room, setRoom] = useState(null)
  const [finalBoard, setFinalBoard] = useState(null)
  const [error, setError] = useState('')
  const [confirmExitOpen, setConfirmExitOpen] = useState(false)
  const hasSavedFinalStats = useRef(false)

  const amHost = useMemo(() => room?.hostPlayerId === playerId, [room, playerId])

  useEffect(() => {
    if(!roomCode || !playerId){
      navigate('/pvp/join', { replace: true })
      return
    }

    const socket = getPvpSocket()

    const handleRoundEnded = (payload) => {
      if(payload?.roomCode === roomCode){
        setResults(payload)
      }
    }

    const handleRoundStarted = (payload) => {
      if(payload?.roomCode === roomCode){
        navigate('/pvp/round', { state: { roomCode, playerId } })
      }
    }

    const handleMatchEnded = (payload) => {
      if(payload?.roomCode === roomCode){
        setFinalBoard(payload)
      }
    }

    const handleRoomState = (payload) => {
      if(payload?.roomCode === roomCode){
        setRoom(payload)
      }
    }

    const handleRoomClosed = (payload) => {
      if(payload?.roomCode === roomCode){
        navigate('/pvp/join', { replace: true })
      }
    }

    const handleRoomError = (payload) => {
      if(payload?.roomCode === roomCode){
        setError(payload?.error || 'Room error')
      }
    }

    socket.on('round_ended', handleRoundEnded)
    socket.on('round_started', handleRoundStarted)
    socket.on('match_ended', handleMatchEnded)
    socket.on('room_state', handleRoomState)
    socket.on('room_closed', handleRoomClosed)
    socket.on('room_error', handleRoomError)

    socket.emit('get_room_state', { roomCode })

    return () => {
      socket.off('round_ended', handleRoundEnded)
      socket.off('round_started', handleRoundStarted)
      socket.off('match_ended', handleMatchEnded)
      socket.off('room_state', handleRoomState)
      socket.off('room_closed', handleRoomClosed)
      socket.off('room_error', handleRoomError)
    }
  }, [navigate, roomCode, playerId])

  const nextRound = () => {
    const socket = getPvpSocket()
    socket.emit('next_round', { roomCode, playerId })
  }

  const board = finalBoard?.leaderboard || results?.leaderboard || []
  const podium = board.slice(0, 3)
  const medalForIndex = (index) => {
    if(index === 0){ return '🥇' }
    if(index === 1){ return '🥈' }
    if(index === 2){ return '🥉' }
    return null
  }

  const avatarSx = {
    width: 38,
    height: 38,
    fontSize: '1rem',
    bgcolor: 'rgba(255,255,255,0.18)',
    animation: 'pvpAvatarBob 0.95s ease-in-out infinite alternate, pvpAvatarSway 1.2s ease-in-out infinite',
    '@keyframes pvpAvatarBob': {
      '0%': { transform: 'translateY(0px)' },
      '100%': { transform: 'translateY(-4px)' }
    },
    '@keyframes pvpAvatarSway': {
      '0%': { rotate: '-3deg' },
      '50%': { rotate: '3deg' },
      '100%': { rotate: '-3deg' }
    }
  }

  const leaveGame = () => {
    const socket = getPvpSocket()
    socket.emit('leave_room', { roomCode, playerId })
    navigate('/', { replace: true })
  }

  const handleExitClick = () => {
    if(amHost){
      leaveGame()
      return
    }

    setConfirmExitOpen(true)
  }

  useEffect(() => {
    const persistFinalStats = async () => {
      if(!finalBoard || hasSavedFinalStats.current){
        return
      }

      const user = auth.currentUser
      if(!user){
        return
      }

      const me = finalBoard.leaderboard?.find((entry) => entry.uid && entry.uid === user.uid)
      if(!me){
        return
      }

      const winner = finalBoard.leaderboard?.[0]
      const didWin = winner?.uid && winner.uid === user.uid

      hasSavedFinalStats.current = true
      await upsertPvpCategoryStats({
        categoryMode: finalBoard.category,
        points: me.totalPoints || 0,
        won: didWin
      })
    }

    persistFinalStats().catch(() => {
      hasSavedFinalStats.current = false
    })
  }, [finalBoard])

  return (
    <Box
      minHeight='100vh'
      sx={{
        background: 'radial-gradient(circle at top, #06b6d4 0%, #4f46e5 40%, #0f172a 100%)',
        py: { xs: 3, sm: 6 },
        px: { xs: 1.5, sm: 2.5 }
      }}
    >
      <Container maxWidth='md'>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 3.2,
            backgroundColor: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.22)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Stack spacing={2.2}>
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
              <Typography variant='h5' sx={{ color: 'white', fontWeight: 700 }}>
                {finalBoard ? '🎉 Final Podium' : `🏁 Leaderboard - Round ${results?.roundNumber || '-'}`}
              </Typography>
              <Stack direction='row' spacing={1}>
                <PvpConnectionBadge />
                <Button size='small' variant='outlined' color='error' onClick={handleExitClick} sx={{ borderColor: 'rgba(255,255,255,0.35)', color: 'white' }}>Exit</Button>
              </Stack>
            </Stack>

            {error && <Alert severity='error'>{error}</Alert>}

            {finalBoard && podium.length > 0 && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
                {podium[1] && (
                  <Paper
                    key={`podium-${podium[1].playerId}`}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      flex: 1,
                      borderRadius: 2.4,
                      minHeight: { sm: 112 },
                      border: '1px solid rgba(203,213,225,0.65)',
                      background: 'linear-gradient(135deg, rgba(203,213,225,0.32), rgba(71,85,105,0.24))'
                    }}
                  >
                    <Stack spacing={0.7} alignItems='center'>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>🥈</Typography>
                      <Avatar src={podium[1].avatar || ''} alt={podium[1].name} sx={avatarSx}>
                        {!podium[1].avatar && (podium[1].avatarEmoji || '🕺🐶')}
                      </Avatar>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>{podium[1].name}</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.86rem' }}>{podium[1].totalPoints || 0} pts</Typography>
                    </Stack>
                  </Paper>
                )}

                {podium[0] && (
                  <Paper
                    key={`podium-${podium[0].playerId}`}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      flex: 1,
                      borderRadius: 2.4,
                      minHeight: { sm: 144 },
                      border: '1px solid rgba(253,224,71,0.75)',
                      background: 'linear-gradient(135deg, rgba(250,204,21,0.34), rgba(249,115,22,0.24))'
                    }}
                  >
                    <Stack spacing={0.7} alignItems='center'>
                      <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.4rem' }}>🥇</Typography>
                      <Avatar src={podium[0].avatar || ''} alt={podium[0].name} sx={avatarSx}>
                        {!podium[0].avatar && (podium[0].avatarEmoji || '🕺🐶')}
                      </Avatar>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>{podium[0].name}</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.86rem' }}>{podium[0].totalPoints || 0} pts</Typography>
                    </Stack>
                  </Paper>
                )}

                {podium[2] && (
                  <Paper
                    key={`podium-${podium[2].playerId}`}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      flex: 1,
                      borderRadius: 2.4,
                      minHeight: { sm: 96 },
                      border: '1px solid rgba(217,119,6,0.75)',
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(194,65,12,0.25))'
                    }}
                  >
                    <Stack spacing={0.7} alignItems='center'>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>🥉</Typography>
                      <Avatar src={podium[2].avatar || ''} alt={podium[2].name} sx={avatarSx}>
                        {!podium[2].avatar && (podium[2].avatarEmoji || '🕺🐶')}
                      </Avatar>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>{podium[2].name}</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.86rem' }}>{podium[2].totalPoints || 0} pts</Typography>
                    </Stack>
                  </Paper>
                )}
              </Stack>
            )}

            <Stack spacing={1}>
              {board.map((entry, index) => (
                <Paper
                  key={entry.playerId}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: index === 0 ? '1px solid rgba(253,224,71,0.65)' : '1px solid rgba(255,255,255,0.22)',
                    backgroundColor: index === 0 ? 'rgba(250,204,21,0.14)' : 'rgba(255,255,255,0.10)'
                  }}
                >
                  <Stack direction='row' spacing={1.5} alignItems='center' justifyContent='space-between'>
                    <Stack direction='row' spacing={1.2} alignItems='center'>
                      <Chip size='small' label={medalForIndex(index) ? `${medalForIndex(index)} ${index + 1}` : `${index + 1}`} color={index === 0 ? 'secondary' : 'default'} sx={{ color: index === 0 ? 'white' : '#f3f4f6' }} />
                      <Avatar src={entry.avatar || ''} alt={entry.name} sx={avatarSx}>
                        {!entry.avatar && (entry.avatarEmoji || '🕺🐶')}
                      </Avatar>
                      <Typography sx={{ color: 'white', fontWeight: 600 }}>{entry.name}</Typography>
                    </Stack>

                    <Typography sx={{ color: 'white', fontWeight: 700, minWidth: 72, textAlign: 'right' }}>{entry.totalPoints || 0} pts</Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {!finalBoard && amHost && <Button variant='contained' fullWidth onClick={nextRound} sx={{ background: 'linear-gradient(90deg, #d946ef, #06b6d4)', color: 'white', fontWeight: 700 }}>Next Round</Button>}
              {!finalBoard && !amHost && <Typography sx={{ color: 'grey.300', alignSelf: 'center' }}>Waiting for host to continue...</Typography>}
            </Stack>

            <Dialog open={confirmExitOpen} onClose={() => setConfirmExitOpen(false)}>
              <DialogTitle>Leave Match?</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  If you leave now, you will exit this PvP match and return to home.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmExitOpen(false)}>Cancel</Button>
                <Button color='error' onClick={leaveGame}>Exit Match</Button>
              </DialogActions>
            </Dialog>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
