from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from gemini_service import GeminiService
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI(title="Voice Finance Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", response_class=FileResponse)
async def read_index():
    return FileResponse(os.path.join(static_dir, "index.html"))


gemini = GeminiService()


class VoiceInput(BaseModel):
    text: str
    current_date: str = "2026-06-13"


class TransactionResponse(BaseModel):
    amount: float = Field(description="交易金額")
    category: str = Field(description="交易類別")
    description: str = Field(description="交易描述")
    type: str = Field(description="expense 或 income")
    date: str = Field(description="YYYY-MM-DD")
    merchant: Optional[str] = Field(default="未知", description="商家名稱")
    payment_method: Optional[str] = Field(default="現金", description="付款方式")
    tags: Optional[List[str]] = Field(default=[], description="標籤")
    raw_text: Optional[str] = Field(default="", description="原始輸入")
    sub_category: Optional[str] = Field(default="其他", description="二級分類")
    items: Optional[List[str]] = Field(default=[], description="商品細項")


@app.post("/api/parse", response_model=TransactionResponse)
async def parse_voice(input: VoiceInput):
    try:
        result = gemini.parse_transaction(input.text, input.current_date)
        return TransactionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health():
    return {"status": "ok"}
