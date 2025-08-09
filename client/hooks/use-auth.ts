"use client"

import { useEffect, useState } from "react"
import { type User, onAuthStateChanged, signInWithPopup, signOut, AuthError } from "firebase/auth"
import { auth, googleProvider, persistenceReady } from "../lib/firebase"
import { useRouter } from "next/navigation"
import { apiClient } from "../lib/api" // apiClient import 추가

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      //console.log('🔐 Firebase 인증 상태 감지 시작...')
      
      // Firebase 토큰 저장소 확인
      //console.log('🔍 브라우저 저장소 확인 중...')
      //console.log('- localStorage 키들:', Object.keys(localStorage))
      //console.log('- sessionStorage 키들:', Object.keys(sessionStorage))
      
      // Firebase 관련 저장소 항목 찾기
      const firebaseKeys = Object.keys(localStorage).filter(key => 
        key.includes('firebase') || key.includes('Firebase')
      )
      //console.log('🔥 Firebase 관련 저장소:', firebaseKeys)
      
      // 현재 사용자 확인
      //console.log('👤 현재 Firebase 사용자:', auth.currentUser)
      
      // 로컬 스토리지 기반 복구 로직 제거 (쿠키만 사용)
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        //console.log('👤 인증 상태 변경:', user ? `로그인됨 (${user.email})` : '로그아웃됨')
        //console.log('🕐 현재 시간:', new Date().toLocaleTimeString())
        //console.log('⚡ Fast Refresh 중인지 확인:', window.location.href)
        
        // 쿠키 세션만 사용하므로 로컬스토리지 캐시는 유지하지 않음
        
        setUser(user)
        setLoading(false)
        setError(null)
        setIsFirebaseAvailable(true)
        
        // 로그인 성공 시 대시보드로 자동 이동 (단, 이미 대시보드면 이동하지 않음)
        if (user) {
          const path = window.location.pathname
          if (path === '/login') {
            //console.log('🔄 인증 완료: /login -> /dashboard 리다이렉트')
            window.location.replace('/dashboard')
          }
        } else {
          // 로그인 상태가 아니고 보호된 경로이면 로그인으로 이동 (무한 루프 방지: /login에서는 이동 안함)
          const path = window.location.pathname
          const isProtected = path.startsWith('/dashboard')
          if (isProtected && path !== '/login') {
            //console.log('🔒 비인증 상태에서 보호된 경로 접근: /login으로 이동')
            window.location.replace('/login')
          }
        }
      }, (error) => {
        console.error("Auth state change error:", error)
        
        // API 키 오류인 경우 Firebase를 비활성화
        if ((error as AuthError).code === 'auth/api-key-not-valid' || (error as AuthError).code === 'auth/invalid-api-key') {
          setError("Firebase API 키가 유효하지 않습니다. 설정을 확인해주세요.")
          setIsFirebaseAvailable(false)
        } else {
          setError(error.message)
        }
        setLoading(false)
      })

      // 토큰 만료 감지
      const tokenRefreshInterval = setInterval(async () => {
        if (auth.currentUser) {
          try {
            await auth.currentUser.getIdToken(true) // force refresh
                     } catch (error) {
             console.error("Token refresh error:", error)
             if ((error as AuthError).code === 'auth/user-token-expired' || (error as AuthError).code === 'auth/requires-recent-login') {
              // 토큰이 만료되었거나 재인증이 필요한 경우
              await signOut(auth)
              router.push("/login")
            }
          }
        }
      }, 10 * 60 * 1000) // 10분마다 토큰 갱신 시도

      return () => {
        unsubscribe()
        clearInterval(tokenRefreshInterval)
      }
      
    } catch (error) {
      console.error("Firebase auth initialization error:", error)
      setError("Firebase 인증 초기화 오류")
      setIsFirebaseAvailable(false)
      setLoading(false)
    }
  }, [router])

  const signInWithGoogle = async () => {
    if (!isFirebaseAvailable) {
      setError("Firebase가 설정되지 않았습니다. 먼저 Firebase 설정을 완료해주세요.")
      return
    }

    try {
      setLoading(true)
      setError(null)
      // 지속성 설정 완료 후 로그인 시도 (세션 스토리지 사용)
      await persistenceReady.catch(() => {})
      // 1. Firebase로 구글 로그인
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseToken = await result.user.getIdToken()
      //console.log('✅ Firebase 구글 로그인 성공')

      // 2. 서버에 사용자 정보 등록 (세션 생성 대신)
      await apiClient.loginWithFirebase(firebaseToken)
      //console.log('✅ 서버 사용자 정보 등록 성공')
      
      // 3. onAuthStateChanged에서 자동으로 리다이렉트 처리됨
      //console.log('✅ 로그인 완료, 자동 리다이렉트 대기 중...')

    } catch (error) {
      console.error("Error signing in with Google:", error)
      
      if ((error as AuthError).code === 'auth/api-key-not-valid' || (error as AuthError).code === 'auth/invalid-api-key') {
        setError("Firebase API 키가 유효하지 않습니다. .env.local 파일을 확인해주세요.")
      } else {
        setError((error as Error).message || "Google 로그인 중 오류가 발생했습니다.")
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    if (!isFirebaseAvailable) {
      setError("Firebase가 설정되지 않았습니다.")
      return
    }

    try {
      setError(null)
      //console.log('🚪 로그아웃 시작...')
      
      // 서버에 로그아웃 요청 (에러가 발생해도 계속 진행)
      try {
        await apiClient.logout()
        //console.log('✅ 서버 로그아웃 완료')
      } catch (serverError) {
        console.warn('서버 로그아웃 실패 (계속 진행):', serverError)
      }

      // Firebase 로그아웃
      await signOut(auth)
      //console.log('✅ Firebase 로그아웃 완료')

      // 로컬 스토리지 사용하지 않음
      
      // 강제로 로그인 페이지로 이동
      window.location.href = "/login"
    } catch (error) {
      console.error("Error signing out:", error)
      setError((error as Error).message || "로그아웃 중 오류가 발생했습니다.")
      // 에러가 발생해도 로그인 페이지로 이동
      window.location.href = "/login"
    }
  }

  return {
    user,
    loading,
    error,
    isFirebaseAvailable,
    signInWithGoogle,
    logout,
  }
}
