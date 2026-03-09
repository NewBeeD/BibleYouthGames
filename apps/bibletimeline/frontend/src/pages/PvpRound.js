import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { getPvpSocket } from '../modules/pvpSocket'
import { getLevelName, PVP_MODES } from '../modules/gameModes'
import { PvpConnectionBadge } from '../components/PvpConnectionBadge'

export const PvpRound = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const roomCode = location.state?.roomCode
  const playerId = location.state?.playerId

  const [round, setRound] = useState(null)
  const [data, setData] = useState([])
  const [challengeLists, setChallengeLists] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [pvpMode, setPvpMode] = useState(PVP_MODES.CLASSIC)
  const [, setCompletedChallenges] = useState({})
  const [myCompletedCount, setMyCompletedCount] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [hostPlayerId, setHostPlayerId] = useState(null)
  const [confirmExitOpen, setConfirmExitOpen] = useState(false)

  const amHost = hostPlayerId === playerId
  const raceChallenges = round?.challenges || []
  const totalRaceChallenges = raceChallenges.length || 3
  const activeRaceChallenge = pvpMode === PVP_MODES.RACE_THREE ? raceChallenges[myCompletedCount] : null

  const roundLabel = useMemo(() => {
    if(!round){
      return ''
    }

    if(pvpMode === PVP_MODES.RACE_THREE){
      return `${getLevelName(round.difficultyLevel)} Race (Round ${round.roundNumber}/${round.totalRounds})`
    }

    return `${getLevelName(round.difficultyLevel)} (Round ${round.roundNumber}/${round.totalRounds})`
  }, [round, pvpMode])

  useEffect(() => {
    if(!roomCode || !playerId){
      navigate('/pvp/join', { replace: true })
      return
    }

    const socket = getPvpSocket()

    const hydrateRaceRound = (payload) => {
      const challenges = payload?.challenges || []
      const lists = challenges.reduce((accumulator, challenge) => {
        accumulator[challenge.challengeId] = challenge.events || []
        return accumulator
      }, {})

      setChallengeLists(lists)
      setCompletedChallenges({})
      setMyCompletedCount(0)
      setFeedback('')
    }

    const handleRoundStarted = (payload) => {
      if(payload?.roomCode !== roomCode){
        return
      }

      setRound(payload)
      const incomingMode = payload?.pvpMode || PVP_MODES.CLASSIC
      setPvpMode(incomingMode)

      if(incomingMode === PVP_MODES.RACE_THREE){
        hydrateRaceRound(payload)
        return
      }

      setData(payload.events || [])
      setChallengeLists({})
      setCompletedChallenges({})
      setMyCompletedCount(0)
      setFeedback('')
    }

    const handleRoundEnded = (payload) => {
      if(payload?.roomCode !== roomCode){
        return
      }

      navigate('/pvp/results', {
        state: {
          roomCode,
          playerId,
          roundResults: payload
        }
      })
    }

    const handleRoomState = (payload) => {
      if(payload?.roomCode !== roomCode){
        return
      }

      setHostPlayerId(payload?.hostPlayerId || null)
      const incomingMode = payload?.settings?.pvpMode || PVP_MODES.CLASSIC
      setPvpMode(incomingMode)

      if(payload?.activeRound){
        setRound(payload.activeRound)

        if(incomingMode === PVP_MODES.RACE_THREE){
          const challenges = payload.activeRound.challenges || []
          setChallengeLists((previous) => {
            if(Object.keys(previous).length > 0){
              return previous
            }

            return challenges.reduce((accumulator, challenge) => {
              accumulator[challenge.challengeId] = challenge.events || []
              return accumulator
            }, {})
          })

          const progress = payload.activeRound.progressByPlayer || {}
          setMyCompletedCount(Number(progress[playerId]) || 0)
          return
        }

        setData(payload.activeRound.events || [])
      }
    }

    const handleProblemFeedback = (payload) => {
      if(payload?.roomCode !== roomCode || payload?.roundId !== round?.roundId){
        return
      }

      if(payload?.playerId !== playerId){
        return
      }

      if(payload?.isCorrect){
        if(!payload?.challengeId){
          setFeedback(`Correct! +${payload?.pointsAwarded || 0} points`)
          return
        }

        const challengeId = payload?.challengeId
        setCompletedChallenges((previous) => ({ ...previous, [challengeId]: true }))
        setMyCompletedCount(payload?.completedCount || 0)
        setFeedback(`Correct! +${payload?.pointsAwarded || 0} points (${payload?.completedCount || 0}/${payload?.totalChallenges || 3})`)
      }
      else{
        setFeedback(payload?.error || 'Not correct yet, keep trying!')
      }
    }

    const handleRaceProgressUpdate = (payload) => {
      if(payload?.roomCode !== roomCode || payload?.roundId !== round?.roundId){
        return
      }

      if(payload?.playerId !== playerId){
        return
      }

      setMyCompletedCount(Number(payload?.completedCount) || 0)
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

    socket.on('round_started', handleRoundStarted)
    socket.on('round_ended', handleRoundEnded)
    socket.on('room_state', handleRoomState)
    socket.on('room_closed', handleRoomClosed)
    socket.on('room_error', handleRoomError)
    socket.on('problem_feedback', handleProblemFeedback)
    socket.on('race_progress_update', handleRaceProgressUpdate)

    socket.emit('get_room_state', { roomCode })

    return () => {
      socket.off('round_started', handleRoundStarted)
      socket.off('round_ended', handleRoundEnded)
      socket.off('room_state', handleRoomState)
      socket.off('room_closed', handleRoomClosed)
      socket.off('room_error', handleRoomError)
      socket.off('problem_feedback', handleProblemFeedback)
      socket.off('race_progress_update', handleRaceProgressUpdate)
    }
  }, [navigate, roomCode, playerId, round?.roundId])

  useEffect(() => {
    if(!round?.endsAt){
      return
    }

    const update = () => {
      const now = Date.now()
      const seconds = Math.max(0, Math.ceil((round.endsAt - now) / 1000))
      setTimeLeft(seconds)
    }

    update()

    const intervalId = setInterval(update, 300)

    return () => clearInterval(intervalId)
  }, [round])

  const handleDragDrop = (result) => {
    const { source, destination } = result

    if(!destination){
      return
    }

    if(source.index === destination.index){
      return
    }

    if(pvpMode === PVP_MODES.RACE_THREE){
      const activeDroppableId = source?.droppableId || destination?.droppableId
      if(!activeDroppableId){
        return
      }

      setChallengeLists((previous) => {
        const list = Array.from(previous[activeDroppableId] || [])
        const [reordered] = list.splice(source.index, 1)
        list.splice(destination.index, 0, reordered)

        return {
          ...previous,
          [activeDroppableId]: list
        }
      })
      return
    }

    const items = Array.from(data)
    const [reordered] = items.splice(source.index, 1)
    items.splice(destination.index, 0, reordered)
    setData(items)
  }

  const submitClassicOrder = () => {
    if(!round || timeLeft <= 0){
      return
    }

    const submittedOrder = data.map((eventItem) => eventItem.id)

    const socket = getPvpSocket()
    socket.emit('submit_order', {
      roomCode,
      playerId,
      roundId: round.roundId,
      submittedOrder
    })
  }

  const submitRaceChallenge = (challengeId) => {
    if(!round || !challengeId || timeLeft <= 0){
      return
    }

    const order = challengeLists[challengeId] || []
    const submittedOrder = order.map((eventItem) => eventItem.id)

    const socket = getPvpSocket()
    socket.emit('submit_problem_order', {
      roomCode,
      playerId,
      roundId: round.roundId,
      challengeId,
      submittedOrder
    })
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

  return (
    <Box
      minHeight='100vh'
      sx={{
        background: 'radial-gradient(circle at top, #06b6d4 0%, #4f46e5 40%, #0f172a 100%)',
        py: { xs: 3, sm: 5 },
        px: { xs: 1.5, sm: 2.5 }
      }}
    >
      <Container maxWidth='md'>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.22)'
          }}
        >
          <Stack spacing={2}>
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
              <Typography variant='h5' sx={{ color: 'white', fontWeight: 700 }}>PvP Round ⚡</Typography>
              <Stack direction='row' spacing={1}>
                <PvpConnectionBadge />
                <Button
                  size='small'
                  variant='outlined'
                  color='error'
                  onClick={handleExitClick}
                  sx={{ minWidth: 72, px: 1.5, py: 0.35, fontSize: '0.76rem' }}
                >
                  Exit
                </Button>
              </Stack>
            </Stack>

            {error && <Alert severity='error'>{error}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} justifyContent='space-between'>
              <Chip label={roundLabel || 'Waiting for round...'} color='secondary' sx={{ color: 'white' }} />
              <Chip label={`Time left: ${timeLeft}s`} color={timeLeft <= 5 ? 'warning' : 'default'} sx={{ color: '#f3f4f6' }} />
            </Stack>

            <Typography sx={{ color: 'grey.400', fontSize: '0.86rem' }}>
              Mobile tip: press and hold an event, then drag to reorder.
            </Typography>

            {pvpMode === PVP_MODES.RACE_THREE && (
              <Chip label={`Completed: ${myCompletedCount}/${totalRaceChallenges}`} color='info' sx={{ color: '#f3f4f6', alignSelf: 'flex-start' }} />
            )}

            <DragDropContext onDragEnd={handleDragDrop}>
              {pvpMode === PVP_MODES.RACE_THREE
                ? (
                    activeRaceChallenge
                      ? (
                    <Paper
                      key={activeRaceChallenge.challengeId}
                      elevation={0}
                      sx={{
                        p: 1.2,
                        mb: 1,
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.16)',
                        backgroundColor: 'rgba(255,255,255,0.04)'
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                          <Typography sx={{ color: 'white', fontWeight: 600 }}>Problem {myCompletedCount + 1}</Typography>
                          <Chip
                            size='small'
                            label='In Progress'
                            color='default'
                            sx={{ color: '#f3f4f6' }}
                          />
                        </Stack>

                        <Droppable droppableId={activeRaceChallenge.challengeId}>
                          {(provided) => (
                            <List {...provided.droppableProps} ref={provided.innerRef} sx={{ width: '100%', textAlign: 'center', p: 0 }}>
                              {(challengeLists[activeRaceChallenge.challengeId] || []).map((point, index) => (
                                <Draggable key={`${activeRaceChallenge.challengeId}-${point.id}`} draggableId={`${activeRaceChallenge.challengeId}-${point.id}`} index={index} shouldRespectForcePress={false}>
                                  {(dragProvided) => (
                                    <Paper
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      style={dragProvided.draggableProps.style}
                                      elevation={0}
                                      sx={{
                                        mb: 1,
                                        borderRadius: 2,
                                        border: '1px solid rgba(255,255,255,0.16)',
                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                        touchAction: 'none',
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none'
                                      }}
                                    >
                                      <ListItem>
                                        <ListItemText
                                          primary={point.event}
                                          primaryTypographyProps={{ fontSize: { xs: '15px', sm: '18px' }, color: 'white' }}
                                        />
                                      </ListItem>
                                    </Paper>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </List>
                          )}
                        </Droppable>

                        <Button
                          variant='contained'
                          onClick={() => submitRaceChallenge(activeRaceChallenge.challengeId)}
                          disabled={timeLeft <= 0}
                        >
                          Check Order (+5)
                        </Button>
                      </Stack>
                    </Paper>
                      )
                      : (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.16)',
                            backgroundColor: 'rgba(255,255,255,0.04)'
                          }}
                        >
                          <Typography sx={{ color: 'white', textAlign: 'center' }}>Waiting for round to end...</Typography>
                        </Paper>
                      )
                  )
                : (
                  <Droppable droppableId='pvp-list'>
                    {(provided) => (
                      <List
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        sx={{ width: '100%', textAlign: 'center', p: 0 }}
                      >
                        {data.map((point, index) => (
                          <Draggable key={point.id} draggableId={point.id.toString()} index={index} shouldRespectForcePress={false}>
                            {(dragProvided) => (
                              <Paper
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={dragProvided.draggableProps.style}
                                elevation={0}
                                sx={{
                                  mb: 1,
                                  borderRadius: 2,
                                  border: '1px solid rgba(255,255,255,0.16)',
                                  backgroundColor: 'rgba(255,255,255,0.06)',
                                  touchAction: 'none',
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none'
                                }}
                              >
                                <ListItem>
                                  <ListItemText
                                    primary={point.event}
                                    primaryTypographyProps={{ fontSize: { xs: '15px', sm: '18px' }, color: 'white' }}
                                  />
                                </ListItem>
                              </Paper>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </List>
                    )}
                  </Droppable>
                )}
            </DragDropContext>

            {pvpMode === PVP_MODES.CLASSIC && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant='contained' fullWidth onClick={submitClassicOrder} disabled={timeLeft <= 0}>
                  Submit
                </Button>
              </Stack>
            )}

            {feedback && <Typography sx={{ color: 'grey.300', textAlign: 'center' }}>{feedback}</Typography>}

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
