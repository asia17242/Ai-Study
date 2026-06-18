from typing import List, Optional
from pydantic import BaseModel, Field


class TransactionResponse(BaseModel):
    amount: float = Field(description="交易金額")
    category: str = Field(description="交易類別")
    description: str = Field(description="交易描述")
    type: str = Field(description="expense 或 income")
    date: str = Field(description="YYYY-MM-DD")
    merchant: Optional[str] = Field(default="未知", description="商家名稱")
    payment_method: Optional[str] = Field(default="現金", description="付款方式")
    items: Optional[List[str]] = Field(default=[], description="商品細項")
    sub_category: Optional[str] = Field(default="其他", description="二級分類")
    is_recurring: Optional[bool] = Field(default=False, description="是否為定期交易")
    day_of_period: Optional[int] = Field(default=None, description="定期執行日")
    recurring_frequency: Optional[str] = Field(default=None, description="定期頻率")


class VoiceInput(BaseModel):
    text: str
    current_date: str = "2026-06-13"


class InvoiceQRInput(BaseModel):
    qr_string: str = Field(description="台灣電子發票左側 QR Code 原始字串")


class TransactionPatchInput(BaseModel):
    category: Optional[str] = None
    sub_category: Optional[str] = None
    payment_method: Optional[str] = None
    amount: Optional[float] = None
    merchant: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    type: Optional[str] = None
    items: Optional[List[str]] = None
