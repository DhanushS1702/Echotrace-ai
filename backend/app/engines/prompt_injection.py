"""
Prompt Injection Engine
-----------------------
Detects attempts to hijack the AI's behaviour through adversarial
instructions embedded in the response or prompt.
Score range: 0.0 (clean) → 1.0 (definite injection attempt)
"""

import re

# Rule-based patterns ordered from most to least severe
_INJECTION_RULES: list[tuple[float, str, str]] = [
    # (severity_weight, regex_pattern, human_label)
    (1.0, r"\bignore\s+(all\s+)?previous\s+instructions?\b",   "Override: ignore previous instructions"),
    (1.0, r"\bdisregard\s+(all\s+)?previous\s+instructions?\b", "Override: disregard previous instructions"),
    (1.0, r"\bforget\s+(everything|all)\s+(you('ve| have))?\s*(been\s+told|learned|know)\b",
                                                                "Override: forget instructions"),
    (0.9, r"\byou\s+are\s+now\s+(a|an)\b",                     "Role-switch attempt"),
    (0.9, r"\bact\s+as\s+(a|an)\s+\w+\s+(with\s+no|without)\s+restrictions?\b",
                                                                "Jailbreak: act-as with no restrictions"),
    (0.8, r"\bDAN\b",                                           "Known jailbreak keyword: DAN"),
    (0.8, r"\bjailbreak\b",                                     "Explicit jailbreak mention"),
    (0.7, r"\bdo\s+anything\s+now\b",                           "Known jailbreak phrase: do anything now"),
    (0.7, r"\bsystem\s+prompt\b",                               "System prompt reference"),
    (0.6, r"\b(reveal|show|print|output)\s+(your\s+)?(system\s+prompt|instructions?|config)\b",
                                                                "Prompt extraction attempt"),
    (0.5, r"\bpretend\s+(you\s+are|to\s+be)\b",                "Identity manipulation: pretend"),
    (0.5, r"\bsimulate\s+(a|an)\s+\w+\s+that\b",               "Simulation manipulation"),
    (0.4, r"<\s*/?script\s*>",                                  "Script tag injection"),
    (0.4, r"\]\s*\(",                                           "Markdown link injection pattern"),
]


def analyze(text: str) -> dict:
    """Return injection risk score and matched rule labels."""
    triggered: list[tuple[float, str]] = []

    for weight, pattern, label in _INJECTION_RULES:
        if re.search(pattern, text, re.IGNORECASE):
            triggered.append((weight, label))

    if not triggered:
        score = 0.0
        explanation = "No prompt injection patterns detected."
    else:
        # Score = max single severity, boosted by count
        max_weight = max(w for w, _ in triggered)
        count_boost = min((len(triggered) - 1) * 0.05, 0.2)
        score = round(min(max_weight + count_boost, 1.0), 4)
        labels = [label for _, label in triggered]
        explanation = f"Detected {len(triggered)} injection pattern(s): {'; '.join(labels)}."

    return {
        "score": score,
        "triggered_rules": [label for _, label in triggered],
        "explanation": explanation,
    }
