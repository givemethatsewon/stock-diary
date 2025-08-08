"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // 로그인된 사용자는 대시보드로
        //console.log('✅ 인증된 사용자, 대시보드로 리다이렉트')
        router.replace("/dashboard")
      } else {
        // 로그인되지 않은 사용자는 로그인 페이지로
        //console.log('❌ 인증되지 않은 사용자, 로그인 페이지로 리다이렉트')
        router.replace("/login")
      }
    }
  }, [user, loading, router])

  // 로딩 중일 때 표시할 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-white">인증 상태 확인 중...</p>
        </div>
      </div>
    )
  }

  // 리다이렉트 중일 때 표시할 화면
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white">페이지 이동 중...</div>
    </div>
  )
}
