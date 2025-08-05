"use client"

import { BookOpen, LogOut, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-700/50 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-400/30">
          <BookOpen className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">시크릿 주주총회</h1>
          <p className="text-xs text-slate-400">AI 투자 일기</p>
        </div>
      </div>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto p-2 rounded-xl hover:bg-slate-800/50">
              <Avatar className="w-9 h-9">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "사용자"} />
                <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-sm font-semibold border border-cyan-400/30">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-white">{user.displayName || "사용자"}</span>
                <span className="text-xs text-slate-400">{user.email}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 bg-slate-800 border-slate-700">
            <div className="flex items-center gap-3 p-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "사용자"} />
                <AvatarFallback className="bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-400/30">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{user.displayName || "사용자"}</span>
                <span className="text-xs text-slate-400">{user.email}</span>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem 
              onClick={logout} 
              className="text-red-400 focus:text-red-300 focus:bg-red-900/20 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  )
}