from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date, datetime, timezone


# User schemas
class UserBase(BaseModel):
    email: EmailStr


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
    diary_datetime: datetime = Field(description="사용자가 의도한 작성 시간 (UTC)")


class DiaryCreate(DiaryBase):
    photo_url: Optional[str] = None


class DiaryUpdate(BaseModel):
    content: Optional[str] = None
    mood: Optional[str] = None
    photo_url: Optional[str] = None


class DiaryInDB(DiaryBase):
    id: int
    photo_url: Optional[str] = None
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