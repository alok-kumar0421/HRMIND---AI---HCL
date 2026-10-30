from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLEnum
from app.core.database import Base
import enum

class Role(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    HR = "HR"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(SQLEnum(Role), default=Role.EMPLOYEE)
    is_active = Column(Boolean, default=True)
    is_temporary_password = Column(Boolean, default=True)

