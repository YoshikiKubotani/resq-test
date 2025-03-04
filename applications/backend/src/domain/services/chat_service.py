import pathlib
from typing import AsyncGenerator

from src.domain.models.chat_model import MailInformation, ReplyPromptInformation
from src.domain.services.llm import QuestionGenerationLLM, ReplyGenerationLLM
from src.utils import setup_logger

logger = setup_logger(__name__)


class ChatService:
    """The service for interacting with the OpenAI chat API."""

    def __init__(self, prompt_directory: pathlib.Path) -> None:
        """Initialize the ChatService.

        Args:
            prompt_directory (pathlib.Path): The directory containing the prompt files.
        """
        # Initialize LLM services
        self._question_generation_llm = QuestionGenerationLLM(prompt_directory)
        self._reply_generation_llm = ReplyGenerationLLM(prompt_directory)

    async def generate_questions_stream(
        self, mail_information: MailInformation
    ) -> AsyncGenerator[str, None]:
        """Generate questions based on the mail information.

        Args:
            mail_information (MailInformation): The mail information for generating questions.

        Yields:
            str: The generated question.
        """
        async for content in self._question_generation_llm.astream(mail_information):
            yield content

    async def generate_reply_stream(
        self, prompt_data: ReplyPromptInformation
    ) -> AsyncGenerator[str, None]:
        """Generate a reply based on the reply prompt information.

        Args:
            prompt_data (ReplyPromptInformation): The reply prompt information.

        Yields:
            str: The generated reply.
        """
        async for content in self._reply_generation_llm.astream(prompt_data):
            yield content
