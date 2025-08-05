from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, timezone, date
from app import models, schemas


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

def get_or_create_user(db: Session, firebase_user: dict):
    """
    Firebase UID로 사용자를 조회하고, 없으면 새로 생성합니다.
    """
    user = get_user_by_firebase_uid(db, firebase_uid=firebase_user['uid'])
    if user:
        return user
    
    # 새 사용자 생성
    new_user = schemas.UserCreate(
        firebase_uid=firebase_user['uid'],
        email=firebase_user['email']
    )
    return create_user(db, new_user)


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
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    query = db.query(models.Diary).filter(models.Diary.owner_id == owner_id)
    
    if start_date:
        print(f"시작 날짜 필터: >= {start_date}")
        query = query.filter(models.Diary.diary_date >= start_date)
    if end_date:
        print(f"종료 날짜 필터: <= {end_date}")
        query = query.filter(models.Diary.diary_date <= end_date)
    
    results = query.order_by(models.Diary.diary_date.desc()).offset(skip).limit(limit).all()
    print(f"조회된 일기 개수: {len(results)}")
    for diary in results:
        print(f"  - ID {diary.id}: {diary.diary_date}")
    
    return results


def get_diary_by_date(db: Session, owner_id: int, date: date):
    """특정 날짜의 일기를 조회 (하루에 하나씩만 작성 가능하므로 단일 일기 반환)"""
    from datetime import datetime, timezone
    
    # 주의: 이 함수는 서버에서 호출되므로 UTC 기준으로 처리
    # 클라이언트에서 이미 사용자 현지시각을 UTC로 변환해서 보냄
    start_datetime = datetime.combine(date, datetime.min.time(), tzinfo=timezone.utc)
    end_datetime = datetime.combine(date, datetime.max.time(), tzinfo=timezone.utc)
    
    print(f"서버 날짜 조회: {date} (UTC 기준) -> {start_datetime} ~ {end_datetime}")
    
    diary = db.query(models.Diary).filter(
        and_(
            models.Diary.owner_id == owner_id,
            models.Diary.diary_date >= start_datetime,
            models.Diary.diary_date <= end_datetime
        )
    ).first()
    
    if diary:
        print(f"찾은 일기: ID={diary.id}, 날짜={diary.diary_date}")
    else:
        print("해당 날짜에 일기 없음")
    
    return diary


def create_diary(db: Session, diary: schemas.DiaryCreate, owner_id: int):
    # 같은 날짜에 이미 일기가 있는지 확인
    existing_diary = get_diary_by_date(db, owner_id, diary.diary_date.date())
    if existing_diary:
        raise ValueError(f"해당 날짜({diary.diary_date.date()})에 이미 일기가 작성되어 있습니다.")
    
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