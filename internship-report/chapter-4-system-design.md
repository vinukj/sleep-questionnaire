# CHAPTER 4

# SYSTEM DESIGN

## 4.1 SYSTEM ARCHITECTURE

### 4.1.1 Service Internals and Runtime Environments

The system is built on a distributed microservices model to isolate heavy computational tasks from standard transactional workflows.

Express.js Backend (Orchestration Layer): Running on Node.js 20 LTS, the backend utilizes the V8 engine's non-blocking I/O to manage concurrent API requests. It employs a PostgreSQL Connection Pool (pg.Pool) to maintain a set of reusable database connections, reducing the latency overhead of the TCP handshake for every query. The backend acts as a Layer 7 gateway, handling authentication via OIDC and routing specific payloads to the AI microservices.

Python FastAPI Services (Compute Layer): Both the RAG and Voice services leverage Uvicorn, an ASGI (Asynchronous Server Gateway Interface) server. This allows Python to handle concurrent requests using async/await, which is critical when waiting for responses from external LLM APIs (Gemini) or managing long-lived WebSocket connections.

React Frontend (Client Layer): Built with Vite, the frontend utilizes Hot Module Replacement (HMR) for development and Rollup for production bundling. It employs a component-driven architecture where state is lifted to React Context to prevent "prop drilling" across the multi-section questionnaire.

### 4.1.2 Communication Protocol Technicalities

The interaction between services is governed by specific protocols chosen for their performance characteristics:

Parallel Execution via Promise.allSettled(): Unlike Promise.all(), which short-circuits and fails if any single promise rejects, allSettled allows the backend to collect the outcome of the ML prediction and the RAG explanation independently. This is a form of Optimistic Concurrency, where the system assumes both will succeed but is architected to handle partial failures without rolling back the primary database transaction.

Binary WebSocket Streaming: For the voice capture, the system bypasses the overhead of Base64 encoding. The frontend captures audio via the Web Audio API (AudioContext), downsamples it to 16-bit PCM at 16kHz, and streams the raw binary data. The backend uses the ws library to forward these binary frames to the Python service, which feeds them into the Azure Speech SDK buffer.

Circuit Breaker State Machine: The circuit breaker is implemented as a logic wrapper around Axios. It monitors the Failure Rate Threshold. When the error count exceeds the limit, the state transitions from CLOSED to OPEN, immediately rejecting calls to a failing service to prevent cascading failures across the cluster.

### 4.1.3 Storage Architecture and Indexing

The storage layer is designed for high-speed retrieval and complex data structure support:

JSONB and GIN Indexing: By using JSONB in PostgreSQL, the system stores questionnaire responses in a binary format that supports Generalized Inverted Index (GIN). This allows for efficient querying inside the JSON blob—for example, searching for all patients who answered "Yes" to a specific conditional question without needing a flat relational table.

Vector Space (ChromaDB): The RAG service utilizes ChromaDB, which implements HNSW (Hierarchical Navigable Small World) graphs for efficient k-Nearest Neighbors (k-NN) searches. Clinical guidelines are converted into 384-dimensional vectors; when a query is made, the system calculates the Cosine Similarity between the query vector and the stored document vectors to find the most contextually relevant evidence.

## 4.2 DETAILED DESIGN

### 4.2.1 Authentication and Token Management

The system uses a Stateless JWT-based authentication model reinforced by a Stateful Session Store in PostgreSQL.

OIDC and Keycloak: Keycloak handles the "Heavy Lifting" of the OpenID Connect protocol. The backend validates tokens using the JWKS (JSON Web Key Set) endpoint, which allows it to verify the RSA signature of the incoming JWT without making a network call for every request.

Session Replacement Logic: To enforce the single-device policy, the system generates a unique session_id upon login. This ID is stored in the database and embedded as a custom claim in the JWT. If a user logs in elsewhere, the is_valid flag for the old session_id is set to false. The backend middleware checks this flag on every request, ensuring that stolen or old tokens are immediately neutralized.

### 4.2.2 Voice Processing and Speaker Diarization

The voice module handles the complexity of "Who spoke when" through specialized signal processing:

Diarization Engine: The Azure ConversationTranscriber uses Speaker Recognition technology to extract "voice prints." By analyzing the pitch, cadence, and frequency of the audio stream, it differentiates between the clinician and the patient.

NLP Extraction (Gemini AI): Once the transcript is complete, the text is fed into a Zero-Shot Prompt in Gemini. The prompt instructs the model to parse the conversational text into a structured JSON schema (HPI, Chief Complaint, etc.). This utilizes the LLM's reasoning capabilities to filter out "filler words" and clinical "noise" from the dialogue.

### 4.2.3 RAG Ingestion and Retrieval Pipeline

The Retrieval-Augmented Generation process is split into an offline ingestion phase and an online retrieval phase:

1. Ingestion (Offline): PDFs are parsed using pypdf. To maintain context, a Recursive Character Text Splitter is used, creating 500-token chunks with a 50-token overlap. This ensures that a sentence split across two chunks can still be understood in its entirety.

2. Retrieval (Online): The query is embedded using the all-MiniLM-L6-v2 model. The system retrieves the top 5 chunks.

3. Augmentation: These chunks are injected into the LLM context window as "Context," and the LLM is instructed to answer the user's query only using the provided context, significantly reducing the risk of hallucinations.

### 4.2.4 Frontend Form Logic and Auto-Persistence

The questionnaire UI is designed for data integrity:

Conditional Logic Engine: Each question object contains a dependsOn attribute. The frontend uses a Watcher Pattern (via react-hook-form) to monitor the state of parent questions. When a value matches the condition, the dependent question is dynamically mounted into the DOM.

LocalStorage Sync: The useQuestionnaireForm hook implements a Debounced Persistence logic. It writes the current state of the form to localStorage every 30 seconds but only after the user stops typing for 500ms, preventing unnecessary I/O operations and ensuring a smooth typing experience.
