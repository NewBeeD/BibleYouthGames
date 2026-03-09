import { Avatar, Box, Typography, Stack, Button, Skeleton, Container, Paper, ToggleButtonGroup, ToggleButton, Chip } from "@mui/material"

import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useState, useEffect } from "react"
import { sortDifficultyMode } from "../modules/SortDifficultyMode";
import { Link } from "react-router-dom";

// Firebase Database config
import { db } from "../firebaseAuth/firebaseSDK";
import { ref, onValue } from 'firebase/database'
import { leaderboardData } from "../modules/leaderboardEntries";


// const dataPoints = [
//     {name: 'Danphil', easyscore: '9', mediumscore: '7', hardscore: '4', difficulty: 'easy', mode: 'newtestament'},
//     {name: 'Lee', easyscore: '11', mediumscore: '3', hardscore: '2', difficulty: 'easy', mode: 'oldtestament'},
//     {name: 'Kalinda', easyscore: '5', mediumscore: '4', hardscore: '8', difficulty: 'medium', mode: 'newtestament'},
//     {name: 'Yuvanka', easyscore: '4', mediumscore: '8', hardscore: '1', difficulty: 'hard', mode: 'oldtestament'},
//     {name: 'Phillippa', easyscore: '8', mediumscore: '9', hardscore: '3', difficulty: 'easy', mode: 'newtestament'},
//     {name: 'Johnny', easyscore: '15', mediumscore: '5', hardscore: '4', difficulty: 'medium', mode: 'mixed'},
//     {name: 'Greg', easyscore: '9', mediumscore: '0', hardscore: '7', difficulty: 'hard', mode: 'oldtestament'},
//     {name: 'Gerrald', easyscore: '3', mediumscore: '0', hardscore: '1', difficulty: 'easy', mode: 'newtestament'}
    
//   ]



export const LeaderBoard = () => {

  const [allUserData, setAllUserData] = useState([])
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)


  useEffect(() =>{
    
    const userData = ref(db, 'users/')

    const unsubscribe = onValue(userData, (snapshot) => {

      let highScore = snapshot.val()
      const playerDataOrganized = leaderboardData(highScore)
      const firstEntry = playerDataOrganized.filter(modeName => modeName.mode === 'newtestament' && modeName.gameType === 'classic')
      setAllUserData(playerDataOrganized)
      setData(firstEntry)
      setIsLoading(false)
      
    }, () => {
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Problem function
  // const initialPrint = allUserData.filter(modeName => modeName.mode === 'newtestament')

  // console.log(initialPrint);

  const [color, setColor] = useState('newtestament')
  const [gameType, setGameType] = useState('classic')
  const [arrow, setArrow] = useState({easy: false, medium: false, hard: false, wins: false, totalPoints: false, bestMatch: false})

  // This function is used to filter the user data by game mode category
  const filterData = (gameMode, selectedGameType = gameType) => {
 
    let newScores = allUserData.filter(modeName => modeName.mode === gameMode && modeName.gameType === selectedGameType)
    setData(newScores)
    setColor(gameMode)
  }

  const handleModeChange = (event, gameMode) => {
    if(gameMode){
      filterData(gameMode, gameType)
    }
  }

  const handleGameTypeChange = (event, selectedGameType) => {
    if(selectedGameType){
      setGameType(selectedGameType)
      filterData(color, selectedGameType)
    }
  }

  // This is a sorting function by organizing datapoint from high to low (vice-versa)
  const sortFunction = (difficultyMode) => {

    switch(difficultyMode){

      case 'easy':
        setArrow({...arrow, easy: !arrow.easy})
        setData(sortDifficultyMode(data, arrow, color, 'easy', gameType))
        break;
      
      case 'medium':
        setArrow({...arrow, medium: !arrow.medium})
        setData(sortDifficultyMode(data, arrow, color, 'medium', gameType))
        break;

      case 'hard':
        setArrow({...arrow, hard: !arrow.hard})
        setData(sortDifficultyMode(data, arrow, color, 'hard', gameType))
        break;

      case 'wins':
        setArrow({...arrow, wins: !arrow.wins})
        setData(sortDifficultyMode(data, arrow, color, 'wins', gameType))
        break;

      case 'totalPoints':
        setArrow({...arrow, totalPoints: !arrow.totalPoints})
        setData(sortDifficultyMode(data, arrow, color, 'totalPoints', gameType))
        break;

      case 'bestMatch':
        setArrow({...arrow, bestMatch: !arrow.bestMatch})
        setData(sortDifficultyMode(data, arrow, color, 'bestMatch', gameType))
        break;
      
      default:
        break;
    }

    
    
  }
  
  
  return (
      <Box
        minHeight='100vh'
        sx={{
          background: 'radial-gradient(circle at 10% 10%, #1f4aa5 0%, #173174 35%, #1f2833 65%, #0b0c10 100%)',
          py: { xs: 3, sm: 6 }
        }}
      >
      <Container maxWidth='lg'>
        <Stack spacing={3}>
          <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={1.5}>
            <Box>
              <Typography variant='h4' sx={{ color: 'white', fontWeight: 700 }}>Leaderboard</Typography>
              <Typography sx={{ color: 'grey.300' }}>Compare scores across category and game mode.</Typography>
            </Box>
            <Link to='/' style={{textDecoration: 'none'}}>
              <Button variant='outlined' sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>Home</Button>
            </Link>
          </Stack>

          <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: 3, backgroundColor: 'rgba(11, 12, 16, 0.88)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Stack spacing={2}>
              <ToggleButtonGroup
                exclusive
                value={color}
                onChange={handleModeChange}
                fullWidth
                sx={{ '& .MuiToggleButton-root': { color: '#f3f4f6' }, '& .Mui-selected': { color: 'white !important' } }}
              >
                <ToggleButton value='oldtestament'>Old Testament</ToggleButton>
                <ToggleButton value='newtestament'>New Testament</ToggleButton>
                <ToggleButton value='mixed'>Mixed</ToggleButton>
              </ToggleButtonGroup>

              <ToggleButtonGroup
                exclusive
                value={gameType}
                onChange={handleGameTypeChange}
                fullWidth
                sx={{ '& .MuiToggleButton-root': { color: '#f3f4f6' }, '& .Mui-selected': { color: 'white !important' } }}
              >
                <ToggleButton value='classic'>Classic</ToggleButton>
                <ToggleButton value='speed'>Speed</ToggleButton>
                <ToggleButton value='pvp'>PvP</ToggleButton>
              </ToggleButtonGroup>

              <Stack direction='row' sx={{ borderBottom: '1px solid rgba(255,255,255,0.14)', pb: 1 }}>
                <Box flex={2}><Typography fontWeight='bold' sx={{ color: '#f3f4f6' }}>Player</Typography></Box>
                {gameType !== 'pvp' &&
                  <>
                    <Box flex={1} textAlign='center'>
                      <Button variant='text' sx={{ color: '#f3f4f6' }} onClick={() => sortFunction('easy')} endIcon={arrow.easy ? <KeyboardArrowDownIcon/> : <KeyboardArrowUpIcon/>}>
                        Easy
                      </Button>
                    </Box>
                    <Box flex={1} textAlign='center'>
                      <Button variant='text' sx={{ color: '#f3f4f6' }} onClick={() => sortFunction('medium')} endIcon={arrow.medium ? <KeyboardArrowDownIcon/> : <KeyboardArrowUpIcon/>}>
                        Medium
                      </Button>
                    </Box>
                    <Box flex={1} textAlign='center'>
                      <Button variant='text' sx={{ color: '#f3f4f6' }} onClick={() => sortFunction('hard')} endIcon={arrow.hard ? <KeyboardArrowDownIcon/> : <KeyboardArrowUpIcon/>}>
                        Hard
                      </Button>
                    </Box>
                  </>
                }

                {gameType === 'pvp' &&
                  <>
                    <Box flex={1} textAlign='center'>
                      <Button variant='text' sx={{ color: '#f3f4f6' }} onClick={() => sortFunction('wins')} endIcon={arrow.wins ? <KeyboardArrowDownIcon/> : <KeyboardArrowUpIcon/>}>
                        Wins
                      </Button>
                    </Box>
                    <Box flex={1} textAlign='center'>
                      <Button variant='text' sx={{ color: '#f3f4f6' }} onClick={() => sortFunction('totalPoints')} endIcon={arrow.totalPoints ? <KeyboardArrowDownIcon/> : <KeyboardArrowUpIcon/>}>
                        Total
                      </Button>
                    </Box>
                    <Box flex={1} textAlign='center'>
                      <Button variant='text' sx={{ color: '#f3f4f6' }} onClick={() => sortFunction('bestMatch')} endIcon={arrow.bestMatch ? <KeyboardArrowDownIcon/> : <KeyboardArrowUpIcon/>}>
                        Best
                      </Button>
                    </Box>
                  </>
                }
              </Stack>

              {isLoading ? (
                <Skeleton variant="rectangular" width='100%' height={220} animation="wave"/>
              ) : allUserData.length > 0 ? (
                data.length > 0 ? data.map((datapoint, index) => (
                  <Stack key={`${datapoint.gameType}-${datapoint.mode}-${datapoint.playerName}`} direction='row' sx={{ py: 1.2, borderBottom: '1px solid rgba(255,255,255,0.1)' }} alignItems='center'>
                    <Box flex={2}>
                      <Stack direction='row' spacing={1.2} alignItems='center'>
                        <Chip size='small' label={index + 1} color={index === 0 ? 'secondary' : 'default'} sx={{ color: index === 0 ? 'white' : '#f3f4f6' }} />
                        <Avatar src={datapoint.playerImg || ''} sx={{ width: 28, height: 28 }} />
                        <Typography sx={{ textTransform: 'capitalize', color: 'white' }}>{datapoint.playerName}</Typography>
                      </Stack>
                    </Box>

                    {gameType !== 'pvp' &&
                      <>
                        <Box flex={1} textAlign='center' sx={{ color: '#f3f4f6' }}>{datapoint.easy === 0 ? '-' : datapoint.easy}</Box>
                        <Box flex={1} textAlign='center' sx={{ color: '#f3f4f6' }}>{datapoint.medium === 0 ? '-' : datapoint.medium}</Box>
                        <Box flex={1} textAlign='center' sx={{ color: '#f3f4f6' }}>{datapoint.hard === 0 ? '-' : datapoint.hard}</Box>
                      </>
                    }

                    {gameType === 'pvp' &&
                      <>
                        <Box flex={1} textAlign='center' sx={{ color: '#f3f4f6' }}>{datapoint.wins === 0 ? '-' : datapoint.wins}</Box>
                        <Box flex={1} textAlign='center' sx={{ color: '#f3f4f6' }}>{datapoint.totalPoints === 0 ? '-' : datapoint.totalPoints}</Box>
                        <Box flex={1} textAlign='center' sx={{ color: '#f3f4f6' }}>{datapoint.bestMatch === 0 ? '-' : datapoint.bestMatch}</Box>
                      </>
                    }
                  </Stack>
                )) : (
                  <Typography textAlign='center' sx={{ py: 3, color: '#f3f4f6' }}>No scores yet for this category.</Typography>
                )
              ) : (
                <Typography textAlign='center' sx={{ py: 3, color: '#f3f4f6' }}>No players yet. Play a game to create the first score.</Typography>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>
      </Box>
    
  )
}
