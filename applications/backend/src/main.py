from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from .config.settings import CORS_SETTINGS
from .api.routes import router

# FastAPIアプリケーションの初期化
app = FastAPI()

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    **CORS_SETTINGS
)

# ルーターの登録
app.include_router(router)

# AWS Lambda用ハンドラー
handler = Mangum(app)