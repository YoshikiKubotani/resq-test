import pathlib
from src.domain.models import MailInformation
from src.settings import settings


class ChatService:
    """The service for interacting with the OpenAI chat API."""
    def __init__(self, prompt_directory: pathlib.Path) -> None:
        """Initialize the ChatService.

        Args:
            prompt_directory (pathlib.Path): The directory containing the prompt files.
        """
        # The path to the question generation prompt file.
        self.question_generation_prompt_path: pathlib.Path = prompt_directory / "question_generation_prompt.txt"
        self.reply_generation_prompt_path: pathlib.Path = prompt_directory / "reply_prompt.txt"

        with open(self.question_generation_prompt_path, "r") as f:
            self.question_generation_prompt: str = f.read()

        with open(self.reply_generation_prompt_path, "r") as f:
            self.reply_generation_prompt: str = f.read()

        # OpenAI API async client
        self.async_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_questions_stream(self, mail_information: MailInformation) -> AsyncGenerator[str, None]:
                model="gpt-4o",
                messages=[{"role": "system", "content": prompt}],
                response_format={"type": "json_object"},
                stream=True
            )

            for chunk in response:
                delta = getattr(chunk.choices[0], "delta", None)
                content = getattr(delta, "content", "")
                if content:
                    yield content

        except Exception as e:
            print(e)
            yield f"Error: {str(e)}"

    async def generate_reply_stream(self, prompt_data: list[Any]) -> AsyncGenerator[str, None]:
        prompt = generate_reply_prompt(prompt_data)

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "system", "content": prompt}],
                stream=True
            )

            for chunk in response:
                delta = getattr(chunk.choices[0], "delta", None)
                content = getattr(delta, "content", "")
                if content:
                    yield content

        except Exception as e:
            print(e)
            yield f"Error: {str(e)}"