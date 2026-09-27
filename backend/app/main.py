from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback

from .config import settings
from .database import engine, Base
from .routers import analyze, history, report, trust_analysis, llm_pipeline, live_analysis


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

# ── Global Exception Handler ───────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc) or exc.__class__.__name__
    print(f"[Global Server Error on {request.url.path}]: {error_msg}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal Server Error: {error_msg}",
            "error_type": exc.__class__.__name__
        }
    )

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers (Supported with and without /api prefix) ──────────────────────────
app.include_router(live_analysis.router)
app.include_router(live_analysis.router, prefix="/api")

app.include_router(analyze.router)
app.include_router(analyze.router, prefix="/api")

app.include_router(history.router)
app.include_router(history.router, prefix="/api")

app.include_router(report.router)
app.include_router(report.router, prefix="/api")

app.include_router(trust_analysis.router)
app.include_router(trust_analysis.router, prefix="/api")

app.include_router(llm_pipeline.router)
app.include_router(llm_pipeline.router, prefix="/api")



# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "echotrace-ai"}
