import re


class FinancialAgent:
    def extract_metrics(self, raw_text: str, extracted_data: dict) -> list[dict]:
        metrics = []

        figures = re.findall(
            r"(?:revenue|sales|eps|net income|profit|margin|roa|roe|book value|dividend)"
            r"[:\s]*[NT$]*\s*([\d,]+(?:\.\d+)?)",
            raw_text[:5000],
            re.IGNORECASE
        )

        for fig in figures[:10]:
            try:
                value = float(fig.replace(",", ""))
                metrics.append({
                    "metric_name": "financial_highlight",
                    "metric_value": value,
                })
            except ValueError:
                continue

        if extracted_data.get("financial_highlights"):
            for key, value in extracted_data["financial_highlights"].items():
                if isinstance(value, (int, float)):
                    metrics.append({
                        "metric_name": str(key),
                        "metric_value": float(value),
                    })

        return metrics

    def extract_estimates(self, raw_text: str) -> dict:
        estimates = {}
        patterns = {
            "fy_revenue": r"(?:fy\d{4}|20\d{2})\s*(?:revenue|sales)[:\s]*[NT$]*\s*([\d,]+(?:\.\d+)?)",
            "fy_eps": r"(?:fy\d{4}|20\d{2})\s*(?:eps|earnings per share)[:\s]*[NT$]*\s*([\d,]+(?:\.\d+)?)",
            "target_pe": r"(?:target\s*|forward\s*)?p/e[:\s]*([\d,.]+)",
        }
        for key, pattern in patterns.items():
            match = re.search(pattern, raw_text[:5000], re.IGNORECASE)
            if match:
                try:
                    estimates[key] = float(match.group(1).replace(",", ""))
                except ValueError:
                    continue
        return estimates
