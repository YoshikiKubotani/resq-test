import os
import logging
from dotenv import load_dotenv

# ロギングの設定
logging.basicConfig(level=logging.INFO)

# 環境変数の読み込み
load_dotenv()

# OpenAI設定
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("API key is not set")

# CORSの設定
CORS_SETTINGS = {
    "allow_origins": ["*"],
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}