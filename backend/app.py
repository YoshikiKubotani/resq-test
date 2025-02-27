from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import asyncio
from prompts import generate_question_prompt, generate_reply_prompt
import os
from pydantic import BaseModel
from mangum import Mangum
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("API key is not set")

client = OpenAI(api_key=api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
async def root():
    return {"message": "Hello from lambda"}

@app.post("/api/chrome_generate_questions_stream")
async def generate_questions(request: Request):
    data = await request.json()
    conversation_history = data.get("conversationhistory", [])
    user_id = data.get("user_id", "")

    # Generate the prompt
    prompt = generate_question_prompt(conversation_history)

    # OpenAI API call function
    def question_generator():
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "system", "content": prompt}],
                response_format={"type": "json_object"},
                stream=True  # Enable streaming response
            )

            # Synchronous iteration for streaming response
            for chunk in response:
                # Use attribute access to get the content
                delta = getattr(chunk.choices[0], "delta", None)
                content = getattr(delta, "content", "")
                if content:
                    yield content
            print(response)

        except Exception as e:
            print(e)
            yield f"Error: {str(e)}"

    return StreamingResponse(question_generator(), media_type="text/plain")


# 返信生成用のエンドポイント
@app.post("/api/chrome_generate_reply_stream")
async def generate_reply(request: Request):
    data = await request.json()
    prompt_data = data.get("prompt", [])
    user_id = data.get("user_id", "")

    # プロンプトを生成
    prompt = generate_reply_prompt(prompt_data)

    # OpenAIのAPIを呼び出す関数
    def reply_generator():
        try:
            response = client.chat.completions.create(
                model="gpt-4o",  # モデルは適宜選択
                messages=[{"role": "system", "content": prompt}],
                # response_format={"type": "json_object"},
                stream=True  # ストリーミングで応答を取得
            )
            
            # ストリームで応答を逐次送信
            # for chunk in response:
            #     content = chunk['choices'][0]['delta'].get('content', '')
            #     print(content)
            #     if content:
            #         yield content
            
            for chunk in response:
                # Use attribute access to get the content
                delta = getattr(chunk.choices[0], "delta", None)
                content = getattr(delta, "content", "")
                if content:
                    yield content
            print(response)

        except Exception as e:
            print(e)
            yield f"Error: {str(e)}"

    return StreamingResponse(reply_generator(), media_type="text/plain")

# エディタを開いたときのログを記録
@app.post("/api/chrome_open_editor")
async def record_open_editor(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    reply_editor_tab_id = data.get("replyEditorTabId")
    content_tab_id = data.get("contentTabId")
    
    print(f"Editor opened by user {user_id} with replyEditorTabId {reply_editor_tab_id} and contentTabId {content_tab_id}")
    return {"status": "ok"}

# エディタを閉じたときのログを記録
@app.post("/api/chrome_close_editor")
async def record_close_editor(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    reply_editor_tab_id = data.get("replyEditorTabId")
    content_tab_id = data.get("contentTabId")
    
    print(f"Editor closed by user {user_id} with replyEditorTabId {reply_editor_tab_id} and contentTabId {content_tab_id}")
    return {"status": "ok"}

handler = Mangum(app)