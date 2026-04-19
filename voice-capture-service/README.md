# Voice Capture Service (Local, No Azure)

Standalone Python FastAPI microservice for live microphone capture, local speech-to-text, and lightweight real-time speaker diarization.

This service is intentionally separate from your Azure pipeline and is useful for demos/reviews where you want to show a fully self-built local stack.

## Features
- Live audio streaming over WebSocket
- Local transcription using Vosk (offline speech model)
- Lightweight online diarization (speaker turn labeling heuristic)
- Built-in browser UI served by the service
- Session transcript retrieval APIs

## Folder Structure
- `app/main.py` - FastAPI app + websocket stream handling
- `app/config.py` - env config
- `app/diarization/simple_diarizer.py` - local diarization logic
- `app/services/session_store.py` - in-memory session transcript store
- `static/index.html` - standalone demo UI

## Quick Start
1. Enter folder and create env:
   ```bash
   cd /home/mohammedzaid/projects/web/sleep-questionnaire/voice-capture-service
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

2. Download a Vosk model (one-time):
   ```bash
   mkdir -p models
   cd models
   wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
   unzip vosk-model-small-en-us-0.15.zip
   cd ..
   ```

3. Create env file:
   ```bash
   cp .env.example .env
   ```

4. Run service:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8110 --reload
   ```

5. Open UI:
   - `http://127.0.0.1:8110`
   - If you open `static/index.html` from another dev server (for example `127.0.0.1:5500`), set the **API base** field in the page to `http://127.0.0.1:8110` so WebSocket traffic goes to this service.

## API
- `GET /health`
- `GET /config`
- `GET /sessions/new`
- `GET /sessions/{session_id}`
- `GET /sessions/{session_id}/transcript`
- `GET /sessions/{session_id}/speakers`
- `POST /sessions/{session_id}/finalize`
- `WS /ws/live/{session_id}`

## WebSocket Protocol
Client sends:
- JSON `{ "event": "start" }`
- Binary audio frames as PCM 16-bit mono at 16kHz
- JSON `{ "event": "stop" }`

Server emits events:
- `session`, `ack`, `partial`, `final`, `diarization`, `done`, `error`

## Notes
- Diarization in this demo is heuristic and lightweight. It is useful for presenting speaker turn separation in review demos, but not intended as clinical-grade diarization.
- Session storage is in-memory. Restarting service clears sessions.
- The browser page and API/WS endpoint must point to the same backend host/port (default `127.0.0.1:8110`). A `ws://127.0.0.1:5500/ws/live/...` error means the page is trying to connect to the wrong server port.
