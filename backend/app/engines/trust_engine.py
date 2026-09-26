"""
Trust Engine
============
Lightweight, self-contained trust analyser.

Runs four independent detectors on the input text and synthesises
a single trust_score on a 0–100 integer scale.

Detectors
---------
1. unsupported_claims   – factual assertions with no backing source
2. uncertainty_words    – hedging / epistemic-uncertainty language
3. missing_evidence     – sentences that assert facts but cite nothing
4. claim_specificity    – very specific numbers/names without evidence

Score formula (all sub-scores are 0–100 penalties, lower = worse):
  trust_score = 100 − weighted_penalty
  weighted_penalty = (
      unsupported_claims_penalty * 0.35
    + uncertainty_penalty        * 0.25
    + missing_evidence_penalty   * 0.25
    + specificity_penalty        * 0.15
  )

Output shape
------------
{
  "trust_score": 72,                     # 0–100 int
  "trust_level": "MODERATE",            # HIGH | MODERATE | LOW | CRITICAL
  "signals": {
    "unsupported_claims": {
      "count": 3,
      "matches": ["studies show", ...],
      "penalty": 45,
      "explanation": "..."
    },
    "uncertainty_words": {
      "count": 2,
      "matches": ["probably", "might"],
      "penalty": 20,
      "explanation": "..."
    },
    "missing_evidence": {
      "unsupported_sentence_count": 4,
      "total_sentences": 7,
      "penalty": 30,
      "explanation": "..."
    },
    "claim_specificity": {
      "specific_claim_count": 2,
      "evidence_count": 0,
      "penalty": 25,
      "explanation": "..."
    }
  },
  "recommendations": ["...", "..."],
  "summary": "..."
}
"""

from __future__ import annotations
import re


# ══════════════════════════════════════════════════════════════════════════════
# 1. UNSUPPORTED CLAIMS DETECTOR
# ══════════════════════════════════════════════════════════════════════════════

# Phrases that introduce an asserted claim which requires a backing source
_UNSUPPORTED_CLAIM_PATTERNS: list[str] = [
    r"\bstudies show\b",
    r"\bresearch (shows?|proves?|demonstrates?|confirms?|indicates?|suggests?)\b",
    r"\bscientists (say|have found|discovered|proved|confirmed)\b",
    r"\bexperts (say|believe|agree|warn|predict|suggest)\b",
    r"\bdoctors (say|recommend|warn|advise)\b",
    r"\bit (is|has been) (proven|established|demonstrated|confirmed|shown)\b",
    r"\bdata (shows?|reveals?|indicates?|suggests?|proves?)\b",
    r"\bstatistics (show|reveal|indicate|suggest|prove)\b",
    r"\bfacts? (show|prove|indicate|suggest)\b",
    r"\bevidence (shows?|suggests?|indicates?|proves?|demonstrates?)\b",
    r"\bhistory (shows?|proves?|tells? us)\b",
    r"\bit is (well[- ]known|widely accepted|commonly known|generally agreed)\b",
    r"\beveryone knows\b",
    r"\bit goes without saying\b",
    r"\bobviously\b",
    r"\bclearly\b",
    r"\bundeniably\b",
    r"\bwithout (a )?doubt\b",
    r"\bnobody (disputes?|denies?|questions?)\b",
]

_UNSUPPORTED_RE = re.compile("|".join(_UNSUPPORTED_CLAIM_PATTERNS), re.IGNORECASE)

# Patterns that qualify as actual evidence (reduce penalty)
_EVIDENCE_MARKERS = re.compile(
    r"\b(according to|cited (in|by)|published in|source[d]?:|see [a-z]|"
    r"as reported by|in (the )?study|DOI|ISBN|arXiv|https?://|"
    r"per (the )?(report|study|paper|research)|journal of|university of)\b",
    re.IGNORECASE,
)


def _detect_unsupported_claims(text: str) -> dict:
    # Use finditer so we always get the full matched string regardless of groups
    matches = [m.group(0).strip() for m in _UNSUPPORTED_RE.finditer(text) if m.group(0).strip()]
    claim_count = len(matches)

    evidence_count = len(_EVIDENCE_MARKERS.findall(text))
    net_unsupported = max(0, claim_count - evidence_count)

    # Penalty: each net unsupported claim costs up to 15 points, capped at 100
    penalty = min(net_unsupported * 15, 100)

    explanation = (
        f"{claim_count} assertive claim phrase(s) found, "
        f"{evidence_count} evidence marker(s) present. "
        f"{net_unsupported} claim(s) appear unsupported by a source."
    )

    return {
        "count": claim_count,
        "matches": list(dict.fromkeys(matches))[:10],  # dedupe, cap display at 10
        "evidence_count": evidence_count,
        "net_unsupported": net_unsupported,
        "penalty": penalty,
        "explanation": explanation,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 2. UNCERTAINTY WORDS DETECTOR
# ══════════════════════════════════════════════════════════════════════════════

_UNCERTAINTY_LEXICON: list[str] = [
    # Epistemic hedges
    "I think", "I believe", "I suppose", "I guess", "I imagine", "I feel",
    "in my opinion", "in my view", "to my knowledge", "as far as I know",
    "to the best of my knowledge", "if I recall correctly",
    # Modal hedges
    "might", "may", "could", "would", "should",
    "might be", "may be", "could be",
    # Adverbial hedges
    "perhaps", "maybe", "possibly", "probably", "likely", "unlikely",
    "presumably", "apparently", "seemingly", "supposedly", "allegedly",
    "roughly", "approximately", "around", "about", "nearly", "almost",
    "generally", "usually", "typically", "often", "sometimes", "rarely",
    # Doubt expressions
    "not sure", "not certain", "uncertain", "unsure", "unclear",
    "hard to say", "difficult to say", "it depends", "it's complicated",
    "I'm not confident", "questionable", "debatable", "controversial",
    # Source weakeners
    "some say", "some people say", "some argue", "it is said", "reportedly",
    "rumoured", "rumored", "unconfirmed", "unverified",
]

# Build regex with word-boundary matching for each term
_UNCERTAINTY_RE = re.compile(
    "|".join(r"\b" + re.escape(t) + r"\b" for t in _UNCERTAINTY_LEXICON),
    re.IGNORECASE,
)


def _detect_uncertainty_words(text: str) -> dict:
    raw_matches = _UNCERTAINTY_RE.findall(text)
    matches = [m.strip() for m in raw_matches if m.strip()]

    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    sentence_count = len(sentences) or 1

    uncertainty_ratio = len(matches) / sentence_count

    # Penalty: high ratio of hedges per sentence signals low authoritativeness
    # 0 hedges/sentence → 0 penalty; ≥2 hedges/sentence → 50 penalty
    penalty = min(int(uncertainty_ratio * 25), 50)

    explanation = (
        f"{len(matches)} uncertainty/hedging word(s) detected across "
        f"{sentence_count} sentence(s) "
        f"(ratio: {uncertainty_ratio:.2f} per sentence)."
    )

    return {
        "count": len(matches),
        "matches": list(dict.fromkeys(matches))[:15],
        "penalty": penalty,
        "explanation": explanation,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 3. MISSING EVIDENCE DETECTOR  (sentence-level)
# ══════════════════════════════════════════════════════════════════════════════

# A sentence is "needs-evidence" if it contains a factual assertion pattern
_FACTUAL_SENTENCE_RE = re.compile(
    r"(\b\d[\d,]*(\.\d+)?\s*(percent|%|million|billion|trillion|thousand|"
    r"people|cases|deaths|years?|months?|days?|hours?|km|kg|lb|USD|EUR)\b"
    r"|"
    r"\b(in|on|at)\s+\d{4}\b"          # year reference: in 2021
    r"|"
    r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b"  # multi-word proper noun
    r")",
    re.IGNORECASE,
)

# A sentence contains evidence if it has a citation/source signal
_SENTENCE_EVIDENCE_RE = re.compile(
    r"\b(according to|source[d]?:|cited|published|per the|https?://|"
    r"in the (study|paper|report)|journal|DOI|arXiv|ISBN)\b",
    re.IGNORECASE,
)


def _detect_missing_evidence(text: str) -> dict:
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    total = len(sentences) or 1

    factual_sentences: list[str] = []
    unsupported: list[str] = []

    for sentence in sentences:
        if _FACTUAL_SENTENCE_RE.search(sentence):
            factual_sentences.append(sentence)
            if not _SENTENCE_EVIDENCE_RE.search(sentence):
                unsupported.append(sentence)

    unsupported_count = len(unsupported)
    factual_count = len(factual_sentences)

    # Penalty: proportion of factual sentences that lack a source
    if factual_count == 0:
        penalty = 0
    else:
        unsupported_ratio = unsupported_count / factual_count
        penalty = min(int(unsupported_ratio * 60), 60)

    explanation = (
        f"{factual_count} sentence(s) contain verifiable claims; "
        f"{unsupported_count} of them have no supporting evidence marker."
    )

    return {
        "unsupported_sentence_count": unsupported_count,
        "total_sentences": total,
        "factual_sentence_count": factual_count,
        "penalty": penalty,
        "explanation": explanation,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 4. CLAIM SPECIFICITY DETECTOR
# ══════════════════════════════════════════════════════════════════════════════

_SPECIFIC_CLAIM_RE = re.compile(
    r"\b\d{4,}\b"                          # large numbers  e.g. 12,000
    r"|"
    r"\b\d+\.\d+\s*%"                      # decimal percentages  e.g. 3.4%
    r"|"
    r"\b(January|February|March|April|May|June|July|August|"
    r"September|October|November|December)\s+\d{1,2},?\s+\d{4}\b",  # full dates
    re.IGNORECASE,
)


def _detect_claim_specificity(text: str) -> dict:
    specific_hits = _SPECIFIC_CLAIM_RE.findall(text)
    specific_count = len(specific_hits)
    evidence_count = len(_EVIDENCE_MARKERS.findall(text))

    net = max(0, specific_count - evidence_count)
    # Penalty: specific claims without evidence are risky
    penalty = min(net * 12, 60)

    explanation = (
        f"{specific_count} highly specific claim(s) (large numbers, exact dates, "
        f"precise percentages) detected with {evidence_count} evidence marker(s). "
        f"{net} specific claim(s) lack a verifiable source."
    )

    return {
        "specific_claim_count": specific_count,
        "evidence_count": evidence_count,
        "net_unsourced": net,
        "penalty": penalty,
        "explanation": explanation,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 5. CONTRADICTIONS DETECTOR
# ══════════════════════════════════════════════════════════════════════════════
#
# Strategy: detect pairs of antonymous or logically opposed statements inside
# the response text.  We use two complementary approaches:
#   A) Negation flip — the same key noun/verb appears once affirmatively and
#      once with a negation word in close proximity.
#   B) Explicit contradiction phrases — sentences that introduce a reversal
#      ("however", "on the other hand", "but", "yet", "nevertheless") after a
#      strong positive or negative claim.

_NEGATION_WORDS = re.compile(
    r"\b(not|never|no|neither|nor|cannot|can't|won't|doesn't|didn't|isn't|aren't|wasn't|weren't|nothing|nobody|none)\b",
    re.IGNORECASE,
)

# Phrases that signal an explicit reversal / contradiction of the prior claim
_REVERSAL_PHRASES = re.compile(
    r"\b(however|on the other hand|but|yet|nevertheless|that said|"
    r"conversely|in contrast|while|although|even though|despite|"
    r"notwithstanding|at the same time|ironically|paradoxically)\b",
    re.IGNORECASE,
)

# Strong absolute claims — if one sentence makes an absolute claim and a
# nearby sentence reverses it, that is a contradiction.
_ABSOLUTE_CLAIM_RE = re.compile(
    r"\b(always|never|all|none|every|no one|everyone|completely|totally|"
    r"entirely|absolutely|impossible|guaranteed|certain|definitive|"
    r"without exception|in all cases|under no circumstances)\b",
    re.IGNORECASE,
)


def _detect_contradictions(text: str) -> dict:
    """
    Scan for self-contradictory language within the response.

    Returns a penalty (0–60), contradiction pairs found, and explanation.
    """
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    total = len(sentences) or 1

    contradiction_pairs: list[str] = []

    # Approach A: negation flip within a sentence window of 3
    for i, sent in enumerate(sentences):
        has_negation = bool(_NEGATION_WORDS.search(sent))
        has_absolute = bool(_ABSOLUTE_CLAIM_RE.search(sent))
        if not has_absolute:
            continue
        # Look at ±2 sentences for a reversal
        window = sentences[max(0, i - 2): i] + sentences[i + 1: i + 3]
        for neighbor in window:
            if _NEGATION_WORDS.search(neighbor) and not has_negation:
                snippet = f"«{sent[:60].rstrip()}…» ↔ «{neighbor[:60].rstrip()}…»"
                if snippet not in contradiction_pairs:
                    contradiction_pairs.append(snippet)
            elif _ABSOLUTE_CLAIM_RE.search(neighbor) and has_negation:
                snippet = f"«{sent[:60].rstrip()}…» ↔ «{neighbor[:60].rstrip()}…»"
                if snippet not in contradiction_pairs:
                    contradiction_pairs.append(snippet)

    # Approach B: count reversal phrases that follow an absolute claim
    reversal_after_absolute = 0
    for i, sent in enumerate(sentences):
        if _ABSOLUTE_CLAIM_RE.search(sent) and i + 1 < total:
            if _REVERSAL_PHRASES.search(sentences[i + 1]):
                reversal_after_absolute += 1
                snippet = f"«{sent[:60].rstrip()}…» ↔ «{sentences[i+1][:60].rstrip()}…»"
                if snippet not in contradiction_pairs:
                    contradiction_pairs.append(snippet)

    count = len(contradiction_pairs)
    # Penalty: each detected contradiction costs 20 pts, capped at 60
    penalty = min(count * 20, 60)

    explanation = (
        f"{count} potential contradiction(s) detected across {total} sentence(s). "
        + (f"Contradictory pairs: {count}." if count else "No self-contradictions found.")
    )

    return {
        "count":       count,
        "pairs":       contradiction_pairs[:6],   # cap display at 6
        "penalty":     penalty,
        "explanation": explanation,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 6. OVERCONFIDENCE DETECTOR
# ══════════════════════════════════════════════════════════════════════════════
#
# Overconfidence is the opposite problem from uncertainty: the response makes
# absolute, unqualified, or hyperbolic claims that exceed what the evidence
# (or the prompt context) can support.

_OVERCONFIDENCE_PATTERNS: list[tuple[float, str, str]] = [
    # (weight, regex, label)
    (1.0, r"\b(100\s*%|one hundred percent)\b",               "100% certainty claim"),
    (1.0, r"\b(proven fact|established fact|scientific fact)\b", "Absolute fact assertion"),
    (0.9, r"\b(definitely|absolutely|certainly|undoubtedly|unquestionably)\b", "Absolute certainty word"),
    (0.9, r"\b(always works|never fails|guaranteed to|will always|always will)\b", "Unconditional guarantee"),
    (0.8, r"\b(the only (way|solution|answer|method|option))\b", "False single-option claim"),
    (0.8, r"\b(it is impossible|impossible to|can never|will never)\b", "Absolute impossibility"),
    (0.8, r"\b(every (expert|scientist|doctor|study) agrees)\b", "False universal consensus"),
    (0.7, r"\b(there is no doubt|without any doubt|beyond any doubt)\b", "Doubt-eliminating phrase"),
    (0.7, r"\b(this (is|was) proven|has been proven|conclusively proven)\b", "Unqualified proof claim"),
    (0.6, r"\b(trivially (easy|simple|obvious)|anyone can|anyone could)\b", "Trivialisation"),
    (0.6, r"\b(best (in the world|ever created|ever made|that exists))\b", "Superlative without basis"),
    (0.5, r"\b(no (risk|danger|side effect|downside|drawback)s?)\b",  "Risk dismissal"),
]

_OVERCONF_RE_LIST = [
    (w, re.compile(pat, re.IGNORECASE), label)
    for w, pat, label in _OVERCONFIDENCE_PATTERNS
]


def _detect_overconfidence(text: str) -> dict:
    """
    Detect absolute, hyperbolic, or unjustified certainty language.

    Returns a penalty (0–60), matched patterns, and explanation.
    """
    triggered: list[tuple[float, str]] = []   # (weight, label)

    for weight, pattern, label in _OVERCONF_RE_LIST:
        if pattern.search(text):
            triggered.append((weight, label))

    count = len(triggered)
    if count == 0:
        penalty = 0
        explanation = "No overconfident language detected."
    else:
        # Penalty: sum of weights * 15, capped at 60
        raw_penalty = sum(w for w, _ in triggered) * 15
        penalty = min(int(raw_penalty), 60)
        labels = [label for _, label in triggered]
        explanation = (
            f"{count} overconfidence pattern(s) detected: {'; '.join(labels[:5])}."
            + (f" (+{count - 5} more)" if count > 5 else "")
        )

    return {
        "count":    count,
        "matches":  [label for _, label in triggered],
        "penalty":  penalty,
        "explanation": explanation,
    }


# ══════════════════════════════════════════════════════════════════════════════
# MISSING CITATIONS DETECTOR (dedicated — extends missing_evidence)
# ══════════════════════════════════════════════════════════════════════════════
#
# Specifically checks whether factual statements in the response could be
# traced back to claims in the original prompt.  If the response introduces
# new facts not referenced in the prompt and without inline citations, those
# are flagged as "missing citations".

_INLINE_CITATION_RE = re.compile(
    r"(https?://\S+|DOI\s*:\s*\S+|arXiv:\S+|\[\d+\]|\(\w[^)]{0,40}\d{4}\))",
    re.IGNORECASE,
)


def _detect_missing_citations(response: str, prompt: str) -> dict:
    """
    Compare factual sentences in the response to citations in both prompt
    and response.  Returns a penalty, citation count, and explanation.
    """
    sentences = [s.strip() for s in re.split(r"[.!?]+", response) if s.strip()]
    total = len(sentences) or 1

    # Count citations anywhere in response + prompt
    resp_citations = _INLINE_CITATION_RE.findall(response)
    prompt_citations = _INLINE_CITATION_RE.findall(prompt)
    total_citations = len(resp_citations) + len(prompt_citations)

    # Count factual sentences (reuse the same RE from missing_evidence)
    factual = [s for s in sentences if _FACTUAL_SENTENCE_RE.search(s)]
    factual_count = len(factual)

    uncited = max(0, factual_count - total_citations)
    # Penalty: each uncited factual sentence costs 10 pts, capped at 50
    penalty = min(uncited * 10, 50)

    explanation = (
        f"{factual_count} factual sentence(s) found; "
        f"{total_citations} inline citation(s) present "
        f"({len(resp_citations)} in response, {len(prompt_citations)} in prompt). "
        f"{uncited} factual sentence(s) appear to have no citation."
    )

    return {
        "factual_sentence_count": factual_count,
        "citation_count":         total_citations,
        "uncited_count":          uncited,
        "penalty":                penalty,
        "explanation":            explanation,
    }


# ══════════════════════════════════════════════════════════════════════════════
# HALLUCINATION RISK CLASSIFIER
# ══════════════════════════════════════════════════════════════════════════════

def _classify_hallucination_risk(signals: dict) -> str:
    """
    Derive a LOW / MEDIUM / HIGH hallucination risk label from the
    combined penalty profile of all six detectors.
    """
    high_risk_penalty = (
        signals["unsupported_claims"]["penalty"]
        + signals["claim_specificity"]["penalty"]
        + signals["missing_citations"]["penalty"]
    )
    if high_risk_penalty >= 80 or signals["overconfidence"]["penalty"] >= 40:
        return "HIGH"
    if high_risk_penalty >= 40 or signals["overconfidence"]["penalty"] >= 20:
        return "MEDIUM"
    return "LOW"


# ══════════════════════════════════════════════════════════════════════════════
# CONFIDENCE SCORE DERIVER
# ══════════════════════════════════════════════════════════════════════════════

def _derive_confidence_score(signals: dict) -> float:
    """
    Produce a 0.0–1.0 confidence score.
    High uncertainty_words penalty → low confidence.
    High overconfidence penalty → also reduces real confidence (paradox).
    """
    uncertainty_pen  = signals["uncertainty_words"]["penalty"]    # 0–50
    overconfidence_pen = signals["overconfidence"]["penalty"]     # 0–60

    # Both extremes erode real confidence
    total_deviation = (uncertainty_pen / 50) * 0.6 + (overconfidence_pen / 60) * 0.4
    raw = 1.0 - min(total_deviation, 1.0)
    return round(max(0.0, min(raw, 1.0)), 4)


# ══════════════════════════════════════════════════════════════════════════════
# THRESHOLDS & RECOMMENDATIONS
# ══════════════════════════════════════════════════════════════════════════════

_TRUST_LEVELS = [
    (75, "HIGH",     "The response appears reliable with minimal risk indicators."),
    (50, "MODERATE", "Some concerns detected. Verify key claims before relying on this response."),
    (25, "LOW",      "Significant issues found. This response should be treated with scepticism."),
    ( 0, "CRITICAL", "High risk of misinformation or fabrication. Do not use without independent verification."),
]

# Updated weights — now six signals, must sum to 1.0
_SIGNAL_WEIGHTS = {
    "unsupported_claims": 0.25,
    "uncertainty_words":  0.15,
    "missing_evidence":   0.15,
    "claim_specificity":  0.15,
    "contradictions":     0.15,
    "overconfidence":     0.15,
}


def _build_recommendations(signals: dict) -> list[str]:
    recs: list[str] = []
    if signals["unsupported_claims"]["net_unsupported"] >= 2:
        recs.append("Cross-check assertive claims against primary sources or citations.")
    if signals["uncertainty_words"]["count"] >= 4:
        recs.append("The response uses uncertain language — treat conclusions as tentative.")
    if signals["missing_evidence"]["unsupported_sentence_count"] >= 3:
        recs.append("Request citations or references for factual statements.")
    if signals["claim_specificity"]["net_unsourced"] >= 2:
        recs.append("Verify specific numbers, dates, and statistics independently.")
    if signals["contradictions"]["count"] >= 1:
        recs.append("Self-contradictory statements detected — seek clarification on conflicting claims.")
    if signals["overconfidence"]["count"] >= 2:
        recs.append("Overconfident language detected — absolute claims should be independently verified.")
    if signals.get("missing_citations", {}).get("uncited_count", 0) >= 2:
        recs.append("Several factual statements lack citations — ask for supporting references.")
    if not recs:
        recs.append("No critical issues found. Standard review recommended before high-stakes use.")
    return recs


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def analyze(text: str, *, prompt: str = "") -> dict:
    """
    Run all six trust detectors and return a structured result.

    Parameters
    ----------
    text : str
        The AI-generated response text to analyse.
    prompt : str, optional
        The original user prompt — used by the missing-citations detector
        to check whether citations were already present in the question.

    Returns
    -------
    dict with keys: trust_score (int 0–100), trust_level, hallucination_risk,
                    confidence_score, signals, recommendations, summary,
                    explanation.
    """
    if not text or not text.strip():
        return {
            "trust_score":       0,
            "trust_level":       "CRITICAL",
            "hallucination_risk": "HIGH",
            "confidence_score":  0.0,
            "signals":           {},
            "recommendations":   ["No text provided for analysis."],
            "summary":           "Empty input — cannot evaluate trust.",
            "explanation":       "No response text was supplied.",
        }

    # Guard against ReDoS on pathologically large inputs.
    MAX_CHARS = 20_000
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]
    if len(prompt) > MAX_CHARS:
        prompt = prompt[:MAX_CHARS]

    signals = {
        "unsupported_claims": _detect_unsupported_claims(text),
        "uncertainty_words":  _detect_uncertainty_words(text),
        "missing_evidence":   _detect_missing_evidence(text),
        "claim_specificity":  _detect_claim_specificity(text),
        "contradictions":     _detect_contradictions(text),
        "overconfidence":     _detect_overconfidence(text),
        "missing_citations":  _detect_missing_citations(text, prompt),
    }

    # Weighted penalty → trust score (only the six primary signals)
    weighted_penalty = sum(
        _SIGNAL_WEIGHTS[key] * signals[key]["penalty"]
        for key in _SIGNAL_WEIGHTS
    )
    trust_score = max(0, min(100, round(100 - weighted_penalty)))

    trust_level, summary = next(
        (level, s)
        for threshold, level, s in _TRUST_LEVELS
        if trust_score >= threshold
    )

    hallucination_risk = _classify_hallucination_risk(signals)
    confidence_score   = _derive_confidence_score(signals)

    # Human-readable explanation covering all active issues
    active_issues = [
        sig["explanation"]
        for key, sig in signals.items()
        if sig.get("penalty", 0) > 0 or sig.get("count", 0) > 0
    ]
    explanation = (
        f"Trust score: {trust_score}/100 ({trust_level}). "
        + (" ".join(active_issues) if active_issues else "No significant issues found.")
    )

    return {
        "trust_score":        trust_score,       # int 0–100
        "trust_level":        trust_level,        # HIGH | MODERATE | LOW | CRITICAL
        "hallucination_risk": hallucination_risk, # LOW | MEDIUM | HIGH
        "confidence_score":   confidence_score,   # float 0.0–1.0
        "signals":            signals,
        "recommendations":    _build_recommendations(signals),
        "summary":            summary,
        "explanation":        explanation,
    }
