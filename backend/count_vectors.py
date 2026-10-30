import os
from dotenv import load_dotenv

load_dotenv('.env')

from app.core.config import settings
from qdrant_client import QdrantClient

qdrant_client = QdrantClient(path=settings.QDRANT_URL)
col_info = qdrant_client.get_collection(settings.QDRANT_COLLECTION)
print(f"Vector Count: {col_info.points_count}")
