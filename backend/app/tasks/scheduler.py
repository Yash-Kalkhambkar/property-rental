from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date

from app.core.database import SessionLocal
from app.models.payment import Payment
from app.models.lease import Lease
from app.models.unit import Unit
from app.models.property import Property
from app.models.tenant import Tenant
from app.services.email_service import email_service


def run_daily_job() -> dict:
    """
    Marks overdue payments and sends email alerts.
    Called either by APScheduler (paid plan) or the /internal/daily-job
    endpoint (free plan via external cron).
    Returns a summary dict for logging.
    """
    db = SessionLocal()
    marked = 0
    emailed = 0
    try:
        overdue_payments = (
            db.query(Payment)
            .join(Lease, Lease.id == Payment.lease_id)
            .join(Unit, Unit.id == Lease.unit_id)
            .join(Property, Property.id == Unit.property_id)
            .join(Tenant, Tenant.id == Lease.tenant_id)
            .filter(
                Payment.status == "PENDING",
                Payment.due_date < date.today(),
            )
            .all()
        )

        for payment in overdue_payments:
            payment.status = "OVERDUE"
            marked += 1

            # Eagerly load relationships for email
            lease = db.query(Lease).filter(Lease.id == payment.lease_id).first()
            if lease:
                tenant = (
                    db.query(Tenant).filter(Tenant.id == lease.tenant_id).first()
                )
                unit = db.query(Unit).filter(Unit.id == lease.unit_id).first()
                prop = (
                    db.query(Property).filter(Property.id == unit.property_id).first()
                    if unit
                    else None
                )

                if tenant and tenant.email and unit and prop:
                    days_late = (date.today() - payment.due_date).days
                    try:
                        email_service.send_overdue_alert(
                            to_email=tenant.email,
                            tenant_name=tenant.full_name,
                            amount=float(payment.amount_due),
                            days_overdue=days_late,
                            unit=f"{unit.unit_number} — {prop.name}",
                        )
                        emailed += 1
                    except Exception:
                        pass  # Don't fail the whole job if one email fails

        db.commit()
        return {"marked_overdue": marked, "emails_sent": emailed}
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def start_scheduler():
    """Start APScheduler — only reliable on Render paid plan (no cold starts)."""
    scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
    scheduler.add_job(run_daily_job, "cron", hour=9, minute=0)
    scheduler.start()
