from __future__ import annotations

import os
from dataclasses import dataclass, field


def _parse_cors_origins() -> list[str]:
    raw = os.getenv("VOICE_CORS_ORIGINS", "*")
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or ["*"]


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("VOICE_APP_NAME", "Sleep Voice Capture Service")
    app_version: str = os.getenv("VOICE_APP_VERSION", "0.1.0")
    cors_origins: list[str] = field(default_factory=_parse_cors_origins)
    vosk_model_path: str = os.getenv("VOSK_MODEL_PATH", "./models/vosk-model-small-en-us-0.15")
    diarization_max_speakers: int = int(os.getenv("DIARIZATION_MAX_SPEAKERS", "2"))
    diarization_similarity_threshold: float = float(os.getenv("DIARIZATION_SIMILARITY_THRESHOLD", "0.88"))
    diarization_min_rms: float = float(os.getenv("DIARIZATION_MIN_RMS", "0.01"))


settings = Settings()
