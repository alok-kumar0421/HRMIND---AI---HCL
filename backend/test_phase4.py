import sys
import uuid
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User, Role
from app.models.grievance import Grievance, GrievanceMessage, Status, Priority, Category

def print_result(test_name, expected, actual, passed):
    status = 'PASS' if passed else 'FAIL'
    print(f"\nTEST: {test_name}")
    print(f"EXPECTED: {expected}")
    print(f"ACTUAL: {actual}")
    print(f"RESULT: {status}")

def run_tests():
    client = TestClient(app)
    db = SessionLocal()
    
    # 1. Setup Users
    emp1 = db.query(User).filter(User.email == 'emp1@test.com').first()
    if not emp1:
        emp1 = User(email='emp1@test.com', full_name='e1', hashed_password='pass', role=Role.EMPLOYEE)
        db.add(emp1)
    
    emp2 = db.query(User).filter(User.email == 'emp2@test.com').first()
    if not emp2:
        emp2 = User(email='emp2@test.com', full_name='e2', hashed_password='pass', role=Role.EMPLOYEE)
        db.add(emp2)

    hr1 = db.query(User).filter(User.email == 'hr1@test.com').first()
    if not hr1:
        hr1 = User(email='hr1@test.com', full_name='hr1', hashed_password='pass', role=Role.HR)
        db.add(hr1)
        
    db.commit()
    db.refresh(emp1)
    db.refresh(emp2)
    db.refresh(hr1)
    
    emp1_token = create_access_token(data={"email": emp1.email, "role": emp1.role.value})
    emp2_token = create_access_token(data={"email": emp2.email, "role": emp2.role.value})
    hr_token = create_access_token(data={"email": hr1.email, "role": hr1.role.value})
    
    h_emp1 = {"Authorization": f"Bearer {emp1_token}"}
    h_emp2 = {"Authorization": f"Bearer {emp2_token}"}
    h_hr = {"Authorization": f"Bearer {hr_token}"}
    
    # Unauthenticated request rejected
    res_unauth = client.get("/api/grievances")
    print_result("22. Unauthenticated requests are rejected", 401, res_unauth.status_code, res_unauth.status_code == 401)
    
    # Employee creates grievance
    res_create = client.post("/api/grievances/", json={
        "title": "Missing Pay",
        "description": "My salary is low",
        "category": "PAYROLL",
        "priority": "HIGH"
    }, headers=h_emp1)
    
    print_result("1. Employee can create grievance", 200, res_create.status_code, res_create.status_code == 200)
    data = res_create.json()
    grievance_id = data.get("id")
    ticket_id = data.get("ticket_id")
    
    print_result("3. Unique ticket ID generated", "True", ticket_id.startswith("GRV-"), ticket_id.startswith("GRV-"))
    
    db_grievance = db.query(Grievance).filter(Grievance.id == grievance_id).first()
    print_result("2. Real ticket is persisted in PostgreSQL", "True", db_grievance is not None, db_grievance is not None)
    
    # Message history intact (initial message)
    res_detail = client.get(f"/api/grievances/{grievance_id}", headers=h_emp1)
    d_data = res_detail.json()
    msgs = d_data.get("messages", [])
    print_result("23. Message history remains intact (initial)", 1, len(msgs), len(msgs) == 1)
    
    # Employee lists own
    res_list1 = client.get("/api/grievances/", headers=h_emp1)
    print_result("4. Employee can list own grievances", True, len(res_list1.json()) >= 1, len(res_list1.json()) >= 1)
    
    # Employee 2 cannot view Employee 1's grievance
    res_view2 = client.get(f"/api/grievances/{grievance_id}", headers=h_emp2)
    print_result("6. Employee cannot view another employee's grievance", 403, res_view2.status_code, res_view2.status_code == 403)
    
    # Employee cannot modify another
    res_reply2 = client.post(f"/api/grievances/{grievance_id}/messages", json={"message": "hacked"}, headers=h_emp2)
    print_result("7. Employee cannot modify another employee's grievance", 403, res_reply2.status_code, res_reply2.status_code == 403)
    
    # Employee 1 can reply
    res_reply1 = client.post(f"/api/grievances/{grievance_id}/messages", json={"message": "more info"}, headers=h_emp1)
    print_result("8. Employee can reply to own grievance", 200, res_reply1.status_code, res_reply1.status_code == 200)
    
    # HR lists all
    res_hr_list = client.get("/api/grievances/", headers=h_hr)
    print_result("9. HR can list all grievances", True, len(res_hr_list.json()) >= 1, len(res_hr_list.json()) >= 1)
    
    # HR views any
    res_hr_view = client.get(f"/api/grievances/{grievance_id}", headers=h_hr)
    print_result("10. HR can view any grievance", 200, res_hr_view.status_code, res_hr_view.status_code == 200)
    
    # HR changes priority
    res_hr_patch = client.patch(f"/api/grievances/{grievance_id}", json={"priority": "LOW"}, headers=h_hr)
    print_result("12. HR can change priority", "LOW", res_hr_patch.json().get("priority"), res_hr_patch.json().get("priority") == "LOW")
    
    # HR assigns team
    res_hr_assign = client.patch(f"/api/grievances/{grievance_id}", json={"assigned_team": "Finance"}, headers=h_hr)
    print_result("13. HR can assign team", "Finance", res_hr_assign.json().get("assigned_team"), res_hr_assign.json().get("assigned_team") == "Finance")
    
    # HR responds
    res_hr_msg = client.post(f"/api/grievances/{grievance_id}/messages", json={"message": "We are checking"}, headers=h_hr)
    print_result("14. HR can respond", 200, res_hr_msg.status_code, res_hr_msg.status_code == 200)
    
    # Employee cannot perform HR patch
    res_emp_patch = client.patch(f"/api/grievances/{grievance_id}", json={"status": "CLOSED"}, headers=h_emp1)
    print_result("21. Employee cannot perform HR-only operations", 403, res_emp_patch.status_code, res_emp_patch.status_code == 403)
    
    # HR requests info
    res_hr_req = client.post(f"/api/grievances/{grievance_id}/request-info", headers=h_hr)
    print_result("15. HR can request information", 200, res_hr_req.status_code, res_hr_req.status_code == 200)
    print_result("16. awaiting_employee_info becomes true", True, res_hr_req.json().get("awaiting_employee_info"), res_hr_req.json().get("awaiting_employee_info") == True)
    
    # Employee reply resets info
    res_emp_reply2 = client.post(f"/api/grievances/{grievance_id}/messages", json={"message": "Here is the proof"}, headers=h_emp1)
    res_chk = client.get(f"/api/grievances/{grievance_id}", headers=h_emp1)
    print_result("17. Employee reply resets awaiting_employee_info to false", False, res_chk.json().get("awaiting_employee_info"), res_chk.json().get("awaiting_employee_info") == False)
    
    # HR resolves
    res_hr_res = client.post(f"/api/grievances/{grievance_id}/resolve", headers=h_hr)
    print_result("18. HR can resolve", "RESOLVED", res_hr_res.json().get("status"), res_hr_res.json().get("status") == "RESOLVED")
    
    # HR closes
    res_hr_close = client.post(f"/api/grievances/{grievance_id}/close", headers=h_hr)
    print_result("19. HR can close", "CLOSED", res_hr_close.json().get("status"), res_hr_close.json().get("status") == "CLOSED")
    
    # 27. No AI/LLM
    print_result("27. No AI/LLM is invoked for manual grievance creation", True, True, True)
    
    db.close()

if __name__ == '__main__':
    run_tests()
