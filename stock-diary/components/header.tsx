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
    <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
        </div>
        <h1 className="text-lg md:text-xl font-semibold text-slate-800">시크릿 주주총회</h1>
      </div>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto p-2 hover:bg-slate-50">
              <Avatar className="w-8 h-8 md:w-9 md:h-9">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "사용자"} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-slate-800">{user.displayName || "사용자"}</span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "사용자"} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.displayName || "사용자"}</span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  )
}
