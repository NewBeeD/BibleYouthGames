import { Box, Typography, List, ListItem, ListItemText, Paper, Container, Stack, Button, AppBar, Toolbar, Drawer, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Divider, Switch, Snackbar } from "@mui/material"
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import '../App.css'
import { DragDropContext, Droppable, Draggable} from '@hello-pangea/dnd'
import { useEffect, useState } from "react"
import { numberGen } from "../modules/numberGen"
import { Link, Navigate, useLocation } from "react-router-dom"
import { eventsCheck } from '../modules/eventsOrderFinder'
import { orderChecker } from "../modules/orderChecker"
import { solution } from "../modules/solution"
import { upsertPlayerScore } from "../modules/firebaseScores";
import { MoveCounterIcon } from "../components/MoveCounterIcon";
import { auth } from "../firebaseAuth/firebaseSDK";
import { onAuthStateChanged } from "firebase/auth";
import { GAME_TYPES } from "../modules/gameModes";



import ReactCountdownClock from 'react-countdown-clock'
// import { useWindowSize } from "@uidotdev/usehooks";
// import breakPoint from "../modules/BreakPointCalculator";





export const Gamepage = () => {


  // const {difficulty, dispatch} = useTimeLineContext()

  const location = useLocation()
  const storedDifficulty = location.state
  const shouldRedirect = !storedDifficulty || !storedDifficulty.diffMode
  const difficulty = shouldRedirect ? {data: 2, diffMode: {level: 4, time: 30}, gameType: GAME_TYPES.CLASSIC} : storedDifficulty
  const gameType = difficulty.gameType || GAME_TYPES.CLASSIC
  const unlimitedMoves = gameType !== GAME_TYPES.CLASSIC
  const isSpeedMode = gameType === GAME_TYPES.SPEED
  const allowSkip = isSpeedMode

 
  const [data, setData] = useState(numberGen(difficulty.data, difficulty.diffMode.level))
  const [truth, setTruth] = useState('')
  const [animation, setAnimation] = useState(null)
  const [btnNxtDisabled, setBtnNxtDisabled] = useState(false)
  const [btnSolDisabled, setBtnSolDisabled] = useState(false)

  const [score, setScore] = useState(0)
  const showScore = true

  // const [countdown, setCountDown] = useState(() => <CountDownTimer />)
  
  const [counter, setCounter] = useState(difficulty.diffMode.time)
  const [isDrawerOPen, setIsDrawerOpen] = useState(false)
  const [timer, setTimer] = useState(false)
  const [open, setOpen] = useState(false)
  const [moveCounter, setMoveCounter] = useState(0)
  const [blankTimer, setBlankTimer] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [scoreSavedOpen, setScoreSavedOpen] = useState(false)
  const [scoreSaveErrorOpen, setScoreSaveErrorOpen] = useState(false)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(Boolean(user))
      setAuthReady(true)
    })

    return () => unsubscribeAuth()
  }, [])


  const moveCounterFunction = (currentMoveCounter) =>{

    if(unlimitedMoves){
      return
    }

    let gameMode = difficulty.diffMode.level

    if(currentMoveCounter > parseInt(gameMode, 10)){
      upsertPlayerScore(difficulty, score)
      
      setBtnNxtDisabled(true) 
      setBlankTimer(true)
      setMoveCounter(0)}
  }

  


  // random number added to the counter so as to render on every problem set
  const randomNum = (boolData) => {

    if(boolData.toString() === 'true'){ return 0 }
    return Math.random()
  }

  const timerChange = (event) => {
    setTimer(event.target.checked);
  }
  

  // Returns the correct order of the events
  let eventsOrder = eventsCheck(data)

  const nextSet = () =>{

    // Matches the solution to the order entered, returns true or false
    let bool = orderChecker(eventsOrder, data)

    if(bool){

      if(btnNxtDisabled && btnSolDisabled){

        setBtnNxtDisabled(false)
        setBtnSolDisabled(false)
        setBlankTimer(false)
        setScore(0)
      }
      else{
        const nextScore = score + 1
        setScore(nextScore)
        upsertPlayerScore(difficulty, nextScore)
      }

      setMoveCounter(0)

      setData(numberGen(difficulty.data, difficulty.diffMode.level))
      // setCounter(40 + randomNum(timer))

      if(!isSpeedMode){
        switch(difficulty.diffMode.level){

          case 4:
            setCounter(30 + randomNum(timer))
            break;
          
          case 5:
            setCounter(40 + randomNum(timer))
            break;

          case 6:
            setCounter(50 + randomNum(timer))
            break;

          default:
            setCounter(30 + randomNum(timer))
            break;
        }
      }
    }
    else{
      setTruth('red')
      setAnimation(true)}
  }
    
  // Drag and Drop Functionality
  const handleDragDrop = (result) => {


    const {source, destination} = result

    setTruth('none')
    setAnimation(false)
    

    if(!result.destination){return}

    const items = Array.from(data)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    
    if(source.draggableId !== destination.droppableId && source.index !== destination.index){

      const nextMoveCounter = moveCounter + 1
      setMoveCounter(nextMoveCounter)
      setData(items)
      moveCounterFunction(nextMoveCounter)}
    // moveCounterFunction()
  }

  // Returning to mode-selection page
  const changeCategory = () =>{
    // dispatch({type: 'SET_DIFFICULTY', payload: null})
  }

  const eventSolution = () => {

    let solutionData = solution(eventsOrder, data) 
    setTruth('blue')

    setData(solutionData)
    setTimeout(setBlue, 1000)
    setBtnNxtDisabled(true)
    setBtnSolDisabled(true)
    setBlankTimer(true)

    saveFinalScore()
  }

  const skipSet = () => {
    if(!allowSkip){
      return
    }

    setTruth('none')
    setAnimation(false)
    setMoveCounter(0)
    setData(numberGen(difficulty.data, difficulty.diffMode.level))
  }

  function setBlue(){
    setTruth('none')
  }

  const saveFinalScore = async () => {

    const didSave = await upsertPlayerScore(difficulty, score)
    if(didSave){
      setScoreSavedOpen(true)
      setScoreSaveErrorOpen(false)
    }
    else{
      setScoreSaveErrorOpen(true)
    }
  }

  const handleScoreSavedClose = () => {
    setScoreSavedOpen(false)
  }

  const handleScoreSaveErrorClose = () => {
    setScoreSaveErrorOpen(false)
  }

  const saveScore = () => {

    setBtnNxtDisabled(true)
    setBtnSolDisabled(true)
    setBlankTimer(true)

    saveFinalScore()
    
  }

  if(shouldRedirect){
    return <Navigate to='/' replace />
  }

  if(!authReady){
    return (
      <Box minHeight="100vh" display='flex' justifyContent='center' alignItems='center' className="gamePage">
        <Typography variant='h6' sx={{ color: 'white' }}>Loading...</Typography>
      </Box>
    )
  }

  if(authReady && !isAuthenticated){
    return <Navigate to='/' replace />
  }

  if(open){
    return (

      <div minHeight="100vh" className="gamePage">

        <AppBar position="static" sx={{ backgroundColor: '#173174', marginBottom: {xs: '185px', sm: '150px', md: '100px', lg: '200px'} }}>
          <Toolbar sx={{ justifyContent: "space-between" }}>

            <Box>

              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={()=>setIsDrawerOpen(true)}
              >
                  <MenuIcon />
                </IconButton>

            </Box>        


            <Box >

              <Button onClick={changeCategory}><Typography variant="h5" sx={{alignItems: 'center', color: 'white'}}><Link to='/' style={{textDecoration: 'none', color: 'white'}}>Bible TimeLine</Link></Typography></Button>

            </Box>

            <Box direction="row" spacing={1} sx={{ display: 'flex', alignItems: 'center'}}>

              <Typography></Typography>
              {/* <Switch color="secondary"/> */}
            </Box>

          </Toolbar>
        </AppBar>

        <Dialog open={open} >

          <DialogTitle component='div' sx={{ pb: 1 }}><Typography variant="h4">How to Play</Typography></DialogTitle>
          <DialogTitle component='div' sx={{ pt: 0 }}><Typography variant="h5">Find the order of events in {difficulty.diffMode.level} moves</Typography></DialogTitle>

          <DialogContent>
            <DialogContentText>Simply drag and drop events in their chronological order.</DialogContentText>
            <Divider sx={{marginY: '10px'}}/>
            <DialogContentText>Click next if you are confident in your order of events.</DialogContentText>
            <Divider sx={{marginY: '10px'}}/>
            <DialogContentText>If it shows red, that means your order is not correct, so try again.</DialogContentText>
            <Divider sx={{marginY: '10px'}}/>
            <DialogContentText>If you are unable to solve, then click solution to see the answer.</DialogContentText>

          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpen(false)}>OK</Button>
          </DialogActions>

        </Dialog>

      
        <Container sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', minHeight: '300px'}}>
          <Typography sx={{ color: '#173174', fontSize: '0.86rem', marginBottom: 1 }}>
            Mobile tip: press and hold an event, then drag to reorder.
          </Typography>
  
  <DragDropContext onDragEnd={handleDragDrop}>

    <Droppable droppableId="list">

      {(provided) => (

        <List 
        {...provided.droppableProps} 
        ref={provided.innerRef} 
        sx={{width: '100%', maxWidth: 560, bgcolor: 'background.paper', textAlign: 'center'}}>

        {data && data.map((points, index)=> (
          
          <Draggable key={points.id} draggableId={points.id.toString()} index={index} shouldRespectForcePress={false}>

          {(provided) => (

            <Paper ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style} elevation={3} sx={{marginBottom: '20px', border: (truth === 'red'? '2px solid red': truth === 'blue'? '2px solid blue': 'none'), touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none'}} className={(animation? 'shake': '')}>

              <ListItem sx={{textAlign: "center"}} >
                <ListItemText  primary={points.event} primaryTypographyProps={{fontSize: {xs:'20px', sm:'25px', md: '28px'}}} />
              </ListItem>

            </Paper>

          )}

        </Draggable>
        ))}

        {provided.placeholder}


      </List>
      )}
  
    </Droppable>
  </DragDropContext>

        </Container>

        <Snackbar
          open={scoreSavedOpen}
          autoHideDuration={1800}
          onClose={handleScoreSavedClose}
          message='Score saved'
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />

        <Snackbar
          open={scoreSaveErrorOpen}
          autoHideDuration={2200}
          onClose={handleScoreSaveErrorClose}
          message='Could not save score'
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />

      </div>
    )
  }
  else{

    return (

      <div minHeight="100vh" className="gamePage">
  
        <AppBar position="static" sx={{ backgroundColor: '#173174' }}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
  
            <Box>
  
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={()=>setIsDrawerOpen(true)}
              >
                  <MenuIcon />
                </IconButton>
  
            </Box>        
  
  
            <Box >
  
              <Button onClick={changeCategory}><Typography variant="h5" sx={{alignItems: 'center', color: 'white'}}><Link to='/' style={{textDecoration: 'none', color: 'white'}}>Bible TimeLine</Link></Typography></Button>
  
            </Box>
  
            <Box direction="row" spacing={1} sx={{ display: 'flex', alignItems: 'center'}}>
  
              <Typography></Typography>
              {/* <Switch color="secondary"/> */}
            </Box>
  
          </Toolbar>
        </AppBar>
  
        {/* Drawer */}
        <Drawer anchor="left" 
        open={isDrawerOPen}
        onClose={() => setIsDrawerOpen(false)
        }>
  
          <Box p={2} width='250px' textAlign='center' justifyContent='center' role='presentation'>
  
            <Typography variant="h4" style={{color: '#173174'}}> Settings </Typography>
  
            <Box marginTop={10}>
  
              <Box>
                <Stack spacing={10} direction='row' alignItems='center' justifyContent='center' >
  
                  <Box>
                    <Typography>Speedster</Typography>
                  </Box>
  
                  <Box>
                    <Switch 
                    checked={timer}
                    onChange={timerChange}
                    />              
                  </Box>
  
                </Stack>
              </Box>
  
              <Box>
                <Typography marginTop={5} variant="body1" sx={{cursor: 'pointer'}}>ScoreBoard</Typography>
              </Box>
              
  
            </Box>
  
          </Box>
  
        </Drawer>
  
        {/* CountDown Timer */}
        <Box display='flex' justifyContent='center' marginTop={{xs:5, sm:8, md:10, lg:12}} marginBottom={2}>
  
          {/* <Box>
            <Typography variant="h3">00:{counter < 10? `0${counter}`: counter}</Typography>
          </Box> */}

        {!blankTimer? <ReactCountdownClock 
                      seconds={counter}
                      color="#173174"
                      alpha={0.9}
                      size={150}
                      onComplete={saveScore}
                      /> : <ReactCountdownClock 
                      seconds={0}
                      color="#090"
                      alpha={0.9}
                      size={150}
                      /> }

  
        </Box>
  
        {showScore && <Box margin='auto' marginY={2} sx={{textAlign: 'center', border: '2px solid #173174', width: '120px', borderRadius: '10px'}}>
  
          {showScore && 
          <Box sx={{textAlign: 'center'}}>
  
            <Typography variant="h3" style={{color: '#173174'}}>{ score }</Typography>
            
          </Box>}
  
        </Box>}
  
        
  
        <Container sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', minHeight: '300px'}}>
          <Typography sx={{ color: '#173174', fontSize: '0.86rem', marginBottom: 1 }}>
            Mobile tip: press and hold an event, then drag to reorder.
          </Typography>
  
          <DragDropContext onDragEnd={handleDragDrop}>
  
            <Droppable droppableId="list">
  
              {(provided) => (
  
                <List 
                {...provided.droppableProps} 
                ref={provided.innerRef} 
                sx={{width: '100%', maxWidth: 560, bgcolor: 'background.paper', textAlign: 'center'}}>
  
                {data && data.map((points, index)=> (
                  
                  <Draggable key={points.id} draggableId={points.id.toString()} index={index} shouldRespectForcePress={false}>
  
                  {(provided) => (
  
                    <Paper ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={provided.draggableProps.style} elevation={3} sx={{marginBottom: '20px', border: (truth === 'red'? '2px solid red': truth === 'blue'? '2px solid blue': 'none'), touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none'}} className={(animation? 'shake': '')}>
  
                      <ListItem sx={{textAlign: "center"}} >
                        <ListItemText  primary={points.event} primaryTypographyProps={{fontSize: {xs:'20px', sm:'25px', md: '28px'}}} />
                      </ListItem>
  
                    </Paper>
  
                  )}
  
                </Draggable>
                ))}
  
                {provided.placeholder}
  
  
              </List>
              )}
          
            </Droppable>
          </DragDropContext>
  
        </Container>

        {!btnSolDisabled && 
        
        <Stack display='flex' justifyContent='center' direction='row' spacing={{xs: 15, sm: 20, md: 25, lg: 15}} sx={{marginTop: '0px'}}>
            
          <Button variant="outlined" size="large" color="secondary" onClick={nextSet} disabled={btnNxtDisabled} startIcon={<MoveCounterIcon moveCounter={moveCounter} level={difficulty.diffMode.level} unlimitedMoves={unlimitedMoves}/>}>Next</Button>
          {!isSpeedMode && <Button variant="outlined" color="secondary" onClick={eventSolution} disabled={btnSolDisabled}>Solution</Button>}
          {allowSkip && <Button variant="outlined" color="secondary" onClick={skipSet}>Skip</Button>}
        </Stack>}

        {btnSolDisabled && !isSpeedMode &&

          <Stack display='flex' justifyContent='center' direction='row' spacing={{xs: 15, sm: 20, md: 25, lg: 15}} sx={{marginTop: '0px'}}>

            <Button 
            variant="outlined" 
            size="large" 
            color="secondary" 
            onClick={nextSet} 
            >
              Try Again
            </Button>

          </Stack>
        }

        <Snackbar
          open={scoreSavedOpen}
          autoHideDuration={1800}
          onClose={handleScoreSavedClose}
          message='Score saved'
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />

        <Snackbar
          open={scoreSaveErrorOpen}
          autoHideDuration={2200}
          onClose={handleScoreSaveErrorClose}
          message='Could not save score'
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
  
        
  
        
  
  
      </div>
    )


  }
}



