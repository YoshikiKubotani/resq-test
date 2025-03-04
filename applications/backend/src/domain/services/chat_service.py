from typing import Generator, List, Any
from src.domain.models import MailInformation
from src.settings import settings

# OpenAI API async client
async_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class ChatService:
    @staticmethod
    def generate_questions_stream(mail_information: MailInformation) -> Generator[str, None, None]:
        prompt = generate_question_prompt(mail_information)

        try:
            response = client.chat.completions.create(
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

    @staticmethod
    def generate_reply_stream(prompt_data: List[Any]) -> Generator[str, None, None]:
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