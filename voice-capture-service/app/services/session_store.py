from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class TranscriptSegment:
    speaker: str
    start: float
    end: float
    text: str
    confidence: float | None = None


@dataclass
class SessionState:
    session_id: str
    sample_rate: int
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    finalized: bool = False
    segments: list[TranscriptSegment] = field(default_factory=list)


class SessionStore:
    def __init__(self):
        self._sessions: dict[str, SessionState] = {}

    def create_or_get(self, session_id: str, sample_rate: int) -> SessionState:
        existing = self._sessions.get(session_id)
        if existing:
            return existing

        session = SessionState(session_id=session_id, sample_rate=sample_rate)
        self._sessions[session_id] = session
        return session

    def get(self, session_id: str) -> SessionState | None:
        return self._sessions.get(session_id)

    def add_segment(self, session_id: str, segment: TranscriptSegment) -> None:
        session = self._sessions[session_id]
        session.segments.append(segment)

    def finalize(self, session_id: str) -> SessionState:
        session = self._sessions[session_id]
        session.finalized = True
        return session

    def speakers(self, session_id: str) -> list[str]:
        session = self._sessions[session_id]
        uniq = {seg.speaker for seg in session.segments if seg.speaker and seg.speaker != "silence"}
        return sorted(uniq)
