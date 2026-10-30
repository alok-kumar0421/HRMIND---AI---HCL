import requests
import json
from app.core.security import create_access_token

BASE_URL = "http://localhost:8000/api"

hr_token = create_access_token(data={"email": "hr1@test.com", "role": "HR"})
headers = {"Authorization": f"Bearer {hr_token}"}

res = requests.get(f"{BASE_URL}/grievances/", headers=headers)
print(f"GET /grievances/ -> Status: {res.status_code}")
if res.status_code == 200:
    print(f"Count: {len(res.json())}")

res_no_slash = requests.get(f"{BASE_URL}/grievances", headers=headers)
print(f"GET /grievances -> Status: {res_no_slash.status_code}")

