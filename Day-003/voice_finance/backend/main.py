from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from gemini_service import GeminiService

app = FastAPI(title="Voice Finance Backend")
gemini = GeminiService()

class VoiceInput(BaseModel):
    text: str
    current_date: str = "2026-06-13"

class TransactionResponse(BaseModel):
    amount: float
    category: str
    description: str
    type: str

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
