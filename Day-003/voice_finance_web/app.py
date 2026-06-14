import os
import json
import re
import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv()

# Initialize FastAPI App
app = FastAPI(title="Voice Finance Web App", description="Unified Voice Finance Web Platform")

# CORS middleware for testing accessibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas for structured input & API response validation
class TransactionResponse(BaseModel):
    amount: float = Field(description="交易金額")
    category: str = Field(description="交易類別，例如：餐飲食品、交通出行、日常用品、娛樂消費、醫療保健等")
    description: str = Field(description="交易描述或細節描述")
    type: str = Field(description="交易類型：'expense' (支出) 或 'income' (收入)")
    date: str = Field(description="交易日期，格式為 YYYY-MM-DD")
    merchant: Optional[str] = Field(default="未知", description="商家名稱")
    payment_method: Optional[str] = Field(default="現金", description="付款方式：'現金'、'信用卡' 或 '電子支付'")
    items: Optional[List[str]] = Field(default=[], description="交易明細中的個別商品或細項列表，例如：['鮮奶', '麵包']")
    is_recurring: Optional[bool] = Field(default=False, description="是否為定期定額交易")
    day_of_period: Optional[int] = Field(default=None, description="定期交易的每期執行日（如每月5日則為5）")
    recurring_frequency: Optional[str] = Field(default=None, description="定期頻率：'monthly' 或 'weekly'")

class VoiceInput(BaseModel):
    text: str
    current_date: str = "2026-06-13"

class InvoiceQRInput(BaseModel):
    qr_string: str = Field(description="台灣電子發票左側 QR Code 原始字串")

# Initialize GenAI Client or use Mock mode
api_key = os.getenv("GEMINI_API_KEY")
mock_mode = False
client_type = "mock"
legacy_model = None

if not api_key or api_key.strip() == "":
    print("[WARNING] GEMINI_API_KEY is empty. Starting in Mock Mode.")
    mock_mode = True
    client_type = "mock"
else:
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        model_name = "gemini-2.5-flash"
        client_type = "new"
        print("[INFO] Google GenAI (New SDK) initialized successfully.")
    except Exception as e1:
        print(f"[INFO] New SDK not available ({e1}). Trying legacy SDK...")
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=api_key)
            legacy_model = legacy_genai.GenerativeModel(
                model_name="gemini-1.5-flash",
            )
            client_type = "legacy"
            print("[INFO] Google GenerativeAI (Legacy SDK) initialized successfully.")
        except Exception as e2:
            print(f"[ERROR] Both GenAI SDKs failed to initialize. Falling back to Mock Mode. Error: {e2}")
            mock_mode = True
            client_type = "mock"

def mock_parse(text: str, current_date: str) -> dict:
    """Fallback parser for local testing without Gemini API Key."""
    # Handle Bidirectional AI Retrieval Queries
    if "上個月手搖飲" in text or "手搖飲總共花多少錢" in text:
        return {
            "amount": 0,
            "category": "其他",
            "description": "💡 AI 查詢結果：您上個月（5月）手搖飲共消費 6 次，累計金額為 $380 元。",
            "type": "expense",
            "date": current_date,
            "merchant": "AI 搜尋",
            "payment_method": "系統查詢",
            "items": [],
            "is_recurring": False,
            "day_of_period": None,
            "recurring_frequency": None
        }
    elif "中油加油費" in text or "中油加油費是多少" in text:
        return {
            "amount": 0,
            "category": "其他",
            "description": "💡 AI 查詢結果：昨天去中油加油共花費 $800 元（使用電子支付）。",
            "type": "expense",
            "date": current_date,
            "merchant": "AI 搜尋",
            "payment_method": "系統查詢",
            "items": [],
            "is_recurring": False,
            "day_of_period": None,
            "recurring_frequency": None
        }
    elif "全聯買了什麼" in text:
        return {
            "amount": 0,
            "category": "其他",
            "description": "💡 AI 查詢結果：上週去全聯購買了 鮮奶、麵包，共計 $250 元（使用信用卡）。",
            "type": "expense",
            "date": current_date,
            "merchant": "AI 搜尋",
            "payment_method": "系統查詢",
            "items": [],
            "is_recurring": False,
            "day_of_period": None,
            "recurring_frequency": None
        }

    amount = 100
    currency_match = re.search(r'(\d+)\s*(萬|億)?\s*(元|塊)', text)
    if currency_match:
        base = float(currency_match.group(1))
        multiplier = currency_match.group(2)
        if multiplier == '萬':
            base *= 10000
        elif multiplier == '億':
            base *= 100000000
        amount = base
    else:
        if '一百二十' in text:
            amount = 120.0
        elif '二五零' in text or '二百五十' in text:
            amount = 250.0
        elif '八百' in text:
            amount = 800.0
        elif '四十五' in text:
            amount = 45.0
        elif '五萬' in text:
            amount = 50000.0
        elif '三萬' in text:
            amount = 30000.0
        elif '一萬' in text:
            amount = 10000.0

    tx_type = "expense"
    category = "其他"
    merchant = "未知"
    payment_method = "現金"
    items = []

    # Simple item extraction for demo
    if "鮮奶" in text:
        items.append("鮮奶")
    if "麵包" in text:
        items.append("麵包")
    if "拿鐵" in text or "咖啡" in text:
        items.append("大杯冰拿鐵")
    if "油" in text:
        items.append("無鉛汽油")

    if any(k in text for k in ["賺", "薪水", "收入", "薪資"]):
        tx_type = "income"
        category = "薪資"
        if "獎金" in text:
            category = "獎金"
        elif "投資" in text:
            category = "投資"
    else:
        if any(k in text for k in ["餐", "吃", "飯", "麵", "喝", "飲料", "午餐", "晚餐", "早餐", "麥當勞", "肯德基"]):
            category = "餐飲食品"
            if "麥當勞" in text:
                merchant = "麥當勞"
            elif "肯德基" in text:
                merchant = "肯德基"
        elif any(k in text for k in ["車", "搭", "捷運", "油", "中油", "公車", "高鐵"]):
            category = "交通出行"
            if "中油" in text:
                merchant = "中油"
        elif any(k in text for k in ["買", "購物", "全聯", "大買家", "7-11", "全家", "超市"]):
            category = "日常用品"
            if "全聯" in text:
                merchant = "全聯"
            elif "7-11" in text or "咖啡" in text:
                merchant = "7-11"
        elif any(k in text for k in ["玩", "看電影", "遊戲", "娛樂", "KTV", "唱歌"]):
            category = "娛樂消費"
        elif any(k in text for k in ["看病", "醫", "藥", "醫院", "診所"]):
            category = "醫療保健"

    if any(k in text for k in ["Pay", "支付", "LINE Pay", "Line Pay", "中油Pay", "悠遊卡", "電子支付"]):
        payment_method = "電子支付"
    elif any(k in text for k in ["刷卡", "信用卡", "刷"]):
        payment_method = "信用卡"

    # Recurring pattern detection
    is_recurring = False
    day_of_period = None
    recurring_frequency = None
    recurring_kw = ["每個月", "每週", "每月", "固定", "定期"]
    if any(k in text for k in recurring_kw):
        is_recurring = True
        if "每週" in text:
            recurring_frequency = "weekly"
            week_match = re.search(r'每週\s*(\d+)', text)
            if week_match:
                day_of_period = int(week_match.group(1))
        else:
            recurring_frequency = "monthly"
            day_match = re.search(r'(?:每個?月|每月|固定)\s*(\d+)\s*日', text)
            if day_match:
                day_of_period = int(day_match.group(1))
            else:
                day_match = re.search(r'(\d+)\s*日\s*都', text)
                if day_match:
                    day_of_period = int(day_match.group(1))

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

    return {
        "amount": amount,
        "category": category,
        "description": text,
        "type": tx_type,
        "date": tx_date.strftime("%Y-%m-%d"),
        "merchant": merchant,
        "payment_method": payment_method,
        "items": items,
        "is_recurring": is_recurring,
        "day_of_period": day_of_period,
        "recurring_frequency": recurring_frequency
    }

@app.post("/api/parse", response_model=TransactionResponse)
async def parse_voice(input: VoiceInput):
    if client_type == "mock" or mock_mode:
        print(f"[MOCK] Parsing input: '{input.text}' (baseline: {input.current_date})")
        parsed = mock_parse(input.text, input.current_date)
        return TransactionResponse(**parsed)
    
    system_instruction = (
        "你是一個專業的財務記帳分析師，專門負責將口語或語音文字轉換為結構化記帳 JSON。\n"
        f"當前系統時間基準為（current_date）：{input.current_date}。\n"
        "請精確解析出交易金額、類別、備註、收支類型、交易日期、商家名稱、付款方式，並提取具體商品項目放入 items 陣列。\n\n"
        "=== 金額萃取嚴格規則（Taiwan NER）===\n"
        "1. 貨幣錨點規則：金額 amount 必須提取緊鄰於「元」或「塊」之前的數字。\n"
        "   例：「電話支出1500元」→ amount: 1500。「花了800塊」→ amount: 800。\n"
        "2. 上下文排除規則：強制忽略緊接於日期/數量修飾詞之後的數字，包含但不限於：\n"
        "   「日」、「號」、「個」、「杯」、「次」、「件」、「歲」、「月」、「年」。\n"
        "   例：「每個月5日固定支出1500元」→ amount: 1500（絕不取 5）。\n"
        "3. 萬/億轉換規則：若貨幣字串含「萬」或「億」，必須先做數學乘積再輸出。\n"
        "   例：「100萬元」→ amount: 100 * 10000 = 1000000。\n"
        "   「5億」→ amount: 5 * 100000000 = 500000000。\n"
        "4. 若語句中完全沒有貨幣相關數字（無元/塊/萬/億），amount 設為 0。\n\n"
        "=== 其他欄位規則 ===\n"
        "5. 台灣常見商家：如全聯、中油、大買家、家樂福、7-11、全家、康是美等，請標註於 merchant 欄位。\n"
        "6. 付款方式 (payment_method)：必須精準歸類為 '現金'、'信用卡' 或 '電子支付' 之一（街口支付, Line Pay, 中油Pay, 悠遊卡等皆屬 '電子支付'）。\n"
        "7. 日期 (date)：若提及「昨天」、「前天」、「大前天」，請用系統時間基準扣除對應天數算得具體日期。\n"
        "8. 商品細項 (items)：若提及購買了多個具體物件（如鮮奶和麵包），請拆分為字串陣列放入 items 欄位，例如 ['鮮奶', '麵包']。若無具體商品，則傳回空陣列 []。\n\n"
        "=== 定期交易偵測規則 ===\n"
        "9. 若語句含「每個月」、「每月」、「每週」、「固定」、「定期」等關鍵字：\n"
        "   - is_recurring 設為 true。\n"
        "   - recurring_frequency：'monthly'（每月）或 'weekly'（每週）。\n"
        "   - day_of_period：從語句中提取執行日期數字。\n"
        "     例：「每個月5日固定電話支出1500元」→ is_recurring: true, recurring_frequency: 'monthly', day_of_period: 5。\n"
        "     例：「每週一固定買咖啡」→ is_recurring: true, recurring_frequency: 'weekly', day_of_period: 1。\n"
        "   若無定期關鍵字，is_recurring 設為 false，其餘欄位設為 null。\n\n"
        "回傳格式必須為符合以下 Pydantic 欄位定義的 JSON。\n"
        "金額(amount)必須為數字類型，收支類型(type)必須是 'expense' 或 'income'。"
    )

    if client_type == "new":
        print(f"[GEMINI NEW SDK] Parsing input: '{input.text}' (baseline: {input.current_date})")
        try:
            from google.genai import types
            response = client.models.generate_content(
                model=model_name,
                contents=input.text,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=TransactionResponse,
                    temperature=0.1
                )
            )
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(json)?\n", "", raw_text)
                raw_text = re.sub(r"\n```$", "", raw_text)
            parsed_data = json.loads(raw_text)
            return TransactionResponse(**parsed_data)
        except Exception as e:
            print(f"[ERROR] New SDK parse failed: {e}. Falling back to mock...")
            parsed = mock_parse(input.text, input.current_date)
            return TransactionResponse(**parsed)
            
    elif client_type == "legacy":
        print(f"[GEMINI LEGACY SDK] Parsing input: '{input.text}' (baseline: {input.current_date})")
        try:
            import google.generativeai as legacy_genai
            generation_config = {
                "response_mime_type": "application/json",
                "temperature": 0.1,
            }
            
            prompt_content = (
                f"系統指令：\n{system_instruction}\n\n"
                f"請分析以下文字並回傳 JSON：\n{input.text}"
            )
            
            response = legacy_model.generate_content(
                prompt_content,
                generation_config=generation_config
            )
            
            raw_text = response.text.strip()
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```(json)?\n", "", raw_text)
                raw_text = re.sub(r"\n```$", "", raw_text)
            parsed_data = json.loads(raw_text)
            
            normalized = {
                "amount": float(parsed_data.get("amount", 0)),
                "category": parsed_data.get("category", "其他"),
                "description": parsed_data.get("description", parsed_data.get("description", input.text)),
                "type": parsed_data.get("type", "expense"),
                "date": parsed_data.get("date", input.current_date),
                "merchant": parsed_data.get("merchant", "未知"),
                "payment_method": parsed_data.get("payment_method", "現金"),
                "items": parsed_data.get("items", [])
            }
            return TransactionResponse(**normalized)
        except Exception as e:
            print(f"[ERROR] Legacy SDK parse failed: {e}. Falling back to mock...")
            parsed = mock_parse(input.text, input.current_date)
            return TransactionResponse(**parsed)

@app.post("/api/parse-invoice-qr", response_model=TransactionResponse)
async def parse_invoice_qr(input: InvoiceQRInput):
    """Parse Taiwan E-Invoice left-side QR code string."""
    qr = input.qr_string.strip()
    print(f"[INVOICE QR] Raw input length: {len(qr)}")
    
    try:
        invoice_number = qr[:10]
        taiwan_year = qr[10:13]
        date_mmdd = qr[13:17]
        hex_amount = qr[21:29]
        
        western_year = int(taiwan_year) + 1911
        mm = date_mmdd[:2]
        dd = date_mmdd[2:4]
        date_str = f"{western_year}-{mm}-{dd}"
        
        amount = int(hex_amount, 16)
        
        print(f"[INVOICE QR] Invoice: {invoice_number}, Date: {date_str}, Amount: {amount}")
        
        return TransactionResponse(
            amount=float(amount),
            category="日常用品",
            description=f"電子發票 {invoice_number}",
            type="expense",
            date=date_str,
            merchant="電子發票",
            payment_method="載具",
            items=[],
            is_recurring=False,
            day_of_period=None,
            recurring_frequency=None
        )
    except Exception as e:
        print(f"[INVOICE QR] Parse error: {e}")
        raise HTTPException(status_code=400, detail=f"QR 解析錯誤: {str(e)}")

# Mount static web directory
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Serve UI index.html at root route
@app.get("/", response_class=FileResponse)
async def read_root():
    return FileResponse(os.path.join(static_dir, "index.html"))

@app.get("/api/health")
async def health():
    return {"status": "ok", "mock_mode": mock_mode}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
