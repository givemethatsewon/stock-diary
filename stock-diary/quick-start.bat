@echo off
echo 🚀 시크릿 주주총회 Next.js 프로젝트 빠른 시작
echo.

echo 📦 의존성 설치 중...
if not exist "node_modules" (
    npm install
    echo ✅ 의존성 설치 완료
) else (
    echo ✅ 의존성이 이미 설치되어 있습니다
)

echo.
echo 🔥 Firebase 설정 중...
if not exist ".env.local" (
    call create-env-local.bat
    echo ✅ Firebase 설정 파일 생성 완료
) else (
    echo ✅ Firebase 설정 파일이 이미 존재합니다
)

echo.
echo 🌐 개발 서버 시작 중...
echo 📱 웹페이지: http://localhost:3000
echo 🔧 백엔드 API: http://localhost:8000
echo.
echo ⚠️  백엔드 서버도 실행해야 합니다!
echo    프로젝트 루트에서: start-dev.bat 실행
echo.

npm run dev 