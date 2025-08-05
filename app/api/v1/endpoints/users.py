from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from firebase_admin import auth

from app import crud, models, schemas
from app.deps import get_current_user, get_db
from app.auth import security  # AuthManager 인스턴스
from app.config import settings

router = APIRouter()


@router.post("/login", response_model=schemas.Message)
def login(
    response: Response,
    *,
    db: Session = Depends(get_db),
    auth_request: schemas.AuthRequest,
) -> dict:
    """
    Firebase ID token을 검증하고, 사용자를 생성/조회한 후,
    세션 토큰을 생성하여 HttpOnly 쿠키에 저장합니다.
    """
    try:
        decoded_token = auth.verify_id_token(auth_request.id_token)
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 Firebase ID 토큰입니다.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Firebase 토큰 검증 중 오류 발생: {e}",
        )

    user = crud.get_or_create_user(db, firebase_user=decoded_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터베이스에서 사용자를 조회하거나 생성할 수 없습니다.",
        )

    # `security` 객체를 사용하여 세션 토큰 생성
    access_token = security.create_access_token(
        data={"sub": str(user.id)}
    )
    
    # 응답에 세션 쿠키 설정
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
    )
    return {"message": "Login successful"}


@router.post("/logout", response_model=schemas.Message)
def logout(response: Response) -> dict:
    """
    세션 쿠키를 삭제하여 로그아웃합니다.
    """
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        secure=settings.ENVIRONMENT == "production",
        httponly=True,
        samesite="lax",
    )
    return {"message": "Logout successful"}


@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    현재 로그인된 사용자의 정보를 반환합니다.
    `get_current_user` 의존성이 쿠키를 검증합니다.
    """
    return current_user
