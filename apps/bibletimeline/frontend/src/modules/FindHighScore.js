import { GAME_TYPES } from './gameModes'
import { resolveCategoryFromMode, resolveDifficultyFromLevel, resolveGameTypeKey, normalizeUserScores } from './scoreSchema'

export const FindHighScore = (active, mode, userHighScores, gameType = GAME_TYPES.CLASSIC) => {

  const gameCategory = resolveCategoryFromMode(active)
  const gameDifficulty = resolveDifficultyFromLevel(mode?.level)
  const gameTypeKey = resolveGameTypeKey(gameType)
  const normalized = normalizeUserScores(userHighScores)

  if(!gameCategory || !gameDifficulty || !gameTypeKey){
    return 0
  }

  if(gameType === GAME_TYPES.PVP){
    return normalized?.[gameCategory]?.pvp?.bestMatch || 0
  }

  return normalized?.[gameCategory]?.[gameTypeKey]?.[gameDifficulty] || 0
  // return 4;  
}
