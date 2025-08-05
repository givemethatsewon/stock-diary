from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .... import models, schemas
from ....deps import get_current_user, get_db

router = APIRouter()


@router.get("/me", response_model=schemas.User)
def get_current_user_info(
    current_user: models.User = Depends(get_current_user)
):
    """
    현재 로그인된 사용자 정보를 조회합니다.
    """
    return current_user 