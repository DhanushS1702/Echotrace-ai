from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base
from .routers import analyze, history, report, trust_analysis


from sqlalchemy import text


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Create tables once at startup — not at module import time
    Base.metadata.create_all(bind=engine)
    # Ensure missing columns in existing SQLite DB tables are migrated cleanly
    with engine.connect() as conn:
        try:
            res = conn.execute(text("PRAGMA table_info(analyses)"))
            cols = [row[1] for row in res.fetchall()]
            if "recommendations" not in cols:
                conn.execute(text("ALTER TABLE analyses ADD COLUMN recommendations TEXT"))
                conn.commit()
        except Exception as e:
            print(f"[Startup Migration Warning]: {e}")
    yield


# Disable interactive docs in production (S1)
_docs_url   = "/docs"  if settings.DEBUG else None
_redoc_url  = "/redoc" if settings.DEBUG else None

app = FastAPI(
    title="EchoTrace AI",
    description=(
        "AI Transparency and Trust Analysis Platform. "
        "Analyze AI-generated responses for confidence, hallucination risk, "
        "bias, missing evidence, and prompt injection."
    ),
    version="1.0.0",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(analyze.router)
app.include_router(history.router)
app.include_router(report.router)
app.include_router(trust_analysis.router)


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "echotrace-ai"}
