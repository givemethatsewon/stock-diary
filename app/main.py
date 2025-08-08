import sys
import os
import firebase_admin
from firebase_admin import credentials
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.v1 import api_router
from app.database import engine
from app import models
from app.config import settings

# Firebase Admin SDK 초기화
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
    print("✅ Firebase Admin SDK가 성공적으로 초기화되었습니다.")
except Exception as e:
    print(f"🔥 Firebase Admin SDK 초기화 실패: {e}")
    # 운영 환경에서는 이 오류를 심각하게 처리해야 합니다.
    # 예: raise SystemExit("Could not initialize Firebase Admin SDK")

# 데이터베이스 테이블 생성
try:
    models.Base.metadata.create_all(bind=engine)
    print("✅ 데이터베이스 테이블이 성공적으로 준비되었습니다.")
except Exception as e:
    print(f"🔥 데이터베이스 테이블 생성 중 오류 발생: {e}")
    print("데이터베이스 연결을 확인해주세요.")


app = FastAPI(
    title="주시다 API",
    description="투자 일기 앱을 위한 FastAPI 백엔드 서버",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
# 이제 /api/v1/users/login, /api/v1/diaries/ 와 같은 경로로 접근합니다.
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def read_root():
    return {
        "message": "시크릿 주주총회 API에 오신 것을 환영합니다!",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
