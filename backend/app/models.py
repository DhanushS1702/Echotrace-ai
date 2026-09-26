import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    trust_score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    hallucination_risk: Mapped[str] = mapped_column(String(16), nullable=False)  # LOW/MEDIUM/HIGH
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    recommendations: Mapped[str] = mapped_column(Text, nullable=True)  # JSON-encoded list
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    scores: Mapped[list["Score"]] = relationship(
        "Score", back_populates="analysis", cascade="all, delete-orphan"
    )
    bias_flags: Mapped[list["BiasFlag"]] = relationship(
        "BiasFlag", back_populates="analysis", cascade="all, delete-orphan"
    )


class Score(Base):
    __tablename__ = "scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"))
    metric: Mapped[str] = mapped_column(String(64), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=True)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="scores")


class BiasFlag(Base):
    __tablename__ = "bias_flags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[str] = mapped_column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"))
    flag: Mapped[str] = mapped_column(Text, nullable=False)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="bias_flags")
