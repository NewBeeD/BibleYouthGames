const STORAGE_KEY = 'bibleTimeline.pvpSession.v1'

const normalizeSession = (session) => {
  const roomCode = String(session?.roomCode || '').trim()
  const playerId = String(session?.playerId || '').trim()
  const authToken = String(session?.authToken || '').trim()

  if(!roomCode || !playerId || !authToken){
    return null
  }

  return {
    roomCode,
    playerId,
    authToken
  }
}

export const loadPvpSession = () => {
  if(typeof window === 'undefined'){
    return null
  }

  try{
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if(!raw){
      return null
    }

    const session = normalizeSession(JSON.parse(raw))
    if(!session){
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return session
  }
  catch(error){
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export const savePvpSession = (session) => {
  const normalized = normalizeSession(session)

  if(typeof window !== 'undefined'){
    if(normalized){
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    }
    else{
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  return normalized
}

export const clearPvpSession = () => {
  if(typeof window !== 'undefined'){
    window.localStorage.removeItem(STORAGE_KEY)
  }
}