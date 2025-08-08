import os
from typing import List, Optional, Dict, Any

from openai import OpenAI
from app.config import settings

def _get_client() -> OpenAI:
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY 환경 변수가 설정되어 있지 않습니다.")
    print("✅ OpenAI 클라이언트가 성공적으로 준비되었습니다.")
    return OpenAI(api_key=api_key)


with open("app/prompts/system_prompt.txt", "r", encoding="utf-8") as f:
    DEFAULT_SYSTEM_INSTRUCTION = f.read()
    print("✅ DEFAULT_SYSTEM_INSTRUCTION 파일이 성공적으로 준비되었습니다.")



def _build_diary_input_content(
    *, content: str, mood: str, photo_url: Optional[str]
) -> List[Dict[str, Any]]:
    blocks: List[Dict[str, Any]] = [
        {
            "type": "input_text",
            "text": f"Diary Content:\n{content}\n\nMood: {mood}",
        }
    ]
    if photo_url:
        blocks.append(
            {
                "type": "input_image",
                "image_url": photo_url,
            }
        )
    return blocks


def create_diary_feedback_stream(
    *,
    content: str,
    mood: str,
    photo_url: Optional[str] = None,
    model: str = "gpt-4o-mini",
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
    input_blocks = _build_diary_input_content(content=content, mood=mood, photo_url=photo_url)

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
        input=messages,
        temperature=temperature,
    )
    return stream


