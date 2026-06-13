from config.settings import RATING_MAP


class Normalizer:
    def normalize_rating(self, rating_raw: str) -> str:
        if not rating_raw:
            return "HOLD"
        rating_clean = rating_raw.strip().lower().replace("  ", " ")
        if rating_clean in RATING_MAP:
            return RATING_MAP[rating_clean]
        for key, value in RATING_MAP.items():
            if key in rating_clean or rating_clean in key:
                return value
        return "HOLD"

    def normalize_target_price(self, price: float | str | None) -> float:
        if price is None:
            return 0.0
        try:
            return float(price)
        except (ValueError, TypeError):
            return 0.0

    def normalize_ticker(self, ticker: str) -> str:
        return ticker.strip().upper()

    def normalize_broker(self, broker: str) -> str:
        broker_map = {
            "gs": "Goldman Sachs",
            "goldman": "Goldman Sachs",
            "goldman sachs": "Goldman Sachs",
            "ms": "Morgan Stanley",
            "morgan": "Morgan Stanley",
            "morgan stanley": "Morgan Stanley",
            "citi": "Citi",
            "citigroup": "Citi",
            "jpm": "JP Morgan",
            "jp morgan": "JP Morgan",
            "jpmorgan": "JP Morgan",
            "bofa": "Bank of America",
            "baml": "Bank of America",
            "bank of america": "Bank of America",
            "ubs": "UBS",
            "cs": "Credit Suisse",
            "credit suisse": "Credit Suisse",
            "deutsche": "Deutsche Bank",
            "db": "Deutsche Bank",
        }
        clean = broker.strip().lower().replace("_", " ").replace("-", " ")
        if clean in broker_map:
            return broker_map[clean]
        for key, value in broker_map.items():
            if key in clean or clean in key:
                return value
        return broker.strip()

    def normalize(self, data: dict) -> dict:
        normalized = dict(data)
        normalized["ticker"] = self.normalize_ticker(data.get("ticker", ""))
        normalized["broker"] = self.normalize_broker(data.get("broker", ""))
        normalized["rating_standard"] = self.normalize_rating(data.get("rating", ""))
        normalized["target_price"] = self.normalize_target_price(
            data.get("target_price")
        )
        if isinstance(data.get("bull_points"), list):
            normalized["bull_points"] = [p.strip() for p in data["bull_points"] if p.strip()]
        if isinstance(data.get("bear_points"), list):
            normalized["bear_points"] = [p.strip() for p in data["bear_points"] if p.strip()]
        return normalized
