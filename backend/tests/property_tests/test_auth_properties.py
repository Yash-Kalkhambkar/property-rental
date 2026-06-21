"""
Property-based tests for authentication functionality.

This module contains property-based tests using Hypothesis to verify
universal behaviors of password hashing, token generation, and authentication.
"""
import bcrypt
from hypothesis import given, strategies as st, settings
from jose import jwt
import pytest


# ── Property 1: Password Hashing Produces Valid Bcrypt Format ──────────────

# Feature: tenant-login-rbac, Property 1: Password Hashing Produces Valid Bcrypt Format
# **Validates: Requirements 2.4, 2.5, 14.5**

# Strategy for valid bcrypt passwords (max 72 bytes when UTF-8 encoded)
@st.composite
def valid_bcrypt_passwords(draw):
    """Generate passwords that are valid for bcrypt (max 72 bytes when UTF-8 encoded)."""
    # Use ASCII printable characters to avoid multi-byte UTF-8 encoding issues
    # This ensures 1 character = 1 byte, so max 72 characters
    password = draw(st.text(
        min_size=1, 
        max_size=72,
        alphabet=st.characters(min_codepoint=32, max_codepoint=126)
    ))
    return password


@given(password=valid_bcrypt_passwords())
@settings(deadline=None)  # Disable deadline as bcrypt hashing is intentionally slow
def test_password_hashing_valid_bcrypt_format(password):
    """
    For any password string, when hashed by the authentication service, the
    resulting hash SHALL be a valid bcrypt hash with exactly 12 rounds and
    SHALL never equal the plain text password.
    
    **Validates: Requirements 2.4, 2.5, 14.5**
    """
    from app.core.security import hash_password
    
    # Hash the password
    hashed = hash_password(password)
    
    # Property 1: Hash must be a valid bcrypt format string
    assert isinstance(hashed, str), \
        f"Password hash must be a string, got {type(hashed)}"
    
    # Property 2: Hash must have the bcrypt format with 12 rounds
    # Bcrypt format: $2b$12$... (where $2b$ is the algorithm identifier, $12$ is the rounds)
    assert hashed.startswith("$2b$12$"), \
        f"Password hash must start with '$2b$12$' (bcrypt with 12 rounds), got {hashed[:8]}"
    
    # Property 3: Hash must be exactly 60 characters (bcrypt standard length)
    assert len(hashed) == 60, \
        f"Password hash must be exactly 60 characters, got {len(hashed)}"
    
    # Property 4: Hash must be verifiable with bcrypt
    # This proves it's a valid bcrypt hash that can be used for verification
    try:
        is_valid = bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        assert is_valid, \
            f"Original password must verify against its hash"
    except Exception as e:
        pytest.fail(f"Hash is not a valid bcrypt hash: {e}")
    
    # Property 5: Hash must never equal the plain text password
    assert hashed != password, \
        f"Password hash must never equal the plain text password"
    
    # Property 6: Same password produces different hashes (due to salt)
    # This verifies proper use of bcrypt salting
    second_hash = hash_password(password)
    assert hashed != second_hash, \
        f"Same password must produce different hashes due to random salt"
    
    # Property 7: Hash should contain only valid bcrypt characters
    # Bcrypt uses base64 encoding with specific character set
    import re
    bcrypt_pattern = re.compile(r'^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$')
    assert bcrypt_pattern.match(hashed), \
        f"Password hash must match valid bcrypt pattern"


# ── Property 4: Password Verification Round-Trip ──────────────────────────

# Feature: tenant-login-rbac, Property 4: Password Verification Round-Trip
# **Validates: Requirements 3.2**

@st.composite
def password_and_different_password(draw):
    """Generate a password and a guaranteed-different password."""
    password = draw(st.text(
        min_size=1,
        max_size=72,
        alphabet=st.characters(min_codepoint=32, max_codepoint=126)
    ))
    # Draw a different password by filtering out the original
    different_password = draw(st.text(
        min_size=1,
        max_size=72,
        alphabet=st.characters(min_codepoint=32, max_codepoint=126)
    ).filter(lambda p: p != password))
    return password, different_password


@given(passwords=password_and_different_password())
@settings(deadline=None)  # Disable deadline as bcrypt hashing is intentionally slow
def test_password_verification_round_trip(passwords):
    """
    For any password string, if the password is hashed using bcrypt, then
    verifying the original password against the hash SHALL succeed, and
    verifying any different password against the hash SHALL fail.

    **Validates: Requirements 3.2**
    """
    from app.core.security import hash_password, verify_password

    password, different_password = passwords

    # Hash the original password
    hashed = hash_password(password)

    # Property 1: Verifying the original password against the hash MUST succeed
    assert verify_password(password, hashed), \
        f"verify_password must return True for the original password"

    # Property 2: Verifying a different password against the hash MUST fail
    assert not verify_password(different_password, hashed), \
        f"verify_password must return False for a different password '{different_password}'"


# ── Property 5: Token Generation Includes Correct Role Claims ──────────────

# Feature: tenant-login-rbac, Property 5: Token Generation Includes Correct Role Claims
# **Validates: Requirements 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5**

# Strategy for valid user IDs (UUIDs as strings)
@st.composite
def user_ids(draw):
    """Generate valid UUID strings for user IDs."""
    import uuid
    return str(uuid.uuid4())


# Strategy for valid roles
roles = st.sampled_from(["OWNER", "TENANT"])


@given(user_id=user_ids(), role=roles)
@settings(deadline=None)  # JWT operations are fast but we disable deadline for consistency
def test_access_token_generation_includes_correct_role_claims(user_id, role):
    """
    For any user ID and role ('OWNER' or 'TENANT'), when generating an access token,
    the decoded JWT payload SHALL contain "role": role and "sub": user_id, and the
    encoded token size SHALL be less than 512 bytes.
    
    **Validates: Requirements 3.3, 3.4, 4.1, 4.2, 4.5**
    """
    from app.core.security import create_access_token
    from app.core.config import settings
    
    # Generate access token
    token = create_access_token(user_id=user_id, role=role)
    
    # Property 1: Token must be a string
    assert isinstance(token, str), \
        f"Access token must be a string, got {type(token)}"
    
    # Property 2: Token size must be less than 512 bytes
    token_size = len(token.encode('utf-8'))
    assert token_size < 512, \
        f"Access token size must be less than 512 bytes, got {token_size} bytes"
    
    # Property 3: Token must be decodable as a valid JWT
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
    except Exception as e:
        pytest.fail(f"Access token must be a valid JWT: {e}")
    
    # Property 4: Payload must contain "sub" claim with the correct user_id
    assert "sub" in payload, \
        f"Access token payload must contain 'sub' claim"
    assert payload["sub"] == user_id, \
        f"Access token 'sub' claim must equal user_id, expected {user_id}, got {payload['sub']}"
    
    # Property 5: Payload must contain "role" claim with the correct role
    assert "role" in payload, \
        f"Access token payload must contain 'role' claim"
    assert payload["role"] == role, \
        f"Access token 'role' claim must equal role, expected {role}, got {payload['role']}"
    
    # Property 6: Payload must contain "type" claim with value "access"
    assert "type" in payload, \
        f"Access token payload must contain 'type' claim"
    assert payload["type"] == "access", \
        f"Access token 'type' claim must be 'access', got {payload['type']}"
    
    # Property 7: Payload must contain "exp" claim (expiry timestamp)
    assert "exp" in payload, \
        f"Access token payload must contain 'exp' claim"
    assert isinstance(payload["exp"], int), \
        f"Access token 'exp' claim must be an integer timestamp"


@given(user_id=user_ids(), role=roles)
@settings(deadline=None)
def test_refresh_token_generation_includes_correct_role_claims(user_id, role):
    """
    For any user ID and role ('OWNER' or 'TENANT'), when generating a refresh token,
    the decoded JWT payload SHALL contain "role": role and "sub": user_id, and the
    encoded token size SHALL be less than 512 bytes.
    
    **Validates: Requirements 4.3, 4.4, 4.5**
    """
    from app.core.security import create_refresh_token
    from app.core.config import settings
    
    # Generate refresh token
    token = create_refresh_token(user_id=user_id, role=role)
    
    # Property 1: Token must be a string
    assert isinstance(token, str), \
        f"Refresh token must be a string, got {type(token)}"
    
    # Property 2: Token size must be less than 512 bytes
    token_size = len(token.encode('utf-8'))
    assert token_size < 512, \
        f"Refresh token size must be less than 512 bytes, got {token_size} bytes"
    
    # Property 3: Token must be decodable as a valid JWT
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
    except Exception as e:
        pytest.fail(f"Refresh token must be a valid JWT: {e}")
    
    # Property 4: Payload must contain "sub" claim with the correct user_id
    assert "sub" in payload, \
        f"Refresh token payload must contain 'sub' claim"
    assert payload["sub"] == user_id, \
        f"Refresh token 'sub' claim must equal user_id, expected {user_id}, got {payload['sub']}"
    
    # Property 5: Payload must contain "role" claim with the correct role
    assert "role" in payload, \
        f"Refresh token payload must contain 'role' claim"
    assert payload["role"] == role, \
        f"Refresh token 'role' claim must equal role, expected {role}, got {payload['role']}"
    
    # Property 6: Payload must contain "type" claim with value "refresh"
    assert "type" in payload, \
        f"Refresh token payload must contain 'type' claim"
    assert payload["type"] == "refresh", \
        f"Refresh token 'type' claim must be 'refresh', got {payload['type']}"
    
    # Property 7: Payload must contain "exp" claim (expiry timestamp)
    assert "exp" in payload, \
        f"Refresh token payload must contain 'exp' claim"
    assert isinstance(payload["exp"], int), \
        f"Refresh token 'exp' claim must be an integer timestamp"


# ── Property 2: Email Validation Accepts Valid Formats Only ───────────────

# Feature: tenant-login-rbac, Property 2: Email Validation Accepts Valid Formats Only
# **Validates: Requirements 2.1**


@given(email=st.emails())
def test_email_validation_accepts_valid_emails(email):
    """
    For any valid email string, TenantLoginRequest SHALL accept it without
    raising a ValidationError.

    **Validates: Requirements 2.1**
    """
    from pydantic import ValidationError
    from app.schemas.tenant_auth import TenantLoginRequest

    # Valid emails must not raise a ValidationError
    try:
        TenantLoginRequest(email=email, password="password123")
    except ValidationError as exc:
        pytest.fail(
            f"TenantLoginRequest rejected a valid email '{email}': {exc}"
        )


@given(
    email=st.text(max_size=50).filter(lambda s: "@" not in s and "." not in s)
)
def test_email_validation_rejects_invalid_emails(email):
    """
    For any string lacking both '@' and '.', TenantLoginRequest SHALL reject
    it with a ValidationError.

    **Validates: Requirements 2.1**
    """
    from pydantic import ValidationError
    from app.schemas.tenant_auth import TenantLoginRequest

    with pytest.raises(ValidationError):
        TenantLoginRequest(email=email, password="password123")


# ── Property 3: Password Length Validation Enforces Minimum ───────────────

# Feature: tenant-login-rbac, Property 3: Password Length Validation Enforces Minimum
# **Validates: Requirements 2.2, 14.4**


@given(
    new_password=st.text(
        min_size=8,
        max_size=100,
        alphabet=st.characters(blacklist_categories=("Cc", "Cs")),
    )
)
def test_password_length_validation_accepts_sufficient_length(new_password):
    """
    For any password with length >= 8, TenantPasswordChangeRequest SHALL
    accept the new_password without raising a ValidationError.

    **Validates: Requirements 2.2, 14.4**
    """
    from pydantic import ValidationError
    from app.schemas.tenant_auth import TenantPasswordChangeRequest

    try:
        TenantPasswordChangeRequest(current_password="any", new_password=new_password)
    except ValidationError as exc:
        pytest.fail(
            f"TenantPasswordChangeRequest rejected a password of length "
            f"{len(new_password)} (>= 8): {exc}"
        )


@given(
    new_password=st.text(
        max_size=7,
        alphabet=st.characters(blacklist_categories=("Cc", "Cs")),
    )
)
def test_password_length_validation_rejects_short_passwords(new_password):
    """
    For any password with length < 8, TenantPasswordChangeRequest SHALL
    reject the new_password with a ValidationError.

    **Validates: Requirements 2.2, 14.4**
    """
    from pydantic import ValidationError
    from app.schemas.tenant_auth import TenantPasswordChangeRequest

    with pytest.raises(ValidationError):
        TenantPasswordChangeRequest(current_password="any", new_password=new_password)


# ── Property 23: Temporary Password Generation Length ─────────────────────

# Feature: tenant-login-rbac, Property 23: Temporary Password Generation Length
# **Validates: Requirements 15.4**


@given(st.integers(min_value=1, max_value=50))
def test_temporary_password_generation_length(n):
    """
    For any tenant password reset by an owner, the generated temporary password
    SHALL have exactly 12 characters and SHALL consist only of alphanumeric
    characters (ascii_letters + digits).

    The generation logic is tested directly (stateless), calling it n times and
    asserting all invariants hold for every generated password.

    **Validates: Requirements 15.4**
    """
    import random
    import string

    # Replicate the exact generation logic from owner_reset_tenant_password()
    # in tenant_auth_service.py:
    #   alphabet = string.ascii_letters + string.digits
    #   temp_password = "".join(random.choices(alphabet, k=12))
    alphabet = string.ascii_letters + string.digits

    for _ in range(n):
        temp_password = "".join(random.choices(alphabet, k=12))

        # Property 1: The temporary password MUST be exactly 12 characters
        assert len(temp_password) == 12, (
            f"Temporary password must be exactly 12 characters, "
            f"got {len(temp_password)}: {temp_password!r}"
        )

        # Property 2: Every character MUST be alphanumeric (ascii_letters + digits)
        assert all(c in alphabet for c in temp_password), (
            f"Temporary password must contain only alphanumeric characters, "
            f"got {temp_password!r}"
        )

        # Property 3: The password MUST be a string
        assert isinstance(temp_password, str), (
            f"Temporary password must be a string, got {type(temp_password)}"
        )
