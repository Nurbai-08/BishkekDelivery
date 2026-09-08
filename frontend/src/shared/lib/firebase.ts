import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'

const options = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
export const firebaseAuth = options.apiKey && options.projectId ? getAuth(initializeApp(options)) : null

if (firebaseAuth && import.meta.env.DEV && import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL) {
  connectAuthEmulator(firebaseAuth, import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL)
}
