from datetime import datetime
from pydantic import BaseModel, Field


# ── Request ────────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000, description="Original prompt sent to the AI")
    response: str = Field(..., min_length=1, max_length=16000, description="AI-generated response to analyze")


# ── Sub-objects ────────────────────────────────────────────────────────────────

class MetricScore(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    explanation: str


class TrustReport(BaseModel):
    overall_trust_score: float = Field(..., ge=0.0, le=1.0)
    trust_level: str  # HIGH | MODERATE | LOW | CRITICAL
    summary: str
    recommendations: list[str]


# ── Trust Engine sub-schemas ───────────────────────────────────────────────────

class UnsupportedClaimsSignal(BaseModel):
    count: int
    matches: list[str]
    evidence_count: int
    net_unsupported: int
    penalty: int
    explanation: str


class UncertaintyWordsSignal(BaseModel):
    count: int
    matches: list[str]
    penalty: int
    explanation: str


class MissingEvidenceSignal(BaseModel):
    unsupported_sentence_count: int
    total_sentences: int
    factual_sentence_count: int
    penalty: int
    explanation: str


class ClaimSpecificitySignal(BaseModel):
    specific_claim_count: int
    evidence_count: int
    net_unsourced: int
    penalty: int
    explanation: str


# ── New signal schemas (detectors added in v2) ────────────────────────────────

class ContradictionsSignal(BaseModel):
    count: int
    pairs: list[str]
    penalty: int
    explanation: str


class OverconfidenceSignal(BaseModel):
    count: int
    matches: list[str]
    penalty: int
    explanation: str


class MissingCitationsSignal(BaseModel):
    factual_sentence_count: int
    citation_count: int
    uncited_count: int
    penalty: int
    explanation: str


class TrustEngineSignals(BaseModel):
    unsupported_claims: UnsupportedClaimsSignal
    uncertainty_words: UncertaintyWordsSignal
    missing_evidence: MissingEvidenceSignal
    claim_specificity: ClaimSpecificitySignal
    contradictions: ContradictionsSignal
    overconfidence: OverconfidenceSignal
    missing_citations: MissingCitationsSignal


class TrustEngineResult(BaseModel):
    """
    Output of the dedicated Trust Engine (v2 — 6 detectors + prompt-aware).
    trust_score is an integer 0–100 (higher = more trustworthy).
    """
    trust_score: int = Field(..., ge=0, le=100, description="0–100 trust score")
    trust_level: str                   # HIGH | MODERATE | LOW | CRITICAL
    hallucination_risk: str            # LOW | MEDIUM | HIGH
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    signals: TrustEngineSignals
    recommendations: list[str]
    summary: str
    explanation: str


# ── Dedicated /trust-analysis endpoint schemas ────────────────────────────────

class TrustAnalysisRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000,
                        description="Original prompt sent to the AI")
    response: str = Field(..., min_length=1, max_length=16000,
                          description="AI-generated response to analyze")


class TrustAnalysisResponse(BaseModel):
    """
    Response shape for POST /trust-analysis.
    Matches the exact output contract from the task spec.
    """
    trust_score: int = Field(..., ge=0, le=100,
                             description="Overall trust score 0–100")
    hallucination_risk: str   = Field(..., description="LOW | MEDIUM | HIGH")
    confidence_score: float   = Field(..., ge=0.0, le=1.0,
                                      description="Response confidence 0.0–1.0")
    trust_level: str          = Field(..., description="HIGH | MODERATE | LOW | CRITICAL")
    explanation: str          = Field(..., description="Human-readable analysis summary")
    summary: str              = Field(..., description="One-sentence verdict")
    recommendations: list[str]
    signals: TrustEngineSignals


# ── Primary Response ───────────────────────────────────────────────────────────

class AnalyzeResponse(BaseModel):
    id: str
    trust_score: float = Field(..., ge=0.0, le=1.0)
    hallucination_risk: str          # LOW | MEDIUM | HIGH
    bias_flags: list[str]
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    summary: str
    # Extended detail (engines breakdown)
    scores: dict[str, MetricScore]
    trust_report: TrustReport
    trust_engine: TrustEngineResult   # dedicated 0-100 trust analysis
    created_at: datetime

    model_config = {"from_attributes": True}


# ── History ────────────────────────────────────────────────────────────────────

class AnalysisSummary(BaseModel):
    id: str
    trust_score: float
    hallucination_risk: str
    confidence_score: float
    summary: str
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: list[AnalysisSummary]


# ── LLM Pipeline Schemas ──────────────────────────────────────────────────────

class LLMPipelineRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000, description="User question or prompt for the LLM")
    model: str = Field("google-gemini", description="LLM model key: google-gemini, gemini-2.0-flash, gemini-1.5-flash")
    api_key: str | None = Field(None, description="Optional custom Google Gemini API key. If empty, free Google Gemini engine is used.")


class LLMPipelineResponse(AnalyzeResponse):
    question: str
    llm_model: str
    llm_provider: str
    generated_response: str
    generation_time_ms: float
    pipeline_source: str

