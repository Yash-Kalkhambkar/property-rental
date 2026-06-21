"""
Unit tests for the tenant authentication service.

Tests cover:
  - Successful login (returns TokenResponse, sets cookie)
  - Login with wrong email (401)
  - Login with wrong password (401)
  - Token refresh with expired/invalid cookie (401)
  - Password change with wrong current password (401)
  - Owner reset password for tenant they don't own (404)
"""
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.core.security import hash_password


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_tenant(
    tenant_id: str = "tenant-uuid-1",
    owner_id: str = "owner-uuid-1",
    email: str = "alice@example.com",
    password: str = "ValidPass1!",
) -> MagicMock:
    """Create a mock Tenant with a real bcrypt hash for the given password."""
    tenant = MagicMock()
    tenant.id = tenant_id
    tenant.owner_id = owner_id
    tenant.email = email
    tenant.password_hash = hash_password(password)
    tenant.full_name = "Alice Tester"
    tenant.phone = "555-0100"
    tenant.created_at = None
    return tenant


def _make_owner(owner_id: str = "owner-uuid-1") -> MagicMock:
    owner = MagicMock()
    owner.id = owner_id
    return owner


# ---------------------------------------------------------------------------
# 1. test_tenant_login_success
# ---------------------------------------------------------------------------

def test_tenant_login_success():
    """Successful login returns TokenResponse and sets the refresh cookie."""
    from app.services.tenant_auth_service import tenant_login

    password = "ValidPass1!"
    tenant = _make_tenant(password=password)

    # DB query returns our mock tenant
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = tenant

    # FastAPI Response mock — we inspect set_cookie calls
    response = MagicMock()

    result = tenant_login(db=db, email=tenant.email, password=password, response=response)

    # Should return a TokenResponse with an access_token
    from app.schemas.auth import TokenResponse
    assert isinstance(result, TokenResponse)
    assert result.access_token  # non-empty string
    assert result.token_type == "bearer"

    # Refresh cookie must have been set
    response.set_cookie.assert_called_once()
    call_kwargs = response.set_cookie.call_args.kwargs
    assert call_kwargs["key"] == "tenant_refresh_token"
    assert call_kwargs["httponly"] is True


# ---------------------------------------------------------------------------
# 2. test_tenant_login_wrong_email
# ---------------------------------------------------------------------------

def test_tenant_login_wrong_email():
    """Login with an email not in the DB raises HTTP 401."""
    from app.services.tenant_auth_service import tenant_login

    db = MagicMock()
    # Simulate no tenant found for that email
    db.query.return_value.filter.return_value.first.return_value = None

    response = MagicMock()

    with pytest.raises(HTTPException) as exc_info:
        tenant_login(db=db, email="nobody@example.com", password="anything", response=response)

    assert exc_info.value.status_code == 401


# ---------------------------------------------------------------------------
# 3. test_tenant_login_wrong_password
# ---------------------------------------------------------------------------

def test_tenant_login_wrong_password():
    """Login with correct email but wrong password raises HTTP 401."""
    from app.services.tenant_auth_service import tenant_login

    tenant = _make_tenant(password="CorrectPass1!")

    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = tenant

    response = MagicMock()

    with pytest.raises(HTTPException) as exc_info:
        tenant_login(db=db, email=tenant.email, password="WrongPass999!", response=response)

    assert exc_info.value.status_code == 401


# ---------------------------------------------------------------------------
# 4. test_tenant_refresh_expired_token
# ---------------------------------------------------------------------------

def test_tenant_refresh_expired_token():
    """Passing an invalid/expired token in the cookie raises HTTP 401."""
    from app.services.tenant_auth_service import tenant_refresh

    # Build a Request mock that returns a bad token from the cookie
    request = MagicMock()
    request.cookies.get.return_value = "this.is.not.a.valid.jwt"

    response = MagicMock()

    with pytest.raises(HTTPException) as exc_info:
        tenant_refresh(request=request, response=response)

    assert exc_info.value.status_code == 401


def test_tenant_refresh_missing_cookie():
    """Missing refresh cookie raises HTTP 401."""
    from app.services.tenant_auth_service import tenant_refresh

    request = MagicMock()
    request.cookies.get.return_value = None  # cookie absent

    response = MagicMock()

    with pytest.raises(HTTPException) as exc_info:
        tenant_refresh(request=request, response=response)

    assert exc_info.value.status_code == 401


# ---------------------------------------------------------------------------
# 5. test_tenant_change_password_wrong_current
# ---------------------------------------------------------------------------

def test_tenant_change_password_wrong_current():
    """Providing an incorrect current password during change raises HTTP 401."""
    from app.services.tenant_auth_service import change_tenant_password

    tenant = _make_tenant(password="CurrentPass1!")

    db = MagicMock()

    with pytest.raises(HTTPException) as exc_info:
        change_tenant_password(
            db=db,
            tenant=tenant,
            current_password="WrongCurrentPass!",
            new_password="NewValidPass1!",
        )

    assert exc_info.value.status_code == 401
    # DB commit must NOT have been called
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# 6. test_owner_reset_password_for_non_owned_tenant
# ---------------------------------------------------------------------------

def test_owner_reset_password_for_non_owned_tenant():
    """Owner resetting password for a tenant they don't own raises HTTP 404."""
    from app.services.tenant_auth_service import owner_reset_tenant_password

    # The tenant belongs to a different owner
    tenant = _make_tenant(owner_id="other-owner-uuid")
    owner = _make_owner(owner_id="owner-uuid-1")

    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = tenant

    with pytest.raises(HTTPException) as exc_info:
        owner_reset_tenant_password(db=db, owner=owner, tenant_id=tenant.id)

    assert exc_info.value.status_code == 404


def test_owner_reset_password_for_nonexistent_tenant():
    """Owner resetting password for a tenant that doesn't exist raises HTTP 404."""
    from app.services.tenant_auth_service import owner_reset_tenant_password

    owner = _make_owner()

    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        owner_reset_tenant_password(db=db, owner=owner, tenant_id="nonexistent-id")

    assert exc_info.value.status_code == 404
