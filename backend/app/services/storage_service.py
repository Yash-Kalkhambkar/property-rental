from __future__ import annotations
from app.core.config import settings


class StorageService:
    """Wraps Supabase Storage. Client is created lazily so the app starts
    even when SUPABASE_URL / SUPABASE_SERVICE_KEY are not yet configured."""

    def __init__(self) -> None:
        self._client = None

    def _get_client(self):
        if self._client is None:
            from supabase import create_client
            self._client = create_client(
                settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
            )
        return self._client

    def upload(self, key: str, body: bytes, content_type: str = "application/octet-stream") -> None:
        self._get_client().storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
            path=key,
            file=body,
            file_options={"content-type": content_type, "upsert": "true"},
        )

    def signed_url(self, key: str, expires_in: int = 900) -> str:
        response = self._get_client().storage.from_(settings.SUPABASE_STORAGE_BUCKET).create_signed_url(
            key, expires_in
        )
        return response["signedURL"]

    def delete(self, key: str) -> None:
        self._get_client().storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([key])


storage_service = StorageService()
