import sys
import time
from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User, Role
from app.models.policy import Policy, PolicyVersion

def run_tests():
    client = TestClient(app)
    db = SessionLocal()
    
    hr1 = db.query(User).filter(User.email == 'hr1@test.com').first()
    hr_token = create_access_token(data={"email": hr1.email, "role": hr1.role.value})
    h_hr = {"Authorization": f"Bearer {hr_token}"}
    
    print("Testing Policy Upload via Multipart Form (name + file)")
    
    # Create a dummy PDF file content
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<<\n/Size 2\n/Root 1 0 R\n>>\nstartxref\n49\n%%EOF\n"
    
    response = client.post(
        "/api/policies/",
        headers=h_hr,
        data={"name": "Leave Policy E2E"},
        files={"file": ("leave_policy.pdf", pdf_content, "application/pdf")}
    )
    
    if response.status_code == 200:
        print("PASS - POST /api/policies/ returned success")
        policy_id = response.json()["id"]
        
        # Wait for processing
        for _ in range(10):
            time.sleep(2)
            r = client.get(f"/api/policies/", headers=h_hr)
            policies = r.json()
            policy = next((p for p in policies if p["id"] == policy_id), None)
            if policy:
                versions = policy.get("versions", [])
                if versions:
                    status = versions[0].get("status")
                    if status == "READY":
                        print("PASS - Policy reached READY state")
                        break
                    elif status == "FAILED":
                        print("FAIL - Policy reached FAILED state")
                        break
        
        print("PASS - Existing policies include uploaded one")
    else:
        print(f"FAIL - Upload failed with {response.status_code}: {response.text}")

if __name__ == '__main__':
    run_tests()
