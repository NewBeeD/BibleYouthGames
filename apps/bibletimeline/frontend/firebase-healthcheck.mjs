import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get } from 'firebase/database'

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
const key = 'healthcheck/' + Date.now()
const rowRef = ref(db, key)

const withTimeout = async (promise, ms, label) => {
  return await Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(label + '_TIMEOUT')), ms)
    })
  ])
}

try {
  await withTimeout(set(rowRef, { ok: true, ts: Date.now(), source: 'workspace-check' }), 8000, 'WRITE')
  const snap = await withTimeout(get(rowRef), 8000, 'READ')
  console.log('WRITE_READ_OK')
  console.log(JSON.stringify(snap.val()))
  await withTimeout(set(rowRef, null), 8000, 'CLEANUP')
  console.log('CLEANUP_OK')
  console.log(key)
} catch (error) {
  console.log('WRITE_READ_FAIL')
  console.log(String(error))
  process.exitCode = 1
}
