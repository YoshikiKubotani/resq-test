import pathlib
from typing import AsyncGenerator

from src.domain.models.chat_model import ReplyGenerationInput
from src.utils import setup_logger

from .llm_base import LLMBase

logger = setup_logger(__name__)


class ReplyGenerationLLM(LLMBase[ReplyGenerationInput, str]):
    """LLM service for generating replies based on prompt information."""

    def __init__(self, prompt_directory: pathlib.Path) -> None:
        """Initialize the ReplyGenerationLLM service.

        Args:
            prompt_directory (pathlib.Path): Directory containing prompt files
        """
        template_path: pathlib.Path = (
            prompt_directory / "templates" / "reply_generation_prompt_template.jinja2"
        )
        system_prompt_path: pathlib.Path = (
            prompt_directory / "system_prompts" / "reply_generation_system_prompt.txt"
        )

        super().__init__(
            template_path=template_path,
            system_prompt_path=system_prompt_path,
        )

    async def astream(  # type: ignore
        self, input: ReplyGenerationInput
    ) -> AsyncGenerator[str, None]:
        """Generate a reply based on the prompt information using streaming.

        Args:
            input (ReplyGenerationInput): The input for generating a reply

        Yields:
            str: The generated reply
        """
        template_values: dict[str, str] = input.get_template_values()
        async for content in self._astream(template_values, "Generated Reply"):
            yield content

    async def acompletion(self, input: ReplyGenerationInput) -> str:
        """Generate a reply based on the prompt information.

        Args:
            input (ReplyGenerationInput): The input for generating a reply

        Returns:
            str: The generated reply
        """
        template_values: dict[str, str] = input.get_template_values()
        return await self._acompletion(template_values, "Generated Reply")
