import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Container, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { ensurePvpSocketConnected, emitPvpAck, getPvpServerUrl } from '../modules/pvpSocket'
import { GAME_TYPES, PVP_MODES } from '../modules/gameModes'
import { PvpConnectionBadge } from '../components/PvpConnectionBadge'
import { getPvpAnimalAvatars, loadPvpIdentity, savePvpIdentity } from '../modules/pvpIdentity'

export const PvpCreateMatch = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const avatars = getPvpAnimalAvatars()
  const initialIdentity = loadPvpIdentity()

  const selected = location.state || { data: 2, diffMode: { level: 4, time: 30 }, gameType: GAME_TYPES.PVP }
  const [displayName, setDisplayName] = useState(initialIdentity.name)
  const [avatarIndex, setAvatarIndex] = useState(initialIdentity.avatarIndex)
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [roundCount, setRoundCount] = useState(6)
  const [pvpMode, setPvpMode] = useState(PVP_MODES.CLASSIC)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const categoryName = useMemo(() => {
    if(selected.data === 1){ return 'Old Testament' }
    if(selected.data === 2){ return 'New Testament' }
    return 'Mixed'
  }, [selected.data])

  const adjustRounds = (step) => {
    setRoundCount((previous) => Math.min(20, Math.max(1, previous + step)))
  }

  const adjustMaxPlayers = (step) => {
    setMaxPlayers((previous) => Math.min(20, Math.max(2, previous + step)))
  }

  const cycleAvatar = (step) => {
    setAvatarIndex((previous) => {
      const count = avatars.length
      return (previous + step + count) % count
    })
  }

  const createGame = async () => {
    if(submitting){
      return
    }

    setSubmitting(true)
    setError('')

    try{
      const socket = await ensurePvpSocketConnected()
      const difficultyLevel = Number(selected?.diffMode?.level) || 4
      const safeRoundCount = Math.min(20, Math.max(1, Number(roundCount) || 1))
      const roundPlan = Array.from({ length: safeRoundCount }, () => difficultyLevel)

      const response = await emitPvpAck(socket, 'create_room', {
        host: {
          name: displayName || 'Player',
          avatar: '',
          avatarEmoji: avatars[avatarIndex],
          uid: null
        },
        settings: {
          category: selected.data,
          maxPlayers,
          roundPlan,
          pvpMode
        }
      })

      if(!response?.ok){
        setError(response?.error || 'Could not create game room')
        return
      }

      savePvpIdentity({
        name: displayName,
        avatarIndex
      })

      navigate('/pvp/lobby', {
        state: {
          roomCode: response.roomCode,
          playerId: response.playerId,
          host: true
        }
      })
    }
    catch(error){
      setError(`Cannot reach PvP server at ${getPvpServerUrl()}. Start server (cd server ; npm install ; npm start) and try again.`)
    }
    finally{
      setSubmitting(false)
    }
  }

  return (
    <Box
      minHeight='100vh'
      sx={{
        background: 'radial-gradient(circle at top, #1d4ed8 0%, #312e81 40%, #0f172a 100%)',
        py: { xs: 4, sm: 7 },
        px: { xs: 1.5, sm: 2.5 },
        fontFamily: 'Inter, Segoe UI, Arial, Helvetica, sans-serif'
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
          <Stack spacing={3}>
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
              <Typography variant='h5' sx={{ color: 'white', fontWeight: 700 }}>Create PvP Match 🎮</Typography>
              <PvpConnectionBadge />
            </Stack>

            <Typography sx={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
              Choose a PvP mode and number of rounds.
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>Category: {categoryName}</Typography>

            <TextField
              label='Display name'
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              fullWidth
              size='small'
              sx={{
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.85)' },
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.38)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.58)' },
                '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.78)' }
              }}
            />

            <Paper elevation={0} sx={{ p: 1.3, borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Typography sx={{ color: 'grey.200', fontWeight: 700, mb: 1 }}>Dancing animal avatar</Typography>
              <Stack direction='row' spacing={1.3} alignItems='center' justifyContent='center'>
                <Button variant='outlined' onClick={() => cycleAvatar(-1)} sx={{ minWidth: 54, height: 46, borderColor: 'rgba(255,255,255,0.5)', color: 'white', backgroundColor: 'rgba(255,255,255,0.05)' }}><RemoveRoundedIcon /></Button>
                <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', minWidth: 88, textAlign: 'center' }}>{avatars[avatarIndex]}</Typography>
                <Button variant='outlined' onClick={() => cycleAvatar(1)} sx={{ minWidth: 54, height: 46, borderColor: 'rgba(255,255,255,0.5)', color: 'white', backgroundColor: 'rgba(255,255,255,0.05)' }}><AddRoundedIcon /></Button>
              </Stack>
            </Paper>

            <FormControl fullWidth size='medium'>
              <InputLabel id='pvp-mode-label' sx={{ color: 'rgba(255,255,255,0.85)' }}>PvP mode</InputLabel>
              <Select
              labelId='pvp-mode-label'
              label='PvP mode'
              value={pvpMode}
              onChange={(event) => setPvpMode(event.target.value)}
              sx={{
                color: 'white',
                minHeight: 58,
                fontSize: '1rem',
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.55)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#90caf9' },
                '.MuiSvgIcon-root': { color: 'white' }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'rgba(17, 24, 39, 0.98)',
                    color: 'white'
                  }
                }
              }}
            >
              <MenuItem value={PVP_MODES.CLASSIC}>Classic PvP (single order per round)</MenuItem>
              <MenuItem value={PVP_MODES.RACE_THREE}>Race (3 orders, first finisher ends round)</MenuItem>
              </Select>
            </FormControl>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Paper elevation={0} sx={{ flex: 1, p: 1.3, borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: 'grey.200', fontWeight: 700, mb: 1 }}>Number of rounds</Typography>
                <Stack direction='row' spacing={1.3} alignItems='center' justifyContent='center'>
                  <Button variant='outlined' onClick={() => adjustRounds(-1)} sx={{ minWidth: 54, height: 46, borderColor: 'rgba(255,255,255,0.5)', color: 'white', backgroundColor: 'rgba(255,255,255,0.05)' }}><RemoveRoundedIcon /></Button>
                  <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', minWidth: 40, textAlign: 'center' }}>{roundCount}</Typography>
                  <Button variant='outlined' onClick={() => adjustRounds(1)} sx={{ minWidth: 54, height: 46, borderColor: 'rgba(255,255,255,0.5)', color: 'white', backgroundColor: 'rgba(255,255,255,0.05)' }}><AddRoundedIcon /></Button>
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ flex: 1, p: 1.3, borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: 'grey.200', fontWeight: 700, mb: 1 }}>Max players</Typography>
                <Stack direction='row' spacing={1.3} alignItems='center' justifyContent='center'>
                  <Button variant='outlined' onClick={() => adjustMaxPlayers(-1)} sx={{ minWidth: 54, height: 46, borderColor: 'rgba(255,255,255,0.5)', color: 'white', backgroundColor: 'rgba(255,255,255,0.05)' }}><RemoveRoundedIcon /></Button>
                  <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.25rem', minWidth: 40, textAlign: 'center' }}>{maxPlayers}</Typography>
                  <Button variant='outlined' onClick={() => adjustMaxPlayers(1)} sx={{ minWidth: 54, height: 46, borderColor: 'rgba(255,255,255,0.5)', color: 'white', backgroundColor: 'rgba(255,255,255,0.05)' }}><AddRoundedIcon /></Button>
                </Stack>
              </Paper>
            </Stack>

            {error && <Alert severity='error'>{error}</Alert>}

            <Stack spacing={1.5}>
              <Button variant='contained' fullWidth onClick={createGame} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create & Go To Lobby'}
              </Button>
              <Button variant='outlined' fullWidth onClick={() => navigate('/')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.55)', backgroundColor: 'rgba(255,255,255,0.05)' }}>Back</Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
