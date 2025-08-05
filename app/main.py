from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.endpoints import diaries, users
from .database import engine
from . import models

# 데이터베이스 테이블 생성
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"데이터베이스 테이블 생성 중 오류 발생: {e}")
    print("데이터베이스 연결을 확인해주세요.")

app = FastAPI(
    title="시크릿 주주총회 API",
    description="투자 일기 앱을 위한 FastAPI 백엔드 서버",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용하도록 설정
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(diaries.router, prefix="/api/v1/diaries", tags=["diaries"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])


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