"""
Hallucination Engine
--------------------
Estimates the probability that the response contains fabricated or
unverifiable claims (specific numbers, dates, names, citations).
Score range: 0.0 (low risk) → 1.0 (high risk)
"""

import re

# Patterns that typically signal a verifiable (and potentially fabricated) claim
_SPECIFIC_NUMBER = re.compile(r"\b\d{4,}\b")                          # large numbers e.g. 12,000
_PERCENTAGE      = re.compile(r"\b\d+(\.\d+)?\s*%")                   # percentages
_DATE_PATTERN    = re.compile(r"\b(January|February|March|April|May|June|July|August|"
                               r"September|October|November|December)\s+\d{1,2},?\s+\d{4}\b",
                               re.IGNORECASE)
_CITATION        = re.compile(r"\b(according to|cited by|as reported by|source:|ref\.)\b",
                               re.IGNORECASE)
_PROPER_NOUN     = re.compile(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b")  # multi-word proper nouns

# Words that signal the model is explicitly hedging its factual claims
_FABRICATION_SIGNALS = re.compile(
    r"\b(I made up|I fabricated|not verified|may not be accurate|hallucin|fictional)\b",
    re.IGNORECASE,
)


def analyze(text: str) -> dict:
    """Return hallucination risk score and explanation."""
    words = text.split()
    word_count = len(words) or 1

    specific_nums   = len(_SPECIFIC_NUMBER.findall(text))
    percentages     = len(_PERCENTAGE.findall(text))
    dates           = len(_DATE_PATTERN.findall(text))
    citations       = len(_CITATION.findall(text))
    proper_nouns    = len(_PROPER_NOUN.findall(text))
    fab_signals     = len(_FABRICATION_SIGNALS.findall(text))

    # Specific claims without citations raise risk
    claim_count  = specific_nums + percentages + dates + proper_nouns
    claim_ratio  = claim_count / word_count

    # Citations reduce risk
    citation_penalty = max(0.0, 1.0 - citations * 0.15)

    raw = min(claim_ratio * 4.0 * citation_penalty, 1.0)

    # Hard boost if model itself signals fabrication
    if fab_signals:
        raw = min(raw + 0.4, 1.0)

    score = round(max(0.0, min(raw, 1.0)), 4)

    if score >= 0.65:
        risk_label = "HIGH"
    elif score >= 0.35:
        risk_label = "MEDIUM"
    else:
        risk_label = "LOW"

    explanation = (
        f"Found {claim_count} specific claim(s) ({specific_nums} number(s), "
        f"{dates} date(s), {proper_nouns} proper noun(s)) and {citations} citation(s). "
        f"Hallucination risk is {risk_label}."
    )

    return {"score": score, "risk_label": risk_label, "explanation": explanation}
