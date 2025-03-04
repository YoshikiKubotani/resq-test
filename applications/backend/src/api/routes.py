from typing import Any
import pathlib

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from src.api.schemas import HealthCheckResponse, QuestionGenerationRequest, ReplyGenerationRequest
from src.domain.models import MailInformation, ReplyPromptInformation

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
    """Generate questions based on the mail information.

    Args:
        request (QuestionGenerationRequest): The request for generating questions.

    Returns:
        StreamingResponse: The generated question.
    """
    mail_information: MailInformation = MailInformation(
        contents=request.mail_information
    )
    chat_service: ChatService = ChatService(prompt_directory=pathlib.Path("data"))

    return StreamingResponse(
        chat_service.generate_questions_stream(mail_information),
        media_type="text/event-stream",
    )

@router.post("/reply")
async def generate_reply(request: ReplyGenerationRequest) -> StreamingResponse:
    """Generate replies based on the reply prompt information.

    Args:
        request (ReplyGenerationRequest): The request for generating replies.

    Returns:
        StreamingResponse: The generated reply.
    """
    reply_prompt_inforamtion: ReplyPromptInformation = ReplyPromptInformation(
        contents=request.reply_prompt_information
    )
    chat_service: ChatService = ChatService(prompt_directory=pathlib.Path("data"))

    return StreamingResponse(
        chat_service.generate_reply_stream(reply_prompt_inforamtion),
        media_type="text/event-stream"
    )