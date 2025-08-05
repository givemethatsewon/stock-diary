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
        <div key={`empty-start-${i}`} className="aspect-square sm:aspect-[4/3] lg:aspect-[5/4] xl:aspect-[6/5] flex items-center justify-center">
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
          className={`aspect-square sm:aspect-[4/3] lg:aspect-[5/4] xl:aspect-[6/5] p-1 sm:p-2 border border-slate-600/30 hover:bg-slate-600/50 transition-all duration-200 relative flex flex-col items-start justify-start rounded-lg group ${
            isSelected ? "bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/25" : "bg-slate-700/30"
          } ${isToday ? "ring-1 ring-cyan-400" : ""}`}
        >
          <span className={`text-xs sm:text-sm font-medium ${
            isToday ? "text-cyan-400 font-bold" : 
            isSelected ? "text-cyan-300" : "text-slate-200"
          }`}>
            {day}
          </span>
          {entry && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg sm:text-xl lg:text-2xl" title={entry.emotionLabel}>
                {entry.emotion}
              </span>
            </div>
          )}
          {isToday && <div className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full"></div>}
        </button>,
      )
    }

    // Fill remaining cells to complete the grid
    const remainingCells = totalCells - (firstDayWeekday + daysInMonth)
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        <div key={`empty-end-${i}`} className="aspect-square sm:aspect-[4/3] lg:aspect-[5/4] xl:aspect-[6/5] flex items-center justify-center">
        </div>
      )
    }

    return days
  }

  return (
    <div className="bg-slate-700/40 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/50 p-3 sm:p-4 lg:p-6 h-auto flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6 flex-shrink-0">
        <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">
          {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
        </h2>
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-slate-600/50 hover:bg-slate-500/50 border-slate-500 hover:border-slate-400 text-slate-300 hover:text-white rounded-lg"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={nextMonth} 
            className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-slate-600/50 hover:bg-slate-500/50 border-slate-500 hover:border-slate-400 text-slate-300 hover:text-white rounded-lg"
          >
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          </Button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-3 flex-shrink-0">
        {weekDays.map((day) => (
          <div key={day} className="h-6 sm:h-8 lg:h-10 flex items-center justify-center">
            <span className="text-xs sm:text-sm font-medium text-slate-400">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 min-h-0">
        {renderCalendarDays()}
      </div>
    </div>
  )
}