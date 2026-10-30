import secrets
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import require_hr_role, get_current_active_user
from app.models.user import User, Role
from app.schemas.user import UserCreate, UserInDB, UserUpdate, PasswordResetResponse
from app.core.security import get_password_hash

router = APIRouter()

def generate_temp_password():
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(12))

@router.post("/", response_model=PasswordResetResponse)
def create_employee(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_hr_role)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    temp_pwd = generate_temp_password()
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active,
        hashed_password=get_password_hash(temp_pwd),
        is_temporary_password=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"temp_password": temp_pwd}

@router.get("/", response_model=List[UserInDB])
def read_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(require_hr_role)):
    return db.query(User).offset(skip).limit(limit).all()

@router.get("/me", response_model=UserInDB)
def read_current_employee(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.put("/{user_id}/status", response_model=UserInDB)
def update_employee_status(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_hr_role)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/reset-password", response_model=PasswordResetResponse)
def reset_password(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_hr_role)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    temp_pwd = generate_temp_password()
    user.hashed_password = get_password_hash(temp_pwd)
    user.is_temporary_password = True
    db.commit()
    return {"temp_password": temp_pwd}

