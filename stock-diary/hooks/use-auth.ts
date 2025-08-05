"use client"

import { useEffect, useState } from "react"
import { type User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"
import { useRouter } from "next/navigation"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user)
        setLoading(false)
        setError(null)
        setIsFirebaseAvailable(true)
      }, (error) => {
        console.error("Auth state change error:", error)
        
        // API 키 오류인 경우 Firebase를 비활성화
        if (error.code === 'auth/api-key-not-valid' || error.code === 'auth/invalid-api-key') {
          setError("Firebase API 키가 유효하지 않습니다. 설정을 확인해주세요.")
          setIsFirebaseAvailable(false)
        } else {
          setError(error.message)
        }
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error("Firebase auth initialization error:", error)
      setError("Firebase 인증 초기화 오류")
      setIsFirebaseAvailable(false)
      setLoading(false)
    }
  }, [])

  const signInWithGoogle = async () => {
    if (!isFirebaseAvailable) {
      setError("Firebase가 설정되지 않았습니다. 먼저 Firebase 설정을 완료해주세요.")
      return
    }

    try {
      setLoading(true)
      setError(null)
      await signInWithPopup(auth, googleProvider)
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error signing in with Google:", error)
      
      if (error.code === 'auth/api-key-not-valid' || error.code === 'auth/invalid-api-key') {
        setError("Firebase API 키가 유효하지 않습니다. .env.local 파일을 확인해주세요.")
      } else {
        setError(error.message || "Google 로그인 중 오류가 발생했습니다.")
      }
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
      await signOut(auth)
      router.push("/login")
    } catch (error: any) {
      console.error("Error signing out:", error)
      setError(error.message || "로그아웃 중 오류가 발생했습니다.")
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
