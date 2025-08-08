"use client"

import { useState, ChangeEvent, useEffect } from "react"
import { Paperclip, Save, Edit, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { DiaryEntry } from "@/app/dashboard/page"
import { useApi } from "@/hooks/use-api"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"

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
  onGetAIFeedback: _onGetAIFeedback,
  isLoading = false 
}: SidePanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedEmotion, setSelectedEmotion] = useState(emotions[0])
  const [diaryText, setDiaryText] = useState("")
  const [photo, setPhoto] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { getPresignedUrl, uploadComplete } = useApi()
  
  // 부모에서 전달된 핸들러 참조를 소비하여 린트 경고 방지
  useEffect(() => {
    // no-op
  }, [_onGetAIFeedback])


  const handleDiaryTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setDiaryText(value)
  }

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
    setUploadError(null)
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

  // AI 피드백 재요청 로직은 현재 UI에서 사용하지 않음

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // 파일 크기 검증 (10MB 제한)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setUploadError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      
      // 이미지 파일 타입 검증
      if (!selectedFile.type.startsWith('image/')) {
        setUploadError('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      handleImageUpload(selectedFile);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // 1. FastAPI 백엔드에 Presigned URL 요청
      console.log('📤 Presigned URL 요청:', { filename: file.name, type: file.type, size: file.size });
      const presignedData = await getPresignedUrl(file.name, file.type);
      
      if (!presignedData) {
        throw new Error('Presigned URL 요청에 실패했습니다.');
      }

      const { presigned_url } = presignedData;
      console.log('📥 Presigned URL 수신:', presigned_url);

      // 2. 발급받은 Presigned URL을 사용해 파일을 S3로 직접 PUT
      const uploadRes = await fetch(presigned_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('S3 업로드에 실패했습니다.');
      }

      // 3. CDN 주소 변환 API 호출
      const key = presigned_url.split('.com/')[1].split('?')[0];
      console.log('🔗 CDN 주소 변환 요청:', { key });
      
      const uploadCompleteData = await uploadComplete(key);
      if (!uploadCompleteData) {
        throw new Error('CDN 주소 변환에 실패했습니다.');
      }
      
      console.log('✅ CDN 주소 수신:', uploadCompleteData.file_url);

      // 4. CDN 주소로 상태 업데이트
      setPhoto(uploadCompleteData.file_url);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(`업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto("");
    setUploadError(null);
  };

  // Display existing entry
  if (selectedEntry && !isEditing) {
    // 스트리밍 진행 여부는 상태에 반영된 값으로 판단하되, 별도 변수는 사용하지 않음
    const escapeMarkdownListsPreserveDashes = (text: string): string => {
      return text
        .split("\n")
        .map((line) => {
          // 선행 공백 후 불릿 기호(-, *, +)로 시작하면 이스케이프 처리하여 하이픈을 그대로 표시
          if (/^\s*[-*+]\s+/.test(line)) {
            return line.replace(/^(\s*)([-*+])(\s+)/, (_m, s, sym, sp) => `${s}\\${sym}${sp}`)
          }
          // 숫자. 으로 시작하는 순서 리스트도 일반 텍스트로 보이도록 점을 이스케이프
          if (/^\s*\d+\.\s+/.test(line)) {
            return line.replace(/^(\s*)(\d+)(\.)(\s+)/, (_m, s, num, dot, sp) => `${s}${num}\\${dot}${sp}`)
          }
          return line
        })
        .join("\n")
    }

    const aiFeedbackForRender = selectedEntry.aiFeedback
      ? escapeMarkdownListsPreserveDashes(selectedEntry.aiFeedback)
      : ""
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
               className="w-full max-h-96 object-contain rounded-lg border border-slate-600"
             />
           </div>
         )}

        <div className="flex-1 mb-4 md:mb-6">
          <div className="bg-slate-700 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {selectedEntry.text}
            </p>
          </div>

          {(selectedEntry.aiFeedback || selectedEntry.aiFeedbackSource) && (
            <div className="bg-blue-900/30 rounded-lg p-3 md:p-4 border border-blue-700/50">
              <h4 className="font-medium text-blue-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                <img src="/aistar.svg" alt="AI" className="w-4 h-4 md:w-5 md:h-5" />
                주시다의 피드백
              </h4>
              {selectedEntry.aiFeedback ? (
                <div className="text-blue-200 text-xs md:text-sm leading-relaxed prose prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-pre:my-2">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      a(props) {
                        return <a {...props} target="_blank" rel="noopener noreferrer" />
                      },
                    }}
                  >
                    {aiFeedbackForRender}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="shimmer rounded-md bg-blue-800/20 border border-blue-700/30 p-3">
                  <div className="text-blue-300 text-xs md:text-sm">주시다가 응답 생성중...</div>
                  <div className="mt-2 space-y-2 opacity-80">
                    <div className="h-3 bg-blue-700/30 rounded" />
                    <div className="h-3 w-5/6 bg-blue-700/30 rounded" />
                    <div className="h-3 w-4/6 bg-blue-700/30 rounded" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          
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
          onChange={handleDiaryTextChange}
          placeholder="오늘의 투자 경험, 생각, 다짐을 자유롭게 기록해보세요."
          className="h-full min-h-[180px] resize-none bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl"
          disabled={isLoading}
        />
      </div>

             {photo && (
         <div className="mb-4 relative">
           <img
             src={photo}
             alt="업로드된 이미지"
             className="w-full max-h-96 object-contain rounded-xl border border-slate-600"
           />
           <button
             onClick={handleRemovePhoto}
             className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
             disabled={isLoading}
           >
             <X className="w-3 h-3" />
           </button>
         </div>
       )}

      {uploadError && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
          <p className="text-red-300 text-sm">{uploadError}</p>
        </div>
      )}

      <div className="mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
          disabled={isLoading || isUploading}
        />
        <label
          htmlFor="image-upload"
          className={`w-full h-12 flex items-center justify-center bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white transition-all duration-200 rounded-xl font-medium cursor-pointer ${
            (isLoading || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isUploading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-pulse" />
              업로드 중...
            </>
          ) : (
            <>
              <Paperclip className="w-4 h-4 mr-2" />
              사진 추가
            </>
          )}
        </label>
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