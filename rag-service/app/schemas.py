from typing import Any
from pydantic import BaseModel, Field


class IngestTextRequest(BaseModel):
    source_id: str = Field(..., description="Stable ID for idempotent ingestion")
    source_name: str
    content: str
    source_type: str = Field(default="guideline", description="guideline or patient_report")
    patient_id: str | None = None
    response_id: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class IngestResponse(BaseModel):
    success: bool
    document_id: str
    chunks_upserted: int


class ExplainRequest(BaseModel):
    prediction: dict[str, Any]
    response_data: dict[str, Any]
    patient_id: str | None = None
    response_id: int | None = None
    top_k: int | None = None


class Citation(BaseModel):
    source_name: str
    chunk_id: str
    snippet: str
    page: int | None = None
    score: float | None = None


class ExplainResponse(BaseModel):
    success: bool
    summary: str
    factors: list[str]
    citations: list[Citation]
    retrieval_diagnostics: dict[str, Any]
