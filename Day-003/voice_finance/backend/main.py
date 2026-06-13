from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
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

# Get absolute path to the static directory
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

# Mount static folder
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Serve index.html at root
@app.get("/", response_class=FileResponse)
async def read_index():
    return FileResponse(os.path.join(static_dir, "index.html"))

gemini = GeminiService()

class VoiceInput(BaseModel):

    text: str
    current_date: str = "2026-06-13"

class TransactionResponse(BaseModel):
    amount: float
    category: str
    description: str
    type: str
    date: str

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
