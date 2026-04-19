from __future__ import annotations

from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader

from .config import RAG_DEFAULT_TOP_K
from .llm import generate_grounded_explanation
from .schemas import ExplainRequest, ExplainResponse, IngestResponse, IngestTextRequest, Citation
from .vector_store import retrieve_evidence, upsert_document

app = FastAPI(title="Sleep RAG Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    from io import BytesIO

    reader = PdfReader(BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n".join(pages).strip()


def _flatten_results(raw: dict[str, Any]) -> list[dict[str, Any]]:
    ids = (raw.get("ids") or [[]])[0]
    docs = (raw.get("documents") or [[]])[0]
    metas = (raw.get("metadatas") or [[]])[0]
    dists = (raw.get("distances") or [[]])[0]

    rows = []
    for i in range(min(len(ids), len(docs), len(metas))):
        rows.append(
            {
                "id": ids[i],
                "document": docs[i],
                "metadata": metas[i] or {},
                "distance": dists[i] if i < len(dists) else None,
            }
        )
    return rows


def _extract_factors(response_data: dict[str, Any]) -> list[str]:
    factors: list[str] = []

    if str(response_data.get("daytime_sleepiness", "")).lower() in {"yes", "true", "1"}:
        factors.append("Reported daytime sleepiness")
    if str(response_data.get("is_snoring", response_data.get("snoring", ""))).lower() in {"yes", "true", "1"}:
        factors.append("Snoring present")

    ess = response_data.get("ess")
    if isinstance(ess, (int, float)) and ess >= 10:
        factors.append(f"Elevated ESS score ({ess})")

    bmi = response_data.get("bmi")
    if isinstance(bmi, (int, float)) and bmi >= 30:
        factors.append(f"High BMI ({bmi})")

    neck = response_data.get("neck")
    if isinstance(neck, (int, float)) and neck >= 40:
        factors.append(f"Increased neck circumference ({neck} cm)")

    return factors[:6]


@app.get("/health")
def health():
    return {"status": "ok", "service": "sleep-rag", "version": "0.1.0"}


@app.post("/ingest/text", response_model=IngestResponse)
def ingest_text(payload: IngestTextRequest):
    chunks = upsert_document(
        source_id=payload.source_id,
        source_name=payload.source_name,
        text=payload.content,
        source_type=payload.source_type,
        patient_id=payload.patient_id,
        response_id=payload.response_id,
        metadata=payload.metadata,
    )
    return IngestResponse(success=True, document_id=payload.source_id, chunks_upserted=chunks)


@app.post("/ingest/pdf", response_model=IngestResponse)
async def ingest_pdf(
    source_id: str = Form(...),
    source_name: str = Form(...),
    source_type: str = Form("patient_report"),
    patient_id: str | None = Form(None),
    response_id: int | None = Form(None),
    file: UploadFile = File(...),
):
    filename = file.filename or "upload.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported in this endpoint")

    raw = await file.read()
    text = _extract_text_from_pdf(raw)
    if not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from PDF")

    chunks = upsert_document(
        source_id=source_id,
        source_name=source_name,
        text=text,
        source_type=source_type,
        patient_id=patient_id,
        response_id=response_id,
        metadata={"filename": filename},
    )

    return IngestResponse(success=True, document_id=source_id, chunks_upserted=chunks)


@app.post("/explain", response_model=ExplainResponse)
def explain(payload: ExplainRequest):
    top_k = payload.top_k or RAG_DEFAULT_TOP_K
    query = (
        f"Explain sleep prediction. Prediction={payload.prediction}. "
        f"Questionnaire={payload.response_data}."
    )

    patient_res, global_res = retrieve_evidence(
        query=query,
        patient_id=payload.patient_id,
        response_id=payload.response_id,
        top_k=top_k,
    )

    patient_rows = _flatten_results(patient_res)
    global_rows = _flatten_results(global_res)

    combined = patient_rows + global_rows
    snippets = [row["document"] for row in combined[: max(3, top_k)]]

    summary = generate_grounded_explanation(
        prediction=payload.prediction,
        response_data=payload.response_data,
        snippets=snippets,
    )

    citations = []
    for row in combined[: max(3, top_k)]:
        md = row["metadata"]
        citations.append(
            Citation(
                source_name=md.get("source_name", "unknown"),
                chunk_id=row["id"],
                snippet=(row["document"] or "")[:320],
                page=md.get("page"),
                score=row.get("distance"),
            )
        )

    factors = _extract_factors(payload.response_data)

    return ExplainResponse(
        success=True,
        summary=summary,
        factors=factors,
        citations=citations,
        retrieval_diagnostics={
            "patient_hits": len(patient_rows),
            "global_hits": len(global_rows),
            "top_k": top_k,
        },
    )
