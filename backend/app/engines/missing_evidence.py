"""
Missing Evidence Engine
-----------------------
Identifies unsupported factual assertions — claims that would require
a source but have none. High score = many unsupported claims.
Score range: 0.0 (well-supported) → 1.0 (no evidence)
"""

import re

# Patterns that signal a factual assertion is being made
_ASSERTION_PATTERNS = re.compile(
    r"\b(studies show|research shows|it is proven|data shows|statistics show|"
    r"experts say|scientists say|doctors say|according to experts|"
    r"it has been shown|evidence suggests|facts show|history shows)\b",
    re.IGNORECASE,
)

# Patterns that signal actual evidence IS present
_EVIDENCE_PATTERNS = re.compile(
    r"\b(according to|cited in|published in|source:|reference:|see also|"
    r"as reported by|in the study|DOI|ISBN|URL|https?://|arXiv)\b",
    re.IGNORECASE,
)


def analyze(text: str) -> dict:
    """Return missing-evidence score and explanation."""
    assertions = len(_ASSERTION_PATTERNS.findall(text))
    evidence   = len(_EVIDENCE_PATTERNS.findall(text))

    # If more assertions than evidence markers → higher risk
    unsupported = max(0, assertions - evidence)

    # Also penalise if the text makes many numeric claims without any source
    numeric_claims = len(re.findall(r"\b\d+(\.\d+)?\s*(%|million|billion|thousand|people|cases|deaths)\b",
                                    text, re.IGNORECASE))
    unsupported += max(0, numeric_claims - evidence)

    total_sentences = max(len(re.split(r"[.!?]+", text)), 1)
    raw = min(unsupported / total_sentences, 1.0)
    score = round(max(0.0, min(raw, 1.0)), 4)

    explanation = (
        f"Found {assertions} assertion phrase(s) and {numeric_claims} numeric claim(s) "
        f"with only {evidence} supporting evidence marker(s). "
        f"{unsupported} claim(s) appear unsupported."
    )

    return {"score": score, "explanation": explanation}
