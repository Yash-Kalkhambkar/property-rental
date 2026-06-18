from pydantic import BaseModel
from typing import Literal

IdType = Literal["AADHAAR", "PAN", "PASSPORT", "DRIVING_LICENSE"]


class CreateTenantRequest(BaseModel):
    full_name: str
    email: str | None = None
    phone: str
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    id_type: IdType | None = None
    id_number: str | None = None
    notes: str | None = None


class UpdateTenantRequest(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    id_type: IdType | None = None
    id_number: str | None = None
    notes: str | None = None


class TenantResponse(BaseModel):
    id: str
    owner_id: str
    full_name: str
    email: str | None
    phone: str
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    id_type: str | None
    id_number: str | None
    id_document_url: str | None
    notes: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}
