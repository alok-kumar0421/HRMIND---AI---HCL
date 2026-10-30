import sys
import os
import json
import uuid
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal, Base, engine
from app.core.security import create_access_token
from app.models.user import User, Role

def print_result(test_name, expected, actual, passed):
    status = 'PASS' if passed else 'FAIL'
    print(f"\nTEST: {test_name}")
    print(f"EXPECTED: {expected}")
    print(f"ACTUAL: {actual}")
    print(f"RESULT: {status}")

def run_tests():
    client = TestClient(app)
    db = SessionLocal()
    
    # 1. Setup Data
    # Assuming Qdrant memory is clean, let's insert a dummy policy vector.
    from app.services.rag import qdrant_client, get_embedding_model, init_qdrant_collection
    from qdrant_client.models import PointStruct
    init_qdrant_collection()
    
    model = get_embedding_model()
    dummy_text = "Employees are allowed exactly 12 casual leaves per year."
    query_vector = list(model.embed([dummy_text]))[0]
    
    doc_id = str(uuid.uuid4())
    qdrant_client.upsert(
        collection_name="hrmind_policies",
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector=query_vector.tolist() if hasattr(query_vector, "tolist") else query_vector,
                payload={
                    "document_id": doc_id,
                    "policy_name": "Test Leave Policy",
                    "version": 1,
                    "filename": "leave.pdf",
                    "page_number": 1,
                    "chunk_id": f"{doc_id}_1_0",
                    "source": "leave.pdf",
                    "text": dummy_text
                }
            )
        ]
    )
    
    # Check users
    emp = db.query(User).filter(User.email == 'emp@test.com').first()
    if not emp:
        from app.core.security import get_password_hash
        emp = User(email='emp@test.com', full_name='emp1', hashed_password=get_password_hash('pass'), role=Role.EMPLOYEE)
        db.add(emp)
    
    hr = db.query(User).filter(User.email == 'hr@test.com').first()
    if not hr:
        hr = User(email='hr@test.com', full_name='hr1', hashed_password=get_password_hash('pass'), role=Role.HR)
        db.add(hr)
    
    db.commit()
    
    emp_token = create_access_token(data={"email": emp.email, "role": emp.role.value})
    hr_token = create_access_token(data={"email": hr.email, "role": hr.role.value})
    
    # 3. Unauthenticated request rejected
    res = client.post("/api/policy/query/", json={"question": "leaves?"})
    print_result("3. Unauthenticated request rejected", "Status 401", f"Status {res.status_code}", res.status_code == 401)
    
    # 1. Authenticated employee can ask policy question
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    res_emp = client.post("/api/policy/query/", json={"question": "How many casual leaves per year?"}, headers=emp_headers)
    
    if res_emp.status_code == 500 and "api_key" in res_emp.text:
        print_result("1. Authenticated employee can ask policy question", "Status 200", f"Status 500 - Missing Groq API Key", False)
        print_result("6. Relevant policy question returns grounded answer", "Contains '12'", "NOT EXECUTED", False)
        print_result("7. Answer contains source metadata", "Length > 0", "NOT EXECUTED", False)
        print_result("11. Secrets are not exposed", "False", "NOT EXECUTED", False)
    else:
        print_result("1. Authenticated employee can ask policy question", "Status 200", f"Status {res_emp.status_code} - {res_emp.text}", res_emp.status_code == 200)
        
        if res_emp.status_code == 200:
            data = res_emp.json()
            print_result("6. Relevant policy question returns grounded answer", "Contains '12'", data["answer"], "12" in data["answer"])
            print_result("7. Answer contains source metadata", "Length > 0", f"Length {len(data.get('sources', []))}", len(data.get("sources", [])) > 0)
            
            # 11. Secrets are not exposed
            keys = set(data.keys())
            has_secret = any("secret" in k.lower() or "key" in k.lower() for k in keys)
            print_result("11. Secrets are not exposed", "False", f"{has_secret}", not has_secret)
        
    # 2. HR can ask policy question
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    res_hr = client.post("/api/policy/query/", json={"question": "What is the leave limit?"}, headers=hr_headers)
    
    if res_hr.status_code == 500 and "api_key" in res_hr.text:
        print_result("2. HR can ask policy question", "Status 200", f"Status 500 - Missing Groq API Key", False)
    else:
        print_result("2. HR can ask policy question", "Status 200", f"Status {res_hr.status_code}", res_hr.status_code == 200)
    
    # 8. Out-of-policy question / 9. Irrelevant retrieval
    res_irr = client.post("/api/policy/query/", json={"question": "What is the recipe for cake?"}, headers=emp_headers)
    if res_irr.status_code == 500 and "api_key" in res_irr.text:
        print_result("8/9. Irrelevant retrieval results produce no-policy response", "I couldn't find this", "NOT EXECUTED", False)
    else:
        data_irr = res_irr.json()
        expected_msg = "I couldn't find this in the available HR policies."
        print_result("8/9. Irrelevant retrieval results produce no-policy response", expected_msg, data_irr.get("answer", ""), expected_msg in data_irr.get("answer", ""))
    
    db.close()

if __name__ == '__main__':
    run_tests()
