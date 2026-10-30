from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import uuid
import random
from app.core.database import get_db
from app.models.user import User, Role
from app.api.deps import get_current_user, get_current_active_user, require_hr_role
from app.models.grievance import Grievance, GrievanceMessage, Status
from app.schemas.grievance import (
    GrievanceCreate, 
    GrievanceResponse, 
    GrievanceUpdate, 
    GrievanceMessageCreate, 
    GrievanceMessageResponse
)

router = APIRouter()

from app.services.grievance_service import create_grievance_record

@router.post("/", response_model=GrievanceResponse)
def create_grievance(
    grievance_in: GrievanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return create_grievance_record(employee_id=current_user.id, grievance_data=grievance_in, db=db)

@router.get("/", response_model=List[GrievanceResponse])
def get_grievances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role == Role.HR:
        return db.query(Grievance).all()
    else:
        return db.query(Grievance).filter(Grievance.employee_id == current_user.id).all()

@router.get("/{id}", response_model=GrievanceResponse)
def get_grievance(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    grievance = db.query(Grievance).filter(Grievance.id == id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
        
    if current_user.role != Role.HR and grievance.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    return grievance

@router.patch("/{id}", response_model=GrievanceResponse)
def update_grievance(
    id: int,
    grievance_in: GrievanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    grievance = db.query(Grievance).filter(Grievance.id == id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
        
    update_data = grievance_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(grievance, field, value)
        
    db.commit()
    db.refresh(grievance)
    return grievance

@router.post("/{id}/messages", response_model=GrievanceMessageResponse)
def add_message(
    id: int,
    msg_in: GrievanceMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    grievance = db.query(Grievance).filter(Grievance.id == id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
        
    if current_user.role != Role.HR and grievance.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    # Add message
    msg = GrievanceMessage(
        grievance_id=grievance.id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        message=msg_in.message
    )
    db.add(msg)
    
    # State update
    if current_user.role == Role.EMPLOYEE:
        grievance.awaiting_employee_info = False
        
    db.commit()
    db.refresh(msg)
    return msg

@router.post("/{id}/request-info", response_model=GrievanceResponse)
def request_info(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    grievance = db.query(Grievance).filter(Grievance.id == id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
        
    grievance.awaiting_employee_info = True
    db.commit()
    db.refresh(grievance)
    return grievance

@router.post("/{id}/resolve", response_model=GrievanceResponse)
def resolve_grievance(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    grievance = db.query(Grievance).filter(Grievance.id == id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
        
    grievance.status = Status.RESOLVED
    grievance.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(grievance)
    return grievance

@router.post("/{id}/close", response_model=GrievanceResponse)
def close_grievance(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    grievance = db.query(Grievance).filter(Grievance.id == id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
        
    grievance.status = Status.CLOSED
    grievance.closed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(grievance)
    return grievance
