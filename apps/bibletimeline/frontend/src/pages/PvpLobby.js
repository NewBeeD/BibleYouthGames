import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Avatar, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Paper, Stack, Typography } from '@mui/material'
import { getPvpSocket } from '../modules/pvpSocket'
import { PvpConnectionBadge } from '../components/PvpConnectionBadge'
import { PVP_MODES } from '../modules/gameModes'

const AVATARS = ['🕺🐶', '💃🐱', '🕺🦊', '💃🐼', '🕺🦁', '💃🐨', '🕺🐸', '💃🦄', '🕺🐵', '💃🐯']

export const PvpLobby = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const [room, setRoom] = useState(null)
  const [error, setError] = useState('')
  const [confirmExitOpen, setConfirmExitOpen] = useState(false)

  const roomCode = location.state?.roomCode
  const playerId = location.state?.playerId

  const amHost = room?.hostPlayerId === playerId

  const avatarForUser = (seed = '') => {
    if(!seed){
      return AVATARS[0]
    }

    let hash = 0
    for(let index = 0; index < seed.length; index += 1){
      hash = ((hash << 5) - hash) + seed.charCodeAt(index)
      hash |= 0
    }

    return AVATARS[Math.abs(hash) % AVATARS.length]
  }

  const buildFallbackColor = (seed = '') => {
    const palette = ['#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#db2777', '#f59e0b', '#ea580c']
    const index = Math.abs(seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0)) % palette.length
    return palette[index]
  }

  useEffect(() => {
    if(!roomCode || !playerId){
      navigate('/pvp/join', { replace: true })
      return
    }

    const socket = getPvpSocket()

    const handleRoomState = (payload) => {
      if(payload?.roomCode === roomCode){
        setRoom(payload)
      }
    }

    const handleMatchStarted = (payload) => {
      if(payload?.roomCode === roomCode){
        navigate('/pvp/round', { state: { roomCode, playerId } })
      }
    }

    const handleError = (payload) => {
      if(payload?.roomCode === roomCode){
        setError(payload?.error || 'Room error')
      }
    }

    const handleRoomClosed = (payload) => {
      if(payload?.roomCode === roomCode){
        navigate('/pvp/join', { replace: true })
      }
    }

    socket.on('room_state', handleRoomState)
    socket.on('match_started', handleMatchStarted)
    socket.on('room_error', handleError)
    socket.on('room_closed', handleRoomClosed)

    socket.emit('get_room_state', { roomCode })

    return () => {
      socket.off('room_state', handleRoomState)
      socket.off('match_started', handleMatchStarted)
      socket.off('room_error', handleError)
      socket.off('room_closed', handleRoomClosed)
    }
  }, [navigate, roomCode, playerId])

  const startMatch = () => {
    const socket = getPvpSocket()
    socket.emit('start_match', { roomCode, playerId })
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

  const copyCode = async () => {
    try{
      await navigator.clipboard.writeText(roomCode || '')
    }
    catch(error){
      setError('Could not copy room code')
    }
  }

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
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.22)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Stack spacing={3}>
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
              <Typography variant='h5' sx={{ color: 'white', fontWeight: 800 }}>Waiting Room 👥</Typography>
              <PvpConnectionBadge />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent='space-between'>
              <Typography sx={{ color: 'grey.100', fontWeight: 700 }}>Game code</Typography>
              <Chip
                label={roomCode}
                color='secondary'
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.2em',
                  color: 'white',
                  fontSize: { xs: '1.05rem', sm: '1.2rem' },
                  px: 1.2,
                  py: 0.35
                }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
              <Button variant='outlined' onClick={copyCode} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.55)', backgroundColor: 'rgba(255,255,255,0.06)' }}>Copy Code</Button>
            </Stack>

            {room?.settings && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Chip
                  label={room.settings.pvpMode === PVP_MODES.RACE_THREE ? 'Mode: Race (3 Orders)' : 'Mode: Classic PvP'}
                  color='default'
                  sx={{ color: '#f3f4f6', backgroundColor: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(255,255,255,0.2)' }}
                />
                <Chip label={`Rounds: ${room.settings.roundPlan?.length || 0}`} color='default' sx={{ color: '#f3f4f6', backgroundColor: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(255,255,255,0.2)' }} />
              </Stack>
            )}

            {error && <Alert severity='error'>{error}</Alert>}

            <Grid container spacing={1.5}>
              {room?.players?.map((player) => (
                <Grid item xs={12} sm={6} md={4} key={player.playerId}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.75,
                      borderRadius: 2.4,
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.10)',
                      textAlign: 'center'
                    }}
                  >
                    <Stack spacing={1.1} alignItems='center'>
                      <Avatar
                        src={player.avatar || undefined}
                        alt={player.name}
                        sx={{
                          width: 64,
                          height: 64,
                          fontSize: '2rem',
                          bgcolor: player.avatar ? 'transparent' : buildFallbackColor(player.playerId || player.name),
                          animation: 'pvpAvatarBob 0.95s ease-in-out infinite alternate, pvpAvatarSway 1.2s ease-in-out infinite',
                          '@keyframes pvpAvatarBob': {
                            '0%': { transform: 'translateY(0px)' },
                            '100%': { transform: 'translateY(-7px)' }
                          },
                          '@keyframes pvpAvatarSway': {
                            '0%': { rotate: '-4deg' },
                            '50%': { rotate: '4deg' },
                            '100%': { rotate: '-4deg' }
                          }
                        }}
                      >
                        {!player.avatar && (player.avatarEmoji || avatarForUser(player.playerId || player.name || ''))}
                      </Avatar>
                      <Stack spacing={0.5} alignItems='center'>
                        <Typography sx={{ color: 'white', fontWeight: 700 }}>{player.name}</Typography>
                        <Chip
                          size='small'
                          label={player.connected ? 'Connected' : 'Disconnected'}
                          color={player.connected ? 'success' : 'default'}
                          sx={{ color: player.connected ? 'white' : '#e5e7eb' }}
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant='outlined'
                fullWidth
                onClick={handleExitClick}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.35)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  fontWeight: 700,
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.55)',
                    backgroundColor: 'rgba(255,255,255,0.18)'
                  }
                }}
              >
                Exit Game
              </Button>
              {amHost && (
                <Button
                  variant='contained'
                  fullWidth
                  onClick={startMatch}
                  sx={{
                    color: 'white',
                    fontWeight: 800,
                    background: 'linear-gradient(90deg, #d946ef, #06b6d4)',
                    boxShadow: '0 10px 24px rgba(6, 182, 212, 0.35)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #c026d3, #0891b2)'
                    }
                  }}
                >
                  Start Match
                </Button>
              )}
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
