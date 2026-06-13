import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """
You are a financial transaction parser. Extract structured data from voice input.
Return JSON with: amount (number), category (string), description (string), type ("expense" or "income").
Categories: 餐飲, 交通, 購物, 娛樂, 醫療, 教育, 居家, 其他
"""

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name="gemini-pro",
            system_instruction=SYSTEM_PROMPT,
        )

    def parse_transaction(self, text: str) -> dict:
        response = self.model.generate_content(text)
        raw = response.text.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```")
        return json.loads(raw)
