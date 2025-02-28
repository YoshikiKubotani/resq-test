# prompts.py
def load_backend_prompt(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def generate_question_prompt(conversation_history):
    # バックエンドで使用するプロンプト
    backend_prompt = load_backend_prompt("generate_questions.txt")
    
    # フロントエンドのデータ（conversation_history）と結合
    combined_prompt = f"{backend_prompt}\nConversation History:\n{conversation_history}"
    
    return combined_prompt

def generate_reply_prompt(prompt):
    # バックエンドで使用するプロンプト
    backend_prompt = load_backend_prompt("generate_reply.txt")
    # backend_prompt = "Please provide a draft reply to the sender of this email on behalf of the user."
    
    # フロントエンドのデータ（prompt）と結合
    combined_prompt = f"{backend_prompt}\nPrompt:\n{prompt}"
    
    return combined_prompt