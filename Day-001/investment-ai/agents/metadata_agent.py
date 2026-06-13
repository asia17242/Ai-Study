from core.pdf_loader import PDFLoader
from core.text_parser import TextParser
from core.extractor import Extractor
from core.normalizer import Normalizer


class MetadataAgent:
    def __init__(self):
        self.pdf_loader = PDFLoader()
        self.text_parser = TextParser()
        self.extractor = Extractor()
        self.normalizer = Normalizer()

    def process(self, file_path: str) -> dict:
        pdf_data = self.pdf_loader.load(file_path)

        extracted = self.extractor.extract(
            pdf_data["raw_text"], pdf_data["file_name"]
        )

        normalized = self.normalizer.normalize(extracted)

        return {
            "pdf_metadata": {
                "file_name": pdf_data["file_name"],
                "file_hash": pdf_data["file_hash"],
                "pages": pdf_data["pages"],
                "file_path": pdf_data["file_path"],
            },
            "stock_info": {
                "ticker": normalized["ticker"],
                "company": normalized.get("company", ""),
                "broker": normalized["broker"],
                "report_date": normalized.get("date", ""),
            },
            "rating_info": {
                "rating_raw": normalized.get("rating", ""),
                "rating_standard": normalized["rating_standard"],
                "target_price": normalized["target_price"],
                "currency": normalized.get("currency", "TWD"),
            },
            "bull_bear": {
                "bull_points": normalized.get("bull_points", []),
                "bear_points": normalized.get("bear_points", []),
            },
            "summary": normalized.get("summary", ""),
        }
