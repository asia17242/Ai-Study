import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "AI 投資研究情報平台 (IRIP)"
    API_V1_STR: str = "/api"
    
    # Database Settings
    # Default to a local SQLite database for easy out-of-the-box local running
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./irip.db")
    
    # OpenAI Settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-large")  # 3072 dimensions
    
    # Storage Paths (aligned to workspace root /storage)
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    STORAGE_DIR: str = os.path.join(BASE_DIR, "storage")
    RAW_PDF_DIR: str = os.path.join(STORAGE_DIR, "raw_pdfs")
    PROCESSED_DIR: str = os.path.join(STORAGE_DIR, "processed")
    REPORTS_DIR: str = os.path.join(STORAGE_DIR, "reports")
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
os.makedirs(settings.RAW_PDF_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
