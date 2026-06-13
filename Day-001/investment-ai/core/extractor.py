import json
import re

from openai import OpenAI

from config.settings import OPENAI_API_KEY, OPENAI_MODEL


class Extractor:
    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

    def extract(self, raw_text: str, filename_hint: str = "") -> dict:
        if self.client:
            return self._llm_extract(raw_text, filename_hint)
        return self._fallback_extract(raw_text, filename_hint)

    def _llm_extract(self, raw_text: str, filename_hint: str) -> dict:
        prompt = f"""You are an AI investment research analyst. Extract structured data from this broker research report.

Report file: {filename_hint}

Extract the following fields in JSON format:
1. ticker (stock code, e.g. 2330)
2. company (full company name)
3. broker (broker name)
4. date (report date in YYYY-MM-DD)
5. rating (BUY/HOLD/SELL or equivalent)
6. target_price (numeric, without currency)
7. currency (default TWD)
8. bull_points (list of bullish arguments, max 5)
9. bear_points (list of bearish arguments, max 5)
10. summary (1-2 sentence summary)
11. financial_highlights (dict of key financial metrics found)

Report text:
{raw_text[:12000]}

Return ONLY valid JSON, no markdown formatting."""
        try:
            response = self.client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            return self._validate(result)
        except Exception as e:
            return self._fallback_extract(raw_text, filename_hint)

    def _fallback_extract(self, raw_text: str, filename_hint: str) -> dict:
        text = raw_text[:8000]
        result = {}

        ticker_match = re.search(r"\((\d{4})\)", text)
        result["ticker"] = ticker_match.group(1) if ticker_match else ""

        parts = filename_hint.replace(".pdf", "").split("_")
        result["ticker"] = result["ticker"] or (parts[0] if parts else "")
        result["broker"] = "_".join(parts[1:]) if len(parts) > 1 else ""

        company_match = re.search(
            r"([A-Z][A-Za-z\s.]+(?:Inc|Corp|Ltd|Co|Technology|Semiconductor|Electronics))",
            text[:1000]
        )
        result["company"] = company_match.group(1).strip() if company_match else ""

        date_match = re.search(r"(\d{4}[-/]\d{1,2}[-/]\d{1,2})", text)
        result["date"] = date_match.group(1) if date_match else ""

        rating_match = re.search(
            r"(rating|recommendation|view)[:\s]+([A-Za-z\s\-]+?)(?:\.|$|\n)",
            text[:2000],
            re.IGNORECASE
        )
        result["rating"] = rating_match.group(2).strip() if rating_match else ""

        tp_match = re.search(
            r"(?:target\s*price|price\s*target|PT)[:\s]*[NT$]*\s*([\d,]+(?:\.\d+)?)",
            text[:3000],
            re.IGNORECASE
        )
        result["target_price"] = float(tp_match.group(1).replace(",", "")) if tp_match else 0.0
        result["currency"] = "TWD"

        bull = re.search(r"(?:bull|positive|upside|catalyst)[\s\S]{0,500}", text[:6000], re.IGNORECASE)
        result["bull_points"] = [bull.group(0)[:200]] if bull else []

        bear = re.search(r"(?:bear|negative|downside|risk|cautious)[\s\S]{0,500}", text[:6000], re.IGNORECASE)
        result["bear_points"] = [bear.group(0)[:200]] if bear else []

        result["summary"] = text[:200].replace("\n", " ").strip()
        result["financial_highlights"] = {}
        return result

    def _validate(self, result: dict) -> dict:
        required = ["ticker", "company", "broker", "rating"]
        for field in required:
            if field not in result:
                result[field] = ""
        if "target_price" in result:
            try:
                result["target_price"] = float(result["target_price"])
            except (ValueError, TypeError):
                result["target_price"] = 0.0
        if "bull_points" not in result:
            result["bull_points"] = []
        if "bear_points" not in result:
            result["bear_points"] = []
        return result
