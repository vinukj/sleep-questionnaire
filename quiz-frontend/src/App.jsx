import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthScreen from "./pages/authScreen.jsx";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import HomeScreen from "./pages/HomeScreen.jsx";
import QuestionnairePage from "./pages/questionnairePage.jsx";
import QuizScreen from "./pages/QuizScreen.jsx";
import ResultsScreen from "./components/ResultsScreen.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import Questionnaire from "./components/Questionnaire.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import {STJohnQuestionnaire} from "../STJOHNQuestions.js";

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
        path="/STJohnquestionnaire"
        element={<ProtectedRoute><Questionnaire questionnaire={STJohnQuestionnaire} /></ProtectedRoute>}></Route>

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

      {/* Admin Dashboard Route */}
      <Route
        path="/admin"
        element={
          <AdminRoute> <AdminDashboard /></AdminRoute>
           
      
        }
      />

      {/* Admin Export Route */}
     

      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
