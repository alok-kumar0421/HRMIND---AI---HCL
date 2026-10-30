import uuid
from io import BytesIO
from typing import List, Dict, Any
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance, Filter, FieldCondition, MatchValue
from app.core.config import settings

# Initialize Qdrant Client
if settings.QDRANT_URL == ":memory:":
    qdrant_client = QdrantClient(location=":memory:")
elif settings.QDRANT_URL and settings.QDRANT_URL.startswith("http"):
    qdrant_client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None)
else:
    qdrant_client = QdrantClient(path=settings.QDRANT_URL)

def get_embedding_model():
    from fastembed import TextEmbedding
    return TextEmbedding(model_name=settings.EMBEDDING_MODEL)

def init_qdrant_collection():
    if not qdrant_client.collection_exists(collection_name=settings.QDRANT_COLLECTION):
        try:
            model = get_embedding_model()
            dummy_embedding = list(model.embed(["test"]))[0]
            vector_size = len(dummy_embedding)
        except ImportError:
            vector_size = 384
        qdrant_client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
        )

try:
    init_qdrant_collection()
except Exception as e:
    print(f"Failed to initialize Qdrant collection: {e}")

def extract_text_from_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
    reader = PdfReader(BytesIO(file_bytes))
    pages_data = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            text = " ".join(text.split())
            pages_data.append({"page_number": i + 1, "text": text})
    return pages_data

def process_and_store_document(document_id: str, policy_name: str, version: int, filename: str, file_bytes: bytes):
    try:
        pages = extract_text_from_pdf(file_bytes)
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
        embedding_model = get_embedding_model()
        
        points = []
        for page in pages:
            chunks = text_splitter.split_text(page["text"])
            for chunk_idx, chunk in enumerate(chunks):
                chunk_id = f"{document_id}_{page['page_number']}_{chunk_idx}"
                embedding = list(embedding_model.embed([chunk]))[0]
                
                payload = {
                    "document_id": document_id,
                    "policy_name": policy_name,
                    "version": version,
                    "filename": filename,
                    "page_number": page["page_number"],
                    "chunk_id": chunk_id,
                    "source": filename,
                    "text": chunk
                }
                
                points.append(
                    PointStruct(
                        id=str(uuid.uuid4()),
                        vector=embedding.tolist() if hasattr(embedding, "tolist") else embedding,
                        payload=payload
                    )
                )
                
        if points:
            qdrant_client.upsert(
                collection_name=settings.QDRANT_COLLECTION,
                points=points
            )
            
    except Exception as e:
        raise RuntimeError(f"RAG Processing failed: {str(e)}")

def delete_document_vectors(document_id: str):
    qdrant_client.delete(
        collection_name=settings.QDRANT_COLLECTION,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="document_id",
                    match=MatchValue(value=document_id)
                )
            ]
        )
    )
