from fastapi import APIRouter
from app.api.v1.endpoints import diaries, users

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(diaries.router, prefix="/diaries", tags=["diaries"])
