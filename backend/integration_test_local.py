"""Local integration test — run while backend is on http://127.0.0.1:8000"""
import sys
from datetime import date, timedelta

import requests

BASE = "http://127.0.0.1:8000/api/v1"
PASS = 0
FAIL = 0


def check(label: str, ok: bool, detail: str = "") -> None:
    global PASS, FAIL
    if ok:
        PASS += 1
        print(f"OK  {label}" + (f" | {detail}" if detail else ""))
    else:
        FAIL += 1
        print(f"FAIL {label}" + (f" | {detail}" if detail else ""))


def main() -> int:
    stamp = date.today().strftime("%Y%m%d%H%M%S")
    email = f"integration{stamp}@example.com"
    password = "TestPass@99"
    session = requests.Session()

    r = requests.get("http://127.0.0.1:8000/health")
    check("GET /health", r.status_code == 200, r.text)

    r = session.post(
        f"{BASE}/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Integration Tester",
            "phone": "9876543210",
        },
    )
    check("POST /auth/register", r.status_code == 200, email)

    r = session.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    check("POST /auth/login", r.status_code == 200)
    token = r.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = session.get(f"{BASE}/auth/me", headers=headers)
    check("GET /auth/me", r.status_code == 200, r.json()["data"]["full_name"])

    r = session.post(f"{BASE}/auth/refresh")
    check("POST /auth/refresh", r.status_code == 200)

    r = session.get(f"{BASE}/dashboard/", headers=headers)
    check("GET /dashboard/", r.status_code == 200)

    r = session.post(
        f"{BASE}/properties/",
        headers=headers,
        json={
            "name": "Integration Tower",
            "address_line": "1 Test St",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "property_type": "RESIDENTIAL",
            "total_units": 2,
        },
    )
    check("POST /properties/", r.status_code == 200)
    prop_id = r.json()["data"]["id"]

    r = session.post(
        f"{BASE}/properties/{prop_id}/units",
        headers=headers,
        json={
            "unit_number": "A1",
            "unit_type": "2BHK",
            "monthly_rent": 20000,
            "deposit_amount": 40000,
        },
    )
    check("POST /properties/:id/units", r.status_code == 200)
    unit_id = r.json()["data"]["id"]

    tenant_email = f"tenant{stamp}@example.com"
    r = session.post(
        f"{BASE}/tenants/",
        headers=headers,
        json={
            "full_name": "Tenant One",
            "email": tenant_email,
            "password": "TenantPass@99",
            "phone": "9123456789",
            "id_type": "AADHAAR",
            "id_number": "1234-5678-9012",
        },
    )
    check("POST /tenants/", r.status_code == 200)
    tenant_id = r.json()["data"]["id"]

    today = date.today().isoformat()
    end = (date.today() + timedelta(days=365)).isoformat()
    r = session.post(
        f"{BASE}/leases/",
        headers=headers,
        json={
            "unit_id": unit_id,
            "tenant_id": tenant_id,
            "start_date": today,
            "end_date": end,
            "monthly_rent": 20000,
            "deposit_paid": 40000,
            "rent_due_day": 5,
        },
    )
    check("POST /leases/", r.status_code == 200)
    lease_id = r.json()["data"]["id"]

    r = session.post(
        f"{BASE}/payments/",
        headers=headers,
        json={
            "lease_id": lease_id,
            "amount_due": 20000,
            "amount_paid": 20000,
            "due_date": today,
            "paid_date": today,
            "payment_method": "UPI",
        },
    )
    check("POST /payments/", r.status_code == 200)

    tenant_session = requests.Session()
    r = tenant_session.post(
        f"{BASE}/auth/tenant/login",
        json={"email": tenant_email, "password": "TenantPass@99"},
    )
    check("POST /auth/tenant/login", r.status_code == 200)
    tenant_token = r.json()["data"]["access_token"]
    tenant_headers = {"Authorization": f"Bearer {tenant_token}"}

    for path in [
        "/tenant/dashboard",
        "/tenant/leases",
        "/tenant/payments",
        "/tenant/properties",
        "/auth/tenant/me",
    ]:
        r = tenant_session.get(f"{BASE}{path}", headers=tenant_headers)
        check(f"GET {path}", r.status_code == 200)

    r = tenant_session.post(f"{BASE}/auth/tenant/refresh")
    check("POST /auth/tenant/refresh", r.status_code == 200)

    r = requests.options(
        f"{BASE}/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    check(
        "CORS preflight",
        r.status_code in (200, 204),
        str(r.headers.get("access-control-allow-origin")),
    )

    print(f"\n=== {PASS} passed, {FAIL} failed ===")
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
