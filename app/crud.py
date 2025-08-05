from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, datetime, timezone
from . import models, schemas


# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_firebase_uid(db: Session, firebase_uid: str):
    return db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        firebase_uid=user.firebase_uid,
        email=user.email
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Diary CRUD operations
def get_diary(db: Session, diary_id: int, owner_id: int):
    return db.query(models.Diary).filter(
        and_(models.Diary.id == diary_id, models.Diary.owner_id == owner_id)
    ).first()


def get_diaries(
    db: Session, 
    owner_id: int, 
    skip: int = 0, 
    limit: int = 100,
    start_datetime: Optional[datetime] = None,
    end_datetime: Optional[datetime] = None
):
    query = db.query(models.Diary).filter(models.Diary.owner_id == owner_id)
    
    if start_datetime:
        query = query.filter(models.Diary.diary_datetime >= start_datetime)
    if end_datetime:
        query = query.filter(models.Diary.diary_datetime <= end_datetime)
    
    return query.order_by(models.Diary.diary_datetime.desc()).offset(skip).limit(limit).all()


def get_diaries_by_datetime_range(db: Session, owner_id: int, start_datetime: datetime, end_datetime: datetime):
    """특정 시간 범위의 일기들을 조회 (사용자 시간대 하루 범위에 해당하는 UTC 시간 범위)"""
    return db.query(models.Diary).filter(
        and_(
            models.Diary.owner_id == owner_id,
            models.Diary.diary_datetime >= start_datetime,
            models.Diary.diary_datetime <= end_datetime
        )
    ).order_by(models.Diary.diary_datetime.desc()).all()


def create_diary(db: Session, diary: schemas.DiaryCreate, owner_id: int):
    db_diary = models.Diary(
        **diary.model_dump(),
        owner_id=owner_id
    )
    db.add(db_diary)
    db.commit()
    db.refresh(db_diary)
    return db_diary


def update_diary(db: Session, diary_id: int, diary_update: schemas.DiaryUpdate, owner_id: int):
    db_diary = get_diary(db, diary_id=diary_id, owner_id=owner_id)
    if not db_diary:
        return None
    
    update_data = diary_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_diary, field, value)
    
    # updated_at은 자동으로 업데이트됨 (onupdate=func.now())
    db.commit()
    db.refresh(db_diary)
    return db_diary


def delete_diary(db: Session, diary_id: int, owner_id: int):
    db_diary = get_diary(db, diary_id=diary_id, owner_id=owner_id)
    if not db_diary:
        return False
    
    db.delete(db_diary)
    db.commit()
    return True 