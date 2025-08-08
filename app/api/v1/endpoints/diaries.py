from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app import crud, models, schemas
from app.deps import get_current_user, get_db
from app.utils.s3_utils import s3_utils
from app.config import settings
from app.utils.openai_client import create_diary_feedback_stream


router = APIRouter()


@router.post("/", response_model=schemas.Diary)
def create_diary(
    diary: schemas.DiaryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    새 일기를 생성합니다.
    diary_date는 사용자가 의도한 작성 시간(UTC)으로 전달되어야 합니다.
    하루에 하나씩만 작성할 수 있습니다.
    """
    print(f"일기 생성 요청: 사용자={current_user.id}, 날짜={diary.diary_date}")
    try:
        result = crud.create_diary(db=db, diary=diary, owner_id=current_user.id)
        print(f"일기 생성 완료: ID={result.id}")
        return result
    except ValueError as e:
        print(f"일기 생성 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[schemas.Diary])
def get_diaries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[datetime] = Query(None, description="시작 날짜 (UTC)"),
    end_date: Optional[datetime] = Query(None, description="종료 날짜 (UTC)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    로그인된 사용자의 모든 일기를 조회합니다.
    날짜 범위로 필터링할 수 있습니다.
    모든 날짜는 UTC 기준으로 처리됩니다.
    """
    diaries = crud.get_diaries(
        db=db, 
        owner_id=current_user.id, 
        skip=skip, 
        limit=limit,
        start_date=start_date,
        end_date=end_date
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


@router.get("/{diary_id}/ai-feedback")
def get_ai_feedback(
    diary_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    특정 일기 내용으로 AI 피드백을 요청하고 SSE로 스트리밍 전송합니다.
    스트림 완료 후 최종 피드백을 DB에 저장합니다.
    """
    diary = crud.get_diary(db=db, diary_id=diary_id, owner_id=current_user.id)
    if diary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="일기를 찾을 수 없습니다."
        )

    def sse_event_generator():
        final_text_parts: List[str] = []
        try:
            with create_diary_feedback_stream(
                content=diary.content,
                mood=diary.mood,
                photo_url=diary.photo_url,
            ) as stream:
                for event in stream:
                    if event.type == "response.output_text.delta":
                        chunk = event.delta
                        if chunk:
                            final_text_parts.append(chunk)
                            yield f"data: {chunk}\n\n"
                    elif event.type == "response.error":
                        # 에러 발생 시 프론트로 에러 이벤트 전송
                        yield f"event: error\ndata: {event.error.get('message', 'OpenAI error')}\n\n"
                # 스트림 종료 시
                stream.close()

            final_text = "".join(final_text_parts).strip()
            if final_text:
                # DB 업데이트 및 커밋
                diary.llm_feedback = final_text
                db.add(diary)
                db.commit()
            # 종료 신호
            yield "event: done\ndata: [DONE]\n\n"
        except Exception as e:
            # 서버 내부 에러
            yield f"event: error\ndata: {str(e)}\n\n"

    # 요청 Origin에 맞춰 CORS 허용 헤더 부여 (SSE에서 명시적 설정)
    origin = request.headers.get("origin")
    allow_origin = (
        origin if origin and origin in settings.CORS_ORIGINS else (settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "*")
    )

    headers = {
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream; charset=utf-8",
        "Connection": "keep-alive",
        # 명시적 CORS 허용
        "Access-Control-Allow-Origin": allow_origin,
    }

    return StreamingResponse(sse_event_generator(), media_type="text/event-stream", headers=headers)


@router.post("/images/presigned-url")
async def create_presigned_url(filename: str, content_type: str = None):
    """
    S3에 직접 업로드할 수 있는 Presigned URL을 생성하는 API
    """
    try:
        presigned_url = s3_utils.get_presigned_url(filename=filename, content_type=content_type)
        return {"presigned_url": presigned_url, "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/images/upload-complete")
async def upload_complete(filename: str = Body(..., embed=True)):
    # .env 파일이나 설정 파일에서 CDN 도메인을 가져옵니다.
    cdn_domain = settings.CDN_DOMAIN
    
    # 전달받은 파일명(Key)과 조합하여 최종 URL 생성
    final_url = f"{cdn_domain}/{filename}"
    print(f"🔗 최종 URL: {final_url}")
    
    return {"message": "Upload complete", "file_url": final_url}