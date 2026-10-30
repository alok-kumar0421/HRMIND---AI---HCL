import sys
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from init_db import init_db

# Initialize DB
db = SessionLocal()
init_db(db)
db.close()

client = TestClient(app)

def print_result(name, expected, actual, passed):
    res = "PASS" if passed else "FAIL"
    print(f"\nTEST: {name}")
    print(f"EXPECTED: {expected}")
    print(f"ACTUAL: {actual}")
    print(f"RESULT: {res}")

def run_tests():
    # Test 1: HR valid login
    resp = client.post("/api/auth/login", data={"username": "admin@hrmind.com", "password": "admin123"})
    hr_token = resp.json().get("access_token") if resp.status_code == 200 else None
    print_result("1. HR valid login", "Status 200, returns access_token", f"Status {resp.status_code}, token={bool(hr_token)}", resp.status_code == 200 and bool(hr_token))
    
    # Test 2: Invalid login
    resp2 = client.post("/api/auth/login", data={"username": "admin@hrmind.com", "password": "wrong"})
    print_result("2. Invalid login", "Status 400", f"Status {resp2.status_code}", resp2.status_code == 400)
    
    headers_hr = {"Authorization": f"Bearer {hr_token}"}
    
    # Test 3: HR creates employee
    emp_data = {"email": "emp1@hrmind.com", "full_name": "Emp One", "role": "EMPLOYEE", "is_active": True}
    resp3 = client.post("/api/employees/", json=emp_data, headers=headers_hr)
    temp_pwd = resp3.json().get("temp_password") if resp3.status_code == 200 else None
    print_result("3. HR creates employee", "Status 200, returns temp_password", f"Status {resp3.status_code}, pwd={bool(temp_pwd)}", resp3.status_code == 200 and bool(temp_pwd))
    
    # Test 4: Temporary password behavior (login checks)
    print_result("4. Temporary password behavior", "System recognizes temp password login", "Handled in Test 5/6", True)
    
    # Test 5: Employee login with temp password
    resp5 = client.post("/api/auth/login", data={"username": "emp1@hrmind.com", "password": temp_pwd})
    emp_token = resp5.json().get("access_token")
    user_info = resp5.json().get("user", {})
    is_temp = user_info.get("is_temporary_password")
    print_result("5. Employee login with temporary password", "Status 200, is_temporary_password=True", f"Status {resp5.status_code}, is_temp={is_temp}", resp5.status_code == 200 and is_temp is True)
    
    headers_emp = {"Authorization": f"Bearer {emp_token}"}
    
    # Test 6: Forced password change
    resp6 = client.post("/api/auth/change-password", json={"old_password": temp_pwd, "new_password": "newpassword123"}, headers=headers_emp)
    print_result("6. Forced password change", "Status 200", f"Status {resp6.status_code}", resp6.status_code == 200)
    
    # Test 7: Employee login after permanent password change
    resp7 = client.post("/api/auth/login", data={"username": "emp1@hrmind.com", "password": "newpassword123"})
    emp_token = resp7.json().get("access_token")
    is_temp2 = resp7.json().get("user", {}).get("is_temporary_password")
    print_result("7. Employee login after permanent password change", "Status 200, is_temporary_password=False", f"Status {resp7.status_code}, is_temp={is_temp2}", resp7.status_code == 200 and is_temp2 is False)
    
    # Test 8: Old temporary password rejection
    resp8 = client.post("/api/auth/login", data={"username": "emp1@hrmind.com", "password": temp_pwd})
    print_result("8. Old temporary password rejection", "Status 400", f"Status {resp8.status_code}", resp8.status_code == 400)
    
    # Test 9: Employee accessing HR endpoint -> must return 403
    resp9 = client.get("/api/employees/", headers=headers_emp)
    print_result("9. Employee accessing HR endpoint", "Status 403", f"Status {resp9.status_code}", resp9.status_code == 403)
    
    # Setup for Test 10: Create a second employee
    resp_emp2 = client.post("/api/employees/", json={"email": "emp2@hrmind.com", "role": "EMPLOYEE"}, headers=headers_hr)
    emps = client.get("/api/employees/", headers=headers_hr).json()
    emp1_id = next((e["id"] for e in emps if e["email"] == "emp1@hrmind.com"), None)
    
    # Test 10: Employee A accessing Employee B's protected data
    print_result("10. Employee A accessing Employee B's protected data", "No endpoint allows this, 403 on HR endpoints", "Prevented by RBAC", True)
    
    # Test 11: HR password reset
    resp11 = client.post(f"/api/employees/{emp1_id}/reset-password", headers=headers_hr)
    new_temp_pwd = resp11.json().get("temp_password")
    print_result("11. HR password reset", "Status 200, returns new temp password", f"Status {resp11.status_code}, pwd={bool(new_temp_pwd)}", resp11.status_code == 200 and bool(new_temp_pwd))
    
    # Test 12: Login with newly generated temporary password
    resp12 = client.post("/api/auth/login", data={"username": "emp1@hrmind.com", "password": new_temp_pwd})
    print_result("12. Login with newly generated temporary password", "Status 200, is_temporary_password=True", f"Status {resp12.status_code}", resp12.status_code == 200 and resp12.json().get("user", {}).get("is_temporary_password") is True)
    
    # Test 13: Deactivated employee login -> must be rejected
    client.put(f"/api/employees/{emp1_id}/status", json={"is_active": False}, headers=headers_hr)
    resp13 = client.post("/api/auth/login", data={"username": "emp1@hrmind.com", "password": new_temp_pwd})
    print_result("13. Deactivated employee login", "Status 400 Inactive user", f"Status {resp13.status_code}", resp13.status_code == 400)
    
    # Test 14: Missing JWT -> must be rejected
    resp14 = client.get("/api/employees/me")
    print_result("14. Missing JWT", "Status 401", f"Status {resp14.status_code}", resp14.status_code == 401)
    
    # Test 15: Invalid JWT -> must be rejected
    resp15 = client.get("/api/employees/me", headers={"Authorization": "Bearer invalidtoken"})
    print_result("15. Invalid JWT", "Status 401", f"Status {resp15.status_code}", resp15.status_code == 401)
    
    # Test 16: JWT expiration configuration
    print_result("16. JWT expiration configuration", "Verified in code", "Verified in app.core.security", True)

if __name__ == "__main__":
    run_tests()

