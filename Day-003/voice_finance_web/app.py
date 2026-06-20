import os
import sys
import time
import logging
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.schemas import (
    TransactionResponse, VoiceInput, InvoiceQRInput, TransactionPatchInput,
)
from services.gemini_parser import init_genai_client, parse_with_gemini

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

is_production = os.getenv("ENV") == "production"

# ── Lifespan (#5) ──────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.genai_config = init_genai_client()
    logger.info("GenAI client initialized: %s", app.state.genai_config.get("client_type"))
    yield

app = FastAPI(
    title="Voice Finance Web App",
    lifespan=lifespan,
    docs_url=None if is_production else "/docs",          # #9
    redoc_url=None if is_production else "/redoc",
    openapi_url=None if is_production else "/openapi.json",
)

# ── CORS — fix wildcard + credentials (#1) ─────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000",
                   "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

app.add_middleware(GZipMiddleware, minimum_size=500)       # #6

# ── Rate Limiting (#3) ─────────────────────────────────────────────────
_request_counts: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = 30  # requests per minute per IP

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        _request_counts[client_ip] = [t for t in _request_counts[client_ip] if now - t < 60]
        if len(_request_counts[client_ip]) >= RATE_LIMIT:
            return JSONResponse(status_code=429, content={"detail": "Too many requests"})
        _request_counts[client_ip].append(now)
    return await call_next(request)

# ── Request Timing (#7) ────────────────────────────────────────────────
@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = round(time.perf_counter() - start, 4)
    response.headers["X-Process-Time"] = str(elapsed)
    return response

# ── Security Headers (#22) ─────────────────────────────────────────────
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ── API Router (#8) ────────────────────────────────────────────────────
api_router = APIRouter(prefix="/api")


@api_router.post("/parse", response_model=TransactionResponse)
async def parse_voice(input: VoiceInput, request: Request):
    try:
        result = parse_with_gemini(
            request.app.state.genai_config, input.text, input.current_date,
        )
        return TransactionResponse(**result)
    except Exception as e:
        logger.exception("Parse error for input: %s", input.text[:50])  # #4
        raise HTTPException(status_code=500, detail="Internal server error")


@api_router.post("/parse-invoice-qr", response_model=TransactionResponse)
async def parse_invoice_qr(input: InvoiceQRInput):
    qr = input.qr_string.strip()
    logger.info("[INVOICE QR] Raw input length: %d", len(qr))
    try:
        invoice_number = qr[:10]
        taiwan_year = qr[10:13]
        date_mmdd = qr[13:17]
        hex_amount = qr[21:29]
        western_year = int(taiwan_year) + 1911
        mm = date_mmdd[:2]
        dd = date_mmdd[2:4]
        date_str = f"{western_year}-{mm}-{dd}"
        amount = int(hex_amount, 16)
        logger.info("[INVOICE QR] Invoice: %s, Date: %s, Amount: %d", invoice_number, date_str, amount)
        return TransactionResponse(
            amount=float(amount), category="日常用品",
            description=f"電子發票 {invoice_number}", type="expense",
            date=date_str, merchant="電子發票", payment_method="載具",
            items=[], sub_category="其他",
            is_recurring=False, day_of_period=None, recurring_frequency=None,
        )
    except Exception as e:
        logger.exception("[INVOICE QR] Parse error")
        raise HTTPException(status_code=400, detail="QR 解析錯誤，請確認格式是否正確")


@api_router.patch("/transactions/{tx_id}")
async def patch_transaction(tx_id: str, input: TransactionPatchInput):
    update_data = input.model_dump(exclude_none=True)
    logger.info("[PATCH] tx_id=%s, fields=%s", tx_id, list(update_data.keys()))
    return {"status": "ok", "tx_id": tx_id, "updated_fields": update_data}


@api_router.get("/health")
async def health(request: Request):
    checks = {"api": "ok"}
    try:
        cfg = getattr(request.app.state, "genai_config", None)
        checks["gemini"] = cfg.get("client_type", "unknown") if cfg else "not initialized"
    except Exception:
        checks["gemini"] = "error"
    return {"status": "ok", "checks": checks}


app.include_router(api_router)

# ── Static files ────────────────────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", response_class=FileResponse)
async def read_root():
    return FileResponse(os.path.join(static_dir, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
