import { Typography, Box, Stack, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Paper, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { HighscoreDisplay } from './HighscoreDisplay'
import { useTimeLineContext } from "../hooks/useTimeLineContext"
// import { localStorageData } from "../modules/localStorageData"
import { FindHighScore } from '../modules/FindHighScore'
import { GAME_TYPES } from '../modules/gameModes'
import { createBlankScores, normalizeUserScores } from '../modules/scoreSchema'


// Firebase Support
import { auth, db } from '../firebaseAuth/firebaseSDK'
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth'
import { signOut } from 'firebase/auth'
import { set, ref, onValue, update } from 'firebase/database'

const blankScores = createBlankScores()


export const PageTitle = () => {

  const [active, setActive] = useState(2)
  const { dispatch } = useTimeLineContext()
  const navigate = useNavigate()
  const [mode, setMode] = useState({level: 4, time: 30})
  const [gameType, setGameType] = useState(GAME_TYPES.CLASSIC)
  const [highScore, setHighScore] = useState()
  const [showSigninBtn, setShowSignInBtn] = useState(true)
  const [name, setName] = useState('')
  const [howToPlayOpen, setHowToPlayOpen] = useState(false)



  // Google authentication
  const provider = new GoogleAuthProvider()


  const signinWithGoogle = () => {

    signInWithPopup(auth, provider)
    .then(() => {
      setShowSignInBtn(false)
    })
    .catch((error) => console.log(error))
  }


  const signOutUser = () => {

    signOut(auth).then(() => {
      setShowSignInBtn(true)
    }).catch((err) => console.log(err))
  }

  
  
  
  const startGame = () => {
    if(gameType === GAME_TYPES.PVP){
      navigate('/pvp/create', { state: { data: active, diffMode: mode, gameType } })
      return
    }

    navigate('/game', { state: { data: active, diffMode: mode, gameType } })
  }

  const joinPvpGame = () => {
    navigate('/pvp/join')
  }

  const selectedCategory = active === 1 ? 'Old Testament' : active === 2 ? 'New Testament' : 'Mixed'
  const selectedDifficulty = mode.level === 4 ? 'Easy' : mode.level === 5 ? 'Medium' : 'Hard'
  const selectedMode = gameType === GAME_TYPES.PVP ? 'PvP' : gameType === GAME_TYPES.SPEED ? 'Speed' : 'Classic'
  const requiresSignin = gameType !== GAME_TYPES.PVP

  const toggleGroupSx = {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2.5,
    p: 0.4,
    '& .MuiToggleButton-root': {
      color: 'rgba(255,255,255,0.96)',
      borderColor: 'rgba(255,255,255,0.35)',
      fontWeight: 700,
      textTransform: 'none',
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 1.6
    },
    '& .MuiToggleButton-root.Mui-selected': {
      backgroundColor: 'rgba(66, 165, 245, 0.35)',
      color: 'white',
      borderColor: 'rgba(144, 202, 249, 0.95)',
      boxShadow: 'inset 0 0 0 1px rgba(144, 202, 249, 0.35)'
    },
    '& .MuiToggleButton-root:hover': {
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderColor: 'rgba(255,255,255,0.7)'
    },
    '& .MuiToggleButton-root.Mui-selected:hover': {
      backgroundColor: 'rgba(66, 165, 245, 0.45)',
      borderColor: 'rgba(187, 222, 251, 1)'
    }
  }

  useEffect(()=>{

    let unsubscribeUserData = () => {}

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {

      if(user){
        setShowSignInBtn(false)
        setName(user.displayName)
  
        const userData = ref(db, 'users/' + user.uid + '/data')

        unsubscribeUserData = onValue(userData, (snapshot) => {

          const userHighScores = snapshot.val()
          
          // Set highscores for new users
          if(userHighScores === null){

            let uid;
            let referenceData;

            uid = user.uid   
            referenceData = ref(db, 'users/' + uid)      

            set((referenceData), {

            userName: user.displayName,
            data: blankScores,
            userImg: user.photoURL
          })


            setHighScore(FindHighScore(active, mode, blankScores, gameType))
          }
          else{
            const normalizedScores = normalizeUserScores(userHighScores)
            dispatch({type: 'SET_DATA', payload: normalizedScores})
            setHighScore(FindHighScore(active, mode, normalizedScores, gameType))

            update(ref(db, 'users/' + user.uid + '/data'), normalizedScores)
              .catch((error) => console.log(error))
          }
          
        })
      }
      else{
        
        setShowSignInBtn(true)
        setHighScore(FindHighScore(active, mode, blankScores, gameType))
      }
    })

    return () => {
      unsubscribeUserData()
      unsubscribeAuth()
    }

  }, [active, mode, dispatch, gameType])
 
  
  return (

    <Box 
    display='flex'
    justifyContent="center"
    alignItems="center"
    minHeight="inherit"
    py={{ xs: 3, sm: 5 }}
    px={2}
    >

      <Paper
        elevation={10}
        sx={{
          width: '100%',
          maxWidth: 820,
          borderRadius: 4,
          p: { xs: 2.6, sm: 3.4 },
          background: 'linear-gradient(180deg, rgba(2, 6, 23, 0.97) 0%, rgba(15, 23, 42, 0.94) 100%)',
          border: '1px solid rgba(255,255,255,0.34)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.55)'
        }}
      >
        <Stack spacing={2.4}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} justifyContent='space-between' alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Box>
              <Typography component='h1' sx={{ typography: { sm: 'h3', xs: 'h4' }, color: 'white', fontWeight: 700 }}>
                Bible TimeLine
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                Choose your setup and jump in.
              </Typography>
            </Box>
            {!showSigninBtn && <Chip label={`Welcome ${name || 'Player'}`} color='secondary' sx={{ color: 'white' }} />}
          </Stack>

          <Box sx={{
            border: '1px solid rgba(144, 202, 249, 0.55)',
            borderRadius: 3,
            py: 1.5,
            px: 2,
            textAlign: 'center',
            backgroundColor: 'rgba(30, 41, 59, 0.86)'
          }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.82)', letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>
              Current Setup
            </Typography>
            <Typography sx={{ color: 'white', mt: 0.4, fontWeight: 600 }}>
              {selectedCategory} · {selectedDifficulty} · {selectedMode}
            </Typography>
          </Box>

          <HighscoreDisplay highscore={highScore}/>

          <Stack spacing={1.2}>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Category</Typography>
            <ToggleButtonGroup
              exclusive
              value={active}
              onChange={(_, newValue) => newValue && setActive(newValue)}
              fullWidth
              sx={toggleGroupSx}
            >
              <ToggleButton value={1}>Old Testament</ToggleButton>
              <ToggleButton value={2}>New Testament</ToggleButton>
              <ToggleButton value={3}>Mixed</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack spacing={1.2}>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Difficulty</Typography>
            <ToggleButtonGroup
              exclusive
              value={mode.level}
              onChange={(_, newValue) => {
                if(newValue === 4){ setMode({level: 4, time: 30}) }
                if(newValue === 5){ setMode({level: 5, time: 40}) }
                if(newValue === 6){ setMode({level: 6, time: 50}) }
              }}
              fullWidth
              sx={toggleGroupSx}
            >
              <ToggleButton value={4}>Easy</ToggleButton>
              <ToggleButton value={5}>Medium</ToggleButton>
              <ToggleButton value={6}>Hard</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack spacing={1.2}>
            <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Game Mode</Typography>
            <ToggleButtonGroup
              exclusive
              value={gameType}
              onChange={(_, newValue) => newValue && setGameType(newValue)}
              fullWidth
              sx={toggleGroupSx}
            >
              <ToggleButton value={GAME_TYPES.CLASSIC}>Classic</ToggleButton>
              <ToggleButton value={GAME_TYPES.SPEED}>Speed</ToggleButton>
              <ToggleButton value={GAME_TYPES.PVP}>PvP</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
            <Button variant='contained' fullWidth onClick={startGame} disabled={requiresSignin && showSigninBtn} sx={{ background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)', '&.Mui-disabled': { color: 'rgba(255,255,255,0.65)', backgroundColor: 'rgba(255,255,255,0.2)' } }}><Typography variant='h6' sx={{color: 'white'}}>{gameType === GAME_TYPES.PVP ? 'Create Match' : 'Start Game'}</Typography></Button>
            {gameType === GAME_TYPES.PVP &&
              <Button variant='contained' color='secondary' fullWidth onClick={joinPvpGame} sx={{ background: 'linear-gradient(90deg, #7c4dff 0%, #1976d2 100%)', '&.Mui-disabled': { color: 'rgba(255,255,255,0.65)', backgroundColor: 'rgba(255,255,255,0.2)' } }}>
                <Typography sx={{color: 'white'}}>Join Match</Typography>
              </Button>
            }
            <Button variant='outlined' fullWidth onClick={() => setHowToPlayOpen(true)} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(15, 23, 42, 0.78)' }}><Typography sx={{color: 'white'}}>How to Play</Typography></Button>
          </Stack>

          {!showSigninBtn &&
            <Stack direction='row' spacing={1.2}>
              <Button variant='outlined' fullWidth onClick={() => navigate('/leaderboard')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(15, 23, 42, 0.78)' }}>
                <Typography sx={{ color: 'white', letterSpacing: 1.2}}>Leaderboard</Typography>
              </Button>
            </Stack>
          }

        <Dialog open={howToPlayOpen} onClose={() => setHowToPlayOpen(false)}>
          <DialogTitle component='div' sx={{ pb: 1 }}>
            <Typography variant='h5'>How to Play</Typography>
          </DialogTitle>
          <DialogTitle component='div' sx={{ pt: 0 }}>
            <Typography variant='body1'>Current selection: {gameType === GAME_TYPES.PVP ? 'PvP' : gameType === GAME_TYPES.SPEED ? 'Speed' : 'Classic'}</Typography>
          </DialogTitle>

          <DialogContent>
            <DialogContentText>
              Core objective: drag and drop Bible events into the correct chronological order.
            </DialogContentText>
            <Divider sx={{marginY: '10px'}}/>

            <DialogContentText>
              Classic Mode: solve one ordering puzzle. Difficulty controls puzzle size (Easy 4, Medium 5, Hard 6 events).
            </DialogContentText>
            <Divider sx={{marginY: '10px'}}/>

            <DialogContentText>
              Speed Mode: solve as many puzzles as possible before the timer ends. Unlimited attempts during the timer.
            </DialogContentText>
            <Divider sx={{marginY: '10px'}}/>

            <DialogContentText>
              PvP Classic: players share the same round puzzle, submit once per round, and round points are shown on the leaderboard.
            </DialogContentText>
            <Divider sx={{marginY: '10px'}}/>

            <DialogContentText>
              PvP Race (3 Orders): each round has 3 shared problems. Players can retry each problem unlimited times. Each correctly completed problem gives 1 point. First player to complete all 3 ends the round for everyone.
            </DialogContentText>
            <Divider sx={{marginY: '10px'}}/>

            <DialogContentText>
              PvP rounds are timed. If time runs out, the round closes for all players and points are calculated from completed answers.
            </DialogContentText>
            <Divider sx={{marginY: '10px'}}/>

            <DialogContentText>
              At match end, total points across rounds decide the final leaderboard and podium (top 3 players).
            </DialogContentText>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setHowToPlayOpen(false)}>OK</Button>
          </DialogActions>
        </Dialog>

        {showSigninBtn && requiresSignin && 
        <Stack marginTop={1}>
          <Typography sx={{ color: 'white', textAlign: 'center' }}>Sign in to save scores to leaderboard</Typography>
        </Stack>
        }

        <Stack marginTop={1} spacing={1}>

          {/* <Button variant='contained'><Typography sx={{ color: 'white'}}>SignIn</Typography></Button> */}

          {showSigninBtn &&  (<Button variant='contained' onClick={signinWithGoogle} sx={{ backgroundColor: 'secondary.main' }}><Typography sx={{ color: 'white', letterSpacing: 2}}>Sign In with Google</Typography></Button>)}

        </Stack>

        {!showSigninBtn && <Stack marginTop={1}>
          <Button variant='outlined' onClick={signOutUser} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(15, 23, 42, 0.78)' }}><Typography sx={{ letterSpacing: 1, color: 'white'}}>Logout</Typography></Button>
        </Stack>}

      </Stack>
      </Paper>



    </Box>


    
  )
}
