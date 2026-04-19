# SleepWebApp

A full-stack web application for sleep research and quiz management. Built with React (frontend) and Express/PostgreSQL (backend).

## Features

- User authentication (email/password & Google OAuth)
- Cross-tab session sync
- Dynamic questionnaire/quiz system
- User profile management
- Results and scoring
- REST API with Swagger documentation
- Responsive UI (custom CSS, ready for integration with Tailwind/MUI/Bootstrap)

## Technologies

- Frontend: React, React Router, Context API, Vite
- Backend: Express, PostgreSQL, JWT, bcrypt, Swagger
- RAG Service: FastAPI, ChromaDB
- API Docs: Swagger UI (`/api-docs`)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL

### Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Mdz4id/sleepWebApp.git
   cd sleepWebApp
   ```

2. **Install dependencies:**
   ```sh
   cd backend
   npm install
   cd ../rag-service
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cd ../quiz-frontend
   npm install
   ```

3. **Configure environment variables:**
   - Fill in database, JWT, and Google OAuth credentials.

4. **Start PostgreSQL and create the database:**
   - Ensure your database is running and matches the config in `backend/.env`.

5. **Run the backend:**
   ```sh
   cd backend
   npm run dev
   # or
   node server.js
   ```

6. **Run the frontend:**
   ```sh
   cd quiz-frontend
   npm run dev
   ```

7. **Access the app:**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000](http://localhost:5000)
   - RAG API: [http://localhost:8100](http://localhost:8100)
   - RAG Docs: [http://localhost:8100/docs](http://localhost:8100/docs)
   - Swagger Docs: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

## RAG Integration

- A separate service is available at `rag-service/` for retrieval-augmented explanations.
- Backend calls `POST /explain` after prediction as a best-effort step. Prediction flow still succeeds if RAG is unavailable.
- Configure backend with:
  - `RAG_ENABLED=true`
  - `RAG_SERVICE_URL=http://127.0.0.1:8100`

## API Documentation

- Interactive API docs available at `/api-docs` (Swagger UI)
- Add/modify endpoint docs in `backend/routes/*.js` using OpenAPI JSDoc comments

## Folder Structure

```
backend/
  controllers/
  models/
  routes/
  config/
  ...
quiz-frontend/
  src/
    components/
    pages/
    context/
    ...
```



## License
MIT

## Author
Mdz4id
