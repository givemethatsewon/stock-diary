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
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}월 ${day}일`
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
      <div className="h-full flex flex-col p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <span className="text-xl md:text-2xl">{selectedEntry.emotion}</span>
          <div>
            <h3 className="font-semibold text-slate-800">{formatDate(selectedEntry.date)}</h3>
            <p className="text-sm text-slate-500">{selectedEntry.emotionLabel}</p>
          </div>
        </div>

        {selectedEntry.photo && (
          <div className="mb-4 md:mb-6">
            <img
              src={selectedEntry.photo || "/placeholder.svg"}
              alt="투자 관련 이미지"
              className="w-full h-32 md:h-48 object-cover rounded-lg border border-slate-200"
            />
          </div>
        )}

        <div className="flex-1 mb-4 md:mb-6">
          <div className="bg-slate-50 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {selectedEntry.text}
            </p>
          </div>

          {selectedEntry.aiFeedback && (
            <div className="bg-blue-50 rounded-lg p-3 md:p-4 border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2 text-sm md:text-base">
                🤖 AI의 피드백
              </h4>
              <p className="text-blue-700 text-xs md:text-sm leading-relaxed">{selectedEntry.aiFeedback}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {!selectedEntry.aiFeedback && onGetAIFeedback && (
            <Button 
              onClick={handleGetAIFeedback}
              disabled={isRequestingFeedback || isLoading}
              variant="outline" 
              className="flex-1 bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isRequestingFeedback ? "AI 분석 중..." : "AI 피드백 받기"}
            </Button>
          )}
          
          <div className="flex gap-3">
            <Button 
              onClick={handleEdit} 
              variant="outline" 
              className="flex-1 bg-transparent"
              disabled={isLoading}
            >
              <Edit className="w-4 h-4 mr-2" />
              수정하기
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
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
    <div className="h-full flex flex-col p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-semibold text-slate-800 mb-4 md:mb-6">
        {isEditing ? "일기 수정하기" : "오늘의 투자 일기"}
      </h3>

      <div className="mb-4 md:mb-6">
        <p className="text-sm text-slate-600 mb-3">오늘의 기분을 선택해주세요</p>
        <div className="grid grid-cols-3 md:flex gap-2">
          {emotions.map((emotion) => (
            <button
              key={emotion.emoji}
              onClick={() => setSelectedEmotion(emotion)}
              disabled={isLoading}
              className={`flex flex-col items-center p-2 md:p-3 rounded-lg border transition-colors ${
                selectedEmotion.emoji === emotion.emoji
                  ? "bg-blue-50 border-blue-300"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="text-lg md:text-xl mb-1">{emotion.emoji}</span>
              <span className="text-xs text-slate-600">{emotion.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 mb-4 md:mb-6">
        <Textarea
          value={diaryText}
          onChange={(e) => setDiaryText(e.target.value)}
          placeholder="오늘의 투자 경험, 생각, 다짐을 자유롭게 기록해보세요."
          className="h-full min-h-[150px] md:min-h-[200px] resize-none border-slate-200 focus:border-blue-300 text-sm md:text-base"
          disabled={isLoading}
        />
      </div>

      {photo && (
        <div className="mb-4">
          <img
            src={photo || "/placeholder.svg"}
            alt="업로드된 이미지"
            className="w-full h-24 md:h-32 object-cover rounded-lg border border-slate-200"
          />
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <Button 
          onClick={handlePhotoUpload} 
          variant="outline" 
          className="flex-1 bg-transparent"
          disabled={isLoading}
        >
          <Paperclip className="w-4 h-4 mr-2" />
          사진 추가
        </Button>
      </div>

      <Button
        onClick={handleSave}
        disabled={!diaryText.trim() || isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        <Save className="w-4 h-4 mr-2" />
        {isLoading ? "저장 중..." : (isEditing ? "수정 완료" : "일기 저장하기")}
      </Button>
    </div>
  )
}
