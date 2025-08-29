import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthScreen from "./pages/authScreen.jsx";

import ProtectedRoute from "./components/ProtectedRoute";
import HomeScreen from "./pages/HomeScreen.jsx";
import QuestionnairePage from "./pages/questionnairePage.jsx";
import QuizScreen from "./pages/QuizScreen.jsx";
import ResultsScreen from "./components/ResultsScreen.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import { fetchAndCacheAllQuizzes } from "./service/quizCacheService.js";

export default function App() {
  
  return (
    <Routes>
      {/* Route for the login/signup page */}
      <Route path="/login" element={<AuthScreen />} />

      <Route
        path="/quiz/:quizName/:language"
        element={
          <ProtectedRoute>
            <QuizScreen />
          </ProtectedRoute>
        }
      />

      {/* A protected route for the quiz. Only logged-in users can access this. */}

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        }
      />

      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <ResultsScreen />
          </ProtectedRoute>
        }
      />

      <Route
        path="/questionnaire"
        element={
          <ProtectedRoute>
            <QuestionnairePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <AboutPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
