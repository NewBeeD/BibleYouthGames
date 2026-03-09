import ReactCountdownClock from 'react-countdown-clock'

const CountDownTimer = () => {
  
  // onComplete={() => setBtnDisabled(true)}
  
  return (

    <ReactCountdownClock 
      seconds={40}
      color="#050"
      alpha={0.9}
      size={150}
    />
  )
}

export default CountDownTimer