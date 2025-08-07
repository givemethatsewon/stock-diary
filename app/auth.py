"""
Firebase Bearer 토큰 기반 인증 시스템의 핵심 로직.
Firebase 토큰 검증 및 현재 사용자를 가져오는 의존성을 포함합니다.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import firebase_admin.auth as firebase_auth
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app import crud, models
from app.config import settings
from app.database import get_db

# JWT 토큰 생성 및 검증을 위한 클래스 (Firebase 토큰과 구분하기 위해 유지)
class AuthManager:
    def __init__(self, secret_key: str, algorithm: str):
        self.secret_key = secret_key
        self.algorithm = algorithm

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """JWT 액세스 토큰을 생성합니다."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> dict:
        """JWT 토큰을 검증하고 페이로드를 반환합니다."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="세션이 만료되었습니다. 다시 로그인해주세요.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 세션입니다.",
                headers={"WWW-Authenticate": "Bearer"},
            )

# 전역 AuthManager 인스턴스 생성
security = AuthManager(secret_key=settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_firebase_token(token: str) -> dict:
    """
    Firebase ID 토큰을 검증하고 사용자 정보를 반환합니다.
    """
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Firebase 토큰 검증 실패: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> models.User:
    """
    API 요청의 Authorization 헤더에서 Firebase Bearer 토큰을 읽어 현재 사용자를 반환하는 의존성.
    이 함수가 모든 보호된 API 엔드포인트의 인증을 담당합니다.
    """
    # Authorization 헤더에서 Bearer 토큰 확인
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization 헤더에 Bearer 토큰이 필요합니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ")[1]
    print(f"🔐 Bearer 토큰 감지: {token[:20]}...")
    
    # Firebase 토큰 검증
    try:
        firebase_payload = verify_firebase_token(token)
        firebase_uid = firebase_payload.get("uid")
        
        if not firebase_uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase 토큰에 사용자 ID가 없습니다.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Firebase UID로 사용자 조회
        user = crud.get_user_by_firebase_uid(db, firebase_uid)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase UID에 해당하는 사용자를 찾을 수 없습니다.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"토큰 검증 중 오류가 발생했습니다: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
