import pathlib
from typing import AsyncGenerator

from src.domain.models.chat_model import QuestionGenerationInput
from .llm_base import LLMBase
from src.utils import setup_logger

logger = setup_logger(__name__)


class QuestionGenerationLLM(LLMBase[QuestionGenerationInput, str]):
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

    async def astream(self, input: QuestionGenerationInput) -> AsyncGenerator[str, None]:  # type: ignore
        """Generate questions based on the mail information using streaming.

        Args:
            input (QuestionGenerationInput): The input for generating questions

        Yields:
            str: The generated questions
        """
        template_values: dict[str, str] = input.get_template_values()
        async for content in self._astream(template_values, "Generated Questions"):
            yield content

    async def acompletion(self, input: QuestionGenerationInput) -> str:
        """Generate questions based on the mail information.

        Args:
            input (QuestionGenerationInput): The input for generating questions

        Returns:
            str: The generated questions
        """
        template_values: dict[str, str] = input.get_template_values()
        return await self._acompletion(template_values, "Generated Questions")