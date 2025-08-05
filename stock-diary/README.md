# Stock Diary - 투자 일기 앱

투자 경험을 기록하고 AI 피드백을 받을 수 있는 웹 애플리케이션입니다.

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp env.local.example .env.local
# .env.local 파일을 편집하여 Firebase 설정을 추가하세요
```

### 2. 개발 서버 실행

```bash
# Next.js 개발 서버 실행
npm run dev

# 또는 배치 파일 사용 (Windows)
quick-start.bat
```

### 3. Firebase 설정

Firebase 프로젝트를 설정하고 인증을 활성화하세요:

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication > Sign-in method에서 이메일/비밀번호 활성화
3. 프로젝트 설정에서 웹 앱 추가
4. 환경 변수에 Firebase 설정 추가

## 🔧 API 연결 설정

### FastAPI 백엔드 실행

```bash
# 백엔드 디렉토리로 이동
cd ..

# Python 의존성 설치
pip install -r requirements.txt

# FastAPI 서버 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 환경 변수 설정

#### Next.js (.env.local)
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### FastAPI (.env)
```env
# Database Configuration
DATABASE_URL=sqlite:///./data/stock_diary.db

# Firebase Configuration
GOOGLE_APPLICATION_CREDENTIALS=./stock-diary-firebase-credentials.json

# Application Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30000
```

### API 테스트

브라우저 콘솔에서 다음 명령어로 API 연결을 테스트할 수 있습니다:

```javascript
// API 연결 테스트
testAPI()
```

## 📁 프로젝트 구조

```
stock-diary/
├── app/                    # Next.js 앱 디렉토리
│   ├── dashboard/         # 대시보드 페이지
│   ├── login/            # 로그인 페이지
│   └── layout.tsx        # 레이아웃 컴포넌트
├── components/           # 재사용 가능한 컴포넌트
│   ├── ui/              # UI 컴포넌트
│   ├── auth-guard.tsx   # 인증 가드
│   ├── calendar.tsx     # 캘린더 컴포넌트
│   ├── header.tsx       # 헤더 컴포넌트
│   └── side-panel.tsx   # 사이드 패널 컴포넌트
├── hooks/               # 커스텀 훅
│   ├── use-auth.ts     # 인증 훅
│   └── use-api.ts      # API 훅
├── lib/                # 유틸리티 라이브러리
│   ├── firebase.ts     # Firebase 설정
│   ├── api.ts          # API 클라이언트
│   └── utils.ts        # 유틸리티 함수
└── public/             # 정적 파일
```

## 🔌 API 엔드포인트

### 일기 관련
- `GET /api/v1/diaries/` - 일기 목록 조회
- `POST /api/v1/diaries/` - 새 일기 생성
- `GET /api/v1/diaries/{id}` - 특정 일기 조회
- `PUT /api/v1/diaries/{id}` - 일기 수정
- `DELETE /api/v1/diaries/{id}` - 일기 삭제
- `POST /api/v1/diaries/{id}/feedback` - AI 피드백 요청

### 사용자 관련
- `GET /api/v1/users/me` - 현재 사용자 정보 조회

## 🛠️ 기술 스택

### Frontend
- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **Firebase Auth** - 인증
- **Lucide React** - 아이콘

### Backend
- **FastAPI** - Python 웹 프레임워크
- **SQLAlchemy** - ORM
- **SQLite** - 데이터베이스
- **Firebase Admin** - 서버 인증
- **Pydantic** - 데이터 검증

## 🚀 배포

### Vercel 배포 (Frontend)
```bash
npm run build
vercel --prod
```

### Railway 배포 (Backend)
```bash
# Railway CLI 설치
npm install -g @railway/cli

# 배포
railway login
railway init
railway up
```

## 📝 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
