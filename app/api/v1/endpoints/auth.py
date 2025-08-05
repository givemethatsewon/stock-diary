"""
세션 기반 인증 엔드포인트
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.auth import get_db, create_session_token, set_session_cookie, clear_session_cookie, get_current_user_session
from app import models, schemas
import firebase_admin.auth as firebase_auth
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class FirebaseTokenRequest(BaseModel):
    firebase_token: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: schemas.User

@router.post("/login", response_model=LoginResponse)
def login_with_firebase(
    request: FirebaseTokenRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Firebase 토큰으로 로그인하고 세션 생성
    """
    try:
        # Firebase 토큰 검증
        decoded_token = firebase_auth.verify_id_token(request.firebase_token)
        firebase_uid = decoded_token['uid']
        email = decoded_token.get('email')
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이메일 정보가 없습니다"
            )
        
        logger.info(f"Firebase 토큰 검증 성공: {email}")
        
        # 기존 사용자 조회 또는 새 사용자 생성
        user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
        
        if not user:
            # 새 사용자 생성
            user = models.User(
                firebase_uid=firebase_uid,
                email=email
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"새 사용자 생성: {email}")
        else:
            logger.info(f"기존 사용자 로그인: {email}")
        
        # 세션 토큰 생성
        access_token = create_session_token(user)
        
        # 쿠키에 토큰 설정
        set_session_cookie(response, access_token)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except firebase_auth.InvalidIdTokenError:
        logger.error("유효하지 않은 Firebase 토큰")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 Firebase 토큰입니다"
        )
    except Exception as e:
        logger.error(f"로그인 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="로그인 처리 중 오류가 발생했습니다"
        )

@router.post("/logout")
def logout(response: Response):
    """
    로그아웃 (세션 쿠키 삭제)
    """
    clear_session_cookie(response)
    return {"message": "로그아웃되었습니다"}

@router.get("/me", response_model=schemas.User)
def get_current_user(
    current_user: models.User = Depends(get_current_user_session)
):
    """
    현재 로그인된 사용자 정보 조회
    """
    return current_user

@router.post("/refresh")
def refresh_token(
    response: Response,
    current_user: models.User = Depends(get_current_user_session)
):
    """
    토큰 갱신
    """
    # 새 토큰 생성
    new_token = create_session_token(current_user)
    
    # 쿠키 업데이트
    set_session_cookie(response, new_token)
    
    return {
        "access_token": new_token,
        "token_type": "bearer"
    }