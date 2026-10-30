from pydantic import BaseModel
from typing import List, Optional

class SourceMetadata(BaseModel):
    document_id: str
    policy_name: str
    version: int
    page_number: int
    chunk_id: str
    source: str

class PolicyQueryRequest(BaseModel):
    question: str

class PolicyQueryResponse(BaseModel):
    answer: str
    sources: List[SourceMetadata] = []
