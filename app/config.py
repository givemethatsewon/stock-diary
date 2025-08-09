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
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))  # 7일
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    # CORS
    # ENV CORS_ORIGINS 가 설정되면 콤마로 분리하여 사용, 없으면 기본값
    _cors_from_env = os.getenv("CORS_ORIGINS")
    CORS_ORIGINS: List[str] = (
        [origin.strip() for origin in _cors_from_env.split(",") if origin.strip()]
        if _cors_from_env
        else [
            "*"
        ]
    )

    # 정규식으로 모든 오리진 허용 (credentials와 함께 사용할 때 * 대신 사용)
    CORS_ORIGIN_REGEX: str = ".*"




    # Cookie settings
    COOKIE_DOMAIN: str | None = os.getenv("COOKIE_DOMAIN") or None
    COOKIE_SECURE: bool = True
    COOKIE_SAMESITE: str = "none"  # "lax" | "strict" | "none"

    # AWS S3
    AWS_S3_BUCKET_NAME: str = os.getenv("AWS_S3_BUCKET_NAME")
    AWS_S3_REGION: str = os.getenv("AWS_S3_REGION")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY")

    # CDN
    # 우선순위: CDN_DOMAIN > AWS_CLOUDFRONT_DOMAIN
    # (배포 스크립트나 환경에 따라 키명이 다를 수 있어 폴백 지원)
    CDN_DOMAIN: str | None = os.getenv("CDN_DOMAIN") or os.getenv("AWS_CLOUDFRONT_DOMAIN") or None

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")


settings = Settings()
