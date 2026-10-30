from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import Role

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Role = Role.EMPLOYEE
    is_active: bool = True

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    id: int
    is_temporary_password: bool
    
    class Config:
        from_attributes = True

class PasswordResetResponse(BaseModel):
    temp_password: str

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserInDB

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[Role] = None

