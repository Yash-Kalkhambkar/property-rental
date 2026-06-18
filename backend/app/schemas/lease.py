from pydantic import BaseModel, model_validator
from datetime import date
from typing import Literal

LeaseStatus = Literal["ACTIVE", "EXPIRED", "TERMINATED"]


class CreateLeaseRequest(BaseModel):
    unit_id: str
    tenant_id: str
    start_date: date
    end_date: date
    monthly_rent: float
    deposit_paid: float
    rent_due_day: int = 1
    notes: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        if not (1 <= self.rent_due_day <= 28):
            raise ValueError("rent_due_day must be between 1 and 28")
        return self


class UpdateLeaseRequest(BaseModel):
    notes: str | None = None
    end_date: date | None = None


class TerminateLeaseRequest(BaseModel):
    reason: str
    termination_date: date


class UnitSummary(BaseModel):
    id: str
    unit_number: str
    property_name: str
    property_id: str


class TenantSummary(BaseModel):
    id: str
    full_name: str
    phone: str
    email: str | None


class PaymentsSummary(BaseModel):
    total_due: float
    total_paid: float
    overdue_amount: float


class LeaseResponse(BaseModel):
    id: str
    unit_id: str
    tenant_id: str
    unit: UnitSummary
    tenant: TenantSummary
    start_date: str
    end_date: str
    monthly_rent: float
    deposit_paid: float
    rent_due_day: int
    status: str
    agreement_url: str | None
    notes: str | None
    payments_summary: PaymentsSummary
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}
