from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth, employees, policies, policy_query, grievances
from app.core.database import Base, engine
from app.core.config import settings
from app.models.grievance import Grievance, GrievanceMessage
import logging

logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.endpoints import auth, employees, policies, policy_query, grievances, chat

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(employees.router, prefix="/api/employees", tags=["employees"])
app.include_router(policies.router, prefix="/api/policies", tags=["policies"])
app.include_router(policy_query.router, prefix="/api/policy/query", tags=["agent"])
app.include_router(grievances.router, prefix="/api/grievances", tags=["grievances"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

