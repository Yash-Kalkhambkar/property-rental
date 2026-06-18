from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_properties: int
    total_units: int
    occupied_units: int
    vacant_units: int
    occupancy_rate: float  # 0–100


class DashboardFinancials(BaseModel):
    current_month_expected: float
    current_month_collected: float
    overdue_amount: float
    overdue_count: int


class ExpiringLease(BaseModel):
    lease_id: str
    tenant_name: str
    unit: str
    end_date: str
    days_remaining: int


class OverduePayment(BaseModel):
    payment_id: str
    tenant_name: str
    unit: str
    overdue_days: int
    amount: float


class DashboardAlerts(BaseModel):
    leases_expiring_soon: list[ExpiringLease]
    overdue_payments: list[OverduePayment]


class DashboardResponse(BaseModel):
    summary: DashboardSummary
    financials: DashboardFinancials
    alerts: DashboardAlerts
