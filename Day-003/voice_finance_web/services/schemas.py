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
    text: str = Field(..., min_length=1, max_length=500, description="語音或文字輸入")
    current_date: str = Field(
        default="2026-06-13",
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="YYYY-MM-DD 格式基準日期",
    )


class InvoiceQRInput(BaseModel):
    qr_string: str = Field(
        ..., min_length=29, max_length=200,
        description="台灣電子發票左側 QR Code 原始字串",
    )


class TransactionPatchInput(BaseModel):
    category: Optional[str] = Field(default=None, max_length=20)
    sub_category: Optional[str] = Field(default=None, max_length=20)
    payment_method: Optional[str] = Field(default=None, max_length=30)
    amount: Optional[float] = Field(default=None, gt=0, le=99999999)
    merchant: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = Field(default=None, max_length=200)
    date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    type: Optional[str] = Field(default=None, pattern=r"^(expense|income)$")
    items: Optional[List[str]] = None
