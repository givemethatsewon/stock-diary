"use client"

import { BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const { signInWithGoogle, loading, error } = useAuth()

  const handleGoogleSignIn = async () => {
    await signInWithGoogle()
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Main content card */}
        <div className="glass-effect rounded-3xl p-8 md:p-12 text-center">
          {/* App Logo and Title */}
          <div className="mb-12">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
              <BookOpen className="w-10 h-10 text-white" />
              <Sparkles className="w-6 h-6 text-teal-400 absolute translate-x-2 -translate-y-2" />
            </div>
            <h1 className="heading-lg text-white mb-4">시크릿 주주총회</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              구글 계정으로 간편하게 시작하세요.
              <br />
              <span className="text-sm text-white/50">투자 여정을 기록하고 성장하세요</span>
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button onClick={handleGoogleSignIn} className="btn-primary w-full h-14 text-lg font-semibold mb-8" disabled={loading}>
            {loading ? (
              <span>로그인 중...</span>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google 계정으로 로그인
              </div>
            )}
          </Button>
          
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-white/40 leading-relaxed mb-4">
              로그인하면 개인정보처리방침 및 서비스 약관에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
