"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/calendar"
import { SidePanel } from "@/components/side-panel"
import { Header } from "@/components/header"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export interface DiaryEntry {
  id: string
  date: string
  emotion: string
  emotionLabel: string
  text: string
  photo?: string
  aiFeedback?: string
}

// Mock data for demonstration
const mockEntries: DiaryEntry[] = [
  {
    id: "1",
    date: "2024-01-15",
    emotion: "😊",
    emotionLabel: "기쁨",
    text: "오늘 테슬라 주식이 5% 상승했다. 지난달에 매수한 결정이 옳았던 것 같다. 장기 투자의 중요성을 다시 한번 깨달았다.",
    aiFeedback:
      "훌륭한 투자 결과입니다! 테슬라의 상승은 전기차 시장의 성장과 관련이 있어 보입니다. 앞으로도 장기적인 관점을 유지하시되, 포트폴리오 다각화도 고려해보시기 바랍니다.",
  },
  {
    id: "2",
    date: "2024-01-20",
    emotion: "🤔",
    emotionLabel: "고민",
    text: "시장이 불안정하다. 금리 인상 소식에 기술주들이 많이 떨어졌다. 손절할지 홀딩할지 고민이다.",
    aiFeedback:
      "시장의 변동성은 자연스러운 현상입니다. 금리 인상은 단기적으로 기술주에 부정적이지만, 기업의 펀더멘털이 건실하다면 장기적으로는 회복될 가능성이 높습니다. 감정적인 결정보다는 데이터에 기반한 판단을 권합니다.",
  },
]

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      }
    }
  }, [user, loading, router])

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [entries, setEntries] = useState<DiaryEntry[]>(mockEntries)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  const selectedEntry = entries.find((entry) => entry.date === selectedDate)

  const handleSaveEntry = (entry: Omit<DiaryEntry, "id">) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: Date.now().toString(),
      aiFeedback: generateAIFeedback(entry.text, entry.emotion),
    }

    setEntries((prev) => {
      const existingIndex = prev.findIndex((e) => e.date === entry.date)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...newEntry, id: prev[existingIndex].id }
        return updated
      }
      return [...prev, newEntry]
    })
  }

  const handleDeleteEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
  }

  const generateAIFeedback = (text: string, emotion: string): string => {
    // Simple AI feedback simulation
    const feedbacks = {
      "😊": "긍정적인 투자 경험이네요! 이런 성공 경험을 바탕으로 투자 전략을 더욱 발전시켜 나가시기 바랍니다.",
      "😥": "투자에는 항상 위험이 따릅니다. 손실을 경험하셨더라도 이를 통해 배우는 것이 중요합니다. 감정적인 결정보다는 냉정한 분석을 권합니다.",
      "🤔": "신중한 고민은 좋은 투자의 시작입니다. 다양한 정보를 수집하고 분석하여 현명한 결정을 내리시기 바랍니다.",
      "🔥": "감정적인 상태에서는 성급한 결정을 내리기 쉽습니다. 잠시 시간을 두고 객관적으로 상황을 판단해보시기 바랍니다.",
      "🤩": "큰 수익을 얻으셨군요! 하지만 과도한 자신감은 위험할 수 있습니다. 리스크 관리를 잊지 마시고 꾸준한 투자를 이어가세요.",
    }
    return (
      feedbacks[emotion as keyof typeof feedbacks] ||
      "투자 일기를 작성해주셔서 감사합니다. 꾸준한 기록을 통해 더 나은 투자자가 되실 수 있을 것입니다."
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
        {/* Main Content Area - Calendar */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <Calendar
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            entries={entries}
          />
        </div>

        {/* Side Panel */}
        <div className="w-full lg:w-1/3 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white">
          <SidePanel
            selectedDate={selectedDate}
            selectedEntry={selectedEntry}
            onSaveEntry={handleSaveEntry}
            onDeleteEntry={handleDeleteEntry}
          />
        </div>
      </div>
    </div>
  )
}
