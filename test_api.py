import os
import sys

# Dynamically resolve path to backend directory containing 'app'
current_dir = os.path.dirname(os.path.abspath(__file__))
candidates = [
    os.path.join(current_dir, "backend"),
    current_dir,
    os.path.abspath(os.path.join(current_dir, "..")),
    os.path.abspath(os.path.join(current_dir, "..", "backend")),
]

for candidate in candidates:
    if os.path.isdir(os.path.join(candidate, "app")):
        if candidate not in sys.path:
            sys.path.insert(0, candidate)
        break

from fastapi.testclient import TestClient
from app.main import app

with TestClient(app) as client:
    print("1. Testing POST /analyze...")
    res_analyze = client.post("/analyze", json={
        "prompt": "What is Python?",
        "response": "Python is a high-level programming language created by Guido van Rossum."
    })
    print("POST /analyze status:", res_analyze.status_code)
    assert res_analyze.status_code in (200, 201), res_analyze.text
    data = res_analyze.json()
    analysis_id = data["id"]
    print("Created analysis ID:", analysis_id)

    print("\n2. Testing GET /history...")
    res_history = client.get("/history")
    print("GET /history status:", res_history.status_code)
    assert res_history.status_code == 200, res_history.text
    history_data = res_history.json()
    print("Total history count:", history_data["total"])
    print("First item summary:", history_data["items"][0]["summary"])

    print("\n3. Testing GET /report/{id}...")
    res_report = client.get(f"/report/{analysis_id}")
    print("GET /report status:", res_report.status_code)
    assert res_report.status_code == 200, res_report.text

    print("\n4. Testing GET /report/{id}/pdf...")
    res_pdf = client.get(f"/report/{analysis_id}/pdf")
    print("GET /report/pdf status:", res_pdf.status_code)
    assert res_pdf.status_code == 200, res_pdf.text
    print("PDF length:", len(res_pdf.content))

    print("\n5. Testing POST /trust-analysis...")
    res_trust = client.post("/trust-analysis", json={
        "prompt": "What is Python?",
        "response": "Python is a high-level programming language created by Guido van Rossum."
    })
    print("POST /trust-analysis status:", res_trust.status_code)
    assert res_trust.status_code == 200, res_trust.text

    print("\n6. Testing POST /llm/generate-and-analyze...")
    res_llm = client.post("/llm/generate-and-analyze", json={
        "question": "What is Quantum Computing?",
        "model": "ibm-granite"
    })
    print("POST /llm/generate-and-analyze status:", res_llm.status_code)
    assert res_llm.status_code in (200, 201), res_llm.text
    llm_data = res_llm.json()
    print("Generated Text:", llm_data["generated_response"][:80] + "...")
    print("Trust Score:", llm_data["trust_score"])

    print("\n7. Testing DELETE /history/{id}...")
    res_del_act = client.delete(f"/history/{analysis_id}")
    print("DELETE /history status:", res_del_act.status_code)
    assert res_del_act.status_code == 204, res_del_act.text

    print("\nALL API TESTS PASSED SUCCESSFULLY!")
