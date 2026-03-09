import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get } from 'firebase/database'

const cfg = {
  apiKey: 'AIzaSyD5yMxgik0W468LmPfXX7Ls1lB05nmE2NM',
  authDomain: 'leaderboard-6f8af.firebaseapp.com',
  projectId: 'leaderboard-6f8af',
  storageBucket: 'leaderboard-6f8af.appspot.com',
  messagingSenderId: '564760106155',
  appId: '1:564760106155:web:b090eca862534ca01cd3ee',
  measurementId: 'G-SPWHZ232Q5'
}

const app = initializeApp(cfg)
const db = getDatabase(app)

try {
  const snap = await get(ref(db, 'users'))
  console.log('READ_USERS_OK')
  const data = snap.val()
  const count = data ? Object.keys(data).length : 0
  console.log('USER_COUNT', count)
} catch (error) {
  console.log('READ_USERS_FAIL')
  console.log(String(error))
  process.exitCode = 1
}
