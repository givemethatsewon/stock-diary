from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    diaries = relationship("Diary", back_populates="owner")


class Diary(Base):
    __tablename__ = "diaries"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    mood = Column(String, nullable=False)  # "happy", "sad", "worried", "angry", "excited"
    photo_url = Column(String, nullable=True)
    diary_date = Column(DateTime(timezone=True), nullable=False, index=True)  # 사용자가 의도한 작성 시간 (UTC)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)  # 실제 서버 저장 시간 (UTC)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    llm_feedback = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationship
    owner = relationship("User", back_populates="diaries")

    # Indexes
    __table_args__ = (
        Index('idx_owner_date', 'owner_id', 'diary_date', unique=True),  # 하루에 하나씩만 작성
    ) 