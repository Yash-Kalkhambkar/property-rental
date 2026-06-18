from pydantic import BaseModel
from typing import Literal


PropertyType = Literal["RESIDENTIAL", "COMMERCIAL"]


class CreatePropertyRequest(BaseModel):
    name: str
    address_line: str
    city: str
    state: str
    pincode: str
    property_type: PropertyType
    total_units: int


class UpdatePropertyRequest(BaseModel):
    name: str | None = None
    address_line: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    property_type: PropertyType | None = None
    total_units: int | None = None


class PropertyResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    address_line: str
    city: str
    state: str
    pincode: str
    property_type: str
    total_units: int
    occupied_units: int
    monthly_revenue: float
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class PropertyDetailResponse(PropertyResponse):
    """Property response with embedded units list."""

    units: list = []  # Will be populated with UnitResponse items
