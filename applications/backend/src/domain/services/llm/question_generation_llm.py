import pathlib
from typing import AsyncGenerator

from src.domain.models.chat_model import MailInformation
from .llm_base import LLMBase
from src.utils import setup_logger

logger = setup_logger(__name__)


class QuestionGenerationLLM(LLMBase[MailInformation, str]):
    """LLM service for generating questions based on mail information."""

    def __init__(self, prompt_directory: pathlib.Path) -> None:
        """Initialize the QuestionGenerationLLM service.

        Args:
            prompt_directory (pathlib.Path): Directory containing prompt files
        """
        template_path: pathlib.Path = prompt_directory / "templates" / "question_generation_prompt_template.jinja2"
        system_prompt_path: pathlib.Path = (
            prompt_directory / "system_prompts" / "question_generation_system_prompt.txt"
        )

        super().__init__(
            template_path=template_path,
            system_prompt_path=system_prompt_path,
        )

    async def astream(self, mail_information: MailInformation) -> AsyncGenerator[str, None]:  # type: ignore
        """Generate questions based on the mail information using streaming.

        Args:
            mail_information (MailInformation): The mail information for generating questions

        Yields:
            str: The generated questions
        """
        template_values: dict[str, str] = {
            "mail_info": mail_information.parse_mail_information(),
        }
        async for content in self._astream(template_values, "Generated Questions"):
            yield content

    async def acompletion(self, mail_information: MailInformation) -> str:
        """Generate questions based on the mail information.

        Args:
            mail_information (MailInformation): The mail information for generating questions

        Returns:
            str: The generated questions
        """
        template_values: dict[str, str] = {
            "mail_info": mail_information.parse_mail_information(),
        }
        return await self._acompletion(template_values, "Generated Questions")