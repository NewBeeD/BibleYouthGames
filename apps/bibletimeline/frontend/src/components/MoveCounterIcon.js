import { Typography } from "@mui/material"

export const MoveCounterIcon = ({moveCounter, level, unlimitedMoves = false}) => {
  return (
    <Typography>{unlimitedMoves ? '∞' : level - moveCounter}</Typography>
  )
  
}
