"""
Bias Engine
-----------
Detects emotionally charged, politically loaded, or one-sided language.
Returns a list of specific flag strings and an aggregate bias score.
Score range: 0.0 (neutral) → 1.0 (highly biased)
"""

import re

# ── Lexicons ──────────────────────────────────────────────────────────────────

_POLITICAL_TERMS = [
    "radical", "extremist", "socialist", "fascist", "communist", "anarchist",
    "far-left", "far-right", "woke", "alt-right", "liberal agenda", "conservative agenda",
    "regime", "propaganda", "deep state", "elites",
]

_EMOTIONAL_AMPLIFIERS = [
    "absolutely", "totally", "completely", "utterly", "outrageous", "disgusting",
    "terrible", "horrible", "amazing", "incredible", "unbelievable", "shocking",
    "catastrophic", "devastating", "brilliant", "perfect", "worst", "best ever",
]

_GENERALISATION_PATTERNS = [
    r"\ball\s+(men|women|people|muslims|christians|jews|immigrants|liberals|conservatives)\b",
    r"\bnone of (them|us|you)\b",
    r"\bthey always\b",
    r"\bthey never\b",
    r"\beveryone knows\b",
    r"\bnobody believes\b",
]

_GEN_RE = re.compile("|".join(_GENERALISATION_PATTERNS), re.IGNORECASE)

# P4: compile political and emotional terms into single alternation regexes
# so analyze() does O(1) regex passes instead of O(n) re.search calls in a loop.
_POLITICAL_RE = re.compile(
    "|".join(r"\b" + re.escape(t) + r"\b" for t in _POLITICAL_TERMS),
    re.IGNORECASE,
)
_EMOTIONAL_RE = re.compile(
    "|".join(r"\b" + re.escape(t) + r"\b" for t in _EMOTIONAL_AMPLIFIERS),
    re.IGNORECASE,
)


def analyze(text: str) -> dict:
    """Return bias score, list of flag strings, and explanation."""
    words = text.split()
    word_count = len(words) or 1

    political_hits  = list(dict.fromkeys(m.lower() for m in _POLITICAL_RE.findall(text)))
    emotional_hits  = list(dict.fromkeys(m.lower() for m in _EMOTIONAL_RE.findall(text)))
    gen_matches     = _GEN_RE.findall(text)

    # Build human-readable flag strings
    flags: list[str] = []
    if political_hits:
        flags.append(f"Politically charged language: {', '.join(political_hits)}")
    if emotional_hits:
        flags.append(f"Emotional amplifiers: {', '.join(emotional_hits)}")
    if gen_matches:
        flags.append("Broad generalisation(s) detected")

    total_hits = len(political_hits) + len(emotional_hits) + len(gen_matches)
    raw = min(total_hits / max(word_count * 0.05, 1), 1.0)
    score = round(max(0.0, min(raw, 1.0)), 4)

    explanation = (
        f"Detected {len(political_hits)} political term(s), "
        f"{len(emotional_hits)} emotional amplifier(s), and "
        f"{len(gen_matches)} generalisation(s). "
        f"{'No significant bias detected.' if not flags else 'Bias indicators present.'}"
    )

    return {"score": score, "flags": flags, "explanation": explanation}
