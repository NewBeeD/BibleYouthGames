
export const leaderboardData = (userScores) => {

  if(!userScores){
    return []
  }

  const blankScores = {easy: 0, medium: 0, hard: 0}
  const blankPvp = {wins: 0, totalPoints: 0, bestMatch: 0}
  const allData = []

  Object.values(userScores).forEach((user) => {
    const userData = user?.data || {}
    const playerName = user?.userName || 'player'
    const playerImg = user?.userImg || ''

    const normalizedCategories = {
      OT: {
        classic: { ...blankScores, ...(userData?.OT?.classic || userData?.OT || {}) },
        speed: { ...blankScores, ...(userData?.OT?.speed || {}) },
        pvp: { ...blankPvp, ...(userData?.OT?.pvp || {}) }
      },
      NT: {
        classic: { ...blankScores, ...(userData?.NT?.classic || userData?.NT || {}) },
        speed: { ...blankScores, ...(userData?.NT?.speed || {}) },
        pvp: { ...blankPvp, ...(userData?.NT?.pvp || {}) }
      },
      MX: {
        classic: { ...blankScores, ...(userData?.MX?.classic || userData?.MX || {}) },
        speed: { ...blankScores, ...(userData?.MX?.speed || {}) },
        pvp: { ...blankPvp, ...(userData?.MX?.pvp || {}) }
      }
    }

    allData.push({ ...normalizedCategories.OT.classic, playerName, playerImg, mode: 'oldtestament', gameType: 'classic' })
    allData.push({ ...normalizedCategories.NT.classic, playerName, playerImg, mode: 'newtestament', gameType: 'classic' })
    allData.push({ ...normalizedCategories.MX.classic, playerName, playerImg, mode: 'mixed', gameType: 'classic' })

    allData.push({ ...normalizedCategories.OT.speed, playerName, playerImg, mode: 'oldtestament', gameType: 'speed' })
    allData.push({ ...normalizedCategories.NT.speed, playerName, playerImg, mode: 'newtestament', gameType: 'speed' })
    allData.push({ ...normalizedCategories.MX.speed, playerName, playerImg, mode: 'mixed', gameType: 'speed' })

    allData.push({ ...normalizedCategories.OT.pvp, playerName, playerImg, mode: 'oldtestament', gameType: 'pvp' })
    allData.push({ ...normalizedCategories.NT.pvp, playerName, playerImg, mode: 'newtestament', gameType: 'pvp' })
    allData.push({ ...normalizedCategories.MX.pvp, playerName, playerImg, mode: 'mixed', gameType: 'pvp' })
  })

  return allData
}