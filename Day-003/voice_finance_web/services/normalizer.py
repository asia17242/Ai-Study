import re

STT_NOISE_PARTICLES = [
    (r'[啦啊厚捏]$', ''),
    (r'那個\s*', ''),
    (r'嗯\s*', ''),
    (r'[欸唉誒]\s*', ''),
]

PHONETIC_PAYMENT_MAP = {
    '賴ㄆㄟ': 'LINE Pay',
    'Line Pay': 'LINE Pay',
    'line pay': 'LINE Pay',
    '阿法ㄆㄟ': 'Apple Pay',
    'Apple Pay': 'Apple Pay',
    'apple pay': 'Apple Pay',
}

TELECOM_FIX_MAP = {
    '亞太': '亞太電信門號費',
    '亞太電信': '亞太電信門號費',
}


def normalize_speech_text(text: str) -> str:
    result = text.strip()
    for pattern, replacement in STT_NOISE_PARTICLES:
        result = re.sub(pattern, replacement, result)
    for phonetic, standard in PHONETIC_PAYMENT_MAP.items():
        result = result.replace(phonetic, standard)
    for telecom_key, telecom_value in TELECOM_FIX_MAP.items():
        result = re.sub(r'(?<!\S)' + re.escape(telecom_key) + r'(?!\S)', telecom_value, result)
    return result.strip()
