from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.policy import ProcessingStatus

class PolicyVersionBase(BaseModel):
    version_number: int
    filename: str
    status: ProcessingStatus
    uploaded_at: datetime
    error_message: Optional[str] = None
    document_id: str

class PolicyVersionInDB(PolicyVersionBase):
    id: int
    policy_id: int
    
    class Config:
        from_attributes = True

class PolicyBase(BaseModel):
    name: str

class PolicyInDB(PolicyBase):
    id: int
    created_at: datetime
    is_active: bool
    versions: List[PolicyVersionInDB] = []
    
    class Config:
        from_attributes = True

