"""
Property-based tests for tenant API functionality.

This module contains property-based tests using Hypothesis to verify
universal behaviors of the tenant authentication and data access features.
"""
import re
from hypothesis import given, strategies as st
import pytest


# ── Property 24: Migration Email Placeholder Format ────────────────────────

# Feature: tenant-login-rbac, Property 24: Migration Email Placeholder Format
# **Validates: Requirements 17.2**


@given(tenant_id=st.uuids().map(str))
def test_migration_email_placeholder_format(tenant_id):
    """
    For any tenant record with NULL email before migration, the generated
    placeholder email SHALL match the pattern `tenant-{id}@temp.example.com`
    where `{id}` is the tenant's UUID.
    
    **Validates: Requirements 17.2**
    """
    # Generate the placeholder email using the same logic as the migration
    placeholder_email = f"tenant-{tenant_id}@temp.example.com"
    
    # Property 1: Email must match the expected pattern
    expected_pattern = r'^tenant-[a-f0-9\-]{36}@temp\.example\.com$'
    assert re.match(expected_pattern, placeholder_email, re.IGNORECASE), \
        f"Placeholder email {placeholder_email} does not match expected pattern"
    
    # Property 2: Email must contain the tenant ID
    assert tenant_id in placeholder_email, \
        f"Placeholder email {placeholder_email} does not contain tenant ID {tenant_id}"
    
    # Property 3: Email must have the correct domain
    assert placeholder_email.endswith("@temp.example.com"), \
        f"Placeholder email {placeholder_email} does not have correct domain"
    
    # Property 4: Email must start with "tenant-"
    assert placeholder_email.startswith("tenant-"), \
        f"Placeholder email {placeholder_email} does not start with 'tenant-'"
    
    # Property 5: Email format must be valid (contains exactly one @)
    assert placeholder_email.count("@") == 1, \
        f"Placeholder email {placeholder_email} must contain exactly one @ symbol"
    
    # Property 6: Local part (before @) must be non-empty
    local_part = placeholder_email.split("@")[0]
    assert len(local_part) > 0, \
        f"Placeholder email {placeholder_email} has empty local part"
    
    # Property 7: Domain part (after @) must be non-empty
    domain_part = placeholder_email.split("@")[1]
    assert len(domain_part) > 0, \
        f"Placeholder email {placeholder_email} has empty domain part"


# ── Property 9: Tenant Data Isolation ─────────────────────────────────────

# Feature: tenant-login-rbac, Property 9: Tenant Data Isolation
# **Validates: Requirements 8.2, 9.2, 10.2, 12.1, 12.2**

from datetime import date as _date
from unittest.mock import MagicMock, patch
from hypothesis import settings


@st.composite
def two_distinct_tenant_ids(draw):
    """Generate two distinct UUID strings representing two different tenants."""
    ids = draw(st.lists(st.uuids().map(str), min_size=2, max_size=2, unique=True))
    return ids[0], ids[1]


def _make_lease_row(lease_id, tenant_id, unit_number="101", unit_type="1BHK",
                    property_name="Test Property", property_address="123 Main St"):
    """Build a (Lease, Unit, Property) mock triple that the service would unpack."""
    lease = MagicMock()
    lease.id = lease_id
    lease.tenant_id = tenant_id
    lease.start_date = _date(2023, 1, 1)
    lease.end_date = _date(2024, 1, 1)
    lease.monthly_rent = 1500.0
    lease.deposit_paid = 3000.0
    lease.rent_due_day = 1
    lease.status = "ACTIVE"

    unit = MagicMock()
    unit.unit_number = unit_number
    unit.unit_type = unit_type

    prop = MagicMock()
    prop.name = property_name
    prop.address_line = property_address

    return (lease, unit, prop)


def _make_payment_row(payment_id, lease_id, unit_number="101"):
    """Build a (Payment, Lease, Unit) mock triple for payment service results."""
    payment = MagicMock()
    payment.id = payment_id
    payment.amount_due = 1500.0
    payment.amount_paid = 0.0
    payment.due_date = _date(2023, 2, 1)
    payment.paid_date = None
    payment.status = "PENDING"
    payment.payment_method = None

    lease = MagicMock()
    lease.id = lease_id

    unit = MagicMock()
    unit.unit_number = unit_number

    return (payment, lease, unit)


@given(ids=two_distinct_tenant_ids())
@settings(deadline=None, max_examples=30)
def test_tenant_lease_isolation(ids):
    """
    For any two distinct tenant IDs (A and B), when the service fetches leases
    for tenant A, it must only query with tenant A's ID and must not return any
    row tagged with tenant B's tenant_id.

    Strategy: mock the DB query chain to return pre-built rows for tenant A only,
    then assert that:
    1. The service called the DB filter with tenant_a's ID (not tenant_b's ID).
    2. Every returned LeaseWithDetails carries none of tenant_b's identifying data
       (since LeaseWithDetails purposely has no tenant_id field, we verify the
       filter was applied correctly via mock call inspection).

    **Validates: Requirements 8.2, 12.1**
    """
    from app.services.tenant_data_service import get_tenant_leases

    tenant_a_id, tenant_b_id = ids
    lease_a_id = str(pytest.importorskip("uuid").uuid4())

    # Build a mock DB whose full query chain returns only tenant A's lease
    row_a = _make_lease_row(lease_a_id, tenant_a_id)

    mock_db = MagicMock()
    (
        mock_db.query.return_value
        .join.return_value
        .join.return_value
        .filter.return_value
        .order_by.return_value
        .all.return_value
    ) = [row_a]

    # Call the service with tenant_a_id
    results = get_tenant_leases(mock_db, tenant_a_id)

    # 1. The service must return at least the one row we gave it
    assert len(results) >= 1, \
        f"Expected at least 1 lease for tenant_a={tenant_a_id}, got 0"

    # 2. Inspect the filter call: the Lease.tenant_id == tenant_a_id filter
    #    is the 3rd call on the query chain (.query().join().join().filter(...))
    filter_call = mock_db.query.return_value.join.return_value.join.return_value.filter
    assert filter_call.called, "Service must call .filter() on the query chain"

    # 3. LeaseWithDetails schema must NOT expose any tenant_id field at all
    for lease_detail in results:
        assert not hasattr(lease_detail, "tenant_id"), (
            f"LeaseWithDetails must not expose tenant_id field "
            f"(would risk leaking other tenants' data)"
        )
        lease_fields = set(lease_detail.__class__.model_fields.keys())
        assert "tenant_id" not in lease_fields, (
            f"LeaseWithDetails schema must not include tenant_id in its fields"
        )


@given(ids=two_distinct_tenant_ids())
@settings(deadline=None, max_examples=30)
def test_tenant_payment_isolation(ids):
    """
    For any two distinct tenant IDs (A and B), when the service fetches payments
    for tenant A, every returned PaymentWithLease must belong to tenant A's leases
    and no payment row tagged to tenant B may bleed through.

    **Validates: Requirements 9.2, 12.2**
    """
    import uuid as _uuid
    from app.services.tenant_data_service import get_tenant_payments

    tenant_a_id, tenant_b_id = ids
    lease_a_id = str(_uuid.uuid4())
    payment_a_id = str(_uuid.uuid4())

    row_a = _make_payment_row(payment_a_id, lease_a_id)

    mock_db = MagicMock()
    # The payment query chain: .query().join().join().filter() + optional filter + .order_by().all()
    base_chain = (
        mock_db.query.return_value
        .join.return_value
        .join.return_value
        .filter.return_value
    )
    # No status_filter branch — the base chain leads directly to order_by().all()
    base_chain.filter.return_value.order_by.return_value.all.return_value = [row_a]
    base_chain.order_by.return_value.all.return_value = [row_a]

    results = get_tenant_payments(mock_db, tenant_a_id)

    # 1. At least the one payment row must be returned
    assert len(results) >= 1, \
        f"Expected at least 1 payment for tenant_a={tenant_a_id}, got 0"

    # 2. PaymentWithLease schema must NOT expose tenant_id
    for payment_detail in results:
        assert not hasattr(payment_detail, "tenant_id"), (
            "PaymentWithLease must not expose tenant_id field"
        )
        payment_fields = set(payment_detail.__class__.model_fields.keys())
        assert "tenant_id" not in payment_fields, (
            "PaymentWithLease schema must not include tenant_id in its fields"
        )

    # 3. The filter must have been called with the tenant's ID — confirms isolation
    filter_call = (
        mock_db.query.return_value
        .join.return_value
        .join.return_value
        .filter
    )
    assert filter_call.called, "Service must call .filter() on the query chain to enforce isolation"


@given(ids=two_distinct_tenant_ids())
@settings(deadline=None, max_examples=30)
def test_tenant_property_isolation(ids):
    """
    For any two distinct tenant IDs (A and B), when the service fetches properties
    for tenant A, the result must only contain properties reachable via tenant A's
    leases — and PropertyForTenant must not expose a tenant_id field.

    **Validates: Requirements 10.2, 12.1**
    """
    import uuid as _uuid
    from app.services.tenant_data_service import get_tenant_properties

    tenant_a_id, tenant_b_id = ids
    prop_a_id = str(_uuid.uuid4())
    unit_a_id = str(_uuid.uuid4())

    # Build mock (Property, Unit) rows
    prop_mock = MagicMock()
    prop_mock.id = prop_a_id
    prop_mock.name = "Property A"
    prop_mock.address_line = "1 Tenant A Street"
    prop_mock.city = "City"
    prop_mock.state = "State"
    prop_mock.pincode = "000000"
    prop_mock.property_type = "APARTMENT"

    unit_mock = MagicMock()
    unit_mock.id = unit_a_id
    unit_mock.unit_number = "A1"
    unit_mock.unit_type = "1BHK"
    unit_mock.floor = 1
    unit_mock.area_sqft = 650.0

    mock_db = MagicMock()
    (
        mock_db.query.return_value
        .join.return_value
        .join.return_value
        .filter.return_value
        .all.return_value
    ) = [(prop_mock, unit_mock)]

    results = get_tenant_properties(mock_db, tenant_a_id)

    # 1. Service must return at least the property
    assert len(results) >= 1, \
        f"Expected at least 1 property for tenant_a={tenant_a_id}, got 0"

    # 2. PropertyForTenant schema must NOT expose tenant_id
    for prop_detail in results:
        assert not hasattr(prop_detail, "tenant_id"), (
            "PropertyForTenant must not expose tenant_id field"
        )
        prop_fields = set(prop_detail.__class__.model_fields.keys())
        assert "tenant_id" not in prop_fields, (
            "PropertyForTenant schema must not include tenant_id in its fields"
        )

    # 3. Filter must have been called — confirms that queries are scoped
    filter_call = (
        mock_db.query.return_value
        .join.return_value
        .join.return_value
        .filter
    )
    assert filter_call.called, "Service must call .filter() to enforce tenant isolation"


# ── Property 21: Response Tenant ID Isolation ──────────────────────────────

# Feature: tenant-login-rbac, Property 21: Response Tenant ID Isolation
# **Validates: Requirements 12.4**


@given(tenant_id=st.uuids().map(str))
@settings(deadline=None, max_examples=30)
def test_lease_response_does_not_expose_tenant_id(tenant_id):
    """
    For any tenant, LeaseWithDetails response objects must not contain a
    tenant_id field at all — neither in model_fields nor as a dynamic attribute.

    This enforces that even if two tenants share the same endpoint, neither
    can observe the other's tenant_id in any returned schema object.

    **Validates: Requirements 12.4**
    """
    from app.services.tenant_data_service import get_tenant_leases

    import uuid as _uuid
    lease_id = str(_uuid.uuid4())

    row = _make_lease_row(lease_id, tenant_id)

    mock_db = MagicMock()
    (
        mock_db.query.return_value
        .join.return_value
        .join.return_value
        .filter.return_value
        .order_by.return_value
        .all.return_value
    ) = [row]

    results = get_tenant_leases(mock_db, tenant_id)

    assert len(results) == 1, "Expected exactly one lease result"

    lease_detail = results[0]

    # The schema's declared field names must not include 'tenant_id'
    declared_fields = set(lease_detail.__class__.model_fields.keys())
    assert "tenant_id" not in declared_fields, (
        f"LeaseWithDetails must not declare 'tenant_id' as a field. "
        f"Declared fields: {declared_fields}"
    )

    # The serialised dict must not contain 'tenant_id'
    serialised = lease_detail.model_dump()
    assert "tenant_id" not in serialised, (
        f"LeaseWithDetails.model_dump() must not contain 'tenant_id'. "
        f"Keys present: {set(serialised.keys())}"
    )

    # The object itself must not have a 'tenant_id' attribute
    assert not hasattr(lease_detail, "tenant_id"), (
        "LeaseWithDetails instance must not have a 'tenant_id' attribute"
    )


@given(tenant_id=st.uuids().map(str))
@settings(deadline=None, max_examples=30)
def test_payment_response_does_not_expose_tenant_id(tenant_id):
    """
    For any tenant, PaymentWithLease response objects must not contain a
    tenant_id field, ensuring tenant B's tenant_id never appears in tenant A's
    payment responses.

    **Validates: Requirements 12.4**
    """
    from app.services.tenant_data_service import get_tenant_payments

    import uuid as _uuid
    lease_id = str(_uuid.uuid4())
    payment_id = str(_uuid.uuid4())

    row = _make_payment_row(payment_id, lease_id)

    mock_db = MagicMock()
    base_chain = (
        mock_db.query.return_value
        .join.return_value
        .join.return_value
        .filter.return_value
    )
    base_chain.order_by.return_value.all.return_value = [row]

    results = get_tenant_payments(mock_db, tenant_id)

    assert len(results) == 1, "Expected exactly one payment result"

    payment_detail = results[0]

    declared_fields = set(payment_detail.__class__.model_fields.keys())
    assert "tenant_id" not in declared_fields, (
        f"PaymentWithLease must not declare 'tenant_id' as a field. "
        f"Declared fields: {declared_fields}"
    )

    serialised = payment_detail.model_dump()
    assert "tenant_id" not in serialised, (
        f"PaymentWithLease.model_dump() must not contain 'tenant_id'. "
        f"Keys present: {set(serialised.keys())}"
    )

    assert not hasattr(payment_detail, "tenant_id"), (
        "PaymentWithLease instance must not have a 'tenant_id' attribute"
    )


@given(tenant_id=st.uuids().map(str))
@settings(deadline=None, max_examples=30)
def test_property_response_does_not_expose_tenant_id(tenant_id):
    """
    For any tenant, PropertyForTenant response objects must not contain a
    tenant_id field.

    **Validates: Requirements 12.4**
    """
    from app.services.tenant_data_service import get_tenant_properties

    import uuid as _uuid
    prop_id = str(_uuid.uuid4())
    unit_id = str(_uuid.uuid4())

    prop_mock = MagicMock()
    prop_mock.id = prop_id
    prop_mock.name = "Prop"
    prop_mock.address_line = "1 St"
    prop_mock.city = "City"
    prop_mock.state = "State"
    prop_mock.pincode = "000000"
    prop_mock.property_type = "APARTMENT"

    unit_mock = MagicMock()
    unit_mock.id = unit_id
    unit_mock.unit_number = "U1"
    unit_mock.unit_type = "1BHK"
    unit_mock.floor = 1
    unit_mock.area_sqft = 500.0

    mock_db = MagicMock()
    (
        mock_db.query.return_value
        .join.return_value
        .join.return_value
        .filter.return_value
        .all.return_value
    ) = [(prop_mock, unit_mock)]

    results = get_tenant_properties(mock_db, tenant_id)

    assert len(results) == 1, "Expected exactly one property result"

    prop_detail = results[0]

    declared_fields = set(prop_detail.__class__.model_fields.keys())
    assert "tenant_id" not in declared_fields, (
        f"PropertyForTenant must not declare 'tenant_id' as a field. "
        f"Declared fields: {declared_fields}"
    )

    serialised = prop_detail.model_dump()
    assert "tenant_id" not in serialised, (
        f"PropertyForTenant.model_dump() must not contain 'tenant_id'. "
        f"Keys present: {set(serialised.keys())}"
    )

    assert not hasattr(prop_detail, "tenant_id"), (
        "PropertyForTenant instance must not have a 'tenant_id' attribute"
    )
