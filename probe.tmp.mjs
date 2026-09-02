import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'
import { initializeFirestore, setDoc, getDoc, doc, deleteDoc } from 'firebase/firestore'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim()])
)

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
})

const auth = getAuth(app)
const db = initializeFirestore(app, { ignoreUndefinedProperties: true })

const email = `probe-${Date.now()}@dndcs-probe.invalid`
const password = `Pr0be-${Date.now()}!`

const credential = await createUserWithEmailAndPassword(auth, email, password)
const uid = credential.user.uid
const step = async (name, work) => {
  try {
    await work()
    console.log('OK    ', name)
  } catch (error) {
    console.log('FAIL  ', name, '::', error.message.slice(0, 110))
  }
}

await step('write users/{uid}', () =>
  setDoc(doc(db, 'users', uid), {
    uid,
    email,
    display_name: 'Probe',
    photo_url: credential.user.photoURL || undefined,
    replicate_api_key: '',
    preferences: { theme: 'medieval' }
  })
)

await step('write users/{uid}/data/details', () =>
  setDoc(doc(db, 'users', uid, 'data', 'details'), { display_name: 'Probe', replicate_api_key: '' })
)

await step('read back users/{uid}', async () => {
  if (!(await getDoc(doc(db, 'users', uid))).exists()) throw new Error('profile not found')
})

await step('read back details', async () => {
  if (!(await getDoc(doc(db, 'users', uid, 'data', 'details'))).exists()) throw new Error('details not found')
})

await step('create a campaign as dm', () =>
  setDoc(doc(db, 'campaigns', `probe-${uid}`), {
    id: `probe-${uid}`,
    name: 'Probe',
    description: '',
    dm_id: uid,
    player_ids: [],
    character_ids: [],
    is_active: true,
    settings: { allow_character_editing: true, share_character_sheets: true, private_notes: true, experience_mode: 'milestone' }
  })
)

await step('write a campaign session as dm', () =>
  setDoc(doc(db, 'campaigns', `probe-${uid}`, 'sessions', 'one'), { id: 'one', number: 1, title: 'Probe', played_at: '2026-09-02', summary: '', present_character_ids: [] })
)

await step('cleanup', async () => {
  await deleteDoc(doc(db, 'campaigns', `probe-${uid}`, 'sessions', 'one'))
  await deleteDoc(doc(db, 'campaigns', `probe-${uid}`))
  await deleteDoc(doc(db, 'users', uid, 'data', 'details'))
  await deleteDoc(doc(db, 'users', uid))
})

await deleteUser(credential.user)
console.log('OK     probe user deleted')
process.exit(0)
