import os
from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client | None:
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        except Exception:
            return None
    return None

def upload_policy_file(document_id: str, file_bytes: bytes, filename: str) -> str:
    supabase = get_supabase_client()
    storage_path = f"policies/{document_id}_{filename}"
    
    if supabase:
        supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
            file=file_bytes,
            path=storage_path,
            file_options={"content-type": "application/pdf"}
        )
        return storage_path
    else:
        # Fallback to local storage for testing if supabase is not configured
        local_dir = os.path.join(os.getcwd(), "local_storage")
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, f"{document_id}_{filename}")
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        return local_path

def delete_policy_file(storage_path: str):
    supabase = get_supabase_client()
    if supabase:
        supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([storage_path])
    else:
        if os.path.exists(storage_path):
            os.remove(storage_path)

