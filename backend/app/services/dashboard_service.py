from datetime import date, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.property import Property
from app.models.unit import Unit
from app.models.lease import Lease
from app.models.tenant import Tenant
from app.models.payment import Payment
from app.models.owner import Owner
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardSummary,
    DashboardFinancials,
    DashboardAlerts,
    ExpiringLease,
    OverduePayment,
)


def get_dashboard(db: Session, owner: Owner) -> DashboardResponse:
    """Build the full dashboard with summary, financials, and alerts."""

    # ── Summary ──
    total_properties = (
        db.query(func.count(Property.id))
        .filter(Property.owner_id == owner.id)
        .scalar()
        or 0
    )

    total_units = (
        db.query(func.count(Unit.id))
        .join(Property, Property.id == Unit.property_id)
        .filter(Property.owner_id == owner.id)
        .scalar()
        or 0
    )

    occupied_units = (
        db.query(func.count(Unit.id))
        .join(Property, Property.id == Unit.property_id)
        .filter(Property.owner_id == owner.id, Unit.status == "OCCUPIED")
        .scalar()
        or 0
    )

    vacant_units = (
        db.query(func.count(Unit.id))
        .join(Property, Property.id == Unit.property_id)
        .filter(Property.owner_id == owner.id, Unit.status == "VACANT")
        .scalar()
        or 0
    )

    occupancy_rate = (
        round((occupied_units / total_units) * 100, 1) if total_units > 0 else 0
    )

    summary = DashboardSummary(
        total_properties=total_properties,
        total_units=total_units,
        occupied_units=occupied_units,
        vacant_units=vacant_units,
        occupancy_rate=occupancy_rate,
    )

    # ── Financials (current month) ──
    today = date.today()
    current_year = today.year
    current_month = today.month

    financials_query = (
        db.query(
            func.coalesce(func.sum(Payment.amount_due), 0).label("expected"),
            func.coalesce(func.sum(Payment.amount_paid), 0).label("collected"),
            func.coalesce(
                func.sum(Payment.amount_due).filter(
                    Payment.status == "OVERDUE"
                ),
                0,
            ).label("overdue_amount"),
            func.count(Payment.id)
            .filter(Payment.status == "OVERDUE")
            .label("overdue_count"),
        )
        .join(Lease, Lease.id == Payment.lease_id)
        .join(Unit, Unit.id == Lease.unit_id)
        .join(Property, Property.id == Unit.property_id)
        .filter(
            Property.owner_id == owner.id,
            extract("year", Payment.due_date) == current_year,
            extract("month", Payment.due_date) == current_month,
        )
        .first()
    )

    financials = DashboardFinancials(
        current_month_expected=float(financials_query.expected) if financials_query else 0,
        current_month_collected=float(financials_query.collected) if financials_query else 0,
        overdue_amount=float(financials_query.overdue_amount) if financials_query else 0,
        overdue_count=int(financials_query.overdue_count) if financials_query else 0,
    )

    # ── Alerts: Expiring Leases (next 30 days) ──
    cutoff = today + timedelta(days=30)
    expiring_leases_raw = (
        db.query(
            Lease.id,
            Lease.end_date,
            Tenant.full_name,
            Unit.unit_number,
            Property.name.label("property_name"),
        )
        .join(Tenant, Tenant.id == Lease.tenant_id)
        .join(Unit, Unit.id == Lease.unit_id)
        .join(Property, Property.id == Unit.property_id)
        .filter(
            Property.owner_id == owner.id,
            Lease.status == "ACTIVE",
            Lease.end_date >= today,
            Lease.end_date <= cutoff,
        )
        .order_by(Lease.end_date.asc())
        .all()
    )

    expiring_leases = [
        ExpiringLease(
            lease_id=row.id,
            tenant_name=row.full_name,
            unit=f"{row.unit_number} — {row.property_name}",
            end_date=row.end_date.isoformat(),
            days_remaining=(row.end_date - today).days,
        )
        for row in expiring_leases_raw
    ]

    # ── Alerts: Overdue Payments ──
    overdue_payments_raw = (
        db.query(
            Payment.id,
            Payment.amount_due,
            Payment.due_date,
            Tenant.full_name,
            Unit.unit_number,
            Property.name.label("property_name"),
        )
        .join(Lease, Lease.id == Payment.lease_id)
        .join(Tenant, Tenant.id == Lease.tenant_id)
        .join(Unit, Unit.id == Lease.unit_id)
        .join(Property, Property.id == Unit.property_id)
        .filter(
            Property.owner_id == owner.id,
            Payment.status == "OVERDUE",
        )
        .order_by(Payment.due_date.asc())
        .limit(20)
        .all()
    )

    overdue_payments = [
        OverduePayment(
            payment_id=row.id,
            tenant_name=row.full_name,
            unit=f"{row.unit_number} — {row.property_name}",
            overdue_days=(today - row.due_date).days,
            amount=float(row.amount_due),
        )
        for row in overdue_payments_raw
    ]

    alerts = DashboardAlerts(
        leases_expiring_soon=expiring_leases,
        overdue_payments=overdue_payments,
    )

    return DashboardResponse(
        summary=summary,
        financials=financials,
        alerts=alerts,
    )
