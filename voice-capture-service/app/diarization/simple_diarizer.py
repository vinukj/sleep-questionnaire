from __future__ import annotations

import math

import numpy as np


class SimpleOnlineDiarizer:
    def __init__(self, sample_rate: int, max_speakers: int = 2, similarity_threshold: float = 0.88, min_rms: float = 0.01):
        self.sample_rate = sample_rate
        self.max_speakers = max_speakers
        self.similarity_threshold = similarity_threshold
        self.min_rms = min_rms
        self._profiles: dict[str, np.ndarray] = {}

    def _extract_embedding(self, audio: np.ndarray) -> tuple[np.ndarray | None, float]:
        if audio.size < 320:
            return None, 0.0

        rms = float(np.sqrt(np.mean(np.square(audio), dtype=np.float64)))
        if rms < self.min_rms:
            return None, rms

        audio = audio - np.mean(audio)
        windowed = audio * np.hanning(audio.size)

        spectrum = np.abs(np.fft.rfft(windowed)) + 1e-8
        power = np.square(spectrum)
        freqs = np.fft.rfftfreq(audio.size, d=1.0 / self.sample_rate)

        def band_energy(low: float, high: float) -> float:
            idx = (freqs >= low) & (freqs < high)
            if not np.any(idx):
                return 0.0
            return float(np.sum(power[idx]))

        total = float(np.sum(power)) + 1e-8
        bands = [
            band_energy(80.0, 300.0),
            band_energy(300.0, 900.0),
            band_energy(900.0, 2200.0),
            band_energy(2200.0, 4000.0),
        ]

        zcr = float(np.mean(np.abs(np.diff(np.signbit(audio)))))
        centroid = float(np.sum(freqs * power) / total)
        spread = float(np.sqrt(np.sum(np.square(freqs - centroid) * power) / total))

        vec = np.array(
            [
                math.log1p(bands[0] / total),
                math.log1p(bands[1] / total),
                math.log1p(bands[2] / total),
                math.log1p(bands[3] / total),
                zcr,
                centroid / 4000.0,
                spread / 3000.0,
                rms,
            ],
            dtype=np.float32,
        )

        norm = float(np.linalg.norm(vec))
        if norm > 0:
            vec = vec / norm

        return vec, rms

    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        denom = (np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8
        return float(np.dot(a, b) / denom)

    def assign_speaker(self, audio: np.ndarray) -> tuple[str, float, float]:
        embedding, rms = self._extract_embedding(audio)
        if embedding is None:
            return "silence", 0.0, rms

        if not self._profiles:
            speaker_id = "S1"
            self._profiles[speaker_id] = embedding
            return speaker_id, 1.0, rms

        best_speaker = ""
        best_score = -1.0
        for speaker_id, profile in self._profiles.items():
            score = self._cosine_similarity(embedding, profile)
            if score > best_score:
                best_speaker = speaker_id
                best_score = score

        if best_score < self.similarity_threshold and len(self._profiles) < self.max_speakers:
            speaker_id = f"S{len(self._profiles) + 1}"
            self._profiles[speaker_id] = embedding
            return speaker_id, best_score, rms

        speaker_id = best_speaker
        self._profiles[speaker_id] = (0.9 * self._profiles[speaker_id]) + (0.1 * embedding)
        return speaker_id, best_score, rms

    def known_speakers(self) -> list[str]:
        return sorted(self._profiles.keys())
