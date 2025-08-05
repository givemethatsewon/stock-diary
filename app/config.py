# app/config.py

import os
from dotenv import load_dotenv
from typing import List

# .env 파일의 경로를 명시적으로 지정하여 로드합니다.
# 현재 구조(app/.env)를 유지하려면 아래처럼 경로를 지정합니다.
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    # 대체 경로 (프로젝트 루트)도 확인
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path=dotenv_path)

class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7일
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"] # 개발 중에는 클라이언트 주소만 허용


    # Session
    SESSION_COOKIE_NAME: str = "stock_diary_session"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development") # "development" or "production"


settings = Settings()
