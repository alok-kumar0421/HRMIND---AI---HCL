from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.grievance import Category, Priority, Status

class GrievanceMessageBase(BaseModel):
    message: str

class GrievanceMessageCreate(GrievanceMessageBase):
    pass

class GrievanceMessageResponse(GrievanceMessageBase):
    id: int
    grievance_id: int
    sender_id: int
    sender_role: str
    created_at: datetime

    class Config:
        from_attributes = True

class GrievanceBase(BaseModel):
    title: str
    description: str
    category: Category
    priority: Priority = Priority.MEDIUM
    relevant_policy_id: Optional[int] = None

class GrievanceCreate(GrievanceBase):
    pass

class GrievanceUpdate(BaseModel):
    status: Optional[Status] = None
    priority: Optional[Priority] = None
    assigned_team: Optional[str] = None
    category: Optional[Category] = None

class GrievanceResponse(GrievanceBase):
    id: int
    ticket_id: str
    employee_id: int
    status: Status
    assigned_team: Optional[str] = None
    awaiting_employee_info: bool
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    messages: List[GrievanceMessageResponse] = []

    class Config:
        from_attributes = True
