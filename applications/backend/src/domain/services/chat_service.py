from typing import Generator, List, Any
from prompts import generate_question_prompt, generate_reply_prompt
from openai import OpenAI
from src.settings import OPENAI_API_KEY

# OpenAIクライアントのシングルトンインスタンス
client = OpenAI(api_key=OPENAI_API_KEY)

class ChatService:
    @staticmethod
    def generate_questions_stream(conversation_history: List[Any]) -> Generator[str, None, None]:
        prompt = generate_question_prompt(conversation_history)

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