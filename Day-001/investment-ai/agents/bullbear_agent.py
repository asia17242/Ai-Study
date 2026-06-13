from collections import Counter


class BullBearAgent:
    def __init__(self):
        self.theme_keywords = {
            "AI / Data Center": ["ai", "artificial intelligence", "datacenter", "data center", "cloud", "hpc", "llm", "gpu"],
            "CoWoS / Packaging": ["cowos", "advanced packaging", "chip on wafer", "silicon interposer", "3dic"],
            "Process Leadership": ["3nm", "2nm", "n3", "n2", "process node", "technology leadership", "advanced node"],
            "Demand Recovery": ["demand recovery", "inventory correction", "restocking", "cycle trough", "upcycle"],
            "Market Share": ["market share", "share gain", "win", "dominant", "leadership"],
            "Geopolitical Risk": ["geopolitical", "china", "taiwan", "tariff", "export control", "trade war", "sic"],
            "Competition": ["competition", "competitor", "intel", "samsung", "alternative"],
            "CapEx / Margin": ["capex", "capital expenditure", "margin", "gross margin", "opex", "spending"],
            "Valuation": ["valuation", "premium", "expensive", "overvalued", "multiple expansion", "p/e"],
        }

    def classify_points(self, points: list[str]) -> list[dict]:
        classified = []
        for point in points:
            category = self._classify(point)
            classified.append({
                "description": point,
                "category": category,
            })
        return classified

    def synthesize(self, bull_points: list[dict], bear_points: list[dict]) -> dict:
        bull_cats = Counter(p.get("category", "Other") for p in bull_points)
        bear_cats = Counter(p.get("category", "Other") for p in bear_points)

        return {
            "bull_summary": self._summarize_themes(bull_cats),
            "bear_summary": self._summarize_themes(bear_cats),
            "bull_categories": dict(bull_cats.most_common()),
            "bear_categories": dict(bear_cats.most_common()),
            "total_bull": len(bull_points),
            "total_bear": len(bear_points),
        }

    def _classify(self, text: str) -> str:
        text_lower = text.lower()
        for theme, keywords in self.theme_keywords.items():
            if any(kw in text_lower for kw in keywords):
                return theme
        return "Other"

    def _summarize_themes(self, categories: Counter) -> str:
        if not categories:
            return "No significant themes identified."
        top = categories.most_common(3)
        return "; ".join(f"{theme} ({count}x)" for theme, count in top)
