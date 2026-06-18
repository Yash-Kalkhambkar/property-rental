from pydantic import BaseModel
from typing import Literal

PaymentStatus = Literal["PENDING", "PAID", "PARTIAL", "OVERDUE"]
PaymentMethod = Literal["CASH", "UPI", "BANK_TRANSFER", "CHEQUE"]


class CreatePaymentRequest(BaseModel):
    lease_id: str
    amount_due: float
    amount_paid: float
    due_date: str  # YYYY-MM-DD
    paid_date: str | None = None
    payment_method: PaymentMethod | None = None
    reference_number: str | None = None
    notes: str | None = None


class UpdatePaymentRequest(BaseModel):
    amount_due: float | None = None
    amount_paid: float | None = None
    due_date: str | None = None
    paid_date: str | None = None
    payment_method: PaymentMethod | None = None
    reference_number: str | None = None
    notes: str | None = None


class PaymentResponse(BaseModel):
    id: str
    lease_id: str
    amount_due: float
    amount_paid: float
    due_date: str
    paid_date: str | None
    payment_method: str | None
    reference_number: str | None
    status: str
    notes: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}
