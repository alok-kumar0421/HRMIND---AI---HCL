import json
import uuid
from typing import TypedDict, Annotated, List, Dict, Any, Literal
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.rag import qdrant_client, get_embedding_model
from app.models.grievance import Grievance, GrievanceMessage, Category, Priority, Status

class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    intent: str
    grievance_title: str
    grievance_description: str
    grievance_category: str
    grievance_priority: str
    awaiting_confirmation: bool
    ticket_id: str
    relevant_policy_id: int
    policy_sources: List[Dict[str, Any]]
    employee_id: int  # To know who is creating the ticket

# --- LLM Helpers ---
def get_llm(temperature=0):
    api_key = settings.GROQ_API_KEY
    if not api_key or api_key == "dummy":
        # Return a dummy/mock LLM for testing if no key is present? No, use real, let it fail.
        pass
    return ChatGroq(temperature=temperature, groq_api_key=api_key, model_name=settings.GROQ_MODEL)

# --- Nodes ---

class IntentClassification(BaseModel):
    intent: Literal["POLICY_QUERY", "GRIEVANCE", "GENERAL_HR", "OFF_TOPIC", "CONFIRMATION"]

def detect_intent(state: AgentState):
    # If we were waiting for confirmation, treat the next message as CONFIRMATION
    if state.get("awaiting_confirmation"):
        return {"intent": "CONFIRMATION"}
        
    llm = get_llm(temperature=0)
    prompt = f"""You are an HR intent classifier. Categorize the user's latest message into one of:
- POLICY_QUERY (asking about rules, limits, HR policies)
- GRIEVANCE (reporting a problem, missing pay, harassment, discrepancy, issue)
- GENERAL_HR (asking how to do something routine not requiring a grievance)
- OFF_TOPIC (weather, recipes, unrelated)

User message: {state['messages'][-1].content}"""

    try:
        structured_llm = llm.with_structured_output(IntentClassification)
        result = structured_llm.invoke(prompt)
        intent = result.intent
    except Exception:
        # Fallback if structured output fails
        intent = "GRIEVANCE" # Defaulting to grievance for safety in this phase if parsing fails
        
    return {"intent": intent}

def route_intent(state: AgentState):
    return state["intent"]

# --- Policy Query (Phase 3 reused) ---
def policy_query(state: AgentState):
    question = state["messages"][-1].content
    model = get_embedding_model()
    query_vector = list(model.embed([question]))[0]
    
    search_result = qdrant_client.query_points(
        collection_name=settings.QDRANT_COLLECTION,
        query=query_vector.tolist() if hasattr(query_vector, "tolist") else query_vector,
        limit=5,
        with_payload=True
    )
    
    chunks = [{"score": hit.score, "payload": hit.payload} for hit in search_result.points]
    is_relevant = chunks[0]["score"] > 0.4 if chunks else False
    
    if not is_relevant:
        return {"messages": [AIMessage(content="I couldn't find this in the available HR policies.")]}
        
    context_text = "\n\n".join([
        f"SOURCE [Policy: {c['payload']['policy_name']}, Version: {c['payload']['version']}, Page: {c['payload']['page_number']}]:\n{c['payload']['text']}"
        for c in chunks
    ])
    
    llm = get_llm(temperature=0)
    sys_prompt = f"You are an HR Policy Assistant. Answer strictly based on the retrieved policy context.\n\nContext:\n{context_text}"
    response = llm.invoke([SystemMessage(content=sys_prompt), HumanMessage(content=question)])
    
    # Append sources directly to the response content for simplicity in the chat UI
    sources_text = "\n\nSources:\n" + "\n".join(set([f"- {c['payload']['policy_name']} (v{c['payload']['version']} Pg {c['payload']['page_number']})" for c in chunks]))
    
    return {"messages": [AIMessage(content=response.content + sources_text)]}

# --- General HR & Off Topic ---
def general_hr(state: AgentState):
    return {"messages": [AIMessage(content="I can help with general HR questions. What do you need assistance with?")]}

def off_topic(state: AgentState):
    return {"messages": [AIMessage(content="I am an HR assistant and can only help with HR-related matters. How can I assist you with HR today?")]}


# --- Grievance Intake ---
class GrievanceExtraction(BaseModel):
    title: str = Field(description="A short title for the grievance")
    description: str = Field(description="Comprehensive summary of the issue")
    category: Literal["LEAVE", "PAYROLL", "ATTENDANCE", "WORKPLACE_CONDUCT", "BENEFITS", "OTHER"]
    priority: Literal["LOW", "MEDIUM", "HIGH"]
    is_complete: bool = Field(description="True if we have enough details (e.g. which month, what amount, who/what/when). False if ambiguous.")
    followup_question: str = Field(description="If is_complete is False, ask a question to get missing info. If True, leave empty.")

def grievance_intake(state: AgentState):
    llm = get_llm(temperature=0)
    
    # Extract recent conversation
    history = "\n".join([f"{m.type}: {m.content}" for m in state["messages"][-5:]])
    
    prompt = f"""Extract grievance details from the conversation.
Rules:
- Category must be one of: LEAVE, PAYROLL, ATTENDANCE, WORKPLACE_CONDUCT, BENEFITS, OTHER.
- Priority must be LOW, MEDIUM, or HIGH. Do NOT make final disciplinary/legal conclusions.
- Check required info: Payroll needs pay period/discrepancy. Leave needs date/issue. Workplace needs what/when/where.
- If missing vital info, set is_complete=False and provide followup_question.

Conversation:
{history}
"""
    
    structured_llm = llm.with_structured_output(GrievanceExtraction)
    try:
        extraction = structured_llm.invoke(prompt)
    except Exception:
        # Fallback if structured output fails
        extraction = GrievanceExtraction(
            title="Grievance", description=state["messages"][-1].content, 
            category="OTHER", priority="MEDIUM", is_complete=True, followup_question=""
        )

    if not extraction.is_complete:
        return {"messages": [AIMessage(content=extraction.followup_question)]}
    
    # It is complete, prepare confirmation
    # Let's search policy to see if relevant
    model = get_embedding_model()
    query_vector = list(model.embed([extraction.description]))[0]
    search_result = qdrant_client.query_points(
        collection_name=settings.QDRANT_COLLECTION,
        query=query_vector.tolist() if hasattr(query_vector, "tolist") else query_vector,
        limit=2,
        with_payload=True
    )
    
    policy_msg = ""
    sources = []
    if search_result.points and search_result.points[0].score > 0.4:
        policy_msg = f"\nRelevant Policy Found: {search_result.points[0].payload.get('policy_name')}"
        sources = [{"policy_name": hit.payload.get("policy_name"), "page": hit.payload.get("page_number")} for hit in search_result.points]

    summary = (
        f"I understood this as a **{extraction.category}** grievance.\n"
        f"**Proposed Priority:** {extraction.priority}\n"
        f"**Summary:** {extraction.description}\n"
        f"{policy_msg}\n\n"
        f"Would you like me to create this grievance for HR? (Yes/No)"
    )
    
    return {
        "messages": [AIMessage(content=summary)],
        "grievance_title": extraction.title,
        "grievance_description": extraction.description,
        "grievance_category": extraction.category,
        "grievance_priority": extraction.priority,
        "awaiting_confirmation": True,
        "policy_sources": sources
    }

from app.services.grievance_service import create_grievance_record
from app.schemas.grievance import GrievanceCreate

def handle_confirmation(state: AgentState):
    user_reply = state["messages"][-1].content.strip().lower()
    if user_reply in ['yes', 'y', 'sure', 'ok', 'create', 'confirm']:
        grievance_data = GrievanceCreate(
            title=state["grievance_title"],
            description=state["grievance_description"],
            category=state["grievance_category"],
            priority=state["grievance_priority"]
        )
        db_grievance = create_grievance_record(
            employee_id=state["employee_id"],
            grievance_data=grievance_data
        )
            
        return {
            "messages": [AIMessage(content=f"Your grievance has been created successfully. Ticket ID: {db_grievance.ticket_id}. HR will review it shortly.")],
            "awaiting_confirmation": False,
            "ticket_id": db_grievance.ticket_id
        }
    else:
        return {
            "messages": [AIMessage(content="Grievance creation cancelled. Let me know if you need anything else.")],
            "awaiting_confirmation": False
        }


# Build Graph
builder = StateGraph(AgentState)

builder.add_node("detect_intent", detect_intent)
builder.add_node("policy_query", policy_query)
builder.add_node("general_hr", general_hr)
builder.add_node("off_topic", off_topic)
builder.add_node("grievance_intake", grievance_intake)
builder.add_node("handle_confirmation", handle_confirmation)

builder.set_entry_point("detect_intent")
builder.add_conditional_edges(
    "detect_intent",
    route_intent,
    {
        "POLICY_QUERY": "policy_query",
        "GRIEVANCE": "grievance_intake",
        "GENERAL_HR": "general_hr",
        "OFF_TOPIC": "off_topic",
        "CONFIRMATION": "handle_confirmation"
    }
)

builder.add_edge("policy_query", END)
builder.add_edge("general_hr", END)
builder.add_edge("off_topic", END)
builder.add_edge("grievance_intake", END)
builder.add_edge("handle_confirmation", END)

memory = MemorySaver()
chat_graph = builder.compile(checkpointer=memory)
