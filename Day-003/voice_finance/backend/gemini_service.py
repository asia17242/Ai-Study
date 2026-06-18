import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from shared.categories import EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, TAIWAN_VENDOR_MAP

import json
import re
import datetime
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

def _build_vendor_map_str():
    lines = []
    for vendor in TAIWAN_VENDOR_MAP:
        keys = "/".join(vendor["keywords"])
        line = f"- {keys} → category: {vendor['category']}, sub_category: {vendor['sub_category']}"
        if "payment_method" in vendor:
            line += f", payment_method: {vendor['payment_method']}"
        lines.append(line)
    return "\n".join(lines)

VENDOR_MAP_TEXT = _build_vendor_map_str()

SYSTEM_PROMPT = f"""
You are a financial transaction parser specialized in Taiwan Traditional Chinese voice input.
Extract structured data from voice input. Return JSON with these fields:
- amount: number (integer, in NTD)
- category: string (Expense: {", ".join(EXPENSE_CATEGORIES)} | Income: {", ".join(INCOME_CATEGORIES)})
- description: string (brief summary of the transaction)
- type: "expense" or "income"
- date: YYYY-MM-DD (calculate from the provided baseline current_date and relative terms like 昨天/前天/大前天)
- merchant: string (vendor name e.g. 全聯, 中油, 7-11; default "未知")
- payment_method: string ({" / ".join(PAYMENT_METHODS)})
- tags: list of strings (relevant tags like payment tool names, activities)
- raw_text: string (the original input text)
- sub_category: string (L2 category e.g. 早餐, 加油, 便利商店)
- items: list of strings (individual purchased items if specified)

Taiwan merchant map:
{VENDOR_MAP_TEXT}
"""

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self.mock_mode = False
        self.client_type = "mock"
        self.client = None
        self.model_name = None

        if not api_key or not api_key.strip():
            self.mock_mode = True
            self.client_type = "mock"
            print("[WARNING] GEMINI_API_KEY is empty. Running in Mock Mode.")
            return

        try:
            from google import genai
            from google.genai import types
            self.client = genai.Client(api_key=api_key)
            self.model_name = "gemini-2.5-flash"
            self.client_type = "new"
            self.genai_types = types
            print("[INFO] Google GenAI (New SDK) initialized with gemini-2.5-flash.")
        except Exception as e1:
            print(f"[INFO] New SDK unavailable ({e1}). Trying legacy SDK...")
            try:
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=api_key)
                self.legacy_model = legacy_genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    system_instruction=SYSTEM_PROMPT,
                )
                self.client_type = "legacy"
                print("[INFO] Legacy SDK initialized with gemini-1.5-flash.")
            except Exception as e2:
                print(f"[ERROR] Both SDKs failed ({e2}). Falling back to Mock Mode.")
                self.mock_mode = True
                self.client_type = "mock"

    def parse_transaction(self, text: str, current_date: str = "2026-06-13") -> dict:
        if self.mock_mode or self.client_type == "mock":
            return self._mock_parse(text, current_date)

        if self.client_type == "new":
            return self._parse_with_new_sdk(text, current_date)

        if self.client_type == "legacy":
            return self._parse_with_legacy_sdk(text, current_date)

        return self._mock_parse(text, current_date)

    def _parse_with_new_sdk(self, text: str, current_date: str) -> dict:
        dynamic_instruction = (
            f"你是一個專業的財務記帳分析師。當前的日期時間基準為：{current_date}。\n"
            f"{SYSTEM_PROMPT}"
        )
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=text,
                config=self.genai_types.GenerateContentConfig(
                    system_instruction=dynamic_instruction,
                    response_mime_type="application/json",
                    response_schema=_TransactionSchema,
                    temperature=0.1,
                ),
            )
            raw = response.text.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(json)?\n", "", raw)
                raw = re.sub(r"\n```$", "", raw)
            return json.loads(raw)
        except Exception as e:
            print(f"[ERROR] New SDK parse failed: {e}. Falling back to mock.")
            return self._mock_parse(text, current_date)

    def _parse_with_legacy_sdk(self, text: str, current_date: str) -> dict:
        try:
            prompt = (
                f"Current baseline date: {current_date}\n"
                f"Analyze and return JSON:\n{text}"
            )
            response = self.legacy_model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json", "temperature": 0.1},
            )
            raw = response.text.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(json)?\n", "", raw)
                raw = re.sub(r"\n```$", "", raw)
            return json.loads(raw)
        except Exception as e:
            print(f"[ERROR] Legacy SDK parse failed: {e}. Falling back to mock.")
            return self._mock_parse(text, current_date)

    def _mock_parse(self, text: str, current_date: str) -> dict:
        original_text = text
        amount = 100
        CN_DIGITS = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '零': 0}

        def _cn_to_int(s):
            s = s.strip()
            if not s: return 0
            if s.isdigit(): return int(s)
            result = 0
            for ch in s:
                if ch in CN_DIGITS: result = result * 10 + CN_DIGITS[ch]
                elif ch.isdigit(): result = result * 10 + int(ch)
            return result

        def _parse_segment(seg):
            seg = seg.strip()
            if not seg: return 0
            val = 0
            m = re.search(r'([\d一二三四五六七八九]+)\s*千', seg)
            if m:
                val += _cn_to_int(m.group(1)) * 1000
                seg = seg[m.end():]
            m = re.search(r'([\d一二三四五六七八九]+)\s*百', seg)
            if m:
                val += _cn_to_int(m.group(1)) * 100
                seg = seg[m.end():]
            m = re.search(r'([\d一二三四五六七八九]+)\s*十', seg)
            if m:
                val += _cn_to_int(m.group(1)) * 10
                seg = seg[m.end():]
            if seg.strip(): val += _cn_to_int(seg.strip())
            return val

        cleaned = re.sub(r'[元塊]', '', text).strip()
        total = 0
        parts = cleaned.split('億')
        if len(parts) > 1:
            total += _parse_segment(parts[0] if parts[0] else '1') * 100000000
            cleaned = parts[1]
        else:
            cleaned = parts[0]
        parts = cleaned.split('萬')
        if len(parts) > 1:
            total += _parse_segment(parts[0] if parts[0] else '1') * 10000
            cleaned = parts[1]
        else:
            cleaned = parts[0]
        if cleaned.strip(): total += _parse_segment(cleaned)

        if total > 0:
            amount = float(total)
        else:
            match = re.search(r'\d+', text)
            if match: amount = float(match.group())

        tx_type = "expense"
        category = "其他"
        merchant = "未知"
        payment_method = "現金"
        items = []
        sub_category = "其他"
        tags = []

        if any(k in text for k in ["賺", "薪水", "收入", "薪資", "中獎", "獎金", "對中", "樂透", "彩券"]):
            tx_type = "income"
            category = "薪資"
            if any(k in text for k in ["中獎", "獎金", "對中", "樂透", "彩券"]):
                category = "獎金"
            elif "投資" in text:
                category = "投資"
        else:
            if any(k in text for k in ["餐", "吃", "飯", "麵", "喝", "飲料", "午餐", "晚餐", "早餐", "麥當勞", "肯德基"]):
                category = "餐飲食品"
                if "早餐" in text: sub_category = "早餐"
                elif "午餐" in text: sub_category = "午餐"
                elif "晚餐" in text: sub_category = "晚餐"
                elif any(k in text for k in ["飲料", "咖啡", "茶", "手搖", "奶茶"]): sub_category = "飲料/零食"
                if "麥當勞" in text: merchant = "麥當勞"
                elif "肯德基" in text: merchant = "肯德基"
            elif any(k in text for k in ["車", "搭", "捷運", "中油", "油", "公車", "高鐵", "計程車"]):
                category = "交通出行"
                if "加油" in text or "中油" in text or "油" in text:
                    sub_category = "加油"
                    if "中油" in text: merchant = "中油"; payment_method = "中油Pay"
                elif "停車" in text: sub_category = "停車"
                elif any(k in text for k in ["捷運", "公車", "高鐵", "火車", "搭"]): sub_category = "大眾運輸"
            elif any(k in text for k in ["買", "購物", "全聯", "大買家", "7-11", "全家", "超市", "好市多", "家樂福"]):
                category = "日常用品"
                if "全聯" in text: merchant = "全聯"; sub_category = "雜貨"; payment_method = "全支付"
                elif "大買家" in text: merchant = "大買家"; sub_category = "生鮮量販"
                elif "7-11" in text: merchant = "7-11"; sub_category = "便利商店"
                elif "全家" in text: merchant = "全家"; sub_category = "便利商店"
                elif "好市多" in text: merchant = "好市多"; sub_category = "量販賣場"
                elif "家樂福" in text: merchant = "家樂福"; sub_category = "量販賣場"
            elif any(k in text for k in ["玩", "看電影", "遊戲", "娛樂", "KTV", "唱歌"]):
                category = "娛樂消費"
            elif any(k in text for k in ["看病", "醫", "藥", "醫院", "診所"]):
                category = "醫療保健"

        if "鮮奶" in text: items.append("鮮奶")
        if "麵包" in text: items.append("麵包")
        if "拿鐵" in text or "咖啡" in text: items.append("拿鐵咖啡")
        if "油" in text: items.append("無鉛汽油")

        if any(k in text for k in ["Pay", "支付", "LINE Pay", "中油Pay", "悠遊卡", "電子支付", "賴ㄆㄟ"]):
            payment_method = "電子支付"
        elif any(k in text for k in ["刷卡", "信用卡", "刷"]):
            payment_method = "信用卡"

        if "中油Pay" in text: tags.append("中油Pay")
        elif "LINE Pay" in text or "Line Pay" in text or "賴ㄆㄟ" in text: tags.append("LINE Pay")
        elif "Apple Pay" in text or "阿法ㄆㄟ" in text: tags.append("Apple Pay")
        elif "悠遊卡" in text: tags.append("悠遊卡")

        try:
            base_date = datetime.datetime.strptime(current_date, "%Y-%m-%d").date()
        except Exception:
            base_date = datetime.date.today()

        tx_date = base_date
        if "昨天" in text: tx_date = base_date - datetime.timedelta(days=1)
        elif "前天" in text: tx_date = base_date - datetime.timedelta(days=2)
        elif "大前天" in text: tx_date = base_date - datetime.timedelta(days=3)
        elif "明天" in text: tx_date = base_date + datetime.timedelta(days=1)
        elif "後天" in text: tx_date = base_date + datetime.timedelta(days=2)
        else:
            match_days = re.search(r'(\d+)\s*天前', text)
            if match_days: tx_date = base_date - datetime.timedelta(days=int(match_days.group(1)))

        return {
            "amount": float(amount),
            "category": category,
            "description": text,
            "type": tx_type,
            "date": tx_date.strftime("%Y-%m-%d"),
            "merchant": merchant,
            "payment_method": payment_method,
            "tags": tags,
            "raw_text": original_text,
            "sub_category": sub_category,
            "items": items,
        }


# Pydantic schema for Gemini 2.5-Flash structured output (new SDK)
try:
    from pydantic import BaseModel, Field
    _TransactionSchema = type("_TransactionSchema", (BaseModel,), {
        "__annotations__": {
            "date": str,
            "type": str,
            "amount": float,
            "category": str,
            "merchant": str,
            "payment_method": str,
            "tags": List[str],
            "description": str,
            "raw_text": str,
            "sub_category": str,
            "items": List[str],
        },
        "date": Field(description="交易日期 YYYY-MM-DD"),
        "type": Field(description="expense 或 income"),
        "amount": Field(description="交易金額"),
        "category": Field(description="交易類別"),
        "merchant": Field(description="商家名稱"),
        "payment_method": Field(description="付款方式：現金/信用卡/電子支付"),
        "tags": Field(default_factory=list, description="標籤陣列"),
        "description": Field(description="交易描述"),
        "raw_text": Field(description="原始輸入文字"),
        "sub_category": Field(description="二級分類"),
        "items": Field(default_factory=list, description="商品細項陣列"),
    })
except ImportError:
    _TransactionSchema = None
