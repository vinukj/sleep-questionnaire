from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool


class SessionInfoResponse(BaseModel):
    session_id: str
    created_at: str
    sample_rate: int
    finalized: bool
    segment_count: int


class TranscriptSegmentResponse(BaseModel):
    speaker: str
    start: float
    end: float
    text: str
    confidence: float | None = None


class TranscriptResponse(BaseModel):
    session_id: str
    segments: list[TranscriptSegmentResponse]


class SpeakersResponse(BaseModel):
    session_id: str
    speakers: list[str]
