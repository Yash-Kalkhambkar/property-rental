"""
Property-based tests for role-based access control (RBAC) enforcement.

This module verifies that the authorization dependencies correctly reject
tokens with the wrong role, regardless of the user ID.
"""
import uuid
import pytest
from unittest.mock import MagicMock, patch
from hypothesis import given, strategies as st, settings
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt

from app.core.security import create_access_token, create_refresh_token
from app.core.config import settings as app_settings
from app.dependencies.auth import get_current_tenant, get_current_owner
from app.services.tenant_auth_service import tenant_refresh


# ── Property 7: Role-Based Authorization Enforcement ──────────────────────

# Feature: tenant-login-rbac, Property 7: Role-Based Authorization Enforcement
# **Validates: Requirements 7.2, 7.5, 13.1, 13.2**

# Strategy for valid user IDs (UUIDs as strings)
user_ids = st.uuids().map(str)


@given(user_id=user_ids)
@settings(deadline=None)
def test_owner_token_rejected_by_get_current_tenant(user_id):
    """
    For any access token with role 'OWNER', calling get_current_tenant
    SHALL return HTTP 403 Forbidden.

    The role check fires before any DB query, so a mock DB session is
    sufficient — it should never be called.

    **Validates: Requirements 7.2, 13.1**
    """
    # Generate an OWNER token for this user
    token = create_access_token(user_id=user_id, role="OWNER")

    # Wrap the raw token in an HTTPAuthorizationCredentials object
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    # Mock DB — must not be touched for a role-mismatch case
    mock_db = MagicMock()

    # The function must raise a 403
    with pytest.raises(HTTPException) as exc_info:
        get_current_tenant(credentials=credentials, db=mock_db)

    assert exc_info.value.status_code == 403, (
        f"Expected 403 for OWNER token on get_current_tenant, "
        f"got {exc_info.value.status_code} (user_id={user_id})"
    )

    # Confirm the DB was never queried (role check is first)
    mock_db.query.assert_not_called()


@given(user_id=user_ids)
@settings(deadline=None)
def test_tenant_token_rejected_by_get_current_owner(user_id):
    """
    For any access token with role 'TENANT', calling get_current_owner
    SHALL return HTTP 403 Forbidden.

    The role check fires before any DB query, so a mock DB session is
    sufficient — it should never be called.

    **Validates: Requirements 7.5, 13.2**
    """
    # Generate a TENANT token for this user
    token = create_access_token(user_id=user_id, role="TENANT")

    # Wrap the raw token in an HTTPAuthorizationCredentials object
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    # Mock DB — must not be touched for a role-mismatch case
    mock_db = MagicMock()

    # The function must raise a 403
    with pytest.raises(HTTPException) as exc_info:
        get_current_owner(credentials=credentials, db=mock_db)

    assert exc_info.value.status_code == 403, (
        f"Expected 403 for TENANT token on get_current_owner, "
        f"got {exc_info.value.status_code} (user_id={user_id})"
    )

    # Confirm the DB was never queried (role check is first)
    mock_db.query.assert_not_called()


# ── Property 8: Token Extraction Preserves Identity ───────────────────────

# Feature: tenant-login-rbac, Property 8: Token Extraction Preserves Identity
# **Validates: Requirements 7.1, 7.3**


@given(user_id=st.uuids().map(str))
@settings(deadline=None)
def test_token_extraction_preserves_identity(user_id):
    """
    For any valid tenant ID, if an access token is generated for that tenant
    and then passed to get_current_tenant, the returned Tenant model instance
    SHALL have `id` equal to the original tenant ID.

    **Validates: Requirements 7.1, 7.3**
    """
    # Generate a TENANT access token for this user_id
    token = create_access_token(user_id=user_id, role="TENANT")

    # Wrap the raw token in an HTTPAuthorizationCredentials object
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    # Mock the DB session so that querying for the tenant returns a mock
    # object whose .id attribute equals the original user_id
    mock_tenant = MagicMock()
    mock_tenant.id = user_id

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = mock_tenant

    # Call get_current_tenant — should succeed (role matches, DB returns the tenant)
    result = get_current_tenant(credentials=credentials, db=mock_db)

    # The returned object's .id must equal the original tenant ID
    assert result.id == user_id, (
        f"Expected returned tenant id={user_id!r}, got {result.id!r}"
    )


# ── Property 6: Token Refresh Preserves Identity and Role ─────────────────

# Feature: tenant-login-rbac, Property 6: Token Refresh Preserves Identity and Role
# **Validates: Requirements 5.2, 5.3**


@given(user_id=st.uuids().map(str))
@settings(deadline=None)
def test_token_refresh_preserves_identity_and_role(user_id):
    """
    For any valid refresh token with role 'TENANT', when the token is used
    to refresh, the newly generated access token SHALL have the same user ID
    and role as the original refresh token.

    **Validates: Requirements 5.2, 5.3**
    """
    # Create a valid TENANT refresh token for this user_id
    refresh_token = create_refresh_token(user_id=user_id, role="TENANT")

    # Mock the incoming request so it returns our refresh token from the cookie
    mock_request = MagicMock()
    mock_request.cookies.get.return_value = refresh_token

    # Mock the response object (cookie setter — we don't need to inspect it)
    mock_response = MagicMock()

    # Call the refresh endpoint logic
    token_response = tenant_refresh(request=mock_request, response=mock_response)

    # Decode the returned access token and verify identity and role are preserved
    payload = jwt.decode(
        token_response.access_token,
        app_settings.SECRET_KEY,
        algorithms=[app_settings.ALGORITHM],
    )

    assert payload["sub"] == user_id, (
        f"Expected sub={user_id!r} in refreshed access token, got {payload['sub']!r}"
    )
    assert payload["role"] == "TENANT", (
        f"Expected role='TENANT' in refreshed access token, got {payload['role']!r}"
    )
    assert payload["type"] == "access", (
        f"Expected token type 'access', got {payload['type']!r}"
    )
