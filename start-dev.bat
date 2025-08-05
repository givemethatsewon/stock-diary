@echo off
echo 🚀 시크릿 주주총회 개발 서버 시작...

echo.
echo 📦 백엔드 서버 시작...
cd /d "%~dp0"
if not exist "venv" (
    echo 가상환경 생성 중...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
start "Backend Server" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo 🌐 프론트엔드 서버 시작...
cd stock-diary
if not exist "node_modules" (
    echo Node.js 의존성 설치 중...
    npm install
)
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ 서버들이 시작되었습니다!
echo 📱 프론트엔드: http://localhost:3000
echo 🔧 백엔드 API: http://localhost:8000
echo 📚 API 문서: http://localhost:8000/docs
echo.
pause 