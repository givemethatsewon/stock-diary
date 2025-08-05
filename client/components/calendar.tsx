"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DiaryEntry } from "@/app/page"

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

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 md:h-20"></div>)
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
          className={`h-16 md:h-20 p-1 md:p-2 border border-slate-100 hover:bg-blue-50 transition-colors relative flex flex-col items-center justify-center ${
            isSelected ? "bg-blue-100 border-blue-300" : "bg-white"
          } ${isToday ? "ring-1 md:ring-2 ring-blue-400" : ""}`}
        >
          <span className={`text-xs md:text-sm font-medium ${isToday ? "text-blue-600" : "text-slate-700"}`}>
            {day}
          </span>
          {entry && (
            <span className="text-base md:text-lg mt-0.5 md:mt-1" title={entry.emotionLabel}>
              {entry.emotion}
            </span>
          )}
          {isToday && <div className="absolute top-1 right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-400 rounded-full"></div>}
        </button>,
      )
    }

    return days
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-800">
          {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousMonth}
            className="w-8 h-8 md:w-9 md:h-9 p-0 bg-transparent"
          >
            <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth} className="w-8 h-8 md:w-9 md:h-9 p-0 bg-transparent">
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="h-8 md:h-10 flex items-center justify-center">
            <span className="text-xs md:text-sm font-medium text-slate-500">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 border border-slate-200 rounded-lg overflow-hidden">
        {renderCalendarDays()}
      </div>
    </div>
  )
}
