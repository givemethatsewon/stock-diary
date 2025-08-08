import { useState, useCallback } from 'react';
import { apiClient, Diary, DiaryCreate, DiaryUpdate, User, AIFeedback } from '../lib/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await requestFn();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      
      // 인증 에러인 경우 로그인 페이지로 리다이렉트
      if (err instanceof Error && errorMessage.includes('401')) {
        console.log('인증 에러 감지, 로그인 페이지로 리다이렉트...');
        window.location.href = "/login";
        return null;
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 일기 관련 훅
  const createDiary = useCallback(async (diary: DiaryCreate): Promise<Diary | null> => {
    return handleRequest(() => apiClient.createDiary(diary));
  }, [handleRequest]);

  const getDiaries = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<Diary[] | null> => {
    return handleRequest(() => apiClient.getDiaries(params));
  }, [handleRequest]);

  const getDiary = useCallback(async (diaryId: number): Promise<Diary | null> => {
    return handleRequest(() => apiClient.getDiary(diaryId));
  }, [handleRequest]);

  const updateDiary = useCallback(async (diaryId: number, diary: DiaryUpdate): Promise<Diary | null> => {
    return handleRequest(() => apiClient.updateDiary(diaryId, diary));
  }, [handleRequest]);

  const deleteDiary = useCallback(async (diaryId: number): Promise<{ message: string } | null> => {
    return handleRequest(() => apiClient.deleteDiary(diaryId));
  }, [handleRequest]);

  const getAIFeedback = useCallback(async (diaryId: number): Promise<AIFeedback | null> => {
    return handleRequest(() => apiClient.getAIFeedback(diaryId));
  }, [handleRequest]);

  // SSE 스트리밍 기반 AI 피드백 수신
  const streamAIFeedback = useCallback(
    async (
      diaryId: number,
      onDelta: (text: string) => void
    ): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        const finalText = await apiClient.streamAIFeedback(diaryId, onDelta);
        return finalText;
      } catch (err) {
        const message = err instanceof Error ? err.message : '스트리밍 오류가 발생했습니다.';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 사용자 관련 훅
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    return handleRequest(() => apiClient.getCurrentUser());
  }, [handleRequest]);

  // 헬스 체크
  const healthCheck = useCallback(async (): Promise<{ status: string } | null> => {
    return handleRequest(() => apiClient.healthCheck());
  }, [handleRequest]);

  // Presigned URL 요청
  const getPresignedUrl = useCallback(async (filename: string, content_type: string): Promise<{ presigned_url: string; filename: string } | null> => {
    return handleRequest(() => apiClient.getPresignedUrl(filename, content_type));
  }, [handleRequest]);

  // CDN 주소 변환 요청
  const uploadComplete = useCallback(async (filename: string): Promise<{ message: string; file_url: string } | null> => {
    return handleRequest(() => apiClient.uploadComplete(filename));
  }, [handleRequest]);

  return {
    loading,
    error,
    createDiary,
    getDiaries,
    getDiary,
    updateDiary,
    deleteDiary,
    getAIFeedback,
    streamAIFeedback,
    getCurrentUser,
    healthCheck,
    getPresignedUrl,
    uploadComplete,
  };
}; 