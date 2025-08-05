"use client"

import { useState } from "react"
import { Paperclip, Save, Edit, Trash2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { DiaryEntry } from "@/app/dashboard/page"

interface SidePanelProps {
  selectedDate: string
  selectedEntry?: DiaryEntry
  onSaveEntry: (entry: Omit<DiaryEntry, "id">) => void
  onDeleteEntry: (entryId: string) => void
  onGetAIFeedback?: (entryId: string) => void
  isLoading?: boolean
}

const emotions = [
  { emoji: "😊", label: "기쁨" },
  { emoji: "😥", label: "슬픔" },
  { emoji: "🤔", label: "고민" },
  { emoji: "🔥", label: "분노" },
  { emoji: "🤩", label: "환희" },
  { emoji: "😌", label: "인내" },
]

export function SidePanel({ 
  selectedDate, 
  selectedEntry, 
  onSaveEntry, 
  onDeleteEntry, 
  onGetAIFeedback,
  isLoading = false 
}: SidePanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedEmotion, setSelectedEmotion] = useState(emotions[0])
  const [diaryText, setDiaryText] = useState("")
  const [photo, setPhoto] = useState<string>("")
  const [isRequestingFeedback, setIsRequestingFeedback] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00') // 로컬 시간대로 해석되도록
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}년 ${month}월 ${day}일`
  }

  const handleSave = () => {
    if (!diaryText.trim()) return

    onSaveEntry({
      date: selectedDate,
      emotion: selectedEmotion.emoji,
      emotionLabel: selectedEmotion.label,
      text: diaryText,
      photo: photo || undefined,
    })

    setDiaryText("")
    setPhoto("")
    setIsEditing(false)
  }

  const handleEdit = () => {
    if (selectedEntry) {
      setSelectedEmotion(emotions.find((e) => e.emoji === selectedEntry.emotion) || emotions[0])
      setDiaryText(selectedEntry.text)
      setPhoto(selectedEntry.photo || "")
      setIsEditing(true)
    }
  }

  const handleDelete = () => {
    if (selectedEntry) {
      onDeleteEntry(selectedEntry.id)
      setIsEditing(false)
    }
  }

  const handleGetAIFeedback = async () => {
    if (selectedEntry && onGetAIFeedback) {
      setIsRequestingFeedback(true)
      try {
        await onGetAIFeedback(selectedEntry.id)
      } finally {
        setIsRequestingFeedback(false)
      }
    }
  }

  const handlePhotoUpload = () => {
    // Simulate photo upload
    setPhoto("/investment-chart.png")
  }

  // Display existing entry
  if (selectedEntry && !isEditing) {
    return (
      <div className="h-full flex flex-col p-4 md:p-6 bg-slate-800 text-white">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <span className="text-xl md:text-2xl">{selectedEntry.emotion}</span>
          <div>
            <h3 className="font-semibold text-white">{formatDate(selectedEntry.date)}</h3>
            <p className="text-sm text-slate-400">{selectedEntry.emotionLabel}</p>
          </div>
        </div>

        {selectedEntry.photo && (
          <div className="mb-4 md:mb-6">
            <img
              src={selectedEntry.photo || "/placeholder.svg"}
              alt="투자 관련 이미지"
              className="w-full h-32 md:h-48 object-cover rounded-lg border border-slate-600"
            />
          </div>
        )}

        <div className="flex-1 mb-4 md:mb-6">
          <div className="bg-slate-700 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {selectedEntry.text}
            </p>
          </div>

          {selectedEntry.aiFeedback && (
            <div className="bg-blue-900/30 rounded-lg p-3 md:p-4 border border-blue-700/50">
              <h4 className="font-medium text-blue-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                🤖 AI의 피드백
              </h4>
              <p className="text-blue-200 text-xs md:text-sm leading-relaxed">{selectedEntry.aiFeedback}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {!selectedEntry.aiFeedback && onGetAIFeedback && (
            <Button 
              onClick={handleGetAIFeedback}
              disabled={isRequestingFeedback || isLoading}
              variant="outline" 
              className="flex-1 bg-purple-900/30 border-purple-500/50 hover:bg-purple-800/50 text-purple-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isRequestingFeedback ? "AI 분석 중..." : "AI 피드백 받기"}
            </Button>
          )}
          
          <div className="flex gap-3">
            <Button 
              onClick={handleEdit} 
              variant="outline" 
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              disabled={isLoading}
            >
              <Edit className="w-4 h-4 mr-2" />
              수정하기
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              className="flex-1 text-red-400 border-red-500/50 hover:bg-red-900/30 bg-transparent"
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              삭제하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Create/Edit entry form
  return (
    <div className="h-full flex flex-col p-4 md:p-6 bg-slate-800 text-white">
      <h3 className="text-lg md:text-xl font-bold text-white mb-6">
        {isEditing ? "일기 수정하기" : "오늘의 투자 일기"}
      </h3>

      <div className="mb-6">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3 px-1">오늘의 기분을 선택해주세요</h4>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full">
          {emotions.map((emotion) => (
            <button
              key={emotion.emoji}
              onClick={() => setSelectedEmotion(emotion)}
              disabled={isLoading}
              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedEmotion.emoji === emotion.emoji
                  ? "bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/25"
                  : "bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 hover:border-slate-500"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="text-2xl mb-2">{emotion.emoji}</span>
              <span className="text-xs text-slate-300 font-medium">{emotion.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 mb-6">
        <Textarea
          value={diaryText}
          onChange={(e) => setDiaryText(e.target.value)}
          placeholder="오늘의 투자 경험, 생각, 다짐을 자유롭게 기록해보세요."
          className="h-full min-h-[180px] resize-none bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl"
          disabled={isLoading}
        />
      </div>

      {photo && (
        <div className="mb-4">
          <img
            src={photo || "/placeholder.svg"}
            alt="업로드된 이미지"
            className="w-full h-24 md:h-32 object-cover rounded-xl border border-slate-600"
          />
        </div>
      )}

      <div className="mb-6">
        <Button 
          onClick={handlePhotoUpload} 
          variant="outline" 
          className="w-full h-12 bg-slate-700/50 hover:bg-slate-600/50 border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white transition-all duration-200 rounded-xl font-medium"
          disabled={isLoading}
        >
          <Paperclip className="w-4 h-4 mr-2" />
          사진 추가
        </Button>
      </div>

      <Button
        onClick={handleSave}
        disabled={!diaryText.trim() || isLoading}
        className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4 mr-2" />
        {isLoading ? "저장 중..." : (isEditing ? "수정 완료" : "일기 저장하기")}
      </Button>
    </div>
  )
}