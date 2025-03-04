from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from src.api.schemas import HealthCheckResponse, QuestionGenerationRequest

from src.domain.services.chat_service import ChatService

router = APIRouter()

@router.get('/health', response_model=HealthCheckResponse)
async def health_check() -> Any:
    """Health check endpoint.

    Returns:
        Dict[str, str]: The status of the health check.
    """
    return {"status": "ok"}

@router.post("/api/chrome_generate_questions_stream")
async def generate_questions(request: QuestionGenerationRequest) -> StreamingResponse:
    return StreamingResponse(
        ChatService.generate_questions_stream(conversation_history),
        media_type="text/plain"
    )

@router.post("/api/chrome_generate_reply_stream")
async def generate_reply(request: Request):
    data = await request.json()
    prompt_data = data.get("prompt", [])
    user_id = data.get("user_id", "")  # user_idは現在未使用

    return StreamingResponse(
        ChatService.generate_reply_stream(prompt_data),
        media_type="text/plain"
    )