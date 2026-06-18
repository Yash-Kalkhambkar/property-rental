# Import all models so that Base.metadata is populated for Alembic
from app.models.owner import Owner  # noqa: F401
from app.models.property import Property  # noqa: F401
from app.models.unit import Unit  # noqa: F401
from app.models.tenant import Tenant  # noqa: F401
from app.models.lease import Lease  # noqa: F401
from app.models.payment import Payment  # noqa: F401
