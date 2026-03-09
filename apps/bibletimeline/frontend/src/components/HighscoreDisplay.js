import { Typography, Box } from '@mui/material'

export const HighscoreDisplay = (props) => {


  return (
    <Box
      sx={{
        border: '1px solid rgba(255,255,255,0.35)',
        borderRadius: 3,
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.92) 0%, rgba(15, 23, 42, 0.9) 100%)',
        p: 1.8,
        textAlign: 'center'
      }}
    >
      <Typography sx={{ color: 'rgba(255,255,255,0.88)', letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>
        High Score
      </Typography>
      <Typography variant='h2' sx={{ color: 'white', fontWeight: 700, lineHeight: 1.05 }}>
        {props.highscore ? props.highscore : 0}
      </Typography>
    </Box>
  )
}
