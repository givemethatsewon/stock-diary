import { getApps, initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}


// Firebase 앱 초기화 (설정이 유효하지 않으면 기본값 사용)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}


export const auth = getAuth(app)

// Firebase 인증 지속성을 세션 스토리지로 설정 (Local Storage 미사용)
export const persistenceReady = setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log('🔒 Firebase 인증 지속성: SESSION persistence 사용 (localStorage 미사용)')
  })
  .catch((err) => {
    console.warn('⚠️ Firebase 인증 지속성 설정 실패, 기본 지속성 사용으로 폴백됨:', err)
  })

export const googleProvider = new GoogleAuthProvider()

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: "select_account",
})
