import { auth, db } from '../firebaseAuth/firebaseSDK'
import { ref, runTransaction, set, update } from 'firebase/database'
import { resolveCategoryFromMode, resolveDifficultyFromLevel, resolveGameTypeKey } from './scoreSchema'

export const upsertPlayerScore = async (difficulty, score) => {
  const user = auth.currentUser
  if(!user){
    return false
  }

  const category = resolveCategoryFromMode(difficulty?.data)
  const difficultyName = resolveDifficultyFromLevel(difficulty?.diffMode?.level)
  const gameTypeKey = resolveGameTypeKey(difficulty?.gameType)
  if(!category || !difficultyName || !gameTypeKey){
    return false
  }

  const rawScore = Number(score)
  if(Number.isNaN(rawScore)){
    return false
  }
  const numericScore = Math.max(0, rawScore)

  const userRootRef = ref(db, 'users/' + user.uid)
  const scoreRef = ref(db, `users/${user.uid}/data/${category}/${gameTypeKey}/${difficultyName}`)

  try{
    await update(userRootRef, {
      userName: user.displayName || 'Player',
      userImg: user.photoURL || ''
    })
  }
  catch(error){
    console.log(error)
  }

  try{
    const transactionResult = await runTransaction(scoreRef, (currentValue) => {
      const existingScore = Number(currentValue) || 0
      return Math.max(existingScore, numericScore)
    })

    if(transactionResult.committed){
      return true
    }
  }
  catch(error){
    console.log(error)
  }

  try{
    await set(scoreRef, numericScore)
    return true
  }
  catch(error){
    console.log(error)
  }

  return false
}

export const upsertPvpCategoryStats = async ({ categoryMode, points, won }) => {
  const user = auth.currentUser
  if(!user){
    return false
  }

  const category = resolveCategoryFromMode(categoryMode)
  if(!category){
    return false
  }

  const numericPoints = Math.max(0, Number(points) || 0)
  const didWin = Boolean(won)

  const userRootRef = ref(db, 'users/' + user.uid)
  const pvpRef = ref(db, `users/${user.uid}/data/${category}/pvp`)

  try{
    await update(userRootRef, {
      userName: user.displayName || 'Player',
      userImg: user.photoURL || ''
    })
  }
  catch(error){
    console.log(error)
  }

  try{
    const transactionResult = await runTransaction(pvpRef, (currentValue) => {
      const current = currentValue || {}
      const wins = Number(current.wins) || 0
      const totalPoints = Number(current.totalPoints) || 0
      const bestMatch = Number(current.bestMatch) || 0

      return {
        wins: didWin ? wins + 1 : wins,
        totalPoints: totalPoints + numericPoints,
        bestMatch: Math.max(bestMatch, numericPoints)
      }
    })

    if(transactionResult.committed){
      return true
    }
  }
  catch(error){
    console.log(error)
  }

  try{
    await set(pvpRef, {
      wins: didWin ? 1 : 0,
      totalPoints: numericPoints,
      bestMatch: numericPoints
    })
    return true
  }
  catch(error){
    console.log(error)
  }

  return false
}
