"""
PDF Report Builder
==================
Generates a styled EchoTrace AI trust analysis report as an in-memory PDF
using ReportLab.  Returns a ``bytes`` object ready to be streamed by FastAPI.

Page layout
-----------
  Cover band  — title, generated date, analysis ID
  Section 1   — Prompt & AI Response (truncated to 600 chars each)
  Section 2   — Trust Overview (score gauge bar, trust level, hallucination risk,
                confidence score, overall summary)
  Section 3   — Signal Findings table (metric, score/penalty, explanation)
  Section 4   — Recommendations
  Footer band — branding on every page
"""

from __future__ import annotations

import io
import json
import math
from datetime import datetime, timezone
from textwrap import wrap

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    FrameBreak,
    HRFlowable,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Frame,
)
from reportlab.platypus.flowables import Flowable

# ── Colour palette (matches the dark-UI brand) ───────────────────────────────
_C_BG        = colors.HexColor("#0f172a")   # slate-950
_C_SURFACE   = colors.HexColor("#1e293b")   # slate-800
_C_BORDER    = colors.HexColor("#334155")   # slate-700
_C_TEXT      = colors.HexColor("#f1f5f9")   # slate-100
_C_MUTED     = colors.HexColor("#94a3b8")   # slate-400
_C_BRAND     = colors.HexColor("#6366f1")   # indigo-500
_C_EMERALD   = colors.HexColor("#34d399")
_C_YELLOW    = colors.HexColor("#fbbf24")
_C_ORANGE    = colors.HexColor("#fb923c")
_C_RED       = colors.HexColor("#ef4444")
_C_WHITE     = colors.white

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm


# ── Helper: trust-level → colour ─────────────────────────────────────────────

def _level_color(level: str) -> colors.Color:
    return {
        "HIGH":     _C_EMERALD,
        "MODERATE": _C_YELLOW,
        "LOW":      _C_ORANGE,
        "CRITICAL": _C_RED,
    }.get(level.upper(), _C_MUTED)


def _risk_color(risk: str) -> colors.Color:
    return {"LOW": _C_EMERALD, "MEDIUM": _C_YELLOW, "HIGH": _C_RED}.get(
        risk.upper(), _C_MUTED
    )


def _score_color(score_0_1: float) -> colors.Color:
    if score_0_1 >= 0.75:
        return _C_EMERALD
    if score_0_1 >= 0.50:
        return _C_YELLOW
    if score_0_1 >= 0.25:
        return _C_ORANGE
    return _C_RED


# ── Custom flowable: horizontal score bar ────────────────────────────────────

class ScoreBar(Flowable):
    """
    A filled rectangle showing a 0–100 score, with label on the left and
    numeric value on the right.
    """

    def __init__(self, label: str, value: int | float, max_val: int = 100,
                 bar_color: colors.Color | None = None,
                 height: float = 6 * mm, width: float | None = None):
        super().__init__()
        self.label     = label
        self.value     = float(value)
        self.max_val   = float(max_val)
        self.bar_color = bar_color or _C_BRAND
        self.bh        = height
        self.bw        = width or (PAGE_W - 2 * MARGIN - 30 * mm)
        self.width     = self.bw + 30 * mm
        self.height    = self.bh + 2 * mm

    def draw(self):
        c = self.canv
        # Label
        c.setFont("Helvetica", 8)
        c.setFillColor(_C_MUTED)
        c.drawString(0, self.bh * 0.3, self.label)
        # Track
        bx = 28 * mm
        c.setFillColor(_C_SURFACE)
        c.roundRect(bx, 0, self.bw, self.bh, 2 * mm, fill=1, stroke=0)
        # Fill
        fill_w = (self.value / self.max_val) * self.bw
        if fill_w > 0:
            c.setFillColor(self.bar_color)
            c.roundRect(bx, 0, fill_w, self.bh, 2 * mm, fill=1, stroke=0)
        # Value text
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(_C_TEXT)
        pct_text = f"{int(self.value)}"
        c.drawRightString(bx + self.bw + 8 * mm, self.bh * 0.3, pct_text)


# ── Custom flowable: coloured badge ──────────────────────────────────────────

class Badge(Flowable):
    """Rounded-rect pill with centred text."""

    def __init__(self, text: str, bg: colors.Color, fg: colors.Color = _C_WHITE,
                 width: float = 28 * mm, height: float = 6 * mm):
        super().__init__()
        self.text   = text
        self.bg     = bg
        self.fg     = fg
        self.width  = width
        self.height = height

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg)
        c.roundRect(0, 0, self.width, self.height, 2 * mm, fill=1, stroke=0)
        c.setFillColor(self.fg)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(self.width / 2, self.height * 0.28, self.text)


# ── Paragraph styles ─────────────────────────────────────────────────────────

def _make_styles() -> dict:
    base = getSampleStyleSheet()

    def _ps(name, **kw) -> ParagraphStyle:
        defaults = dict(
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=_C_TEXT,
            backColor=None,
            spaceBefore=0,
            spaceAfter=0,
        )
        defaults.update(kw)
        return ParagraphStyle(name, **defaults)

    return {
        "h1":      _ps("h1",  fontName="Helvetica-Bold", fontSize=22, leading=28, textColor=_C_WHITE),
        "h2":      _ps("h2",  fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=_C_WHITE, spaceBefore=6),
        "h3":      _ps("h3",  fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=_C_BRAND),
        "body":    _ps("body", fontSize=9, leading=13, textColor=_C_TEXT),
        "muted":   _ps("muted", fontSize=8, leading=12, textColor=_C_MUTED),
        "mono":    _ps("mono", fontName="Courier", fontSize=8, leading=12,
                       textColor=_C_MUTED, backColor=_C_SURFACE),
        "label":   _ps("label", fontName="Helvetica-Bold", fontSize=8,
                       textColor=_C_MUTED, spaceBefore=8),
        "rec":     _ps("rec",  fontSize=9, leading=13, textColor=_C_TEXT,
                       leftIndent=4 * mm),
        "center":  _ps("center", fontSize=9, alignment=TA_CENTER, textColor=_C_MUTED),
    }


# ── Page background + footer ─────────────────────────────────────────────────

def _draw_page(canvas, doc):
    """Called for every page — draws dark background and footer."""
    canvas.saveState()
    # Background
    canvas.setFillColor(_C_BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Footer rule
    fy = 12 * mm
    canvas.setStrokeColor(_C_BORDER)
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN, fy, PAGE_W - MARGIN, fy)
    # Footer text
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(_C_MUTED)
    canvas.drawString(MARGIN, fy - 4 * mm, "EchoTrace AI  ·  IBM Bob 2.0 Hackathon  ·  Confidential")
    canvas.drawRightString(
        PAGE_W - MARGIN, fy - 4 * mm,
        f"Page {doc.page}  ·  Generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}"
    )
    canvas.restoreState()


# ── Cover band ───────────────────────────────────────────────────────────────

def _cover_band(styles: dict, analysis_id: str, created_at: str) -> list:
    elems = []
    # Purple top stripe
    from reportlab.platypus.flowables import Flowable

    class _TopStripe(Flowable):
        def __init__(self):
            super().__init__()
            self.width  = PAGE_W - 2 * MARGIN
            self.height = 2 * mm

        def draw(self):
            self.canv.setFillColor(_C_BRAND)
            self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)

    elems.append(_TopStripe())
    elems.append(Spacer(1, 6 * mm))
    elems.append(Paragraph("EchoTrace AI", styles["h1"]))
    elems.append(Paragraph("Trust Analysis Report", ParagraphStyle(
        "sub", fontName="Helvetica", fontSize=14, leading=18,
        textColor=_C_BRAND
    )))
    elems.append(Spacer(1, 4 * mm))
    elems.append(HRFlowable(width="100%", thickness=0.4, color=_C_BORDER, spaceAfter=4 * mm))
    elems.append(Paragraph(f"Analysis ID: <font color='#{_C_MUTED.hexval()[2:]}'>#{analysis_id[:8]}</font>", styles["muted"]))
    elems.append(Paragraph(f"Generated: {created_at}", styles["muted"]))
    elems.append(Spacer(1, 6 * mm))
    return elems


# ── Section helpers ───────────────────────────────────────────────────────────

def _section_header(title: str, styles: dict) -> list:
    return [
        Spacer(1, 4 * mm),
        Paragraph(title, styles["h2"]),
        HRFlowable(width="100%", thickness=0.4, color=_C_BORDER, spaceBefore=2 * mm, spaceAfter=3 * mm),
    ]


def _text_block(label: str, text: str, styles: dict, max_chars: int = 600) -> list:
    truncated = text[:max_chars].rstrip() + ("…" if len(text) > max_chars else "")
    # Escape XML special chars for Paragraph
    safe = truncated.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return [
        Paragraph(label, styles["label"]),
        Spacer(1, 1 * mm),
        Paragraph(safe, styles["mono"]),
        Spacer(1, 3 * mm),
    ]


# ── Main builder ─────────────────────────────────────────────────────────────

def build_pdf(
    *,
    analysis_id: str,
    prompt: str,
    response: str,
    trust_score: float,          # 0.0–1.0 (composer scale)
    trust_score_100: int,        # 0–100 (trust engine scale)
    trust_level: str,
    hallucination_risk: str,
    confidence_score: float,     # 0.0–1.0
    summary: str,
    scores: dict,                # {metric: {score, explanation}}
    bias_flags: list[str],
    recommendations: list[str],
    created_at: str,
) -> bytes:
    """
    Build the full PDF report in memory and return raw bytes.

    Parameters
    ----------
    All fields correspond directly to the analysis DB record and engine outputs.

    Returns
    -------
    bytes — the complete PDF file content.
    """
    buf    = io.BytesIO()
    styles = _make_styles()

    doc = BaseDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=18 * mm,
        title="EchoTrace AI Trust Analysis Report",
        author="EchoTrace AI",
    )

    frame = Frame(MARGIN, 18 * mm, PAGE_W - 2 * MARGIN, PAGE_H - MARGIN - 18 * mm, id="main")
    template = PageTemplate(id="main", frames=[frame], onPage=_draw_page)
    doc.addPageTemplates([template])

    story: list = []

    # ── Cover ─────────────────────────────────────────────────────────────────
    story += _cover_band(styles, analysis_id, created_at)

    # ── Section 1: Prompt & Response ─────────────────────────────────────────
    story += _section_header("1 · Prompt & AI Response", styles)
    story += _text_block("ORIGINAL PROMPT", prompt, styles, max_chars=500)
    story += _text_block("AI-GENERATED RESPONSE", response, styles, max_chars=700)

    # ── Section 2: Trust Overview ─────────────────────────────────────────────
    story += _section_header("2 · Trust Overview", styles)

    # Score bar (0-100)
    trust_bar_color = _level_color(trust_level)
    story.append(ScoreBar("Trust Score", trust_score_100, bar_color=trust_bar_color))
    story.append(Spacer(1, 2 * mm))

    # Confidence bar (0-100)
    conf_pct = round(confidence_score * 100)
    story.append(ScoreBar("Confidence", conf_pct, bar_color=_score_color(confidence_score)))
    story.append(Spacer(1, 4 * mm))

    # Badges row — Trust Level + Hallucination Risk
    badge_data = [[
        Badge(f"TRUST: {trust_level}", _level_color(trust_level), width=36 * mm),
        Spacer(4 * mm, 1),
        Badge(f"HALLUCINATION: {hallucination_risk}", _risk_color(hallucination_risk), width=48 * mm),
    ]]
    badge_table = Table(badge_data, colWidths=[38 * mm, 6 * mm, 50 * mm])
    badge_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(badge_table)
    story.append(Spacer(1, 4 * mm))

    # Summary
    story.append(Paragraph("SUMMARY", styles["label"]))
    story.append(Spacer(1, 1 * mm))
    story.append(Paragraph(summary.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"), styles["body"]))
    story.append(Spacer(1, 4 * mm))

    # ── Section 3: Signal Findings ────────────────────────────────────────────
    story += _section_header("3 · Signal Findings", styles)

    SIGNAL_META = {
        "confidence":        ("Confidence",        False),
        "hallucination_risk": ("Hallucination Risk", True),
        "missing_evidence":  ("Missing Evidence",  True),
        "bias":              ("Bias",              True),
        "prompt_injection":  ("Prompt Injection",  True),
    }

    tbl_data = [
        [
            Paragraph("<b>Metric</b>",      ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=_C_BRAND)),
            Paragraph("<b>Score</b>",       ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=_C_BRAND)),
            Paragraph("<b>Finding</b>",     ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=_C_BRAND)),
        ]
    ]

    for metric, data in scores.items():
        raw_score   = data.get("score", 0.0)
        explanation = data.get("explanation", "")
        label, is_risk = SIGNAL_META.get(metric, (metric.replace("_", " ").title(), False))
        # For risk metrics: high score is bad; invert for colour
        display_score = raw_score if not is_risk else (1.0 - raw_score)
        col = _score_color(display_score)

        pct_str = f"{round(raw_score * 100)}%"
        safe_exp = explanation.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

        tbl_data.append([
            Paragraph(label, ParagraphStyle("tc", fontName="Helvetica-Bold", fontSize=8, textColor=_C_TEXT)),
            Paragraph(f'<font color="#{col.hexval()[2:]}">{pct_str}</font>',
                      ParagraphStyle("ts", fontName="Helvetica-Bold", fontSize=9, alignment=TA_CENTER)),
            Paragraph(safe_exp, ParagraphStyle("te", fontSize=8, leading=11, textColor=_C_MUTED)),
        ])

    # Bias flags as extra rows
    if bias_flags:
        for flag in bias_flags:
            safe_flag = flag.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            tbl_data.append([
                Paragraph("Bias Flag", ParagraphStyle("tc", fontName="Helvetica-Bold", fontSize=8, textColor=_C_YELLOW)),
                Paragraph("—", ParagraphStyle("ts", fontSize=8, alignment=TA_CENTER, textColor=_C_MUTED)),
                Paragraph(safe_flag, ParagraphStyle("te", fontSize=8, leading=11, textColor=_C_MUTED)),
            ])

    col_w = [36 * mm, 18 * mm, PAGE_W - 2 * MARGIN - 60 * mm]
    findings_table = Table(tbl_data, colWidths=col_w, repeatRows=1)
    findings_table.setStyle(TableStyle([
        # Header
        ("BACKGROUND",  (0, 0), (-1, 0),  _C_SURFACE),
        ("LINEBELOW",   (0, 0), (-1, 0),  0.5, _C_BORDER),
        # Alternating rows
        *[("BACKGROUND", (0, i), (-1, i), _C_SURFACE if i % 2 == 0 else _C_BG)
          for i in range(1, len(tbl_data))],
        ("LINEBELOW",   (0, 1), (-1, -1), 0.3, _C_BORDER),
        ("VALIGN",      (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",  (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0,0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(findings_table)

    # ── Section 4: Recommendations ────────────────────────────────────────────
    story += _section_header("4 · Recommendations", styles)

    if not recommendations:
        recommendations = ["No critical issues found. Standard review recommended before high-stakes use."]

    for i, rec in enumerate(recommendations, 1):
        safe_rec = rec.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        story.append(Paragraph(
            f'<font color="#{_C_BRAND.hexval()[2:]}">›</font>  {safe_rec}',
            styles["rec"],
        ))
        story.append(Spacer(1, 2 * mm))

    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("— End of Report —", styles["center"]))

    doc.build(story)
    buf.seek(0)
    return buf.read()
