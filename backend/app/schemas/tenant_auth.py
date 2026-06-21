from pydantic import BaseModel, EmailStr, field_validator


class TenantLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TenantProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str | None
    created_at: str

    model_config = {"from_attributes": True}


class TenantPasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class TemporaryPasswordResponse(BaseModel):
    temporary_password: str
