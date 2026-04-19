from __future__ import annotations

import requests

from .config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, LLM_TIMEOUT_SECONDS


def llm_enabled() -> bool:
    return bool(LLM_API_KEY)


def generate_grounded_explanation(prediction: dict, response_data: dict, snippets: list[str]) -> str:
    if not llm_enabled():
        risk = prediction.get("risk_level") or prediction.get("prediction") or "Unknown"
        return (
            f"Predicted risk: {risk}. The explanation is based on retrieved sleep-document evidence "
            f"and questionnaire features. Please review cited snippets for clinical validation."
        )

    prompt = (
        "You are an assistant for sleep-clinic decision support. "
        "Use only the provided evidence snippets and questionnaire features. "
        "If evidence is weak, say so explicitly. Keep it concise and clinical.\n\n"
        f"Prediction: {prediction}\n"
        f"Questionnaire: {response_data}\n"
        f"Evidence snippets:\n- " + "\n- ".join(snippets[:8])
    )

    url = f"{LLM_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": "Produce grounded medical-support explanation."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
    }

    response = requests.post(url, headers=headers, json=payload, timeout=LLM_TIMEOUT_SECONDS)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()
