"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/calendar"
import { SidePanel } from "@/components/side-panel"
import { Header } from "@/components/header"
import { AuthGuard } from "@/components/auth-guard"
import { useApi } from "@/hooks/use-api"
import { Diary, apiClient } from "@/lib/api"
import { formatUTCDateTimeToUser } from "@/lib/timezone" 

export interface DiaryEntry {
  id: string
  date: string // 사용자 시간대 날짜 (YYYY-MM-DD)
  emotion: string
  emotionLabel: string
  text: string
  photo?: string
  aiFeedback?: string
}

// API 데이터를 DiaryEntry 형식으로 변환하는 함수
const convertApiDiaryToEntry = (diary: Diary): DiaryEntry => {
  const convertedEntry = {
    id: diary.id.toString(),
    date: formatUTCDateTimeToUser(diary.diary_date, 'date'), // UTC datetime을 사용자 시간대 날짜로 변환
    emotion: getEmotionFromMood(diary.mood),
    emotionLabel: getEmotionLabel(diary.mood),
    text: diary.content,
    photo: diary.photo_url || undefined, // 사진 URL 추가
    aiFeedback: diary.llm_feedback || undefined, // AI 피드백 추가
  }
  return convertedEntry
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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)

  const { 
    loading, 
    error, 
    updateDiary, 
    deleteDiary, 
    getAIFeedback 
  } = useApi()

  const selectedEntry = entries.find((entry) => entry.date === selectedDate)

  useEffect(() => {
    loadDiaries()
  }, [])
  
  useEffect(() => {
    loadDiariesForDate(selectedDate)
  }, [selectedDate])

  const loadDiaries = async () => {
    setIsLoading(true)
    try {
      const diaries = await apiClient.getDiaries()
      if (diaries && diaries.length > 0) {
        const convertedEntries = diaries.map(convertApiDiaryToEntry)
        setEntries(convertedEntries)
      } else {
        setEntries([])
      }
    } catch (err) {
      console.error('일기 목록을 불러오는데 실패했습니다:', err)
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadDiariesForDate = async (date: string) => {
    try {
      const diaries = await apiClient.getDiariesByUserDate(date)
      if (diaries && diaries.length > 0) {
        const convertedEntries = diaries.map(convertApiDiaryToEntry)
        setEntries(prev => {
          const filtered = prev.filter(entry => entry.date !== date)
          return [...filtered, ...convertedEntries]
        })
      }
    } catch (err) {
      console.error(`${date} 날짜 일기 조회 실패:`, err)
    }
  }

  const handleSaveEntry = async (entry: Omit<DiaryEntry, "id" | "aiFeedback">) => {
    try {
      const existingEntry = entries.find((e) => e.date === entry.date)
      
      if (existingEntry) {
        const updatedDiary = await updateDiary(parseInt(existingEntry.id), {
          content: entry.text,
          mood: getMoodFromEmotion(entry.emotion),
          photo_url: entry.photo,
        })
        if (updatedDiary) {
          await loadDiaries()
        }
      } else {
        const newDiary = await apiClient.createDiaryForUserDate(
          entry.date,
          entry.text,
          getMoodFromEmotion(entry.emotion),
          entry.photo
        )
        if (newDiary) {
          await loadDiaries()
        }
      }
    } catch (err) {
      console.error('일기 저장에 실패했습니다:', err)
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류'
      if (errorMessage.includes('이미 일기가 작성되어 있습니다')) {
        alert('해당 날짜에 이미 일기가 작성되어 있습니다. 기존 일기를 수정해주세요.')
      } else {
        alert('일기 저장에 실패했습니다. 다시 시도해주세요.')
      }
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const result = await deleteDiary(parseInt(entryId))
      if (result) {
        await loadDiaries()
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
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-lg text-white">일기를 불러오는 중...</div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-900">
        <Header />

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded mx-4 mt-4">
            오류: {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
          {/* Main Content Area - Calendar */}
          <div className="flex-none lg:flex-1 p-4 md:p-6">
            <div className="max-w-4xl lg:max-w-none mx-auto lg:mx-0 lg:h-full lg:flex lg:items-start">
              <Calendar
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                entries={entries}
              />
            </div>
          </div>

          {/* Side Panel */}
          <div className="flex-1 lg:w-96 lg:flex-none border-t lg:border-t-0 lg:border-l border-slate-700 bg-slate-800">
            <div className="max-w-4xl lg:max-w-none mx-auto lg:mx-0">
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
      </div>
    </AuthGuard>
  )
}
