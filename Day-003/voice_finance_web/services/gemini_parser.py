import os
import json
import re
from .normalizer import normalize_speech_text
from .vendor_mapper import apply_vendor_mapping
from .mock_parser import mock_parse


SYSTEM_INSTRUCTION = """
你是一個專業的財務記帳分析師，專門負責將口語或語音文字轉換為結構化記帳 JSON。
請以 JSON 格式回傳以下欄位：amount, category, description, type, date, merchant, payment_method, items, sub_category, is_recurring, day_of_period, recurring_frequency。

台灣商家智慧識別：全聯、中油、好市多、家樂福、7-11、全家、康是美、麥當勞、星巴克等。
台灣電子支付：LINE Pay, Apple Pay, 中油Pay, 全支付, 街口支付, 悠遊卡 — 歸類為「電子支付」。
金額萃取：必須提取「元」或「塊」前的數字，正確處理萬/億中文數字。
日期：以系統提供之 current_date 為基準，處理昨天/前天/大前天等相對時間。
定期交易：若含「每個月」、「每週」、「固定」等字眼，設定 is_recurring=true。
"""


def init_genai_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        print("[WARNING] GEMINI_API_KEY is empty. Running in Mock Mode.")
        return {"client_type": "mock"}

    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        print("[INFO] Google GenAI (New SDK) initialized with gemini-2.5-flash.")
        return {"client_type": "new", "client": client, "model": "gemini-2.5-flash", "types": types}
    except Exception as e1:
        print(f"[INFO] New SDK unavailable ({e1}). Trying legacy SDK...")
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=api_key)
            model = legacy_genai.GenerativeModel(model_name="gemini-1.5-flash")
            print("[INFO] Legacy SDK initialized with gemini-1.5-flash.")
            return {"client_type": "legacy", "model": model}
        except Exception as e2:
            print(f"[ERROR] Both SDKs failed ({e2}). Falling back to Mock Mode.")
            return {"client_type": "mock"}


def parse_with_gemini(genai_config, text: str, current_date: str):
    normalized = normalize_speech_text(text)
    client_type = genai_config["client_type"]

    if client_type == "mock":
        print(f"[MOCK] Parsing: '{normalized}' (baseline: {current_date})")
        return mock_parse(text, current_date)

    if client_type == "new":
        return _parse_new_sdk(genai_config, normalized, text, current_date)

    if client_type == "legacy":
        return _parse_legacy_sdk(genai_config, normalized, text, current_date)

    print("[WARN] Unknown client type. Falling back to mock.")
    return mock_parse(text, current_date)


def _parse_new_sdk(config, normalized: str, original: str, current_date: str):
    instruction = (
        f"你是一個專業的財務記帳分析師。當前的日期時間基準為：{current_date}。\n"
        f"{SYSTEM_INSTRUCTION}"
    )
    try:
        response = config["client"].models.generate_content(
            model=config["model"],
            contents=normalized,
            config=config["types"].GenerateContentConfig(
                system_instruction=instruction,
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(json)?\n", "", raw)
            raw = re.sub(r"\n```$", "", raw)
        parsed = json.loads(raw)
        return apply_vendor_mapping(dict(parsed), original)
    except Exception as e:
        print(f"[ERROR] New SDK parse failed: {e}. Falling back to mock.")
        return mock_parse(original, current_date)


def _parse_legacy_sdk(config, normalized: str, original: str, current_date: str):
    try:
        generation_config = {"response_mime_type": "application/json", "temperature": 0.1}
        prompt = (
            f"系統指令：\n{SYSTEM_INSTRUCTION}\n\n"
            f"請分析以下文字並回傳 JSON（當前日期基準：{current_date}）：\n{normalized}"
        )
        response = config["model"].generate_content(prompt, generation_config=generation_config)
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(json)?\n", "", raw)
            raw = re.sub(r"\n```$", "", raw)
        parsed = json.loads(raw)
        normalized_result = {
            "amount": float(parsed.get("amount", 0)),
            "category": parsed.get("category", "其他"),
            "description": parsed.get("description", normalized),
            "type": parsed.get("type", "expense"),
            "date": parsed.get("date", current_date),
            "merchant": parsed.get("merchant", "未知"),
            "payment_method": parsed.get("payment_method", "現金"),
            "items": parsed.get("items", []),
            "sub_category": parsed.get("sub_category", "其他"),
            "is_recurring": parsed.get("is_recurring", False),
            "day_of_period": parsed.get("day_of_period"),
            "recurring_frequency": parsed.get("recurring_frequency"),
        }
        return apply_vendor_mapping(normalized_result, original)
    except Exception as e:
        print(f"[ERROR] Legacy SDK parse failed: {e}. Falling back to mock.")
        return mock_parse(original, current_date)
