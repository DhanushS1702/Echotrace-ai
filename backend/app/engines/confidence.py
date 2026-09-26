"""
Confidence Engine
-----------------
Measures how certain the AI response sounds.
A HIGH confidence score means the text makes direct, unhedged claims.
Score range: 0.0 (very uncertain) → 1.0 (very confident)
"""

import re

# Phrases that signal uncertainty / low confidence
_HEDGE_PATTERNS: list[str] = [
    r"\bI think\b",
    r"\bI believe\b",
    r"\bperhaps\b",
    r"\bmaybe\b",
    r"\bpossibly\b",
    r"\bprobably\b",
    r"\bit seems\b",
    r"\bit appears\b",
    r"\bmight\b",
    r"\bcould be\b",
    r"\bnot sure\b",
    r"\buncertain\b",
    r"\bapproximately\b",
    r"\baround\b",
    r"\broughly\b",
    r"\bin my opinion\b",
    r"\bas far as I know\b",
    r"\bto the best of my knowledge\b",
]

_HEDGE_RE = re.compile("|".join(_HEDGE_PATTERNS), re.IGNORECASE)


def analyze(text: str) -> dict:
    """Return confidence score and explanation."""
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    total = len(sentences) or 1

    hedge_matches = _HEDGE_RE.findall(text)
    hedge_count = len(hedge_matches)

    # Passive voice is a soft confidence signal
    passive_matches = re.findall(r"\b(is|are|was|were|be|been|being)\s+\w+ed\b", text, re.IGNORECASE)
    passive_count = len(passive_matches)

    hedge_ratio = hedge_count / total
    passive_ratio = passive_count / total

    # Raw confidence: fewer hedges and passive constructs → higher score
    raw = 1.0 - min(hedge_ratio * 0.6 + passive_ratio * 0.2, 1.0)
    score = round(max(0.0, min(raw, 1.0)), 4)

    if score >= 0.75:
        label = "high"
    elif score >= 0.50:
        label = "moderate"
    else:
        label = "low"

    explanation = (
        f"Detected {hedge_count} hedging phrase(s) and {passive_count} passive construction(s) "
        f"across {total} sentence(s). Confidence level is {label}."
    )

    return {"score": score, "explanation": explanation}
