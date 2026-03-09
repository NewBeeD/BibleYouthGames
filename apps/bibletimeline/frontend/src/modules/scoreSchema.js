import { GAME_TYPES } from './gameModes'

export const SCORE_CATEGORIES = ['OT', 'NT', 'MX']
export const SCORE_DIFFICULTIES = ['easy', 'medium', 'hard']

export const createDifficultyScores = () => ({
  easy: 0,
  medium: 0,
  hard: 0
})

export const createPvpScores = () => ({
  wins: 0,
  totalPoints: 0,
  bestMatch: 0
})

export const createCategoryScores = () => ({
  classic: createDifficultyScores(),
  speed: createDifficultyScores(),
  pvp: createPvpScores()
})

export const createBlankScores = () => ({
  OT: createCategoryScores(),
  NT: createCategoryScores(),
  MX: createCategoryScores()
})

export const resolveCategoryFromMode = (mode) => {
  if(mode === 1){ return 'OT' }
  if(mode === 2){ return 'NT' }
  if(mode === 3){ return 'MX' }
  return null
}

export const resolveDifficultyFromLevel = (level) => {
  if(level === 4){ return 'easy' }
  if(level === 5){ return 'medium' }
  if(level === 6){ return 'hard' }
  return null
}

export const resolveGameTypeKey = (gameType) => {
  if(gameType === GAME_TYPES.SPEED){
    return 'speed'
  }

  if(gameType === GAME_TYPES.PVP){
    return 'pvp'
  }

  return 'classic'
}

export const normalizeUserScores = (userScores) => {
  const defaults = createBlankScores()
  const raw = userScores || {}

  return {
    OT: {
      ...defaults.OT,
      ...(raw.OT || {}),
      classic: { ...defaults.OT.classic, ...(raw.OT?.classic || raw.OT || {}) },
      speed: { ...defaults.OT.speed, ...(raw.OT?.speed || {}) },
      pvp: { ...defaults.OT.pvp, ...(raw.OT?.pvp || {}) }
    },
    NT: {
      ...defaults.NT,
      ...(raw.NT || {}),
      classic: { ...defaults.NT.classic, ...(raw.NT?.classic || raw.NT || {}) },
      speed: { ...defaults.NT.speed, ...(raw.NT?.speed || {}) },
      pvp: { ...defaults.NT.pvp, ...(raw.NT?.pvp || {}) }
    },
    MX: {
      ...defaults.MX,
      ...(raw.MX || {}),
      classic: { ...defaults.MX.classic, ...(raw.MX?.classic || raw.MX || {}) },
      speed: { ...defaults.MX.speed, ...(raw.MX?.speed || {}) },
      pvp: { ...defaults.MX.pvp, ...(raw.MX?.pvp || {}) }
    }
  }
}
