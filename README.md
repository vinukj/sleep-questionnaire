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
   cd ../quiz-frontend
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in both `backend` and `quiz-frontend` folders.
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
   - Swagger Docs: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

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
