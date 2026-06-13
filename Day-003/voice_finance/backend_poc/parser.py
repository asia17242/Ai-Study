import os
import sys
from typing import List
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables (.env file)
load_dotenv()

# Define the structured output schema using Pydantic
class TransactionSchema(BaseModel):
    date: str = Field(
        description="交易日期，格式為 YYYY-MM-DD。若口語提及「昨天」、「前天」等，請以系統指令中給出的基準日期（current_date）計算得出對應日期。"
    )
    type: str = Field(
        description="交易類型，必須為 'expense' (支出) 或 'income' (收入)."
    )
    amount: int = Field(
        description="交易金額，必須為整數。"
    )
    category: str = Field(
        description="交易類別，例如：餐飲食品、交通出行、日常用品、娛樂消費、醫療保健等。"
    )
    merchant: str = Field(
        description="商家或品牌名稱（例如：中油、全聯、大買家、7-11等），若無提及則填寫 '未知'。"
    )
    payment_method: str = Field(
        description="付款方式，必須精準對應為 '現金'、'信用卡' 或 '電子支付'（如：中油Pay、Line Pay、Apple Pay、街口支付等均屬於電子支付）。"
    )
    tags: List[str] = Field(
        description="與此交易相關的標籤陣列，例如支付名稱、特定活動等標籤。"
    )
    description: str = Field(
        description="交易的簡短描述或備註。"
    )
    raw_text: str = Field(
        description="原始輸入的口語文字內容。"
    )

class TransactionParser:
    def __init__(self):
        # The new SDK automatically picks up GEMINI_API_KEY from environment variables.
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("警告: 未在環境變數中檢測到 GEMINI_API_KEY。將嘗試使用 SDK 預設載入。")
            self.client = genai.Client()
        else:
            self.client = genai.Client(api_key=api_key)
            
        self.model_name = "gemini-2.5-flash"

    def parse(self, text: str, current_date: str = "2026-06-13") -> str:
        """
        Parses a Taiwanese oral statements into a structured JSON string.
        """
        dynamic_system_instruction = (
            "你是一個專業的財務記帳分析師，專門負責將語音或口語轉換為結構化記帳 JSON。\n"
            f"當前的日期時間基準（current_date）設定為：{current_date}。\n"
            "你必須能夠完美識別與分析台灣當地的口語記帳情境，特別是以下特徵：\n"
            "1. 台灣常見商家/品牌：如全聯、中油、大買家、家樂福、美廉社、7-11、全家、康是美等。\n"
            "2. 台灣常見電子支付與行動支付：如中油Pay、Line Pay、街口支付、悠遊付、Pi拍錢包等，這些皆應歸類為 '電子支付'。\n"
            "3. 台灣在地口語詞彙：如「加滿油」、「花了800塊」、「吃便當」、「買飲料」等。"
        )
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=text,
                config=types.GenerateContentConfig(
                    system_instruction=dynamic_system_instruction,
                    response_mime_type="application/json",
                    response_schema=TransactionSchema,
                    temperature=0.1,  # Low temperature for highly deterministic output
                ),
            )
            return response.text
        except Exception as e:
            raise RuntimeError(f"Gemini API 解析失敗: {e}")

if __name__ == "__main__":
    # Simple CLI Test Runner
    parser = TransactionParser()
    
    # Check if API key is present
    if not os.getenv("GEMINI_API_KEY"):
        print("請注意：您的系統環境變數中未設定 GEMINI_API_KEY。")
        print("請在當前目錄下建立 .env 檔案並設定 GEMINI_API_KEY=your_api_key_here")
        sys.exit(1)
        
    print("=" * 60)
    print("🚀 Gemini 2.5-Flash 語音記帳解析 PoC 測試")
    print("當前設定時間基準：2026年6月13日")
    print("=" * 60)
    
    test_inputs = [
        "昨天去中油用中油Pay加滿油花了800塊",
        "今天中午去全聯刷信用卡買鮮奶和麵包花了250元",
        "剛才在7-11用悠遊卡買了拿鐵咖啡大杯45元，拿現金付的"
    ]
    
    for i, user_text in enumerate(test_inputs, 1):
        print(f"\n[測試案例 {i}]")
        print(f"📢 輸入口語句: \"{user_text}\"")
        print("⏳ 解析中...")
        try:
            json_result = parser.parse(user_text)
            print("✨ 解析結果 (JSON):")
            print(json_result)
        except Exception as ex:
            print(f"❌ 解析出錯: {ex}")
        print("-" * 60)
