"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/calendar"
import { SidePanel } from "@/components/side-panel"
import { Header } from "@/components/header"
import { AuthGuard } from "@/components/auth-guard"
import { useApi } from "@/hooks/use-api"
import { Diary, DiaryCreate } from "@/lib/api"
import { getCurrentUserDate, getUTCDateTimeAsUserDate } from "@/lib/timezone"

export interface DiaryEntry {
  id: string
  date: string
  emotion: string
  emotionLabel: string
  text: string
  photo?: string
  aiFeedback?: string
}

// API 데이터를 DiaryEntry 형식으로 변환하는 함수
const convertApiDiaryToEntry = (diary: Diary): DiaryEntry => {
  return {
    id: diary.id.toString(),
    date: getUTCDateTimeAsUserDate(diary.diary_date), // UTC 날짜를 사용자 시간대로 변환
    emotion: getEmotionFromMood(diary.mood),
    emotionLabel: getEmotionLabel(diary.mood),
    text: diary.content,
    aiFeedback: undefined, // AI 피드백은 별도로 요청해야 함
  }
}

// 기분을 이모지로 변환
const getEmotionFromMood = (mood: string): string => {
  const moodMap: { [key: string]: string } = {
    'happy': '😊',
    'sad': '😥',
    'neutral': '😌',
    'excited': '🤩',
    'worried': '🤔',
    'angry': '🔥',
  }
  return moodMap[mood] || '😌'
}

// 기분을 한국어 라벨로 변환
const getEmotionLabel = (mood: string): string => {
  const labelMap: { [key: string]: string } = {
    'happy': '기쁨',
    'sad': '슬픔',
    'neutral': '평온',
    'excited': '흥분',
    'worried': '고민',
    'angry': '분노',
  }
  return labelMap[mood] || '평온'
}

// 이모지를 기분으로 변환
const getMoodFromEmotion = (emotion: string): string => {
  const emotionMap: { [key: string]: string } = {
    '😊': 'happy',
    '😥': 'sad',
    '😌': 'neutral',
    '🤩': 'excited',
    '🤔': 'worried',
    '🔥': 'angry',
  }
  return emotionMap[emotion] || 'neutral'
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentUserDate())
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)

  const { 
    loading, 
    error, 
    getDiaries, 
    createDiary, 
    updateDiary, 
    deleteDiary, 
    getAIFeedback 
  } = useApi()

  const selectedEntry = entries.find((entry) => entry.date === selectedDate)

  // 일기 목록 로드
  useEffect(() => {
    loadDiaries()
  }, [])

  const loadDiaries = async () => {
    setIsLoading(true)
    try {
      const diaries = await getDiaries()
      if (diaries) {
        const convertedEntries = diaries.map(convertApiDiaryToEntry)
        setEntries(convertedEntries)
      }
    } catch (err) {
      console.error('일기 목록을 불러오는데 실패했습니다:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveEntry = async (entry: Omit<DiaryEntry, "id">) => {
    try {
      const diaryData: DiaryCreate = {
        diary_date: entry.date,
        content: entry.text,
        mood: getMoodFromEmotion(entry.emotion),
      }

      const existingEntry = entries.find((e) => e.date === entry.date)
      
      if (existingEntry) {
        // 기존 일기 수정
        const updatedDiary = await updateDiary(parseInt(existingEntry.id), {
          content: entry.text,
          mood: getMoodFromEmotion(entry.emotion),
        })
        
        if (updatedDiary) {
          const updatedEntry = convertApiDiaryToEntry(updatedDiary)
          setEntries((prev) => 
            prev.map((e) => e.id === existingEntry.id ? updatedEntry : e)
          )
        }
      } else {
        // 새 일기 생성
        const newDiary = await createDiary(diaryData)
        if (newDiary) {
          const newEntry = convertApiDiaryToEntry(newDiary)
          setEntries((prev) => [...prev, newEntry])
        }
      }
    } catch (err) {
      console.error('일기 저장에 실패했습니다:', err)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const result = await deleteDiary(parseInt(entryId))
      if (result) {
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
      }
    } catch (err) {
      console.error('일기 삭제에 실패했습니다:', err)
    }
  }

  const handleGetAIFeedback = async (entryId: string) => {
    try {
      const feedback = await getAIFeedback(parseInt(entryId))
      if (feedback) {
        setEntries((prev) => 
          prev.map((entry) => 
            entry.id === entryId 
              ? { ...entry, aiFeedback: feedback.feedback }
              : entry
          )
        )
      }
    } catch (err) {
      console.error('AI 피드백 요청에 실패했습니다:', err)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-lg">일기를 불러오는 중...</div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <Header />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-4">
            오류: {error}
          </div>
        )}

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
              onGetAIFeedback={handleGetAIFeedback}
              isLoading={loading}
            />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
