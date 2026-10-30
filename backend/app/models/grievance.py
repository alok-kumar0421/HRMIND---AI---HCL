from sqlalchemy import Column, Integer, String, Boolean, Enum as SQLEnum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.core.database import Base

class Category(str, enum.Enum):
    LEAVE = "LEAVE"
    PAYROLL = "PAYROLL"
    ATTENDANCE = "ATTENDANCE"
    WORKPLACE_CONDUCT = "WORKPLACE_CONDUCT"
    BENEFITS = "BENEFITS"
    OTHER = "OTHER"

class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Status(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, unique=True, index=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SQLEnum(Category), nullable=False)
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM)
    status = Column(SQLEnum(Status), default=Status.OPEN)
    assigned_team = Column(String, nullable=True)
    relevant_policy_id = Column(Integer, ForeignKey("policies.id"), nullable=True)
    awaiting_employee_info = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    employee = relationship("User")
    messages = relationship("GrievanceMessage", back_populates="grievance", cascade="all, delete-orphan", order_by="GrievanceMessage.created_at")

class GrievanceMessage(Base):
    __tablename__ = "grievance_messages"

    id = Column(Integer, primary_key=True, index=True)
    grievance_id = Column(Integer, ForeignKey("grievances.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender_role = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    grievance = relationship("Grievance", back_populates="messages")
    sender = relationship("User")
