from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class PaymentCreate(BaseModel):
    card_id: int = Field(gt=0)
    amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2,
    )


class PaymentResponse(BaseModel):
    id: int
    user_id: int
    card_id: int
    amount: Decimal
    status: PaymentStatus
    transaction_reference: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }