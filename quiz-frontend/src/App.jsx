import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Import your page and component files
import AuthScreen from "./pages/authScreen.jsx";

import ProtectedRoute from "./components/ProtectedRoute";
import HomeScreen from "./pages/HomeScreen.jsx";
import QuestionnairePage from "./pages/questionnairePage.jsx";
import QuizScreen from "./pages/QuizScreen.jsx";
import ResultsScreen from "./components/ResultsScreen.jsx";

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

      {/* This is a catch-all. If a user goes to any other URL,
          it will automatically redirect them to the login page. */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
