from typing import Any
import pathlib

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from src.api.schemas import HealthCheckResponse, QuestionGenerationRequest, ReplyGenerationRequest
from src.domain.models import MailInformation

from src.domain.services.chat_service import ChatService

router = APIRouter()

@router.get('/health', response_model=HealthCheckResponse)
async def health_check() -> Any:
    """Health check endpoint.

    Returns:
        Dict[str, str]: The status of the health check.
    """
    return {"status": "ok"}

@router.post("/questions")
async def generate_questions(request: QuestionGenerationRequest) -> StreamingResponse:
    mail_information: MailInformation = MailInformation(
        mail_information=request.mail_information
    )
    chat_service: ChatService = ChatService(prompt_directory=pathlib.Path("data"))

    return StreamingResponse(
        chat_service.generate_questions_stream(mail_information),
        media_type="text/plain"
    )

@router.post("/reply")
async def generate_reply(request: ReplyGenerationRequest):
    data = await request.json()
    prompt_data = data.get("prompt", [])
    user_id = data.get("user_id", "")  # user_idは現在未使用

    chat_service: ChatService = ChatService(prompt_directory=pathlib.Path("data"))
    return StreamingResponse(
        chat_service.generate_reply_stream(prompt_data),
        media_type="text/plain"
    )