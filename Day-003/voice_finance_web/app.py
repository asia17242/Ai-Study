import os
import sys
import json
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.schemas import (
    TransactionResponse, VoiceInput, InvoiceQRInput, TransactionPatchInput,
)
from services.gemini_parser import init_genai_client, parse_with_gemini

load_dotenv()

app = FastAPI(title="Voice Finance Web App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

genai_config = init_genai_client()


@app.post("/api/parse", response_model=TransactionResponse)
async def parse_voice(input: VoiceInput):
    try:
        result = parse_with_gemini(genai_config, input.text, input.current_date)
        return TransactionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/parse-invoice-qr", response_model=TransactionResponse)
async def parse_invoice_qr(input: InvoiceQRInput):
    qr = input.qr_string.strip()
    print(f"[INVOICE QR] Raw input length: {len(qr)}")
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
        print(f"[INVOICE QR] Invoice: {invoice_number}, Date: {date_str}, Amount: {amount}")
        return TransactionResponse(
            amount=float(amount), category="日常用品",
            description=f"電子發票 {invoice_number}", type="expense",
            date=date_str, merchant="電子發票", payment_method="載具",
            items=[], sub_category="其他",
            is_recurring=False, day_of_period=None, recurring_frequency=None,
        )
    except Exception as e:
        print(f"[INVOICE QR] Parse error: {e}")
        raise HTTPException(status_code=400, detail=f"QR 解析錯誤: {str(e)}")


@app.patch("/api/transactions/{tx_id}")
async def patch_transaction(tx_id: str, input: TransactionPatchInput):
    update_data = input.model_dump(exclude_none=True)
    print(f"[PATCH] tx_id={tx_id}, fields={list(update_data.keys())}")
    return {"status": "ok", "tx_id": tx_id, "updated_fields": update_data}


static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", response_class=FileResponse)
async def read_root():
    return FileResponse(os.path.join(static_dir, "index.html"))


@app.get("/api/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
