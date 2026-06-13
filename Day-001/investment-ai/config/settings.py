import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"
RAW_PDFS_DIR = DATA_DIR / "raw_pdfs"
PROCESSED_DIR = DATA_DIR / "processed"
EMBEDDINGS_DIR = DATA_DIR / "embeddings"
OUTPUT_DIR = BASE_DIR / "outputs"
REPORTS_DIR = OUTPUT_DIR / "reports"

os.makedirs(RAW_PDFS_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

POSTGRES_DSN = os.getenv(
    "POSTGRES_DSN",
    "postgresql://postgres:postgres@localhost:5432/investment_ai"
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))
TOP_K = int(os.getenv("TOP_K", "5"))

RATING_MAP = {
    "overweight": "BUY",
    "outperform": "BUY",
    "buy": "BUY",
    "accumulate": "BUY",
    "add": "BUY",
    "neutral": "HOLD",
    "hold": "HOLD",
    "equal-weight": "HOLD",
    "equal weight": "HOLD",
    "market perform": "HOLD",
    "underperform": "SELL",
    "underweight": "SELL",
    "sell": "SELL",
    "reduce": "SELL",
    # Chinese Ratings
    "買進": "BUY",
    "買入": "BUY",
    "強力買進": "BUY",
    "加碼": "BUY",
    "增加持股": "BUY",
    "優於大盤": "BUY",
    "中立": "HOLD",
    "持有": "HOLD",
    "觀望": "HOLD",
    "區間操作": "HOLD",
    "賣出": "SELL",
    "減碼": "SELL",
    "降低持股": "SELL",
    "避險": "SELL",
    "劣於大盤": "SELL",
}
