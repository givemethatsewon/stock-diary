"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DiaryEntry } from "@/app/dashboard/page"

interface CalendarProps {
  currentMonth: Date
  onMonthChange: (date: Date) => void
  selectedDate: string
  onDateSelect: (date: string) => void
  entries: DiaryEntry[]
}

export function Calendar({ currentMonth, onMonthChange, selectedDate, onDateSelect, entries }: CalendarProps) {
  const today = new Date().toISOString().split("T")[0]

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"]

  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const previousMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    onMonthChange(newDate)
  }

  const nextMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    onMonthChange(newDate)
  }

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0")
    const dayStr = String(day).padStart(2, "0")
    return `${year}-${month}-${dayStr}`
  }

  const getEntryForDate = (date: string) => {
    return entries.find((entry) => entry.date === date)
  }

  const renderCalendarDays = () => {
    const days = []
    const totalCells = Math.ceil((firstDayWeekday + daysInMonth) / 7) * 7

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(
        // [수정] aspect ratio 클래스 단순화 및 통일
        <div key={`empty-start-${i}`} className="aspect-square flex items-center justify-center">
        </div>
      )
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(day)
      const entry = getEntryForDate(dateStr)
      const isToday = dateStr === today
      const isSelected = dateStr === selectedDate

      days.push(
        <button
          key={day}
          onClick={() => onDateSelect(dateStr)}
          // [수정] aspect ratio 단순화, 내부 패딩(p-*) 축소
          className={`aspect-square p-1 sm:p-1.5 border border-slate-600/30 hover:bg-slate-600/50 transition-all duration-200 relative flex flex-col items-start justify-start rounded-lg group ${
            isSelected ? "bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/25" : "bg-slate-700/30"
          } ${isToday ? "ring-1 ring-cyan-400" : ""}`}
        >
          {/* [수정] 날짜 숫자 폰트 크기(text-*) 축소 */}
          <span className={`text-xs sm:text-sm font-medium ${
            isToday ? "text-cyan-400 font-bold" : 
            isSelected ? "text-cyan-300" : "text-slate-200"
          }`}>
            {day}
          </span>
          {entry && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* [수정] 이모지 폰트 크기(text-*) 축소 */}
              <span className="text-lg sm:text-xl lg:text-2xl" title={entry.emotionLabel}>
                {entry.emotion}
              </span>
            </div>
          )}
          {/* [수정] '오늘' 표시 점 크기(w-*, h-*) 축소 */}
          {isToday && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>}
        </button>,
      )
    }

    // Fill remaining cells to complete the grid
    const remainingCells = totalCells - (firstDayWeekday + daysInMonth)
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        // [수정] aspect ratio 클래스 단순화 및 통일
        <div key={`empty-end-${i}`} className="aspect-square flex items-center justify-center">
        </div>
      )
    }

    return days
  }

  return (
    // [수정] 최상위 컨테이너: 패딩(p-*) 축소, max-w-* 추가로 최대 너비 제한
    <div className="bg-slate-700/40 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/50 p-3 sm:p-4 lg:p-5 h-auto flex flex-col lg:w-full max-w-4xl mx-auto">
      {/* Calendar Header */}
      {/* [수정] 헤더: 하단 마진(mb-*) 축소 */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4 flex-shrink-0">
        {/* [수정] 헤더: 제목 폰트 크기(text-*) 축소 */}
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
          {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
        </h2>
        {/* [수정] 헤더: 버튼 간격(gap-*) 축소 */}
        <div className="flex gap-1 sm:gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            // [수정] 헤더: 버튼 크기(w-*, h-*) 축소
            className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-600/50 hover:bg-slate-500/50 border-slate-500 hover:border-slate-400 text-slate-300 hover:text-white rounded-lg"
          >
            {/* [수정] 헤더: 아이콘 크기(w-*, h-*) 축소 */}
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={nextMonth} 
            // [수정] 헤더: 버튼 크기(w-*, h-*) 축소
            className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-600/50 hover:bg-slate-500/50 border-slate-500 hover:border-slate-400 text-slate-300 hover:text-white rounded-lg"
          >
            {/* [수정] 헤더: 아이콘 크기(w-*, h-*) 축소 */}
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Week Days Header */}
      {/* [수정] 요일 헤더: 그리드 간격(gap-*) 및 하단 마진(mb-*) 축소 */}
      <div className="grid grid-cols-7 gap-1 lg:gap-1.5 mb-1 sm:mb-2 flex-shrink-0">
        {weekDays.map((day) => (
          // [수정] 요일 헤더: 높이(h-*) 축소
          <div key={day} className="h-6 sm:h-8 flex items-center justify-center">
            {/* [수정] 요일 헤더: 폰트 크기(text-*) 축소 */}
            <span className="text-xs sm:text-sm font-medium text-slate-400">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {/* [수정] 날짜 그리드: 그리드 간격(gap-*) 축소 */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {renderCalendarDays()}
      </div>
    </div>
  )
}