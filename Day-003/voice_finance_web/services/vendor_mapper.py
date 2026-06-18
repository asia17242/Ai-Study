import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from shared.categories import TAIWAN_VENDOR_MAP


def apply_vendor_mapping(parsed: dict, raw_text: str) -> dict:
    result = dict(parsed)
    text_lower = raw_text.lower()
    for vendor in TAIWAN_VENDOR_MAP:
        if any(kw in raw_text or kw in text_lower for kw in vendor["keywords"]):
            if "category" in vendor:
                result["category"] = vendor["category"]
            if "sub_category" in vendor:
                result["sub_category"] = vendor["sub_category"]
            if "payment_method" in vendor:
                result["payment_method"] = vendor["payment_method"]
            if any(kw in raw_text for kw in vendor["keywords"]):
                result["merchant"] = vendor["keywords"][0]
            break
    return result
