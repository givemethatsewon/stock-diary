from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime, timezone


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    display_name: Optional[str] = None


class UserCreate(UserBase):
    firebase_uid: str


class UserInDB(UserBase):
    id: int
    firebase_uid: str
    created_at: datetime = Field(description="UTC 시간 기준")

    model_config = {"from_attributes": True}


class User(UserInDB):
    pass


# Diary schemas
class DiaryBase(BaseModel):
    content: str
    mood: str
    diary_date: datetime

    @validator('diary_date', pre=True)
    def parse_diary_date(cls, value):
        if isinstance(value, str):
            # 'Z'로 끝나는 ISO 8601 형식을 파싱
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        return value

class DiaryCreate(DiaryBase):
    photo_url: Optional[str] = None
    # 클라이언트가 현지시각 기준 날짜 범위를 UTC로 변환하여 전달
    range_start_utc: Optional[datetime] = None
    range_end_utc: Optional[datetime] = None

    @validator('range_start_utc', 'range_end_utc', pre=True)
    def parse_range_datetimes(cls, value):
        if isinstance(value, str):
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        return value


class DiaryUpdate(BaseModel):
    content: Optional[str] = None
    mood: Optional[str] = None
    photo_url: Optional[str] = None


class DiaryInDB(DiaryBase):
    id: int
    photo_url: Optional[str] = None
    llm_feedback: Optional[str] = None
    created_at: datetime = Field(description="실제 서버 저장 시간 (UTC)")
    updated_at: datetime = Field(description="UTC 시간 기준")
    owner_id: int

    model_config = {"from_attributes": True}


class Diary(DiaryInDB):
    owner: User


# AI Feedback schema
class AIFeedback(BaseModel):
    feedback: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC 시간 기준")


# Response schemas
class Message(BaseModel):
    message: str

