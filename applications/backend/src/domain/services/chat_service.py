import pathlib
from datetime import datetime
from typing import AsyncGenerator
from zoneinfo import ZoneInfo

from openai import AsyncOpenAI, AsyncStream
from openai.types import CompletionUsage
from openai.types.chat import ChatCompletionChunk
from openai.types.chat.chat_completion_chunk import Choice as ChunkChoice
from openai.types.chat.chat_completion_chunk import ChoiceDelta

from src.domain.models import MailInformation, ReplyPromptInformation
from src.settings import settings
from src.utils import setup_logger

logger = setup_logger(__name__)


class ChatService:
    """The service for interacting with the OpenAI chat API."""

    def __init__(self, prompt_directory: pathlib.Path) -> None:
        """Initialize the ChatService.

        Args:
            prompt_directory (pathlib.Path): The directory containing the prompt files.
        """
        # The path to the question generation prompt file.
        self.question_generation_prompt_path: pathlib.Path = (
            prompt_directory / "question_generation_prompt.txt"
        )
        self.reply_generation_prompt_path: pathlib.Path = (
            prompt_directory / "reply_generation_prompt.txt"
        )

        with open(self.question_generation_prompt_path, "r", encoding="utf-8") as f:
            self.question_generation_prompt: str = f.read()

        with open(self.reply_generation_prompt_path, "r", encoding="utf-8") as f:
            self.reply_generation_prompt: str = f.read()

        # OpenAI API async client
        self.async_client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY.get_secret_value()
        )

    async def generate_questions_stream(
        self, mail_information: MailInformation
    ) -> AsyncGenerator[str, None]:
        """Generate questions based on the mail information.

        Args:
            mail_information (MailInformation): The mail information for generating questions.

        Yields:
            str: The generated question.
        """
        try:
            input_message: str = (
                self.question_generation_prompt
                + "\n"
                + mail_information.parse_mail_information()
            )
            logger.info(
                f"Input Message:\n{input_message}", color="gray", show_prefix=True
            )

            stream: AsyncStream[
                ChatCompletionChunk
            ] = await self.async_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "system", "content": input_message}],
                response_format={"type": "json_object"},
                stream=True,
                stream_options={"include_usage": True},
            )

            generated_questions: str = ""

            async for chunk in stream:
                # Check if the chunk is a ChatCompletionChunk
                if not isinstance(chunk, ChatCompletionChunk):
                    raise TypeError(f"Expected ChatCompletionChunk, got {type(chunk)}")

                # Extract the chunk data
                completion_id: str = (
                    chunk.id
                )  # a unique identifier for the chat completion
                created_timestamp: int = (
                    chunk.created
                )  # the unix timestamp (in seconds) of when the completion was created
                datetime_tokyo: datetime = datetime.fromtimestamp(
                    float(created_timestamp), tz=ZoneInfo("Asia/Tokyo")
                )

                usage: CompletionUsage | None = (
                    chunk.usage
                )  # the usage statistics for the completion
                if usage is not None:
                    logger.info(
                        f"Completion ID: {completion_id}",
                        color="gray",
                        show_prefix=True,
                    )
                    logger.info(
                        f"Created Timestamp: {datetime_tokyo}",
                        color="gray",
                        show_prefix=True,
                    )
                    logger.info(
                        f"Completion Tokens: {usage.completion_tokens}",
                        color="green",
                        show_prefix=True,
                    )
                    logger.info(
                        f"Prompt Tokens: {usage.prompt_tokens}",
                        color="green",
                        show_prefix=False,
                    )
                    logger.info(
                        f"Total: {usage.total_tokens}", color="green", show_prefix=False
                    )

                choices: list[ChunkChoice] = chunk.choices
                if len(choices) == 0:
                    continue
                if len(choices) != 1:
                    raise ValueError(
                        f"Expected 1 choice, got {len(choices)}. This error may occur if the chat completion `create` method is called with `n` greater than 1."
                    )

                # Extract the chunk content data
                chunk_content: ChoiceDelta = choices[0].delta
                content_message: str | None = chunk_content.content
                refusal_message: str | None = chunk_content.refusal
                if content_message is not None:
                    if refusal_message is not None:
                        raise ValueError(
                            "Both content message and refusal message are not None."
                        )
                else:
                    if refusal_message is not None:
                        raise ValueError(
                            f"The OpenAI API server refused to process the input for the following reason.\n{refusal_message}"
                        )
                    content_message = ""

                generated_questions += content_message
                yield f"data:{content_message}\n\n"

            logger.info(
                f"Generated Questions: {generated_questions}",
                color="magenta",
                show_prefix=True,
            )

        except Exception as e:
            logger.error(e)
            yield f"Error: {str(e)}"

    async def generate_reply_stream(
        self, prompt_data: ReplyPromptInformation
    ) -> AsyncGenerator[str, None]:
        """Generate a reply based on the reply prompt information.

        Args:
            prompt_data (ReplyPromptInformation): The reply prompt information.

        Yields:
            str: The generated reply.
        """
        try:
            input_message: str = (
                self.reply_generation_prompt
                + "\n"
                + prompt_data.parse_reply_prompt_information()
            )
            logger.info(
                f"Input Message: {input_message}", color="gray", show_prefix=True
            )

            stream: AsyncStream[
                ChatCompletionChunk
            ] = await self.async_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "system", "content": input_message}],
                response_format={"type": "json_object"},
                stream=True,
                stream_options={"include_usage": True},
            )

            generated_reply: str = ""

            async for chunk in stream:
                # Check if the chunk is a ChatCompletionChunk
                if not isinstance(chunk, ChatCompletionChunk):
                    raise TypeError(f"Expected ChatCompletionChunk, got {type(chunk)}")

                # Extract the chunk data
                completion_id: str = (
                    chunk.id
                )  # a unique identifier for the chat completion
                created_timestamp: int = (
                    chunk.created
                )  # the unix timestamp (in seconds) of when the completion was created
                datetime_tokyo: datetime = datetime.fromtimestamp(
                    float(created_timestamp), tz=ZoneInfo("Asia/Tokyo")
                )

                usage: CompletionUsage | None = (
                    chunk.usage
                )  # the usage statistics for the completion
                if usage is not None:
                    logger.info(
                        f"Completion ID: {completion_id}",
                        color="gray",
                        show_prefix=True,
                    )
                    logger.info(
                        f"Created Timestamp: {datetime_tokyo}",
                        color="gray",
                        show_prefix=True,
                    )
                    logger.info(
                        f"Completion Tokens: {usage.completion_tokens}",
                        color="green",
                        show_prefix=True,
                    )
                    logger.info(
                        f"Prompt Tokens: {usage.prompt_tokens}",
                        color="green",
                        show_prefix=False,
                    )
                    logger.info(
                        f"Total: {usage.total_tokens}", color="green", show_prefix=False
                    )

                choices: list[ChunkChoice] = chunk.choices
                if len(choices) == 0:
                    continue
                if len(choices) != 1:
                    raise ValueError(
                        f"Expected 1 choice, got {len(choices)}. This error may occur if the chat completion `create` method is called with `n` greater than 1."
                    )

                # Extract the chunk content data
                chunk_content: ChoiceDelta = choices[0].delta
                content_message: str | None = chunk_content.content
                refusal_message: str | None = chunk_content.refusal
                if content_message is not None:
                    if refusal_message is not None:
                        raise ValueError(
                            "Both content message and refusal message are not None."
                        )
                else:
                    if refusal_message is not None:
                        raise ValueError(
                            f"The OpenAI API server refused to process the input for the following reason.\n{refusal_message}"
                        )
                    content_message = ""

                generated_reply += content_message
                yield f"data:{content_message}\n\n"

            logger.info(
                f"Generated Reply: {generated_reply}", color="magenta", show_prefix=True
            )

        except Exception as e:
            logger.error(e)
            yield f"Error: {str(e)}"
