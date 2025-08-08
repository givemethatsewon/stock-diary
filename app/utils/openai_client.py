import os
from typing import List, Optional, Dict, Any
from urllib.parse import urlparse

from openai import OpenAI
from app.config import settings

_client: Optional[OpenAI] = None


def _get_client() -> OpenAI:
    global _client
    if _client is not None:
        return _client

    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY 환경 변수가 설정되어 있지 않습니다.")

    _client = OpenAI(api_key=api_key)
    print("✅ OpenAI 클라이언트(싱글톤) 초기화 완료")
    return _client


with open("app/prompts/system_prompt.txt", "r", encoding="utf-8") as f:
    DEFAULT_SYSTEM_INSTRUCTION = f.read()
    print("✅ DEFAULT_SYSTEM_INSTRUCTION 파일이 성공적으로 준비되었습니다.")



def _is_valid_public_image_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def _build_diary_input_content(
    *, content: str, mood: str, photo_url: Optional[str], username: str 
) -> List[Dict[str, Any]]:
    blocks: List[Dict[str, Any]] = [
        {
            "type": "input_text",
            "text": f"일기 내용:\n{content}\n\n감정:\n{mood}\n\n사용자 이름:\n{username}",
        }
    ]
    if photo_url and _is_valid_public_image_url(photo_url):
        # Responses API는 input_image.image_url에 문자열 URL을 기대합니다
        blocks.append(
            {
                "type": "input_image",
                "image_url": photo_url,
            }
        )
    else:
        if photo_url:
            print(f"⚠️ 유효하지 않은 이미지 URL이므로 무시합니다: {photo_url}")
    return blocks


def create_diary_feedback_stream(
    *,
    content: str,
    mood: str,
    photo_url: Optional[str] = None,
    username: str,
    model: str = "gpt-5-nano-2025-08-07",
    temperature: float = 0.7,
    system_instruction: Optional[str] = DEFAULT_SYSTEM_INSTRUCTION,
):
    """
    OpenAI Responses API의 스트림 객체를 반환합니다.
    호출 측에서 with-context로 사용하고, 이벤트를 순회하며 delta를 전송하세요.
    사용 예:

        with create_diary_feedback_stream(...) as stream:
            for event in stream:
                ...
            final = stream.get_final_response().output_text
    """
    client = _get_client()
    input_blocks = _build_diary_input_content(content=content, mood=mood, photo_url=photo_url, username=username)

    messages: List[Dict[str, Any]] = []
    if system_instruction:
        messages.append({
            "role": "system",
            "content": [{"type": "input_text", "text": system_instruction}],
        })
    messages.append({"role": "user", "content": input_blocks})

    # Responses API streaming
    stream = client.responses.stream(
        model=model,
        input=messages
    )
    return stream


