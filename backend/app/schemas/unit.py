from pydantic import BaseModel
from typing import Literal


UnitType = Literal["1BHK", "2BHK", "3BHK", "STUDIO", "SHOP", "OFFICE"]
UnitStatus = Literal["VACANT", "OCCUPIED", "MAINTENANCE"]


class CurrentTenantSummary(BaseModel):
    id: str
    full_name: str
    phone: str


class CreateUnitRequest(BaseModel):
    unit_number: str
    floor: int | None = None
    area_sqft: float | None = None
    unit_type: UnitType
    monthly_rent: float
    deposit_amount: float
    amenities: list[str] | None = None


class UpdateUnitRequest(BaseModel):
    unit_number: str | None = None
    floor: int | None = None
    area_sqft: float | None = None
    unit_type: UnitType | None = None
    monthly_rent: float | None = None
    deposit_amount: float | None = None
    amenities: list[str] | None = None


class UnitResponse(BaseModel):
    id: str
    property_id: str
    unit_number: str
    floor: int | None
    area_sqft: float | None
    unit_type: str
    monthly_rent: float
    deposit_amount: float
    status: str
    amenities: list[str]
    current_tenant: CurrentTenantSummary | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}
