import re


class TextParser:
    def extract_metadata(self, raw_text: str) -> dict:
        metadata = {}

        ticker_match = re.search(r"\((\d{4})\)", raw_text)
        if ticker_match:
            metadata["ticker"] = ticker_match.group(1)

        date_match = re.search(
            r"(\d{4}[-/]\d{1,2}[-/]\d{1,2})", raw_text
        )
        if date_match:
            metadata["date"] = date_match.group(1)

        company_match = re.search(
            r"([A-Z][A-Za-z\s]+(?:Inc|Corp|Ltd|Co|Technology|Semiconductor))",
            raw_text[:1000]
        )
        if company_match:
            metadata["company"] = company_match.group(1).strip()

        rating_patterns = [
            r"(rating|recommendation|view)[:\s]+([A-Za-z\s\-]+)",
            r"([A-Za-z\-]+)\s*(?:rating|recommendation|view)",
        ]
        for pattern in rating_patterns:
            match = re.search(pattern, raw_text[:2000], re.IGNORECASE)
            if match:
                rating_str = match.group(2) if match.lastindex and match.lastindex >= 2 else match.group(1)
                metadata["rating_raw"] = rating_str.strip()
                break

        tp_match = re.search(
            r"(?:target\s*price|price\s*target|PT)[:\s]*[NT$]*\s*([\d,]+(?:\.\d+)?)",
            raw_text[:3000],
            re.IGNORECASE
        )
        if tp_match:
            metadata["target_price_raw"] = tp_match.group(1).replace(",", "")

        return metadata

    def extract_sections(self, raw_text: str) -> dict:
        sections = {}
        section_headers = [
            r"(executive\s*summary)",
            r"(investment\s*thesis)",
            r"(company\s*overview)",
            r"(financial\s*outlook|financials|estimates)",
            r"(valuation)",
            r"(risks|risk\s*factors)",
            r"(rating|recommendation)",
            r"(price\s*target)",
        ]
        for pattern in section_headers:
            matches = list(re.finditer(pattern, raw_text, re.IGNORECASE))
            if matches:
                for match in matches:
                    start = match.start()
                    header = match.group(1).lower().replace(" ", "_")
                    end = len(raw_text)
                    for next_pattern in section_headers:
                        next_matches = list(
                            re.finditer(next_pattern, raw_text[match.end():], re.IGNORECASE)
                        )
                        if next_matches:
                            candidate = match.end() + next_matches[0].start()
                            if candidate < end and candidate > start + len(header):
                                end = candidate
                    sections[header] = raw_text[start:end].strip()
        return sections

    def clean_text(self, raw_text: str) -> str:
        text = re.sub(r"\s+", " ", raw_text)
        text = re.sub(r"[^\S\n]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()
