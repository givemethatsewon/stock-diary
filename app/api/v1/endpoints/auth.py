"""
Firebase 인증 관련 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

import firebase_admin.auth as firebase_auth

from app import crud, models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter()


class FirebaseTokenRequest(BaseModel):
    firebase_token: str


@router.post("/login")
def login_with_firebase(
    request: FirebaseTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Firebase ID 토큰으로 로그인
    """
    try:
        # Firebase 토큰 검증
        decoded_token = firebase_auth.verify_id_token(request.firebase_token)
        firebase_uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        display_name = decoded_token.get("name") or decoded_token.get("displayName")
        
        if not firebase_uid or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Firebase 토큰에 필요한 정보가 없습니다."
            )
        
        # 사용자 조회 또는 생성
        user = crud.get_user_by_firebase_uid(db, firebase_uid)
        if not user:
            # 새 사용자 생성 (+ display_name 저장)
            user_data = schemas.UserCreate(
                firebase_uid=firebase_uid,
                email=email,
                display_name=display_name
            )
            user = crud.create_user(db, user_data)
        
        return {"message": "로그인 성공", "user": user}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Firebase 토큰 검증 실패: {str(e)}"
        )


@router.post("/logout")
def logout():
    """
    로그아웃 (클라이언트에서 토큰 삭제)
    """
    return {"message": "로그아웃되었습니다"}


@router.get("/me", response_model=schemas.User)
def get_current_user_info(
    current_user: models.User = Depends(get_current_user)
):
    """
    현재 로그인된 사용자 정보 조회
    """
    return current_user