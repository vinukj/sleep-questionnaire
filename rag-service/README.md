# Sleep RAG Service

Python FastAPI service for retrieval-augmented explanations using ChromaDB.

## Features
- Ingest guideline text and patient sleep report PDFs
- Persist vector index in local ChromaDB storage
- Use fully local deterministic embeddings (no model download needed)
- Retrieve evidence and generate grounded explanation summaries
- Return citations for doctor-facing UI

## Quick start
1. Create virtual env and install dependencies:
   ```bash
   # Python 3.14 is supported with the pinned dependencies in this repo
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Create env file:
   ```bash
   cp .env.example .env
   ```
3. Run service:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload
   ```
4. Open docs: `http://localhost:8100/docs`

## Quick GUI tester
- Open `test-gui.html` in your browser.
- Keep the service running on `http://127.0.0.1:8100` (default in the GUI).
- Use the page to test:
   - `GET /health`
   - `POST /ingest/text`
   - `POST /ingest/pdf`
   - `POST /explain`

## API
- `GET /health`
- `POST /ingest/text`
- `POST /ingest/pdf`
- `POST /explain`

## Notes
- `POST /ingest/pdf` currently handles text-based PDFs. If your PDFs are scanned images, run OCR first from your existing Node OCR pipeline and ingest the extracted text via `POST /ingest/text`.
- LLM generation is optional. Without `LLM_API_KEY`, service returns deterministic extractive summaries with citations.
- Vector embedding is offline and deterministic in this service. It does not require downloading ONNX models at ingest/query time.

## Troubleshooting
- If install fails with `pydantic-core`/`PyO3` errors on Python 3.14, make sure you are using current dependency versions from this repo (not older lock/pins).
- If you must stay on Python 3.14, try:
   ```bash
   export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1
   pip install --upgrade pip setuptools wheel
   pip install -r requirements.txt
   ```
- Check interpreter version quickly:
   ```bash
   python --version
   ```
- If `POST /ingest/pdf` previously failed with `httpx.ReadTimeout` in Chroma embedding download, pull latest code and recreate your venv. The current service avoids that network dependency.

## Quick retest flow
```bash
cd /home/mohammedzaid/projects/web/sleep-questionnaire/rag-service
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8100 --reload
```

Then:
1. Open `http://127.0.0.1:8100/health`
2. Open `test-gui.html`
3. Run `Ingest PDF` and then `Explain` with matching `patient_id`/`response_id`
