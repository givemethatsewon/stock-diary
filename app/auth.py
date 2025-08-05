"""
세션 기반 인증 시스템의 핵심 로직.
JWT 생성, 검증 및 현재 사용자 정보를 가져오는 의존성을 포함합니다.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app import crud, models
from app.config import settings
from app.database import get_db

# JWT 토큰 생성 및 검증을 위한 클래스
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


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> models.User:
    """
    API 요청의 세션 쿠키에서 토큰을 읽어 현재 사용자를 반환하는 의존성.
    이 함수가 모든 보호된 API 엔드포인트의 인증을 담당합니다.
    """
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 토큰이 없습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = security.verify_token(token)
    user_id: str = payload.get("sub")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰 페이로드입니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = crud.get_user(db, user_id=int(user_id))
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="해당 사용자를 찾을 수 없습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return user
