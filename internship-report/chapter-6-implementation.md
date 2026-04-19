# CHAPTER 6

# PROJECT IMPLEMENTATION

## 6.1 OVERVIEW

The Sleep Assessment Platform is implemented as a multi-service architecture comprising four independent services that communicate via REST APIs and WebSocket connections. This chapter presents the implementation details of each critical module.

---

## 6.2 MODULE 1: AUTHENTICATION AND SESSION MANAGEMENT

### 6.2.1 Implementation Overview

The authentication system uses Keycloak for OIDC-based identity management with a custom single-device session enforcement mechanism. The system supports hybrid authentication for migrating legacy users from bcrypt-based authentication to Keycloak.

### 6.2.2 Key Components

**Token Verification and Session Validation:**

```javascript
// backend/middleware/authMiddleware.js

export const verifyTokens = async (req, res, next) => {
  // Extract Bearer token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  // Verify token with Keycloak introspection endpoint
  const tokenData = await keycloakService.verifyToken(token);
  
  if (!tokenData || !tokenData.active) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // Find user in PostgreSQL database
  const userResult = await pool.query(
    "SELECT id, email, role, session_token FROM users WHERE keycloak_id = $1",
    [tokenData.userId]
  );
  
  const user = userResult.rows[0];

  // CRITICAL: Single-device session enforcement
  const clientSessionToken = req.headers['x-session-token'];
  
  if (user.session_token !== clientSessionToken) {
    return res.status(401).json({ 
      message: "Session invalidated - logged in from another device",
      sessionExpired: true 
    });
  }

  req.user = user;
  next();
};
```

**Single-Device Session Enforcement:**

```javascript
// backend/services/keycloakService.js

async revokeAllUserSessions(keycloakUserId) {
  // Get all active sessions from Keycloak
  const sessions = await this.adminClient.users.listSessions({
    id: keycloakUserId,
    realm: process.env.KEYCLOAK_REALM
  });

  // Revoke each session
  for (const session of sessions) {
    await this.adminClient.realms.deleteSession({
      realm: process.env.KEYCLOAK_REALM,
      session: session.id
    });
  }

  return sessions.length;
}
```

### 6.2.3 Database Schema

```sql
-- PostgreSQL users table with session tracking
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  keycloak_id VARCHAR(255),
  session_token VARCHAR(255),  -- For single-device enforcement
  role VARCHAR(50) DEFAULT 'user',
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6.3 MODULE 2: DYNAMIC QUESTIONNAIRE SYSTEM

### 6.3.1 Implementation Overview

The questionnaire system uses a schema-driven approach with JSONB storage in PostgreSQL, enabling dynamic question rendering and conditional logic without database schema changes.

### 6.3.2 Core Implementation

**Questionnaire Submission with Parallel Processing:**

```javascript
// backend/controllers/questionnaireController.js

export const submitQuestionnaireResponse = async (req, res) => {
  const { responseData } = req.body;
  const userId = req.user?.id;

  // Calculate sleep scores (ESS, ISS, BMI)
  const flatScores = await calculateSleepScore(responseData);

  // PARALLEL EXECUTION: DB save and ML prediction run independently
  const [dbResult, predictionResult] = await Promise.allSettled([
    saveQuestionnaireResponse(userId, responseData),
    getPrediction(responseData)
  ]);

  // Handle results gracefully - core functionality preserved even if ML fails
  const savedResponse = dbResult.status === 'fulfilled' ? dbResult.value : null;
  const prediction = predictionResult.status === 'fulfilled' ? 
                     predictionResult.value.prediction : null;

  // RAG explanation (best-effort, non-blocking)
  let ragExplanation = null;
  if (prediction) {
    const ragResult = await getRagExplanation({ prediction, responseData });
    ragExplanation = ragResult.explanation;
  }

  res.status(201).json({
    success: true,
    data: savedResponse,
    scores: flatScores,
    prediction: prediction,
    ragExplanation: ragExplanation
  });
};
```

**Form State Persistence (Frontend):**

```javascript
// quiz-frontend/src/hooks/useQuestionnaireForm.js

export const useQuestionnaireForm = () => {
  const [answers, setAnswers] = useState({});

  // Load saved answers from localStorage (24-hour expiry)
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        setAnswers(parsed.data);
      }
    }
  }, [storageKey]);

  // Auto-save on answer change
  const handleAnswerChange = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    localStorage.setItem(storageKey, JSON.stringify({
      data: newAnswers,
      timestamp: Date.now()
    }));
    setAnswers(newAnswers);
  };

  return { answers, handleAnswerChange, resetForm };
};
```

**Sleep Score Calculation:**

```javascript
// backend/services/scoringService.js

export const calculateSleepScore = async (responseData) => {
  // ESS Score (Epworth Sleepiness Scale)
  const ess = parseInt(responseData.ess || responseData.epworth_score, 10);

  // ISS Score (Indian Sleepiness Scale)
  let iss = 0;
  if (responseData.iss_q1 === "Yes") iss += 2;
  if (responseData.iss_q2b === "Yes") iss += 2;
  if (responseData.iss_q5 === "Yes") iss += 2;
  if (responseData.iss_q7 === "Yes") iss += 2;
  if (responseData.iss_q8a || responseData.iss_q8b || 
      responseData.iss_q8c || responseData.iss_q8d || 
      responseData.iss_q8e) iss += 10;

  // BMI Category
  const bmi = parseFloat(responseData.bmi);
  let bmiCategory = null;
  if (bmi < 18.5) bmiCategory = "Underweight";
  else if (bmi < 25) bmiCategory = "Normal";
  else if (bmi < 30) bmiCategory = "Overweight";
  else bmiCategory = "Obese";

  return { ess, iss, bmiCategory };
};
```

### 6.3.3 Database Schema

```sql
-- Questionnaire responses with JSONB for flexible schema
CREATE TABLE questionnaire_responses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  response_data JSONB NOT NULL,  -- Stores all questionnaire answers
  prediction JSONB,               -- ML prediction result
  ml_payload JSONB,               -- Payload sent to ML service
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GIN index for efficient JSONB queries
CREATE INDEX idx_response_data ON questionnaire_responses USING GIN (response_data);
```

---

## 6.4 MODULE 3: ML PREDICTION SERVICE

### 6.4.1 Implementation Overview

The ML prediction module normalizes questionnaire data and communicates with an external Python-based OSA (Obstructive Sleep Apnea) prediction service. The implementation uses graceful degradation to ensure core functionality even when the ML service is unavailable.

### 6.4.2 Payload Normalization

```javascript
// backend/services/predictionService.js

const convertGender = (gender) => {
  const g = gender.toString().toUpperCase();
  if (g === 'F' || g === 'FEMALE') return 'Female';
  if (g === 'M' || g === 'MALE') return 'Male';
  return gender;
};

const toBinary = (value) => {
  const v = value.toString().toLowerCase().trim();
  if (v === 'yes' || v === 'y' || v === 'true') return 'Yes';
  if (v === 'no' || v === 'n' || v === 'false') return 'No';
  return value;
};

export const buildPredictionPayload = (responseData) => {
  // Conditional logic: if not snoring, witnessed_apnea = "No"
  let witnessedApnea = responseData.witnessed_apneas;
  if (!witnessedApnea && toBinary(responseData.is_snoring) === 'No') {
    witnessedApnea = 'No';
  }

  const payload = {
    age: Number(responseData.age),
    sex: convertGender(responseData.gender),
    daytime_sleepiness: toBinary(responseData.daytime_sleepiness),
    snoring: toBinary(responseData.is_snoring),
    witnessed_apnea: toBinary(witnessedApnea),
    htn: toBinary(responseData.hypertension),
    dm: toBinary(responseData.diabetes),
    bmi: Number(responseData.bmi),
    nc: Number(responseData.neck),
    malampatti: Number(responseData.mallampati),
    ess: Number(responseData.ess),
    iss: Number(responseData.iss)
  };

  // Validate required fields
  const requiredFields = ['age', 'sex', 'snoring', 'bmi', 'nc', 'ess', 'iss'];
  const missingFields = requiredFields.filter(f => !payload[f]);

  if (missingFields.length > 0) {
    return { valid: false, missingFields, payload: null };
  }

  return { valid: true, missingFields: [], payload };
};
```

### 6.4.3 ML Service Integration with Graceful Degradation

```javascript
// backend/services/predictionService.js

export const getPrediction = async (responseData) => {
  const result = buildPredictionPayload(responseData);
  
  if (!result.valid) {
    return { 
      prediction: null, 
      predictionError: { message: 'Missing required fields' }
    };
  }

  try {
    // Call ML service with 5-second timeout
    const response = await axios.post(
      'http://127.0.0.1:8000/predict',
      result.payload,
      { timeout: 5000, headers: { 'Content-Type': 'application/json' } }
    );

    return { prediction: response.data, predictionError: null, mlPayload: result.payload };
    
  } catch (error) {
    // GRACEFUL DEGRADATION: Continue without prediction
    return { 
      prediction: null,
      predictionError: { message: 'ML service unavailable' },
      mlPayload: result.payload 
    };
  }
};
```

---

## 6.5 MODULE 4: RAG-BASED CLINICAL DECISION SUPPORT

### 6.5.1 Implementation Overview

The Retrieval-Augmented Generation (RAG) module provides evidence-based clinical explanations by retrieving relevant passages from medical guidelines and patient history using vector similarity search.

### 6.5.2 Vector Store Implementation

```python
# rag-service/app/vector_store.py

import chromadb
import hashlib
import numpy as np

_client = chromadb.PersistentClient(path="./chroma_db")

def _embed_text(text: str) -> list[float]:
    """
    Generate deterministic embedding using hash-based approach.
    Produces 384-dimensional vectors for cosine similarity search.
    """
    vec = [0.0] * 384
    
    for tok in text.lower().split():
        digest = hashlib.sha256(tok.encode("utf-8")).digest()
        bucket = int.from_bytes(digest[:4], "big") % 384
        sign = -1.0 if (digest[4] & 1) else 1.0
        vec[bucket] += sign
    
    # L2 normalization
    norm = math.sqrt(sum(v * v for v in vec))
    return [v / norm for v in vec] if norm > 0 else vec


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    """Split text into overlapping chunks for context retention."""
    chunks = []
    cursor = 0
    
    while cursor < len(text):
        end = min(cursor + chunk_size, len(text))
        chunks.append(text[cursor:end].strip())
        if end == len(text):
            break
        cursor = max(0, end - overlap)  # Slide back for overlap
    
    return chunks


def upsert_document(source_id: str, text: str, source_type: str, patient_id: str = None):
    """Ingest document into ChromaDB with metadata."""
    collection = get_collection(source_type)
    chunks = chunk_text(text)
    
    ids = []
    documents = []
    metadatas = []
    
    for i, chunk in enumerate(chunks):
        chunk_id = f"{source_id}:{i}:{hashlib.sha256(chunk.encode()).hexdigest()[:12]}"
        ids.append(chunk_id)
        documents.append(chunk)
        metadatas.append({
            "source_id": source_id,
            "source_type": source_type,
            "patient_id": patient_id or "",
            "chunk_index": i
        })
    
    embeddings = [_embed_text(doc) for doc in documents]
    collection.upsert(ids=ids, documents=documents, 
                      metadatas=metadatas, embeddings=embeddings)
    
    return len(ids)


def retrieve_evidence(query: str, patient_id: str, top_k: int):
    """
    Dual retrieval: Search patient-specific + global guidelines.
    Returns combined evidence for grounded explanation.
    """
    patient_collection = get_collection("patient_report")
    global_collection = get_collection("guideline")
    
    # Query patient corpus
    patient_res = patient_collection.query(
        query_embeddings=[_embed_text(query)],
        n_results=top_k,
        where={"patient_id": patient_id} if patient_id else None
    )
    
    # Query global guidelines
    global_res = global_collection.query(
        query_embeddings=[_embed_text(query)],
        n_results=top_k
    )
    
    return patient_res, global_res
```

### 6.5.3 Explanation Generation

```python
# rag-service/app/main.py

@app.post("/explain")
def explain(payload: ExplainRequest):
    # Retrieve evidence from both corpora
    patient_res, global_res = retrieve_evidence(
        query=f"Explain sleep prediction: {payload.prediction}",
        patient_id=payload.patient_id,
        top_k=payload.top_k or 5
    )
    
    # Combine and extract snippets
    combined = patient_rows + global_rows
    snippets = [row["document"] for row in combined[:5]]
    
    # Generate grounded explanation using LLM
    summary = generate_grounded_explanation(
        prediction=payload.prediction,
        response_data=payload.response_data,
        snippets=snippets  # Context for grounding
    )
    
    # Extract risk factors
    factors = _extract_factors(payload.response_data)
    # Example: ["Elevated ESS score (15)", "High BMI (32)", "Snoring present"]
    
    # Build citations
    citations = []
    for row in combined[:3]:
        citations.append({
            "source_name": row["metadata"]["source_name"],
            "snippet": row["document"][:320]
        })
    
    return {
        "summary": summary,
        "factors": factors,
        "citations": citations
    }
```

---

## 6.6 MODULE 5: VOICE TRANSCRIPTION SERVICE

### 6.6.1 Implementation Overview

The voice transcription module implements real-time speech-to-text conversion with automatic speaker diarization. The system uses a custom-built transcription engine based on deep learning acoustic models and spectral feature extraction for speaker separation.

### 6.6.2 Speaker Diarization Engine

```python
# voice-capture-service/app/diarization/simple_diarizer.py

import numpy as np

class SimpleOnlineDiarizer:
    """
    Real-time speaker diarization using spectral feature extraction.
    Separates speakers based on voice print similarity without external APIs.
    """
    
    def __init__(self, sample_rate: int, max_speakers: int = 2):
        self.sample_rate = sample_rate
        self.max_speakers = max_speakers
        self._profiles = {}  # Speaker ID → voice embedding
    
    def _extract_embedding(self, audio: np.ndarray):
        """
        Extract voice fingerprint from audio chunk.
        Uses spectral features: band energy, ZCR, centroid, spread.
        """
        # RMS for voice activity detection
        rms = float(np.sqrt(np.mean(np.square(audio))))
        if rms < 0.01:
            return None, rms  # Silence
        
        # Apply Hanning window for spectral analysis
        windowed = audio * np.hanning(len(audio))
        
        # FFT for frequency decomposition
        spectrum = np.abs(np.fft.rfft(windowed)) + 1e-8
        power = np.square(spectrum)
        freqs = np.fft.rfftfreq(len(audio), d=1.0 / self.sample_rate)
        
        # Extract energy in 4 frequency bands (voice characteristics)
        bands = [
            band_energy(80, 300),     # Low frequencies
            band_energy(300, 900),    # Mid-low (vocal tract)
            band_energy(900, 2200),   # Mid-high (formants)
            band_energy(2200, 4000)   # High frequencies
        ]
        
        # Additional features
        zcr = zero_crossing_rate(audio)
        centroid = spectral_centroid(power, freqs)
        spread = spectral_spread(power, freqs)
        
        # Build 8-dimensional feature vector
        vec = np.array([
            np.log1p(bands[0] / total),
            np.log1p(bands[1] / total),
            np.log1p(bands[2] / total),
            np.log1p(bands[3] / total),
            zcr, centroid / 4000.0, spread / 3000.0, rms
        ], dtype=np.float32)
        
        return vec / np.linalg.norm(vec), rms
    
    def assign_speaker(self, audio: np.ndarray):
        """
        Assign audio chunk to known speaker or create new speaker.
        Uses cosine similarity for voice matching.
        """
        embedding, rms = self._extract_embedding(audio)
        
        if embedding is None:
            return "silence", 0.0, rms
        
        if not self._profiles:
            self._profiles["S1"] = embedding
            return "S1", 1.0, rms
        
        # Find best matching speaker
        best_speaker, best_score = "", -1.0
        for speaker_id, profile in self._profiles.items():
            score = cosine_similarity(embedding, profile)
            if score > best_score:
                best_speaker, best_score = speaker_id, score
        
        # Decision: assign or create new speaker
        if best_score < 0.88 and len(self._profiles) < self.max_speakers:
            speaker_id = f"S{len(self._profiles) + 1}"
            self._profiles[speaker_id] = embedding
            return speaker_id, best_score, rms
        
        # Update existing profile (exponential moving average)
        self._profiles[best_speaker] = (
            0.9 * self._profiles[best_speaker] + 0.1 * embedding
        )
        return best_speaker, best_score, rms
```

### 6.6.3 Real-time Transcription Engine

```python
# voice-capture-service/app/main.py

from vosk import KaldiRecognizer, Model
from fastapi import WebSocket

class SessionStore:
    """In-memory store for transcription sessions."""
    
    def __init__(self):
        self._sessions = {}
    
    def create_or_get(self, session_id: str, sample_rate: int):
        if session_id not in self._sessions:
            self._sessions[session_id] = Session(session_id, sample_rate)
        return self._sessions[session_id]
    
    def add_segment(self, session_id: str, segment: TranscriptSegment):
        self._sessions[session_id].segments.append(segment)


@app.websocket("/ws/live/{session_id}")
async def ws_live(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    # Initialize Kaldi recognizer at 16kHz
    recognizer = KaldiRecognizer(model, 16000)
    recognizer.SetWords(True)
    
    # Initialize custom diarizer
    diarizer = SimpleOnlineDiarizer(sample_rate=16000, max_speakers=2)
    
    session = store.create_or_get(session_id, 16000)
    processed_samples = 0
    
    while True:
        message = await websocket.receive()
        
        # Handle binary audio chunks
        chunk = message.get("bytes")
        if not chunk:
            continue
        
        # Convert to numpy array
        audio_i16 = np.frombuffer(chunk, dtype=np.int16)
        audio_f32 = audio_i16.astype(np.float32) / 32768.0
        
        # Perform speaker diarization
        speaker, similarity, rms = diarizer.assign_speaker(audio_f32)
        
        # Feed audio to recognizer
        is_final = recognizer.AcceptWaveform(chunk)
        
        if is_final:
            result = json.loads(recognizer.Result())
            text = result.get("text", "").strip()
            
            if text:
                # Store transcribed segment with speaker
                segment = TranscriptSegment(
                    speaker=speaker if speaker != "silence" else "S1",
                    start=result["result"][0].get("start", 0),
                    end=result["result"][-1].get("end", 0),
                    text=text,
                    confidence=average_confidence(result)
                )
                store.add_segment(session_id, segment)
                
                # Send to client
                await websocket.send_json({
                    "event": "final",
                    "speaker": segment.speaker,
                    "text": segment.text,
                    "start": segment.start,
                    "end": segment.end
                })
```

### 6.6.4 WebSocket Audio Streaming

```javascript
// quiz-frontend/src/utils/streamAudio.js

export class AudioStreamer {
  async initializeAudio() {
    // Request microphone access with 16kHz mono constraint
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: { ideal: 1 },
        sampleRate: { ideal: 16000 },
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    // Create AudioContext for processing
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // ScriptProcessor for buffer management (2048 samples = 128ms)
    this.scriptProcessor = this.audioContext.createScriptProcessor(2048, 1, 1);

    this.scriptProcessor.onaudioprocess = (event) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const floatSamples = event.inputBuffer.getChannelData(0);

      // Convert Float32 [-1, 1] to Int16 PCM
      const int16Samples = new Int16Array(floatSamples.length);
      for (let i = 0; i < floatSamples.length; i++) {
        const s = Math.max(-1, Math.min(1, floatSamples[i]));
        int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Send raw binary over WebSocket
      this.ws.send(int16Samples.buffer);
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
  }
}
```

### 6.6.5 Structured Clinical Data Extraction

```python
# voice-capture-service/app/services/gemini_extractor.py

import google.generativeai as genai

def extract_clinical_findings(transcript: str) -> dict:
    """
    Extract structured clinical findings from conversation transcript.
    Uses zero-shot prompting to parse dialogue into JSON schema.
    """
    model = genai.GenerativeModel('gemini-pro')
    
    prompt = f"""
    Extract clinical findings from this doctor-patient conversation.
    Return JSON with: chief_complaint, history_of_present_illness, 
    past_medical_history, medications, allergies, family_history, 
    social_history, review_of_systems.
    
    Transcript:
    {transcript}
    """
    
    response = model.generate_content(prompt)
    
    # Parse and validate JSON
    try:
        findings = json.loads(response.text)
        return findings
    except json.JSONDecodeError:
        return {"error": "Failed to parse response"}
```

---

## 6.7 MODULE 6: DATA EXPORT AND SECURITY

### 6.7.1 Excel Export with Formula Injection Prevention

```javascript
// backend/services/exportService.js

import ExcelJS from 'exceljs';

export const exportToExcel = async (responses) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Questionnaire Responses');

  // Define columns
  worksheet.columns = [
    { header: 'Patient ID', key: 'patient_id', width: 15 },
    { header: 'Date', key: 'created_at', width: 20 },
    { header: 'ESS Score', key: 'ess', width: 12 },
    { header: 'ISS Score', key: 'iss', width: 12 },
    { header: 'BMI', key: 'bmi', width: 10 },
    { header: 'Prediction', key: 'prediction', width: 15 }
  ];

  // Add rows with formula injection prevention
  responses.forEach(response => {
    const row = {
      patient_id: response.user_id,
      created_at: new Date(response.created_at).toLocaleString(),
      ess: response.response_data.ess,
      iss: response.response_data.iss,
      bmi: response.response_data.bmi,
      prediction: response.prediction?.risk_level || 'N/A'
    };

    // SECURITY: Sanitize all string values to prevent formula injection
    const sanitized = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'string') {
        // Prefix dangerous characters with apostrophe
        sanitized[key] = value.replace(/^[=+\-@]/, "'$&");
      } else {
        sanitized[key] = value;
      }
    }

    worksheet.addRow(sanitized);
  });

  return workbook.xlsx.writeBuffer();
};
```

### 6.7.2 Security Configuration

```javascript
// backend/middleware/securityMiddleware.js

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting to prevent brute force
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Helmet for security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
});
```

---

## 6.8 MODULE 7: CI/CD PIPELINE

### 6.8.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Auto Deploy (Frontend + Backend)

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e

            # Code sync
            cd /var/www/StJohn-WebApp
            git fetch origin
            git reset --hard origin/main
            git clean -fd

            # Backend deploy
            cd backend
            npm install --production
            pm2 restart sleep-backend
            pm2 save

            # Frontend build
            cd ../quiz-frontend
            npm install
            npm run build

            # Frontend deploy
            sudo rm -rf /var/www/stjohn-frontend/*
            sudo cp -r dist/* /var/www/stjohn-frontend/
```

### 6.8.2 PM2 Process Configuration

```javascript
// backend/ecosystem.config.js

module.exports = {
  apps: [{
    name: 'sleep-backend',
    script: 'server.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

---

## 6.9 DATABASE SCHEMA

### 6.9.1 Complete Schema Definition

```sql
-- Users table with session tracking
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  keycloak_id VARCHAR(255),
  session_token VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questionnaire schemas (versioned)
CREATE TABLE questionnaire_schemas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL,
  schema JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, version)
);

-- Questionnaire responses
CREATE TABLE questionnaire_responses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  response_data JSONB NOT NULL,
  prediction JSONB,
  ml_payload JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient JSONB queries
CREATE INDEX idx_response_data ON questionnaire_responses USING GIN (response_data);
CREATE INDEX idx_user_responses ON questionnaire_responses(user_id);

-- Transcripts from voice capture
CREATE TABLE transcripts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  transcript TEXT NOT NULL,
  gemini_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6.10 SUMMARY

Table 6.1 summarizes the implementation modules and their key characteristics:

| Module | Technology Stack | Key Files | Lines of Code |
|--------|-----------------|-----------|---------------|
| Authentication | Keycloak OIDC, JWT, PostgreSQL | `authMiddleware.js`, `keycloakService.js` | ~350 |
| Questionnaire | React, JSONB, localStorage | `useQuestionnaireForm.js`, `questionnaireController.js` | ~400 |
| ML Prediction | FastAPI, Axios, Promise.allSettled | `predictionService.js` | ~140 |
| RAG Service | ChromaDB, FastAPI, pypdf | `vector_store.py`, `main.py` | ~180 |
| Voice Capture | Vosk, Custom Diarizer, WebSocket | `simple_diarizer.py`, `streamAudio.js` | ~320 |
| Export/Security | ExcelJS, Helmet, Rate Limiter | `exportService.js`, `securityMiddleware.js` | ~150 |
| CI/CD | GitHub Actions, PM2, SSH | `deploy.yml`, `ecosystem.config.js` | ~50 |

The implementation follows a microservices architecture with clear separation of concerns, graceful degradation patterns, and security-first design principles.
