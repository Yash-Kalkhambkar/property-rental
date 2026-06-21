"""
Tenant data access service.

All queries filter by tenant_id at the service layer to enforce strict
data isolation (Requirement 12.3). SQLAlchemy ORM joins are used throughout.
"""

from datetime import date, timedelta
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.lease import Lease
from app.models.payment import Payment
from app.models.property import Property
from app.models.unit import Unit
from app.schemas.tenant_data import (
    LeaseWithDetails,
    PaymentSummary,
    PaymentWithLease,
    PropertyForTenant,
    TenantDashboard,
    UnitForTenant,
)


def get_tenant_leases(
    db: Session,
    tenant_id: str,
) -> list[LeaseWithDetails]:
    """
    Fetch all leases for a tenant with unit and property details.
    Ordered by start_date DESC (Requirement 8.5).

    Returns only leases where tenant_id matches the authenticated tenant
    (Requirement 8.2, 12.3).
    """
    rows = (
        db.query(Lease, Unit, Property)
        .join(Unit, Unit.id == Lease.unit_id)
        .join(Property, Property.id == Unit.property_id)
        .filter(Lease.tenant_id == tenant_id)
        .order_by(Lease.start_date.desc())
        .all()
    )

    result: list[LeaseWithDetails] = []
    for lease, unit, prop in rows:
        result.append(
            LeaseWithDetails(
                id=lease.id,
                start_date=lease.start_date.isoformat(),
                end_date=lease.end_date.isoformat(),
                monthly_rent=float(lease.monthly_rent),
                deposit_paid=float(lease.deposit_paid),
                rent_due_day=lease.rent_due_day,
                status=lease.status,
                unit_number=unit.unit_number,
                unit_type=unit.unit_type,
                property_name=prop.name,
                property_address=prop.address_line,
            )
        )
    return result


def get_tenant_payments(
    db: Session,
    tenant_id: str,
    status_filter: Optional[str] = None,
) -> list[PaymentWithLease]:
    """
    Fetch all payments for a tenant's leases with lease details.
    Joins payments → leases and filters by tenant_id.
    Optionally filter by payment status (Requirement 9.5).
    Ordered by due_date DESC (Requirement 9.4).

    Only returns payments for leases that belong to the authenticated tenant
    (Requirement 9.2, 12.3).
    """
    query = (
        db.query(Payment, Lease, Unit)
        .join(Lease, Lease.id == Payment.lease_id)
        .join(Unit, Unit.id == Lease.unit_id)
        .filter(Lease.tenant_id == tenant_id)
    )

    if status_filter is not None:
        query = query.filter(Payment.status == status_filter)

    query = query.order_by(Payment.due_date.desc())

    result: list[PaymentWithLease] = []
    for payment, lease, unit in query.all():
        result.append(
            PaymentWithLease(
                id=payment.id,
                amount_due=float(payment.amount_due),
                amount_paid=float(payment.amount_paid),
                due_date=payment.due_date.isoformat(),
                paid_date=payment.paid_date.isoformat() if payment.paid_date else None,
                status=payment.status,
                payment_method=payment.payment_method,
                lease_id=lease.id,
                unit_number=unit.unit_number,
            )
        )
    return result


def get_tenant_properties(
    db: Session,
    tenant_id: str,
) -> list[PropertyForTenant]:
    """
    Fetch properties where the tenant has or had leases.
    Includes only the specific units the tenant has leased (Requirement 10.3).
    Deduplicates properties for tenants with multiple units in the same
    property (Requirement 10.5).
    Excludes owner-private fields such as total_units (Requirement 10.4).

    Only returns properties reachable via the authenticated tenant's leases
    (Requirement 10.2, 12.3).
    """
    rows = (
        db.query(Property, Unit)
        .join(Unit, Unit.property_id == Property.id)
        .join(Lease, Lease.unit_id == Unit.id)
        .filter(Lease.tenant_id == tenant_id)
        .all()
    )

    # Deduplicate: build a dict keyed by property_id, collecting per-tenant units
    prop_map: dict[str, tuple[Property, list[UnitForTenant]]] = {}
    seen_unit_ids: set[str] = set()

    for prop, unit in rows:
        if prop.id not in prop_map:
            prop_map[prop.id] = (prop, [])

        # A tenant may have multiple leases on the same unit; deduplicate units too
        if unit.id not in seen_unit_ids:
            seen_unit_ids.add(unit.id)
            prop_map[prop.id][1].append(
                UnitForTenant(
                    unit_number=unit.unit_number,
                    unit_type=unit.unit_type,
                    floor=unit.floor,
                    area_sqft=float(unit.area_sqft) if unit.area_sqft is not None else None,
                )
            )

    result: list[PropertyForTenant] = []
    for prop, units in prop_map.values():
        result.append(
            PropertyForTenant(
                id=prop.id,
                name=prop.name,
                address_line=prop.address_line,
                city=prop.city,
                state=prop.state,
                pincode=prop.pincode,
                property_type=prop.property_type,
                units=units,
            )
        )
    return result


def get_tenant_dashboard(
    db: Session,
    tenant_id: str,
) -> TenantDashboard:
    """
    Aggregate dashboard data for the tenant's home screen.

    - active_leases_count: count of ACTIVE leases (Requirement 11.2)
    - total_amount_due: sum of amount_due for PENDING/OVERDUE payments (Requirement 11.3)
    - upcoming_payments: payments due within today..today+30 days (Requirement 11.4)
    - active_lease_end_dates: end_date for each ACTIVE lease (Requirement 11.5)

    All data is filtered by tenant_id (Requirement 12.3).
    """
    today = date.today()
    cutoff = today + timedelta(days=30)

    # --- Active lease count ---
    active_leases_count: int = (
        db.query(func.count(Lease.id))
        .filter(Lease.tenant_id == tenant_id, Lease.status == "ACTIVE")
        .scalar()
        or 0
    )

    # --- Total amount due (PENDING + OVERDUE) ---
    total_amount_due: float = float(
        db.query(func.coalesce(func.sum(Payment.amount_due), 0))
        .join(Lease, Lease.id == Payment.lease_id)
        .filter(
            Lease.tenant_id == tenant_id,
            Payment.status.in_(["PENDING", "OVERDUE"]),
        )
        .scalar()
        or 0
    )

    # --- Upcoming payments (today ≤ due_date ≤ today+30) ---
    upcoming_rows = (
        db.query(Payment, Unit)
        .join(Lease, Lease.id == Payment.lease_id)
        .join(Unit, Unit.id == Lease.unit_id)
        .filter(
            Lease.tenant_id == tenant_id,
            Payment.due_date >= today,
            Payment.due_date <= cutoff,
        )
        .order_by(Payment.due_date.asc())
        .all()
    )

    upcoming_payments: list[PaymentSummary] = [
        PaymentSummary(
            id=payment.id,
            amount_due=float(payment.amount_due),
            due_date=payment.due_date.isoformat(),
            status=payment.status,
            unit_number=unit.unit_number,
        )
        for payment, unit in upcoming_rows
    ]

    # --- Active lease end dates ---
    active_leases = (
        db.query(Lease.end_date)
        .filter(Lease.tenant_id == tenant_id, Lease.status == "ACTIVE")
        .all()
    )
    active_lease_end_dates: list[str] = [
        row.end_date.isoformat() for row in active_leases
    ]

    return TenantDashboard(
        active_leases_count=active_leases_count,
        total_amount_due=total_amount_due,
        upcoming_payments=upcoming_payments,
        active_lease_end_dates=active_lease_end_dates,
    )
