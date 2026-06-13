from collections import Counter
from typing import Optional


class Analyzer:
    def consensus_analysis(self, ratings: list[dict]) -> dict:
        if not ratings:
            return {
                "avg_target_price": 0,
                "median_target_price": 0,
                "high_target_price": 0,
                "low_target_price": 0,
                "rating_distribution": {},
                "total_reports": 0,
            }

        prices = [
            r["target_price"]
            for r in ratings
            if r.get("target_price") and r["target_price"] > 0
        ]
        rating_labels = [r["rating_standard"] for r in ratings if r.get("rating_standard")]

        avg_price = sum(prices) / len(prices) if prices else 0
        sorted_prices = sorted(prices)
        n = len(sorted_prices)
        median_price = (
            sorted_prices[n // 2]
            if n % 2 == 1
            else (sorted_prices[n // 2 - 1] + sorted_prices[n // 2]) / 2
        ) if prices else 0

        rating_counts = Counter(rating_labels)
        total = len(ratings)

        return {
            "avg_target_price": round(avg_price, 2),
            "median_target_price": round(median_price, 2),
            "high_target_price": max(prices) if prices else 0,
            "low_target_price": min(prices) if prices else 0,
            "rating_distribution": dict(rating_counts),
            "total_reports": total,
        }

    def sentiment_score(self, bull_bear_points: list[dict]) -> dict:
        bulls = sum(1 for p in bull_bear_points if p.get("point_type") == "bull")
        bears = sum(1 for p in bull_bear_points if p.get("point_type") == "bear")
        total = bulls + bears
        if total == 0:
            return {"bullish": 0, "neutral": 100, "bearish": 0}

        bullish_pct = round(bulls / total * 100)
        bearish_pct = round(bears / total * 100)
        neutral_pct = max(0, 100 - bullish_pct - bearish_pct)

        return {
            "bullish": bullish_pct,
            "neutral": neutral_pct,
            "bearish": bearish_pct,
        }

    def bull_bear_themes(self, bull_bear_points: list[dict]) -> dict:
        bull_themes = Counter()
        bear_themes = Counter()

        for point in bull_bear_points:
            text = point.get("description", "")
            theme = point.get("category", "") or self._classify_theme(text)
            if point.get("point_type") == "bull":
                bull_themes[theme] += 1
            elif point.get("point_type") == "bear":
                bear_themes[theme] += 1

        return {
            "bull_themes": dict(bull_themes.most_common()),
            "bear_themes": dict(bear_themes.most_common()),
        }

    def broker_comparison(self, ratings: list[dict]) -> list[dict]:
        broker_data = {}
        for r in ratings:
            broker = r.get("broker", "Unknown")
            if broker not in broker_data:
                broker_data[broker] = {
                    "broker": broker,
                    "rating": r.get("rating_standard", ""),
                    "target_price": r.get("target_price", 0),
                    "latest_date": r.get("report_date", ""),
                }
            else:
                existing_price = broker_data[broker]["target_price"]
                if r.get("target_price", 0) > 0:
                    broker_data[broker]["target_price"] = r.get("target_price", existing_price)
                if r.get("rating_standard"):
                    broker_data[broker]["rating"] = r.get("rating_standard", "")
                if r.get("report_date", "") > broker_data[broker]["latest_date"]:
                    broker_data[broker]["latest_date"] = r.get("report_date", "")

        return list(broker_data.values())

    def trend_analysis(self, ratings: list[dict]) -> dict:
        sorted_ratings = sorted(ratings, key=lambda r: r.get("report_date", ""))
        price_trend = []
        for r in sorted_ratings:
            if r.get("target_price", 0) > 0:
                price_trend.append({
                    "date": r.get("report_date", ""),
                    "target_price": r["target_price"],
                    "broker": r.get("broker", ""),
                    "rating": r.get("rating_standard", ""),
                })

        upgrades = 0
        downgrades = 0
        for i in range(1, len(sorted_ratings)):
            prev = sorted_ratings[i - 1].get("target_price", 0)
            curr = sorted_ratings[i].get("target_price", 0)
            if prev > 0 and curr > 0:
                if curr > prev:
                    upgrades += 1
                elif curr < prev:
                    downgrades += 1

        return {
            "price_trend": price_trend,
            "upgrades": upgrades,
            "downgrades": downgrades,
            "total_target_changes": upgrades + downgrades,
        }

    def _classify_theme(self, text: str) -> str:
        keywords = {
            "AI demand": ["ai", "artificial intelligence", "llm", "generative"],
            "CoWoS expansion": ["cowos", "chip on wafer", "advanced packaging"],
            "Advanced nodes": ["3nm", "2nm", "n3", "n2", "advanced node", "process node"],
            "Geopolitical risk": ["geopolitical", "china", "taiwan", "trade war", "tariff", "export control"],
            "Competition": ["competition", "competitor", "market share loss", "intel", "samsung"],
            "CapEx pressure": ["capex", "capital expenditure", "spending", "investment"],
            "Demand recovery": ["demand recovery", "inventory", "restocking", "cycle rebound"],
            "Valuation": ["valuation", "premium", "multiple", "expensive", "p/e", "p/b"],
            "Macro uncertainty": ["macro", "inflation", "rate", "economy", "recession"],
            "Market share gains": ["market share", "share gain", "win", "leadership"],
        }
        text_lower = text.lower()
        for theme, kws in keywords.items():
            if any(kw in text_lower for kw in kws):
                return theme
        return "Other"
