from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timezone
from .... import crud, models, schemas
from ....deps import get_current_user, get_db

router = APIRouter()


@router.post("/", response_model=schemas.Diary)
def create_diary(
    diary: schemas.DiaryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    새 일기를 생성합니다.
    diary_datetime은 사용자가 의도한 작성 시간(UTC)으로 전달되어야 합니다.
    """
    return crud.create_diary(db=db, diary=diary, owner_id=current_user.id)


@router.get("/", response_model=List[schemas.Diary])
def get_diaries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_datetime: Optional[datetime] = Query(None, description="시작 시간 (UTC)"),
    end_datetime: Optional[datetime] = Query(None, description="종료 시간 (UTC)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    로그인된 사용자의 모든 일기를 조회합니다.
    시간 범위로 필터링할 수 있습니다.
    모든 시간은 UTC 기준으로 처리됩니다.
    """
    diaries = crud.get_diaries(
        db=db, 
        owner_id=current_user.id, 
        skip=skip, 
        limit=limit,
        start_datetime=start_datetime,
        end_datetime=end_datetime
    )
    return diaries


@router.get("/range", response_model=List[schemas.Diary])
def get_diaries_by_datetime_range(
    start_datetime: datetime = Query(description="시작 시간 (UTC)"),
    end_datetime: datetime = Query(description="종료 시간 (UTC)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    특정 시간 범위의 일기들을 조회합니다.
    클라이언트에서 사용자 시간대 기준 하루(00:00-23:59)를 UTC 시간 범위로 변환하여 요청해야 합니다.
    """
    diaries = crud.get_diaries_by_datetime_range(
        db=db,
        owner_id=current_user.id,
        start_datetime=start_datetime,
        end_datetime=end_datetime
    )
    return diaries


@router.get("/{diary_id}", response_model=schemas.Diary)
def get_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    특정 일기를 조회합니다.
    """
    diary = crud.get_diary(db=db, diary_id=diary_id, owner_id=current_user.id)
    if diary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일기를 찾을 수 없습니다."
        )
    return diary


@router.get("/date/{diary_date}", response_model=schemas.Diary)
def get_diary_by_date(
    diary_date: date,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    특정 날짜의 일기를 조회합니다.
    날짜는 YYYY-MM-DD 형식으로 전달됩니다.
    """
    diary = crud.get_diary_by_date(db=db, owner_id=current_user.id, diary_date=diary_date)
    if diary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 날짜의 일기를 찾을 수 없습니다."
        )
    return diary


@router.put("/{diary_id}", response_model=schemas.Diary)
def update_diary(
    diary_id: int,
    diary_update: schemas.DiaryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    특정 일기를 수정합니다.
    """
    diary = crud.update_diary(
        db=db, 
        diary_id=diary_id, 
        diary_update=diary_update, 
        owner_id=current_user.id
    )
    if diary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일기를 찾을 수 없습니다."
        )
    return diary


@router.delete("/{diary_id}", response_model=schemas.Message)
def delete_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    특정 일기를 삭제합니다.
    """
    success = crud.delete_diary(db=db, diary_id=diary_id, owner_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일기를 찾을 수 없습니다."
        )
    return {"message": "일기가 성공적으로 삭제되었습니다."}


@router.post("/{diary_id}/feedback", response_model=schemas.AIFeedback)
def get_ai_feedback(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    특정 일기 내용으로 AI 피드백을 요청합니다.
    """
    # 일기 존재 확인
    diary = crud.get_diary(db=db, diary_id=diary_id, owner_id=current_user.id)
    if diary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일기를 찾을 수 없습니다."
        )
    
    # TODO: Call Large Language Model API (e.g., GPT, Gemini)
    # 여기서 실제 AI API를 호출하여 일기 내용을 분석하고 피드백을 생성합니다.
    # 현재는 고정된 메시지를 반환합니다.
    
    feedback = "AI 피드백이 성공적으로 생성되었습니다."
    
    return schemas.AIFeedback(feedback=feedback) 