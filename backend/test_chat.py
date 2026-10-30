import requests
import json
from app.core.security import create_access_token

BASE_URL = "http://localhost:8000/api"

# Generate Employee Token
emp_token = create_access_token(data={"email": "emp1@test.com", "role": "EMPLOYEE"})
headers = {"Authorization": f"Bearer {emp_token}"}

queries = [
    "How many casual leaves are allowed per year?",
    "How many sick leaves are allowed per year?",
    "What is the company policy on bringing pets to work?"
]

print("=== Testing RAG Persistence ===")
for q in queries:
    print(f"\nQuery: {q}")
    payload = {"message": q}
    res = requests.post(f"{BASE_URL}/chat/", headers=headers, json=payload)
    if res.status_code == 200:
        data = res.json()
        print("Answer:", data.get("response", "No response field").replace("\n", " "))
    else:
        print(f"Error: {res.status_code} - {res.text}")

