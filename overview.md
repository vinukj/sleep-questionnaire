   # Sleep Questionnaire — Project Overview

   ## Purpose

   SleepWebApp is a full-stack web application for sleep research and clinical questionnaire management. It enables medical professionals (physicians, admins) to administer the **St. John Sleep Questionnaire** to patients, collect responses, calculate sleep scores, run ML predictions for sleep disorder risk (e.g., Obstructive Sleep Apnea), and provide RAG-based (Retrieval-Augmented Generation) explanations. The system also supports OCR document processing, voice capture/transcription, and Excel export of patient data.

   ---

   ## Architecture

   ### Monorepo with Independent Services

   ```
   sleep-questionnaire/
   ├── backend/                    # Express.js REST API
   ├── quiz-frontend/              # React SPA (Vite)
   ├── rag-service/                # Python FastAPI — RAG explanations
   └── voice-capture-service/      # Python FastAPI — Voice transcription
   ```

   Each service has its own dependencies, environment variables, and runs independently.

   ### Service Communication Flow

   ```
   Frontend (React)
      │
      ├── REST API ──► Backend (Express:5000)
      │                     │
      │                     ├── PostgreSQL (raw SQL via pg pool)
      │                     │
      │                     ├── ML Prediction (http://127.0.0.1:8000/predict)
      │                     │
      │                     ├── RAG Service (FastAPI:8100)
      │                     │
      │                     └── Keycloak (OIDC/OAuth2)
      │
      ├── WebSocket ──► Backend WS bridge ──► Voice Service (FastAPI:8001)
      │
      └── Direct HTTP ──► RAG Service (optional, for explanations)
   ```

   ---

   ## Tech Stack

   | Layer | Technology |
   |---|---|
   | **Frontend Framework** | React 19 with Vite 7 |
   | **Frontend UI Library** | Material UI (MUI) v7 with Emotion |
   | **Frontend Routing** | React Router DOM v7 |
   | **Frontend Forms** | React Hook Form v7 with Zod v4 validation |
   | **Frontend HTTP** | Axios + native fetch |
   | **Frontend State** | React Context API (AuthContext) |
   | **Backend Framework** | Express.js v5 (ESM modules) |
   | **Database** | PostgreSQL (via `pg` pool) |
   | **Authentication** | Keycloak (OIDC/OAuth2) + Google OAuth |
   | **Token Management** | JWT (jsonwebtoken, jwks-rsa) |
   | **Password Hashing** | bcrypt / bcryptjs |
   | **API Documentation** | Swagger UI (swagger-jsdoc + swagger-ui-express) |
   | **RAG Service** | FastAPI + ChromaDB + pypdf |
   | **Voice Service** | FastAPI + Vosk (speech-to-text) + NumPy |
   | **OCR** | Tesseract.js (browser-side), mammoth (DOCX) |
   | **WebSocket** | `ws` library (audio streaming tunnel) |
   | **Excel Export** | xlsx (SheetJS) |
   | **Build Tool** | Vite (frontend), nodemon (backend dev) |
   | **Deployment** | Vercel (frontend), VPS (backend) |
   | **Linting** | ESLint v9 |

   ---

   ## Directory Structure

   ### Backend (`backend/`)

   ```
   backend/
   ├── config/             # DB pool, Keycloak, Google OAuth config
   ├── controllers/        # Request handlers (auth, questionnaire, OCR, schema admin)
   ├── models/             # Database queries (users, questionnaire responses, schemas)
   ├── routes/             # Express route definitions with Swagger JSDoc
   ├── middleware/         # authMiddleware.js (Keycloak token verification, role guards)
   ├── services/           # Business logic (scoring, prediction, RAG, OCR, export, Keycloak)
   ├── utils/              # Excel/CSV export utilities, column ordering
   ├── ws/                 # WebSocket server (audio streaming bridge to Python)
   ├── scripts/            # Seed scripts for questionnaire data
   ├── migrations/         # SQL migration files
   ├── server.js           # Express app entry point
   └── STJOHNQuestions.js  # Questionnaire schema definition (shared)
   ```

   ### Frontend (`quiz-frontend/`)

   ```
   quiz-frontend/
   ├── src/
   │   ├── api/            # Axios instance with token interceptors
   │   ├── components/     # Reusable UI (Questionnaire, ProtectedRoute, AdminRoute, Navbar, OCR, etc.)
   │   ├── context/        # AuthContext.jsx (full auth state management)
   │   ├── hooks/          # Custom hooks (useQuestionnaire, useQuestionnaireForm, useAuthRedirect, etc.)
   │   ├── pages/          # Route-level pages (AuthScreen, HomeScreen, AdminDashboard, ViewResponse, EditResponse, OCRUploadPage)
   │   ├── service/        # Cache services (quizCacheService, questionnaireSchemaService)
   │   ├── utils/          # JWT utilities, logger, audio streaming
   │   ├── theme.js        # MUI theme configuration
   │   ├── App.jsx         # Router configuration
   │   └── main.jsx        # ReactDOM entry point
   ├── vite.config.js      # Vite config with API proxy
   └── vercel.json         # Vercel deployment with rewrites to backend
   ```

   ### RAG Service (`rag-service/`)

   ```
   rag-service/
   └── app/
      ├── main.py         # FastAPI endpoints (ingest text/PDF, explain)
      ├── vector_store.py # ChromaDB vector operations
      ├── llm.py          # LLM explanation generation
      ├── schemas.py      # Pydantic request/response models
      └── config.py       # Configuration
   ```

   ### Voice Capture Service (`voice-capture-service/`)

   ```
   voice-capture-service/
   └── app/
      ├── main.py         # WebSocket endpoint for live audio streaming
      ├── diarization/    # Speaker diarization
      ├── services/       # Session management
      └── schemas.py      # Pydantic models
   ```

   ---

   ## Database Schema

   **PostgreSQL with raw SQL via `pg` connection pooling. No ORM is used.** Tables are auto-created on server startup using `CREATE TABLE IF NOT EXISTS`.

   ### `users`

   | Column | Type | Constraints |
   |---|---|---|
   | `id` | SERIAL | PRIMARY KEY |
   | `email` | VARCHAR | UNIQUE, NOT NULL |
   | `password` | VARCHAR | NULLABLE (legacy bcrypt) |
   | `name` | VARCHAR | |
   | `google_id` | VARCHAR | |
   | `picture` | VARCHAR | |
   | `keycloak_id` | VARCHAR | UNIQUE |
   | `role` | VARCHAR | DEFAULT 'user' |
   | `session_token` | VARCHAR | |
   | `session_updated_at` | TIMESTAMP | |
   | `created_at` | TIMESTAMP | DEFAULT NOW() |

   ### `user_sessions`

   | Column | Type | Constraints |
   |---|---|---|
   | `token_id` | VARCHAR | PRIMARY KEY |
   | `user_id` | INTEGER | FK → users(id) |
   | `refresh_token` | TEXT | |
   | `expires_at` | TIMESTAMP | |
   | `is_active` | BOOLEAN | DEFAULT true |
   | `created_at` | TIMESTAMP | DEFAULT NOW() |

   ### `questionnaire_responses`

   | Column | Type | Constraints |
   |---|---|---|
   | `id` | SERIAL | PRIMARY KEY |
   | `user_id` | INTEGER | FK → users(id) |
   | `response_data` | JSONB | |
   | `prediction_data` | JSONB | |
   | `ml_payload` | JSONB | |
   | `created_at` | TIMESTAMP | DEFAULT NOW() |
   | `updated_at` | TIMESTAMP | DEFAULT NOW() |

   ### `questionnaire_schemas`

   | Column | Type | Constraints |
   |---|---|---|
   | `id` | SERIAL | PRIMARY KEY |
   | `name` | VARCHAR | UNIQUE, NOT NULL |
   | `schema` | JSONB | |
   | `created_at` | TIMESTAMP | DEFAULT NOW() |
   | `updated_at` | TIMESTAMP | DEFAULT NOW() |

   *Index on `name` column.*

   ---

   ## Authentication Architecture

   ### Keycloak-based OIDC with Hybrid Migration Support

   1. **Primary Auth**: Keycloak as the identity provider
      - Token verification via Keycloak introspection endpoint
      - Admin client for user management (create, assign roles, revoke sessions)
      - Roles: `user`, `physician`, `admin`

   2. **Single Device Login**: Enforced via `session_token` stored in the database
      - On login, a new random session token is generated and stored
      - All previous Keycloak sessions are revoked
      - Every authenticated request must include matching `X-Session-Token` header
      - Mismatch = 401 with `session_token_mismatch` reason

   3. **Google OAuth**: Supported but requires Keycloak federation setup

   4. **Auto-Migration**: Legacy users with bcrypt passwords are automatically migrated to Keycloak on their next login — their actual password is used to create the Keycloak account

   5. **Token Management**:
      - Access tokens + refresh tokens stored in localStorage
      - Proactive refresh when token has < 2 minutes remaining
      - Cross-tab sync via BroadcastChannel + storage events
      - Automatic retry on 401 responses

   ### Auth Middleware Flow

   ```
   Request
   │
   ├── verifyTokens middleware
   │     ├── Extract JWT from Authorization header
   │     ├── Extract session token from X-Session-Token header
   │     ├── Validate JWT via Keycloak introspection
   │     ├── Check session_token matches database
   │     └── Attach user to request
   │
   ├── requireAdmin guard (optional)
   │     └── Check user.role IN ('admin', 'physician')
   │
   └── requireSuperAdmin guard (optional)
         └── Check user.role === 'admin'
   ```

   ---

   ## API Design

   ### RESTful API with consistent patterns

   **Response Format:** `{ success, message, data, error }`

   | Prefix | Route File | Purpose |
   |---|---|---|
   | `/auth` | authRoute.js | Authentication (login, signup, logout, refresh, profile, Google OAuth) |
   | `/questionnaire` | questionnaireRoute.js | Questionnaire submission, responses, schema management |
   | `/about` | userRoute.js | User profile/info |
   | `/api` | exportRoute.js | Excel export |
   | `/ocr` | ocrRoute.js | Document OCR processing |

   ### Key Endpoints

   | Method | Endpoint | Description | Guard |
   |---|---|---|---|
   | `POST` | `/auth/signup` | Create user in Keycloak + local DB | Public |
   | `POST` | `/auth/login` | Hybrid login (Keycloak + auto-migration) | Public |
   | `POST` | `/auth/refresh` | Token rotation | Public |
   | `GET` | `/auth/profile` | Get current user profile | Protected |
   | `POST` | `/auth/google` | Google OAuth login | Public |
   | `POST` | `/auth/logout` | Revoke Keycloak session + invalidate local sessions | Protected |
   | `POST` | `/questionnaire/submit` | Submit questionnaire response | Protected |
   | `PUT` | `/questionnaire/update/:id` | Update existing response | Admin |
   | `GET` | `/questionnaire/admin/all-responses` | Paginated admin view with search | Admin |
   | `GET` | `/questionnaire/schema` | Get questionnaire schema | Public |
   | `POST` | `/questionnaire/schema` | Admin upsert schema | Admin |
   | `GET` | `/api/export/excel` | Export patients to Excel | Admin |
   | `POST` | `/ocr/process` | OCR text extraction | Protected |

   ### Security

   - Rate limiting: General (1000 req/15min) and auth-specific (500 req/15min) via `express-rate-limit`
   - Helmet headers
   - CORS with specific allowed origins
   - Cookie parsing
   - Swagger docs only enabled in non-production environments

   ---

   ## Routing Structure

   ### Frontend Routes (`App.jsx`)

   | Path | Component | Guard |
   |---|---|---|
   | `/login` | AuthScreen | Public |
   | `/home` | HomeScreen | ProtectedRoute |
   | `/STJohnquestionnaire` | Questionnaire | ProtectedRoute |
   | `/admin` | AdminDashboard | AdminRoute (admin/physician) |
   | `/view-response/:id?` | ViewResponse | AdminRoute |
   | `/edit-response/:id` | EditResponse | AdminRoute |
   | `/ocr-upload` | OCRUploadPage | ProtectedRoute |
   | `/` and `/*` | Redirect to `/login` | — |

   ---

   ## State Management

   ### React Context API (No Redux/Zustand)

   1. **AuthContext** (`context/AuthContext.jsx`) — Central auth provider managing:
      - User session state
      - JWT token storage (localStorage)
      - Token refresh logic with deduplication
      - Proactive token refresh (checks every 60 seconds, refreshes when < 2 minutes remain)
      - Cross-tab synchronization via `BroadcastChannel` and `storage` events
      - `authFetch()` wrapper that auto-retries on 401

   2. **Custom Hooks** for domain-specific state:
      - `useQuestionnaire` — Fetches and caches questionnaire schema with version checking
      - `useQuestionnaireForm` — Form state with localStorage persistence
      - `useAuthRedirect` — Handles auth redirect logic

   3. **localStorage Caching** (`quizCacheService.js`) — Per-user questionnaire caching with version-based invalidation

   4. **react-hook-form** — Form state management for the questionnaire with auto-save to localStorage every 30 seconds

   ---

   ## Key Architectural Patterns

   ### 1. Clean Layered Architecture

   ```
   Routes → Controllers → Services → Models → Database
   ```

   - **Routes** define endpoints with Swagger JSDoc annotations
   - **Controllers** handle request/response logic
   - **Services** contain business logic (scoring, prediction, RAG, OCR, export)
   - **Models** handle database queries using raw SQL with `pool.query()`

   ### 2. Resilient Service Communication

   The questionnaire submission flow uses `Promise.allSettled()` to run independent operations (DB save, ML prediction) in parallel. Each operation's success/failure is handled independently so that one failure does not break the entire flow. The RAG explanation is a best-effort call that never blocks the main response.

   ### 3. Dynamic Questionnaire Schema System

   Questionnaire schemas are stored in the database (`questionnaire_schemas` table with JSONB). The frontend fetches the schema from the API with version-based caching. If the API is unavailable, it falls back to a bundled local schema (`STJOHNQuestions.js`). Admins can upsert schemas via API.

   ### 4. Graceful Degradation

   The system is designed to work even when auxiliary services (ML prediction, RAG) are unavailable — the core questionnaire submission always succeeds.

   ### 5. Prediction Payload Builder

   A dedicated service normalizes and validates data before sending to the ML prediction endpoint (`http://127.0.0.1:8000/predict`), handling gender conversion, binary normalization, and conditional field defaults.

   ### 6. WebSocket Audio Tunnel

   The backend WebSocket server acts as a bridge between React frontend and the Python voice service, forwarding audio data bidirectionally.

   ### 7. Excel Formula Injection Prevention

   Export utility sanitizes cell values by prefixing `=`, `+`, `-`, `@` characters with a single quote.

   ### 8. BMI and Waist/Hip Ratio Auto-Calculation

   The frontend watches height/weight and waist/hip inputs and automatically calculates derived fields.

   ### 9. Conditional Question Rendering

   Questions support `dependsOn` property to conditionally show/hide based on other answers.

   ### 10. Auto-Save with Restore Dialog

   The questionnaire form auto-saves to localStorage every 30 seconds. On page load, if a recent save exists (< 24 hours), a dialog offers to restore progress.

   ---

   ## Build & Deployment

   ### Frontend (Vite)

   - Dev server with proxy to backend (`vite.config.js`)
   - Production build: `vite build`
   - Deployed on Vercel with rewrites routing API calls to the backend VPS
   - COOP/COEP headers configured for Google OAuth popup flow

   ### Backend (Express)

   - Dev: `nodemon server.js`
   - Production: `node server.js`
   - Port: 5000
   - Database tables auto-initialized on startup
   - Swagger docs available at `/api-docs` (non-production only)

   ### RAG Service (FastAPI)

   - `uvicorn app.main:app --host 0.0.0.0 --port 8100`
   - ChromaDB for vector storage (local, deterministic embeddings)
   - Optional LLM generation (requires `LLM_API_KEY`)

   ### Voice Service (FastAPI)

   - Vosk model for speech-to-text
   - WebSocket-based live audio streaming with speaker diarization

   ---

   ## Testing

   **No formal test framework is configured.** The `package.json` has `"test": "echo \"Error: no test specified\" && exit 1"`. There are no test files (`*.test.js`, `*.spec.js`) in the codebase.

   Manual test/utility scripts exist:
   - `test.js`, `test-export.js`, `test-output-new.xlsx` — Manual export testing
   - `inspect-excel.js`, `verify-export.js`, `verify-widths.js` — Excel verification utilities
   - `test-gui.html` in both rag-service and voice-capture-service — Browser-based API testing interfaces

   ---

   ## Notable Conventions

   - **ESM Modules**: Both frontend and backend use ES modules (`"type": "module"` in package.json)
   - **Structured Logging**: Custom logger utility with log levels
   - **No TypeScript**: Codebase is entirely JavaScript
   - **Raw SQL**: No ORM — all queries are parameterized raw SQL via `pg` pool
   - **JSONB Storage**: Complex data (responses, predictions, ML payloads, schemas) stored as JSONB in PostgreSQL
   - **Version-Based Schema Caching**: Frontend caches schema in localStorage keyed by user ID, only fetches if version changed
