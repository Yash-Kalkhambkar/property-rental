from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_properties: int
    total_units: int
    total_tenants: int
    total_leases: int
    total_payments: int