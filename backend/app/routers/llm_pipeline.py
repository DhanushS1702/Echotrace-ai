import json
import asyncio
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import LLMPipelineRequest, LLMPipelineResponse
from ..services import llm_service
from .analyze import _run_engines
from ..engines.trust_composer import compose
from .. import crud

router = APIRouter(prefix="/llm", tags=["llm-pipeline"])


@router.post("/generate-and-analyze", response_model=LLMPipelineResponse, status_code=201)
def generate_and_analyze(payload: LLMPipelineRequest, db: Session = Depends(get_db)):
    """
    Complete End-to-End Pipeline:
    1. Receives User Question from React Frontend.
    2. Calls Free & Trusted LLM (IBM Granite / Meta Llama 3 / Ollama) via FastAPI Backend.
    3. Receives Generated Response text.
    4. Runs all 5 EchoTrace Analysis Engines concurrently on the response + question.
    5. Saves analysis to DB and streams full verdict to Trust Dashboard.
    """
    llm_res = llm_service.generate_llm_response(
        question=payload.question,
        model_key=payload.model,
        api_key=payload.api_key or ""
    )

    generated_text = llm_res["generated_response"]

    engine_results = _run_engines(text=generated_text, prompt_text=payload.question)
    result = compose(engine_results, response_text=generated_text, prompt_text=payload.question)

    analysis = crud.create_analysis(
        db,
        prompt=payload.question,
        response=generated_text,
        result=result
    )

    return LLMPipelineResponse(
        id=analysis.id,
        trust_score=result["trust_score"],
        hallucination_risk=result["hallucination_risk"],
        bias_flags=result["bias_flags"],
        confidence_score=result["confidence_score"],
        summary=result["summary"],
        scores=result["scores"],
        trust_report=result["trust_report"],
        trust_engine=result["trust_engine"],
        created_at=analysis.created_at,
        question=payload.question,
        llm_model=llm_res["model_name"],
        llm_provider=llm_res["provider"],
        generated_response=generated_text,
        generation_time_ms=llm_res["generation_time_ms"],
        pipeline_source=llm_res["source"]
    )


@router.post("/stream")
async def stream_generate_and_analyze(payload: LLMPipelineRequest, db: Session = Depends(get_db)):
    """
    Server-Sent Events (SSE) Streaming Endpoint:
    Streams LLM tokens in real-time to the React frontend, followed by
    the final EchoTrace 5-engine evaluation report.
    """
    async def event_generator():
        # Step 1: Status Event
        yield f"data: {json.dumps({'type': 'status', 'message': f'Querying {payload.model} LLM...'})}\n\n"
        await asyncio.sleep(0.05)

        # Step 2: Get LLM Response
        llm_res = llm_service.generate_llm_response(
            question=payload.question,
            model_key=payload.model,
            api_key=payload.api_key or ""
        )
        generated_text = llm_res["generated_response"]

        # Step 3: Stream tokens progressively in chunks
        words = generated_text.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'type': 'token', 'token': chunk})}\n\n"
            await asyncio.sleep(0.02) # Real-time progressive token streaming

        # Step 4: Status Event for EchoTrace Audit
        yield f"data: {json.dumps({'type': 'status', 'message': 'Running EchoTrace 5-Engine Audit...'})}\n\n"
        await asyncio.sleep(0.05)

        # Step 5: Run Engines & Compose Trust Verdict
        engine_results = _run_engines(text=generated_text, prompt_text=payload.question)
        result = compose(engine_results, response_text=generated_text, prompt_text=payload.question)

        analysis = crud.create_analysis(
            db,
            prompt=payload.question,
            response=generated_text,
            result=result
        )

        final_payload = {
            "id": analysis.id,
            "trust_score": result["trust_score"],
            "hallucination_risk": result["hallucination_risk"],
            "bias_flags": result["bias_flags"],
            "confidence_score": result["confidence_score"],
            "summary": result["summary"],
            "scores": result["scores"],
            "trust_report": result["trust_report"],
            "trust_engine": result["trust_engine"],
            "created_at": analysis.created_at.isoformat(),
            "question": payload.question,
            "llm_model": llm_res["model_name"],
            "llm_provider": llm_res["provider"],
            "generated_response": generated_text,
            "generation_time_ms": llm_res["generation_time_ms"],
            "pipeline_source": llm_res["source"]
        }

        # Step 6: Stream Final Complete Event
        yield f"data: {json.dumps({'type': 'complete', 'result': final_payload})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
