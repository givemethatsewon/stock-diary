#!/bin/bash

echo "🚀 시크릿 주주총회 개발 서버 시작..."

echo ""
echo "📦 백엔드 서버 시작..."
if [ ! -d "venv" ]; then
    echo "가상환경 생성 중..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt

# 백엔드 서버를 백그라운드에서 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo ""
echo "🌐 프론트엔드 서버 시작..."
cd stock-diary
if [ ! -d "node_modules" ]; then
    echo "Node.js 의존성 설치 중..."
    npm install
fi

# 프론트엔드 서버를 백그라운드에서 실행
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 서버들이 시작되었습니다!"
echo "📱 프론트엔드: http://localhost:3000"
echo "🔧 백엔드 API: http://localhost:8000"
echo "📚 API 문서: http://localhost:8000/docs"
echo ""
echo "서버를 중지하려면 Ctrl+C를 누르세요."

# 서버 종료 시그널 처리
trap "echo '서버를 종료합니다...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# 서버가 실행 중인 동안 대기
wait 