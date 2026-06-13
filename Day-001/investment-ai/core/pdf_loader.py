import hashlib
from pathlib import Path

import pdfplumber


class PDFLoader:
    def load(self, file_path: str | Path) -> dict:
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"PDF not found: {file_path}")

        raw_text = ""
        pages = 0
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    raw_text += text + "\n"
                pages += 1

        file_hash = hashlib.sha256(raw_text.encode()).hexdigest()
        metadata = self._parse_filename(file_path)

        return {
            "raw_text": raw_text.strip(),
            "pages": pages,
            "file_name": file_path.name,
            "file_hash": file_hash,
            "file_path": str(file_path),
            **metadata,
        }

    def _parse_filename(self, file_path: Path) -> dict:
        stem = file_path.stem
        parts = stem.split("_")
        ticker = parts[0] if len(parts) > 0 else ""
        broker = "_".join(parts[1:]) if len(parts) > 1 else ""
        return {"ticker": ticker, "broker": broker}

    def scan_folder(self, folder_path: str | Path) -> list[Path]:
        folder = Path(folder_path)
        if not folder.exists():
            return []
        return sorted(folder.glob("*.pdf"))
