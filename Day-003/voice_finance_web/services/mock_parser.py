import re
import datetime
from .normalizer import normalize_speech_text
from .vendor_mapper import apply_vendor_mapping


def mock_parse(text: str, current_date: str) -> dict:
    original_text = text
    text = normalize_speech_text(text)

    if "上個月手搖飲" in text or "手搖飲總共花多少錢" in text:
        return _ai_query_response(current_date, "💡 AI 查詢結果：您上個月（5月）手搖飲共消費 6 次，累計金額為 $380 元。")
    if "中油加油費" in text or "中油加油費是多少" in text:
        return _ai_query_response(current_date, "💡 AI 查詢結果：昨天去中油加油共花費 $800 元（使用電子支付）。")
    if "全聯買了什麼" in text:
        return _ai_query_response(current_date, "💡 AI 查詢結果：上週去全聯購買了 鮮奶、麵包，共計 $250 元（使用信用卡）。")

    amount = _extract_amount(text)
    tx_type, category, sub_category, merchant = _classify(text)
    payment_method = _detect_payment(text)
    items = _extract_items(text)
    is_recurring, day_of_period, recurring_frequency = _detect_recurring(text)
    tx_date = _resolve_date(text, current_date)

    parsed = {
        "amount": amount,
        "category": category,
        "description": text,
        "type": tx_type,
        "date": tx_date,
        "merchant": merchant,
        "payment_method": payment_method,
        "items": items,
        "sub_category": sub_category,
        "is_recurring": is_recurring,
        "day_of_period": day_of_period,
        "recurring_frequency": recurring_frequency,
    }
    parsed = apply_vendor_mapping(parsed, original_text)
    return parsed


def _ai_query_response(current_date, message):
    return {
        "amount": 0, "category": "其他", "description": message, "type": "expense",
        "date": current_date, "merchant": "AI 搜尋", "payment_method": "系統查詢",
        "items": [], "sub_category": "其他",
        "is_recurring": False, "day_of_period": None, "recurring_frequency": None,
    }


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
    if m: val += _cn_to_int(m.group(1)) * 1000; seg = seg[m.end():]
    m = re.search(r'([\d一二三四五六七八九]+)\s*百', seg)
    if m: val += _cn_to_int(m.group(1)) * 100; seg = seg[m.end():]
    m = re.search(r'([\d一二三四五六七八九]+)\s*十', seg)
    if m: val += _cn_to_int(m.group(1)) * 10; seg = seg[m.end():]
    if seg.strip(): val += _cn_to_int(seg.strip())
    return val


def _extract_amount(text):
    cleaned = re.sub(r'[元塊]', '', text).strip()
    total = 0
    parts = cleaned.split('億')
    if len(parts) > 1: total += _parse_segment(parts[0] if parts[0] else '1') * 100000000; cleaned = parts[1]
    else: cleaned = parts[0]
    parts = cleaned.split('萬')
    if len(parts) > 1: total += _parse_segment(parts[0] if parts[0] else '1') * 10000; cleaned = parts[1]
    else: cleaned = parts[0]
    if cleaned.strip(): total += _parse_segment(cleaned)

    if total > 0: return float(total)
    if '一百二十' in text: return 120.0
    if '二五零' in text or '二百五十' in text: return 250.0
    if '八百' in text: return 800.0
    if '四十五' in text: return 45.0
    if '五萬' in text: return 50000.0
    if '三萬' in text: return 30000.0
    if '一萬' in text: return 10000.0
    match = re.search(r'\d+', text)
    return float(match.group()) if match else 100.0


def _classify(text):
    merchant = "未知"
    sub_category = "其他"
    category = "其他"
    tx_type = "expense"

    if any(k in text for k in ["賺", "薪水", "收入", "薪資", "中獎", "獎金", "中獎", "對中", "樂透", "彩券", "刮刮樂"]):
        tx_type = "income"
        category = "薪資"
        if any(k in text for k in ["中獎", "獎金", "對中", "樂透", "彩券", "刮刮樂"]): category = "獎金"
        elif "投資" in text: category = "投資"
    elif any(k in text for k in ["餐", "吃", "飯", "麵", "喝", "飲料", "午餐", "晚餐", "早餐", "麥當勞", "肯德基"]):
        category = "餐飲食品"
        if "早餐" in text: sub_category = "早餐"
        elif "午餐" in text: sub_category = "午餐"
        elif "晚餐" in text: sub_category = "晚餐"
        elif "宵夜" in text or "消夜" in text: sub_category = "宵夜"
        elif any(k in text for k in ["飲料", "喝", "咖啡", "茶", "手搖", "奶茶", "拿鐵"]): sub_category = "飲料/零食"
        if "麥當勞" in text: merchant = "麥當勞"
        elif "肯德基" in text: merchant = "肯德基"
    elif any(k in text for k in ["車", "搭", "捷運", "油", "中油", "公車", "高鐵"]):
        category = "交通出行"
        if "加油" in text or "中油" in text or "油" in text:
            sub_category = "加油"
            if "中油" in text: merchant = "中油"
        elif "停車" in text: sub_category = "停車"
        elif any(k in text for k in ["捷運", "公車", "高鐵", "火車", "搭"]): sub_category = "大眾運輸"
        elif "計程車" in text or "Uber" in text.lower(): sub_category = "計程車"
    elif any(k in text for k in ["買", "購物", "全聯", "大買家", "7-11", "全家", "超市"]):
        category = "日常用品"
        if "全聯" in text: merchant = "全聯"
        elif "7-11" in text: merchant = "7-11"
    elif any(k in text for k in ["玩", "看電影", "遊戲", "娛樂", "KTV", "唱歌"]):
        category = "娛樂消費"
    elif any(k in text for k in ["看病", "醫", "藥", "醫院", "診所"]):
        category = "醫療保健"

    return tx_type, category, sub_category, merchant


def _detect_payment(text):
    if any(k in text for k in ["Pay", "支付", "LINE Pay", "Line Pay", "中油Pay", "悠遊卡", "電子支付"]):
        return "電子支付"
    if any(k in text for k in ["刷卡", "信用卡", "刷"]):
        return "信用卡"
    return "現金"


def _extract_items(text):
    items = []
    if "鮮奶" in text: items.append("鮮奶")
    if "麵包" in text: items.append("麵包")
    if "拿鐵" in text or "咖啡" in text: items.append("大杯冰拿鐵")
    if "油" in text: items.append("無鉛汽油")
    return items


def _detect_recurring(text):
    recurring_kw = ["每個月", "每週", "每月", "固定", "定期"]
    if not any(k in text for k in recurring_kw):
        return False, None, None

    recurring_frequency = "weekly" if "每週" in text else "monthly"
    day_of_period = None
    if recurring_frequency == "weekly":
        m = re.search(r'每週\s*(\d+)', text)
        if m: day_of_period = int(m.group(1))
    else:
        m = re.search(r'(?:每個?月|每月|固定)\s*(\d+)\s*日', text)
        if m: day_of_period = int(m.group(1))
        else:
            m = re.search(r'(\d+)\s*日\s*都', text)
            if m: day_of_period = int(m.group(1))
    return True, day_of_period, recurring_frequency


def _resolve_date(text, current_date):
    try:
        base = datetime.datetime.strptime(current_date, "%Y-%m-%d").date()
    except Exception:
        base = datetime.date.today()

    if "昨天" in text: return (base - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    if "前天" in text: return (base - datetime.timedelta(days=2)).strftime("%Y-%m-%d")
    if "大前天" in text: return (base - datetime.timedelta(days=3)).strftime("%Y-%m-%d")
    if "明天" in text: return (base + datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    return base.strftime("%Y-%m-%d")
