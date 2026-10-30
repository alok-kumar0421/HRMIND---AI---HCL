import os
import sys
from dotenv import load_dotenv

load_dotenv('.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.policy import Policy, PolicyVersion
from app.services.rag import qdrant_client, get_embedding_model, init_qdrant_collection, process_and_store_document
from qdrant_client import QdrantClient
from app.services.storage import get_supabase_client

def run_diagnostic():
    print("=== 1. PostgreSQL ===")
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()
    
    leave_policy_doc = db.query(PolicyVersion).filter(PolicyVersion.status == 'READY').first()

    if leave_policy_doc:
        print(f"\nFound Document ID: {leave_policy_doc.document_id}")
        print(f"Status: {leave_policy_doc.status}")
        print(f"Storage Path: {leave_policy_doc.storage_path}")
    else:
        print("\nFAIL: No READY documents found in PostgreSQL.")
        return

    print("\n=== 2. Downloading from Supabase ===")
    supabase = get_supabase_client()
    res = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).download(leave_policy_doc.storage_path)
    file_bytes = res
    print(f"Downloaded {len(file_bytes)} bytes.")

    print("\n=== 3. Re-Processing to Local Memory Qdrant ===")
    init_qdrant_collection()
        
    print("Extracting and Embedding chunks...")
    process_and_store_document(
        document_id=leave_policy_doc.document_id,
        policy_name=leave_policy_doc.policy.name,
        version=leave_policy_doc.version_number,
        filename=leave_policy_doc.filename,
        file_bytes=file_bytes
    )
    
    col_info = qdrant_client.get_collection(settings.QDRANT_COLLECTION)
    print(f"Vector Count in Local Memory: {col_info.points_count}")

    print("\n=== Query Retrieval ===")
    model = get_embedding_model()
    
    queries = [
        "How many casual leaves are allowed per year?",
        "How many sick leaves are allowed per year?",
        "casual leave",
        "sick leave"
    ]
    
    for q in queries:
        print(f"\nQuery: '{q}'")
        query_vector = list(model.embed([q]))[0]
        search_result = qdrant_client.query_points(
            collection_name=settings.QDRANT_COLLECTION,
            query=query_vector.tolist() if hasattr(query_vector, "tolist") else query_vector,
            limit=5,
            with_payload=True
        )
        for i, hit in enumerate(search_result.points):
            payload = hit.payload or {}
            text_preview = payload.get('text', '')[:100].replace('\n', ' ')
            doc_id = payload.get('document_id')
            policy_name = payload.get('policy_name')
            print(f"  {i+1}. Score: {hit.score:.4f} | Doc: {doc_id} | Policy: {policy_name} | Text: {text_preview}...")

if __name__ == '__main__':
    run_diagnostic()
