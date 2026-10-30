import hashlib
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Form
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import require_hr_role
from app.models.policy import Policy, PolicyVersion, ProcessingStatus
from app.schemas.policy import PolicyInDB
from app.services.storage import upload_policy_file, delete_policy_file
from app.services.rag import process_and_store_document, delete_document_vectors

router = APIRouter()

def process_policy_background(db_session_factory, version_id: int, document_id: str, policy_name: str, version: int, filename: str, file_bytes: bytes):
    db = db_session_factory()
    db_version = db.query(PolicyVersion).filter(PolicyVersion.id == version_id).first()
    if not db_version:
        db.close()
        return
        
    db_version.status = ProcessingStatus.PROCESSING
    db.commit()

    try:
        process_and_store_document(document_id, policy_name, version, filename, file_bytes)
        db_version.status = ProcessingStatus.READY
        db.commit()
    except Exception as e:
        db_version.status = ProcessingStatus.FAILED
        db_version.error_message = str(e)
        db.commit()
        db.close()
        return

    # Cleanup old versions if new version is READY
    try:
        policy = db_version.policy
        for old_version in policy.versions:
            if old_version.id != db_version.id and old_version.status == ProcessingStatus.READY:
                delete_document_vectors(old_version.document_id)
                delete_policy_file(old_version.storage_path)
                db.delete(old_version)
        db.commit()
    except Exception as e:
        print(f"Warning: Cleanup failed for old versions of policy {policy_name}: {e}")
        db.rollback()
    finally:
        db.close()

@router.post("/", response_model=PolicyInDB)
async def upload_policy(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_hr_role)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    file_bytes = await file.read()
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    
    # Check duplicate hash globally
    existing_version = db.query(PolicyVersion).filter(PolicyVersion.file_hash == file_hash).first()
    if existing_version:
        raise HTTPException(status_code=400, detail="Exact duplicate file already exists")

    policy = db.query(Policy).filter(Policy.name == name).first()
    if not policy:
        policy = Policy(name=name)
        db.add(policy)
        db.commit()
        db.refresh(policy)
        next_version = 1
    else:
        next_version = max([v.version_number for v in policy.versions]) + 1 if policy.versions else 1

    document_id = str(uuid.uuid4())
    storage_path = upload_policy_file(document_id, file_bytes, file.filename)
    
    new_version = PolicyVersion(
        policy_id=policy.id,
        document_id=document_id,
        version_number=next_version,
        filename=file.filename,
        file_hash=file_hash,
        storage_path=storage_path,
        status=ProcessingStatus.UPLOADED
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    
    from app.core.database import SessionLocal
    background_tasks.add_task(
        process_policy_background,
        SessionLocal,
        new_version.id,
        document_id,
        name,
        next_version,
        file.filename,
        file_bytes
    )
    
    db.refresh(policy)
    return policy

@router.get("/", response_model=List[PolicyInDB])
def list_policies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(require_hr_role)):
    return db.query(Policy).offset(skip).limit(limit).all()

@router.delete("/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db), current_user = Depends(require_hr_role)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    for version in policy.versions:
        try:
            delete_document_vectors(version.document_id)
            delete_policy_file(version.storage_path)
        except Exception as e:
            pass # Continue deletion even if qdrant/storage fails

    db.delete(policy)
    db.commit()
    return {"message": "Policy deleted"}

