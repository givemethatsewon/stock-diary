import { getUserDateTimeAsUTC, getUserDateAsUTCRange } from './timezone';

// SSR(서버)에서는 내부 네트워크 주소를 우선 사용, 브라우저에서는 공개 URL 사용
const API_BASE_URL =
  typeof window === 'undefined'
    ? process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let isRedirectingToLogin = false;
function redirectToLoginIfNeeded() {
  if (typeof window === 'undefined') return;
  if (isRedirectingToLogin) return;
  const currentPath = window.location?.pathname;
  if (currentPath !== '/login') {
    isRedirectingToLogin = true;
    window.location.replace('/login');
  }
}

export interface Diary {
  id: number;
  content: string;
  mood: string;
  photo_url?: string;
  diary_date: string; // UTC ISO 문자열 (사용자가 의도한 작성 날짜)
  created_at: string; // UTC ISO 문자열 (실제 서버 저장 시간)
  updated_at: string; // UTC ISO 문자열
  llm_feedback?: string;
  owner_id: number;
  owner?: User;
}

export interface DiaryCreate {
  diary_date: string; // 사용자 시간대 날짜를 UTC로 변환하여 전송
  content: string;
  mood: string;
  photo_url?: string;
  // 선택한 날짜의 현지 자정~23:59:59(.999)을 UTC로 변환하여 중복 체크에 사용
  range_start_utc?: string;
  range_end_utc?: string;
}

export interface DiaryUpdate {
  content?: string;
  mood?: string;
  photo_url?: string;
}

export interface User {
  id: number;
  firebase_uid: string;
  email: string;
  created_at: string; // UTC ISO 문자열
}

export interface AIFeedback {
  feedback: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Firebase 토큰 가져오기
    let authToken = null;
    try {
      // Firebase auth 객체 가져오기
      const { auth } = await import('../lib/firebase');
      if (!auth) {
        console.warn('⚠️ SSR 환경 또는 Firebase 미초기화: auth 없음');
      }
      
      if (auth && auth.currentUser) {
        //console.log('✅ Firebase 사용자 발견:', auth.currentUser.email);
        authToken = await auth.currentUser.getIdToken();
        //console.log('✅ Firebase 토큰 획득 성공, 길이:', authToken?.length || 0);
      } else if (auth) {
        console.warn('❌ Firebase 사용자가 없음');
      }
    } catch (error) {
      console.error('❌ Firebase 토큰 획득 실패:', error);
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    
    // Authorization 헤더 추가
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      //console.log('🔐 Authorization 헤더 추가됨');
    } else {
      console.warn('⚠️ Firebase 토큰이 없어 Authorization 헤더를 추가하지 않음');
    }
    
    const config: RequestInit = {
      headers,
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        redirectToLoginIfNeeded();
        throw new Error('HTTP 401: Unauthorized');
      }
      let errorData: { detail?: string } = {};
      try {
        const responseText = await response.text();
        if (responseText) {
          errorData = JSON.parse(responseText);
        }
             } catch {
         // 응답이 JSON이 아니거나 빈 응답인 경우
         errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
       }
      
      console.error('❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorData,
      });
      
      const errorMessage = typeof errorData.detail === 'string'
        ? errorData.detail
        : `HTTP ${response.status}: ${response.statusText}`;

      throw new Error(errorMessage);
    }

    return response.json();
  }

  // SSE 스트리밍으로 AI 피드백 수신
  async streamAIFeedback(
    diaryId: number,
    onDelta: (text: string) => void
  ): Promise<string> {
    const url = `${this.baseUrl}/api/v1/diaries/${diaryId}/ai-feedback`;

    // Firebase 토큰 준비
    let authToken: string | null = null;
    try {
      const { auth } = await import('../lib/firebase');
      if (auth && auth.currentUser) {
        authToken = await auth.currentUser.getIdToken();
      }
    } catch {
      // ignore
    }

    const headers: Record<string, string> = {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      Accept: 'text/event-stream',
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok || !response.body) {
      if (response.status === 401) {
        redirectToLoginIfNeeded();
        throw new Error('HTTP 401: Unauthorized');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // 청크 수신 즉시 로딩 상태를 해제하고 첫 렌더 유도 (초기 지연 완화)
      if (buffer.length > 0 && finalText.length === 0) {
        // no-op: onDelta가 실행되며 UI 갱신
      }

      let sepIndex;
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);

        // SSE 이벤트 파싱
        const lines = rawEvent.split('\n');
        let eventType: string | null = null;
        const dataLines: string[] = [];
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            // 'data:' 다음의 한 칸 공백만 제거하고, 나머지 공백은 그대로 보존
            let value = line.slice(5);
            if (value.startsWith(' ')) value = value.slice(1);
            dataLines.push(value);
          }
        }
        const data = dataLines.join('\n');

        if (eventType === 'error') {
          throw new Error(data || 'AI 스트림 오류');
        }
        if (eventType === 'done') {
          // 서버에서 종료 신호
          break;
        }
        // 기본 데이터 이벤트
        if (data) {
          finalText += data;
          onDelta(data);
        }
      }
    }

    return finalText.trim();
  }



  // Firebase 로그인 메서드
  async loginWithFirebase(firebaseToken: string): Promise<{ message: string; user: User }> {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ firebase_token: firebaseToken }),
    });
  }

  // 로그아웃 메서드
  async logout(): Promise<{ message: string }> {
    return this.request('/api/v1/auth/logout', {
      method: 'POST',
    });
  }

  // 현재 사용자 정보 조회
  async getCurrentUser(): Promise<User> {
    return this.request('/api/v1/auth/me');
  }

  // 일기 관련 API
  async createDiary(diary: DiaryCreate): Promise<Diary> {
    // diary_date가 사용자 시간대 날짜(YYYY-MM-DD)라면 UTC datetime으로 변환
    let utcDiary = { ...diary };
    //console.log('원본 일기 데이터:', diary);
    
    if (diary.diary_date && !diary.diary_date.includes('T')) {
      // YYYY-MM-DD 형식을 사용자 시간대의 해당 날짜 00:00:00으로 해석하여 UTC로 변환
      const utcDateTime = getUserDateTimeAsUTC(diary.diary_date);
      //console.log(`날짜 변환: ${diary.diary_date} -> ${utcDateTime}`);
      utcDiary = { ...diary, diary_date: utcDateTime };
    }
    
    //console.log('서버로 전송할 데이터:', utcDiary);
    
    return this.request<Diary>('/api/v1/diaries/', {
      method: 'POST',
      body: JSON.stringify(utcDiary),
    });
  }

  async getDiaries(params?: {
    skip?: number;
    limit?: number;
    day?: string;        // YYYY-MM-DD (서버 미사용, 하위호환 유지)
    start_date?: string; // ISO UTC datetime
    end_date?: string;   // ISO UTC datetime
  }): Promise<Diary[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/v1/diaries/?${queryString}` : '/api/v1/diaries/';
    
    return this.request<Diary[]>(endpoint);
  }

  // 사용자 시간대의 특정 날짜 일기 조회 헬퍼 메서드
  async getDiariesByUserDate(userDate: string, params?: {
    skip?: number;
    limit?: number;
  }): Promise<Diary[]> {
    // 글로벌 대응: 서버는 UTC 기준 일자 필드를 사용하므로 날짜 문자열만 전달
    return this.getDiaries({
      ...params,
      start_date: getUserDateAsUTCRange(userDate).start_datetime, // YYYY-MM-DDT00:00:00
      end_date: getUserDateAsUTCRange(userDate).end_datetime, // YYYY-MM-DDT23:59:59
    });
  }

  // 사용자 시간대 날짜로 일기 작성 헬퍼 메서드
  async createDiaryForUserDate(
    userDate: string, 
    content: string, 
    mood: string, 
    photoUrl?: string
  ): Promise<Diary> {

    const now = new Date();
    const userTimeString = now.toTimeString().split(' ')[0]; // HH:MM:SS 형식
    const user_date_utc = getUserDateTimeAsUTC(userDate, userTimeString);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startString = startOfDay.toTimeString().split(' ')[0];
    const range_start_utc = getUserDateTimeAsUTC(userDate, startString);
    
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const endString = endOfDay.toTimeString().split(' ')[0];
    const range_end_utc = getUserDateTimeAsUTC(userDate, endString);
  

    const diary: DiaryCreate = {
      diary_date: user_date_utc,
      content,
      mood,
      photo_url: photoUrl,
      range_start_utc: range_start_utc,
      range_end_utc: range_end_utc,
    };
    return this.createDiary(diary);
  }



  async getDiary(diaryId: number): Promise<Diary> {
    return this.request<Diary>(`/api/v1/diaries/${diaryId}`);
  }

  async updateDiary(diaryId: number, diary: DiaryUpdate): Promise<Diary> {
    return this.request<Diary>(`/api/v1/diaries/${diaryId}`, {
      method: 'PUT',
      body: JSON.stringify(diary),
    });
  }

  async deleteDiary(diaryId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/diaries/${diaryId}`, {
      method: 'DELETE',
    });
  }

  async getAIFeedback(diaryId: number): Promise<AIFeedback> {
    return this.request<AIFeedback>(`/api/v1/diaries/${diaryId}/feedback`, {
      method: 'POST',
    });
  }



  // 헬스 체크
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // Presigned URL 요청
  async getPresignedUrl(filename: string, contentType?: string): Promise<{ presigned_url: string; filename: string }> {
    const params = new URLSearchParams();
    params.append('filename', filename);
    if (contentType) {
      params.append('content_type', contentType);
    }
    
    return this.request<{ presigned_url: string; filename: string }>(`/api/v1/diaries/images/presigned-url?${params.toString()}`, {
      method: 'POST',
    });
  }

  // CDN 주소 변환 요청
  async uploadComplete(filename: string): Promise<{ message: string; file_url: string }> {
    return this.request<{ message: string; file_url: string }>('/api/v1/diaries/images/upload-complete', {
      method: 'POST',
      body: JSON.stringify({ filename }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL); 