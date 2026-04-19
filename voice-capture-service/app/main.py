from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from uuid import uuid4

import numpy as np
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from vosk import KaldiRecognizer, Model

from .config import settings
from .diarization.simple_diarizer import SimpleOnlineDiarizer
from .schemas import HealthResponse, SessionInfoResponse, SpeakersResponse, TranscriptResponse, TranscriptSegmentResponse
from .services.session_store import SessionStore, TranscriptSegment

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

store = SessionStore()
model: Model | None = None


@app.on_event("startup")
def startup() -> None:
    global model
    model_path = Path(settings.vosk_model_path)
    if model_path.exists():
        model = Model(str(model_path))


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="voice-capture-local",
        version=settings.app_version,
        model_loaded=model is not None,
    )


@app.get("/config")
def config() -> dict[str, Any]:
    return {
        "max_speakers": settings.diarization_max_speakers,
        "model_loaded": model is not None,
        "vosk_model_path": settings.vosk_model_path,
    }


@app.get("/sessions/new")
def new_session() -> dict[str, str]:
    return {"session_id": str(uuid4())}


@app.get("/sessions/{session_id}", response_model=SessionInfoResponse)
def get_session(session_id: str) -> SessionInfoResponse:
    session = store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionInfoResponse(
        session_id=session.session_id,
        created_at=session.created_at.isoformat(),
        sample_rate=session.sample_rate,
        finalized=session.finalized,
        segment_count=len(session.segments),
    )


@app.get("/sessions/{session_id}/transcript", response_model=TranscriptResponse)
def get_transcript(session_id: str) -> TranscriptResponse:
    session = store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    segments = [
        TranscriptSegmentResponse(
            speaker=seg.speaker,
            start=seg.start,
            end=seg.end,
            text=seg.text,
            confidence=seg.confidence,
        )
        for seg in session.segments
    ]
    return TranscriptResponse(session_id=session_id, segments=segments)


@app.get("/sessions/{session_id}/speakers", response_model=SpeakersResponse)
def get_speakers(session_id: str) -> SpeakersResponse:
    session = store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SpeakersResponse(session_id=session_id, speakers=store.speakers(session_id))


@app.post("/sessions/{session_id}/finalize", response_model=SessionInfoResponse)
def finalize_session(session_id: str) -> SessionInfoResponse:
    session = store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session = store.finalize(session_id)
    return SessionInfoResponse(
        session_id=session.session_id,
        created_at=session.created_at.isoformat(),
        sample_rate=session.sample_rate,
        finalized=session.finalized,
        segment_count=len(session.segments),
    )


def _confidence_from_result(result: dict[str, Any]) -> float | None:
    words = result.get("result") or []
    if not words:
        return None
    vals = [w.get("conf") for w in words if isinstance(w.get("conf"), (float, int))]
    if not vals:
        return None
    return float(sum(vals) / len(vals))


@app.websocket("/ws/live/{session_id}")
async def ws_live(websocket: WebSocket, session_id: str):
    await websocket.accept()

    if model is None:
        await websocket.send_json(
            {
                "event": "error",
                "message": "Vosk model not found. Set VOSK_MODEL_PATH correctly.",
            }
        )
        await websocket.close(code=1011)
        return

    sample_rate = 16000
    recognizer = KaldiRecognizer(model, sample_rate)
    recognizer.SetWords(True)
    diarizer = SimpleOnlineDiarizer(
        sample_rate=sample_rate,
        max_speakers=settings.diarization_max_speakers,
        similarity_threshold=settings.diarization_similarity_threshold,
        min_rms=settings.diarization_min_rms,
    )

    session = store.create_or_get(session_id, sample_rate)
    processed_samples = 0

    await websocket.send_json(
        {
            "event": "session",
            "session_id": session.session_id,
            "sample_rate": sample_rate,
            "message": "stream-ready",
        }
    )

    try:
        while True:
            message = await websocket.receive()

            if message.get("type") == "websocket.disconnect":
                break

            if message.get("text"):
                try:
                    payload = json.loads(message["text"])
                except json.JSONDecodeError:
                    await websocket.send_json({"event": "warning", "message": "Invalid JSON control message"})
                    continue
                event = payload.get("event")

                if event == "start":
                    await websocket.send_json(
                        {
                            "event": "ack",
                            "message": "capture-started",
                            "session_id": session.session_id,
                        }
                    )
                    continue

                if event == "stop":
                    final_payload = json.loads(recognizer.FinalResult())
                    final_text = (final_payload.get("text") or "").strip()
                    if final_text:
                        confidence = _confidence_from_result(final_payload)
                        start = (final_payload.get("result") or [{}])[0].get("start", processed_samples / sample_rate)
                        end = (final_payload.get("result") or [{}])[-1].get("end", processed_samples / sample_rate)
                        segment = TranscriptSegment(
                            speaker="S1",
                            start=float(start),
                            end=float(end),
                            text=final_text,
                            confidence=confidence,
                        )
                        store.add_segment(session.session_id, segment)
                        await websocket.send_json(
                            {
                                "event": "final",
                                "speaker": segment.speaker,
                                "text": segment.text,
                                "start": segment.start,
                                "end": segment.end,
                                "confidence": segment.confidence,
                            }
                        )

                    store.finalize(session.session_id)
                    await websocket.send_json({"event": "done", "session_id": session.session_id})
                    await websocket.close(code=1000)
                    break

            chunk = message.get("bytes")
            if not chunk:
                continue

            audio_i16 = np.frombuffer(chunk, dtype=np.int16)
            if audio_i16.size == 0:
                continue

            audio_f32 = audio_i16.astype(np.float32) / 32768.0
            speaker, similarity, rms = diarizer.assign_speaker(audio_f32)
            start_sec = processed_samples / sample_rate
            processed_samples += int(audio_i16.size)
            end_sec = processed_samples / sample_rate

            if speaker != "silence":
                await websocket.send_json(
                    {
                        "event": "diarization",
                        "speaker": speaker,
                        "similarity": similarity,
                        "rms": rms,
                        "start": start_sec,
                        "end": end_sec,
                    }
                )

            is_final = recognizer.AcceptWaveform(chunk)
            if is_final:
                result = json.loads(recognizer.Result())
                text = (result.get("text") or "").strip()
                if text:
                    words = result.get("result") or []
                    seg_start = float(words[0].get("start", start_sec)) if words else start_sec
                    seg_end = float(words[-1].get("end", end_sec)) if words else end_sec
                    confidence = _confidence_from_result(result)
                    segment = TranscriptSegment(
                        speaker=speaker if speaker != "silence" else "S1",
                        start=seg_start,
                        end=seg_end,
                        text=text,
                        confidence=confidence,
                    )
                    store.add_segment(session.session_id, segment)
                    await websocket.send_json(
                        {
                            "event": "final",
                            "speaker": segment.speaker,
                            "text": segment.text,
                            "start": segment.start,
                            "end": segment.end,
                            "confidence": segment.confidence,
                        }
                    )
            else:
                partial_payload = json.loads(recognizer.PartialResult())
                partial = (partial_payload.get("partial") or "").strip()
                if partial:
                    await websocket.send_json(
                        {
                            "event": "partial",
                            "speaker": speaker if speaker != "silence" else "S1",
                            "text": partial,
                            "start": start_sec,
                            "end": end_sec,
                        }
                    )

    except WebSocketDisconnect:
        if store.get(session.session_id):
            store.finalize(session.session_id)
    except Exception as exc:
        await websocket.send_json({"event": "error", "message": str(exc)})
        await websocket.close(code=1011)
