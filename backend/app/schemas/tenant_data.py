from __future__ import annotations

from pydantic import BaseModel


class UnitForTenant(BaseModel):
    """Unit details visible to a tenant."""

    unit_number: str
    unit_type: str
    floor: int | None = None
    area_sqft: float | None = None


class LeaseWithDetails(BaseModel):
    """Lease record with associated unit and property information."""

    # Lease fields
    id: str
    start_date: str
    end_date: str
    monthly_rent: float
    deposit_paid: float
    rent_due_day: int
    status: str

    # Unit fields
    unit_number: str
    unit_type: str

    # Property fields
    property_name: str
    property_address: str

    model_config = {"from_attributes": True}


class PaymentWithLease(BaseModel):
    """Payment record with associated lease reference."""

    # Payment fields
    id: str
    amount_due: float
    amount_paid: float
    due_date: str
    paid_date: str | None = None
    status: str
    payment_method: str | None = None

    # Lease reference
    lease_id: str
    unit_number: str

    model_config = {"from_attributes": True}


class PropertyForTenant(BaseModel):
    """Property details with owner-private fields excluded."""

    id: str
    name: str
    address_line: str
    city: str
    state: str
    pincode: str
    property_type: str
    units: list[UnitForTenant]

    model_config = {"from_attributes": True}


class PaymentSummary(BaseModel):
    """Lightweight payment record for dashboard display."""

    id: str
    amount_due: float
    due_date: str
    status: str
    unit_number: str


class TenantDashboard(BaseModel):
    """Aggregated dashboard data for the tenant's home screen."""

    active_leases_count: int
    total_amount_due: float
    upcoming_payments: list[PaymentSummary]
    active_lease_end_dates: list[str]
