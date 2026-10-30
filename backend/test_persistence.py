import time
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv('.env')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.policy import Policy, PolicyVersion
from app.services.storage import get_supabase_client

BASE_URL = "http://localhost:8000/api"

print("1. Get PDF from Supabase")
engine = create_engine(settings.DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()
leave_policy_doc = db.query(PolicyVersion).filter(PolicyVersion.status == 'READY').first()
if not leave_policy_doc:
    print("NO READY POLICY FOUND IN DB")
    sys.exit(1)

policy_id_to_delete = leave_policy_doc.policy_id

supabase = get_supabase_client()
res = supabase.storage.from_(settings.SUPABASE_STORAGE_BUCKET).download(leave_policy_doc.storage_path)
with open("Leave-Policy.pdf", "wb") as f:
    f.write(res)
print("Saved Leave-Policy.pdf locally.")

# Skip Auth token since hr1@test.com hash might be mock in my local db - I will generate it directly
from app.core.security import create_access_token
hr_token = create_access_token(data={"email": "hr1@test.com", "role": "HR"})
headers = {"Authorization": f"Bearer {hr_token}"}

print("2. Deleting old policy via API...")
requests.delete(f"{BASE_URL}/policies/{policy_id_to_delete}", headers=headers)

print("3. Uploading Leave-Policy.pdf via API (Simulating UI)...")
files = {
    'file': ('Leave-Policy.pdf', open('Leave-Policy.pdf', 'rb'), 'application/pdf')
}
data = {
    'name': 'Leave policy'
}
res = requests.post(f"{BASE_URL}/policies/", headers=headers, files=files, data=data)
if res.status_code != 200:
    print(f"Failed to upload: {res.text}")
    sys.exit(1)

print("Upload successful, waiting for processing to complete...")
time.sleep(8) # Wait for background task

print("Check status in DB:")
new_policy = db.query(PolicyVersion).filter(PolicyVersion.status == 'READY').first()
if new_policy:
    print(f"New Policy Version ID: {new_policy.id}, Status: READY")
else:
    print("New Policy NOT READY YET")

