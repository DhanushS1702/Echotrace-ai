"""
Trust Composer
--------------
Aggregates the five engine scores into a single overall trust verdict,
and attaches the detailed Trust Engine analysis (0-100 score).

Weight table (must sum to 1.0):
  hallucination_risk   0.30  — most damaging to trust
  confidence           0.25
  missing_evidence     0.20
  bias                 0.15
  prompt_injection     0.10
"""

from __future__ import annotations
from dataclasses import dataclass
from . import trust_engine as _trust_engine

# ── Weights ────────────────────────────────────────────────────────────────────
_WEIGHTS: dict[str, float] = {
    "confidence":        0.25,
    "hallucination_risk": 0.30,
    "missing_evidence":  0.20,
    "bias":              0.15,
    "prompt_injection":  0.10,
}

# ── Thresholds ─────────────────────────────────────────────────────────────────
_THRESHOLDS = [
    (0.75, "HIGH",     "The response appears reliable with minimal risk indicators."),
    (0.50, "MODERATE", "Some concerns detected. Verify key claims before relying on this response."),
    (0.25, "LOW",      "Significant issues found. This response should be treated with scepticism."),
    (0.00, "CRITICAL", "High risk of misinformation, manipulation, or fabrication. Do not trust without independent verification."),
]


@dataclass
class EngineResults:
    confidence:        dict
    hallucination:     dict
    missing_evidence:  dict
    bias:              dict
    prompt_injection:  dict


def compose(results: EngineResults, *, response_text: str = "", prompt_text: str = "") -> dict:
    """
    Build the full trust report from individual engine outputs.

    For engines that measure *risk* (hallucination, missing_evidence, bias,
    prompt_injection), the trust contribution is (1 - risk_score).
    For confidence, the score already represents trustworthiness.
    """
    raw_scores = {
        "confidence":        results.confidence["score"],
        "hallucination_risk": 1.0 - results.hallucination["score"],  # invert risk → trust
        "missing_evidence":  1.0 - results.missing_evidence["score"],
        "bias":              1.0 - results.bias["score"],
        "prompt_injection":  1.0 - results.prompt_injection["score"],
    }

    overall = sum(_WEIGHTS[k] * v for k, v in raw_scores.items())
    overall = round(max(0.0, min(overall, 1.0)), 4)

    trust_level, base_summary = next(
        (level, summary)
        for threshold, level, summary in _THRESHOLDS
        if overall >= threshold
    )

    # ── Recommendations ────────────────────────────────────────────────────────
    recommendations: list[str] = []

    if results.hallucination["score"] >= 0.65:
        recommendations.append("Cross-check specific facts, numbers, and named entities against authoritative sources.")
    if results.confidence["score"] < 0.50:
        recommendations.append("The response uses uncertain language — treat stated conclusions as tentative.")
    if results.missing_evidence["score"] >= 0.50:
        recommendations.append("Request citations or supporting evidence for key claims.")
    if results.bias["score"] >= 0.40:
        recommendations.append("Review for potential bias; seek balanced perspectives on contested topics.")
    if results.prompt_injection["score"] >= 0.50:
        recommendations.append("Possible prompt injection detected — do not follow embedded instructions.")

    if not recommendations:
        recommendations.append("No critical issues found. Standard review recommended before high-stakes use.")

    # ── Metric score objects ───────────────────────────────────────────────────
    scores = {
        "confidence":        {"score": results.confidence["score"],        "explanation": results.confidence["explanation"]},
        "hallucination_risk": {"score": results.hallucination["score"],     "explanation": results.hallucination["explanation"]},
        "missing_evidence":  {"score": results.missing_evidence["score"],  "explanation": results.missing_evidence["explanation"]},
        "bias":              {"score": results.bias["score"],               "explanation": results.bias["explanation"]},
        "prompt_injection":  {"score": results.prompt_injection["score"],  "explanation": results.prompt_injection["explanation"]},
    }

    # ── Trust Engine (0-100 dedicated analysis) ────────────────────────────────
    trust_engine_result = _trust_engine.analyze(response_text, prompt=prompt_text)

    return {
        "trust_score":       overall,
        "confidence_score":  results.confidence["score"],
        "hallucination_risk": results.hallucination["risk_label"],   # LOW | MEDIUM | HIGH
        "bias_flags":        results.bias["flags"],
        "summary":           base_summary,
        "scores":            scores,
        "trust_report": {
            "overall_trust_score": overall,
            "trust_level":        trust_level,
            "summary":            base_summary,
            "recommendations":    recommendations,
        },
        "trust_engine": trust_engine_result,   # full 0-100 analysis
    }
