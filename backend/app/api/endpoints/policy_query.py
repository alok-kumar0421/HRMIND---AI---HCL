from fastapi import APIRouter, Depends, HTTPException
from app.schemas.agent import PolicyQueryRequest, PolicyQueryResponse, SourceMetadata
from app.services.agent import qa_graph
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=PolicyQueryResponse)
def query_policy(request: PolicyQueryRequest, current_user = Depends(get_current_user)):
    try:
        # Run graph
        result = qa_graph.invoke({"question": request.question})
        
        answer = result.get("answer", "")
        sources_data = result.get("sources", [])
        
        sources = [SourceMetadata(**s) for s in sources_data]
        
        return PolicyQueryResponse(answer=answer, sources=sources)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
