const STORAGE_KEY = 'bibleTimeline.pvpIdentity.v1'

const dancingAnimals = ['🕺🐶', '💃🐱', '🕺🦊', '💃🐼', '🕺🦁', '💃🐨', '🕺🐸', '💃🦄', '🕺🐵', '💃🐯']

const prefixes = ['Swift', 'Brave', 'Sunny', 'Noble', 'Epic', 'Happy', 'Bold', 'Mighty', 'Clever', 'Lucky']
const places = ['Jericho', 'Galilee', 'Zion', 'Bethany', 'Eden', 'Shiloh', 'Carmel', 'Hebron', 'Jordan', 'Nazareth']

const hashString = (value = '') => {
  let hash = 0
  for(let index = 0; index < value.length; index += 1){
    hash = ((hash << 5) - hash) + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

export const getPvpAnimalAvatars = () => dancingAnimals

const generateRandomName = () => {
  const seed = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
  const value = hashString(seed)
  const prefix = prefixes[value % prefixes.length]
  const place = places[(value + 3) % places.length]
  return `${prefix} ${place}`
}

const normalizeIdentity = (identity) => {
  const fallbackName = generateRandomName()

  const avatarIndexRaw = Number(identity?.avatarIndex)
  const avatarIndex = Number.isFinite(avatarIndexRaw)
    ? Math.min(dancingAnimals.length - 1, Math.max(0, avatarIndexRaw))
    : hashString(identity?.name || fallbackName) % dancingAnimals.length

  const name = String(identity?.name || '').trim() || fallbackName

  return {
    name,
    avatarIndex,
    avatarEmoji: dancingAnimals[avatarIndex]
  }
}

export const loadPvpIdentity = () => {
  if(typeof window === 'undefined'){
    return normalizeIdentity(null)
  }

  try{
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if(!raw){
      const generated = normalizeIdentity(null)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(generated))
      return generated
    }

    const parsed = JSON.parse(raw)
    const normalized = normalizeIdentity(parsed)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    return normalized
  }
  catch(error){
    const fallback = normalizeIdentity(null)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback))
    return fallback
  }
}

export const savePvpIdentity = (identity) => {
  const normalized = normalizeIdentity(identity)

  if(typeof window !== 'undefined'){
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }

  return normalized
}
