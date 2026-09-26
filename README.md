# EchoTrace AI

> **AI Transparency & Trust Analysis Platform** — IBM Bob 2.0 Hackathon

EchoTrace analyses any AI-generated response for confidence, hallucination risk, bias, missing evidence, prompt injection, contradictions, and overconfident statements — then generates a 0–100 trust score and a downloadable PDF report.

---

## Features

| Signal | Description |
|---|---|
| 🎯 Confidence Score | Hedge-word and passive-voice analysis |
| ⚠️ Hallucination Risk | Specific claims without citations |
| 🔎 Missing Evidence | Unsupported factual assertions |
| ⚖️ Bias Detection | Political language, emotional amplifiers, generalisations |
| 🛡️ Prompt Injection | Jailbreak and instruction-override patterns |
| 🔁 Contradictions | Self-opposing statements within the same response |
| 📢 Overconfidence | Absolute certainty language without basis |
| 📋 PDF Report | Styled downloadable report with all findings |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI + Uvicorn |
| Database | SQLite + SQLAlchemy ORM |
| PDF | ReportLab |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL / CORS_ORIGINS if needed
pip install -r requirements.txt
uvicorn app.main:app --reload  # http://localhost:8000
```

> Set `DEBUG=true` in `.env` to enable `/docs` (Swagger UI).

### Frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze` | Full 5-engine analysis + DB persist |
| `POST` | `/trust-analysis` | Stateless 6-detector trust analysis |
| `GET` | `/report/{id}` | Retrieve a saved analysis |
| `GET` | `/report/{id}/pdf` | Download analysis as PDF |
| `GET` | `/history` | Paginated analysis history |
| `DELETE` | `/history/{id}` | Delete an analysis record |
| `GET` | `/health` | Liveness check |

---

## Project Structure

```
echotrace-ai/
├── backend/
│   ├── app/
│   │   ├── engines/          # Analysis engines (confidence, hallucination, bias…)
│   │   ├── routers/          # FastAPI route handlers
│   │   ├── utils/            # PDF builder
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── crud.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/       # ScoreGauge, RiskCard, TrustBadge, Navbar…
        ├── pages/            # Home, Analysis, Reports
        ├── api/              # Axios client
        └── utils/            # Trust level helpers, formatters
```

---

## Built with IBM Bob 2.0

This project was architected and built entirely using **IBM Bob** — IBM's AI software engineer.
Bob contributed:

- Full system architecture and Mermaid diagrams
- 22 Python files (1,878 lines) across engines, routers, schemas, and DB layer
- 13 React components and pages (1,003 lines)
- A 17-issue security, performance, and code-quality audit with automated fixes
- PDF report generation with custom ReportLab flowables

---

*EchoTrace AI — IBM Bob 2.0 Hackathon submission*
