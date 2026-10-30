from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
import uuid

from app.api.deps import get_current_active_user
from app.models.user import User, Role
from langchain_core.messages import HumanMessage
from app.services.chat_agent import chat_graph

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    thread_id: str = None

class ChatResponse(BaseModel):
    response: str
    thread_id: str

@router.post("/", response_model=ChatResponse)
def handle_chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_active_user)
):
    if not req.message:
        raise HTTPException(status_code=400, detail="Message is required")
        
    thread_id = req.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    inputs = {
        "messages": [HumanMessage(content=req.message)],
        "employee_id": current_user.id
    }
    
    # Run graph
    try:
        final_state = chat_graph.invoke(inputs, config=config)
    except Exception as e:
        if "groq" in str(e).lower() or "missing" in str(e).lower() or "api key" in str(e).lower():
             raise HTTPException(status_code=500, detail="Missing Groq API Key")
        raise HTTPException(status_code=500, detail=str(e))
        
    last_message = final_state["messages"][-1]
    
    return {
        "response": last_message.content,
        "thread_id": thread_id
    }
