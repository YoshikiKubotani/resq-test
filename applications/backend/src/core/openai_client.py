from openai import OpenAI
from ..config.settings import OPENAI_API_KEY

# OpenAIクライアントのシングルトンインスタンス
client = OpenAI(api_key=OPENAI_API_KEY)