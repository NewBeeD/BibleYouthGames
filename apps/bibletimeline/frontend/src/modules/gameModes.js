export const GAME_TYPES = {
  CLASSIC: 'classic',
  SPEED: 'speed',
  PVP: 'pvp'
}

export const PVP_ROUND_PLAN = [4, 4, 4, 5, 5, 6]

export const PVP_MODES = {
  CLASSIC: 'classic',
  RACE_THREE: 'race_three'
}

export const PVP_MODE_LABELS = {
  [PVP_MODES.CLASSIC]: 'Classic PvP',
  [PVP_MODES.RACE_THREE]: 'Race (3 Orders)'
}

export const GAME_TYPE_LABELS = {
  [GAME_TYPES.CLASSIC]: 'Classic',
  [GAME_TYPES.SPEED]: 'Speed',
  [GAME_TYPES.PVP]: 'PvP'
}

export const getTimerFromLevel = (level) => {
  if(level === 4){ return 30 }
  if(level === 5){ return 40 }
  if(level === 6){ return 50 }
  return 30
}

export const getLevelName = (level) => {
  if(level === 4){ return 'Easy' }
  if(level === 5){ return 'Medium' }
  if(level === 6){ return 'Hard' }
  return 'Easy'
}
