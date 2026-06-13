import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.config import settings
from backend.db.session import init_db
from backend.api.routes import router as api_router

# Setup basic logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI 投資研究情報平台後端 API，支援 PDF 解析、評等共識分析、與雙軌 RAG 問答功能。",
    version="1.0"
)

# Configure CORS Middleware
# Allows request sharing between backend (typically port 8000) and frontend (Next.js port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development we allow all; restrict to frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database tables
@app.on_event("startup")
def on_startup():
    logger.info("正在初始化資料庫與資料表...")
    try:
        init_db()
        logger.info("資料表初始化完成。")
    except Exception as e:
        logger.error(f"資料庫初始化失敗: {str(e)}")

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    # Start uvicorn server on port 8000
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
