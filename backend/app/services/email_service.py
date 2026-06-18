from __future__ import annotations
from app.core.config import settings


class EmailService:
    """Wraps Resend email sending. API key is set lazily so the app starts
    even when RESEND_API_KEY is not yet configured."""

    def _send(self, payload: dict) -> None:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send(payload)

    def send_overdue_alert(
        self,
        to_email: str,
        tenant_name: str,
        amount: float,
        days_overdue: int,
        unit: str,
    ) -> None:
        self._send({
            "from": settings.EMAIL_SENDER,
            "to": [to_email],
            "subject": f"Overdue Rent Alert — {unit}",
            "text": (
                f"Dear {tenant_name},\n\n"
                f"Your rent of ₹{amount:,.0f} for {unit} is {days_overdue} days overdue.\n\n"
                f"Please contact your landlord immediately.\n\nThank you."
            ),
        })


email_service = EmailService()
