import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """
You are a financial transaction parser. Extract structured data from voice input.
Return JSON with:
- amount: number
- category: string
- description: string
- type: "expense" or "income"
- date: string (format: YYYY-MM-DD. Calculate the transaction date based on the baseline 'current_date' provided in the prompt and any relative temporal words in the input. e.g. "昨天" is current_date minus 1 day, "前天" is current_date minus 2 days. If no date is specified, use current_date.)

Expense Categories: 餐飲, 交通, 購物, 娛樂, 醫療, 教育, 居家, 其他
Income Categories: 薪資, 獎金, 投資, 其他
"""

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key.strip() == "":
            self.mock_mode = True
            print("[WARNING] GEMINI_API_KEY is not set. Running in Mock Mode.")
        else:
            self.mock_mode = False
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(
                model_name="gemini-pro",
                system_instruction=SYSTEM_PROMPT,
            )

    def parse_transaction(self, text: str, current_date: str = "2026-06-13") -> dict:
        if getattr(self, 'mock_mode', False):
            # Fallback mock parsing using regex and simple keywords
            import re
            import datetime
            
            amount = 100
            match = re.search(r'\d+', text)
            if match:
                amount = int(match.group())
            
            # Determine type & category
            tx_type = "expense"
            category = "其他"
            
            if any(k in text for k in ["賺", "薪水", "收入", "薪資"]):
                tx_type = "income"
                category = "薪資"
                if "獎金" in text:
                    category = "獎金"
                elif "投資" in text:
                    category = "投資"
            else:
                if any(k in text for k in ["餐", "吃", "飯", "麵", "喝", "飲料", "午餐", "晚餐", "早餐"]):
                    category = "餐飲"
                elif any(k in text for k in ["車", "搭", "捷運", "中油", "油", "公車", "高鐵"]):
                    category = "交通"
                elif any(k in text for k in ["買", "購物", "全聯", "大買家", "7-11", "全家", "菜"]):
                    category = "購物"
                elif any(k in text for k in ["玩", "看電影", "遊戲", "娛樂", "KTV", "唱歌"]):
                    category = "娛樂"
                elif any(k in text for k in ["看病", "醫", "藥", "醫院", "診所"]):
                    category = "醫療"
                elif any(k in text for k in ["學費", "書", "補習", "教育"]):
                    category = "教育"
                elif any(k in text for k in ["房租", "水電", "瓦斯", "居家", "裝潢", "電費"]):
                    category = "居家"

            # Parse date relative to current_date
            try:
                base_date = datetime.datetime.strptime(current_date, "%Y-%m-%d").date()
            except Exception:
                base_date = datetime.date.today()

            tx_date = base_date
            if "昨天" in text:
                tx_date = base_date - datetime.timedelta(days=1)
            elif "前天" in text:
                tx_date = base_date - datetime.timedelta(days=2)
            elif "大前天" in text:
                tx_date = base_date - datetime.timedelta(days=3)
            elif "明天" in text:
                tx_date = base_date + datetime.timedelta(days=1)
            elif "後天" in text:
                tx_date = base_date + datetime.timedelta(days=2)
            else:
                # Check for X days ago pattern (e.g. 5天前)
                match_days = re.search(r'(\d+)\s*天前', text)
                if match_days:
                    days = int(match_days.group(1))
                    tx_date = base_date - datetime.timedelta(days=days)

            return {
                "amount": float(amount),
                "category": category,
                "description": text,
                "type": tx_type,
                "date": tx_date.strftime("%Y-%m-%d")
            }

        prompt = (
            f"Current baseline date (current_date): {current_date}\n"
            f"Analyze the following text and extract transaction details: {text}"
        )
        response = self.model.generate_content(prompt)
        raw = response.text.strip()
        raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```")
        return json.loads(raw)
