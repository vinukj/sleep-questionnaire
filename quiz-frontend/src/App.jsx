import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import theme from "./theme.js";
import AuthScreen from "./pages/authScreen.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import HomeScreen from "./pages/HomeScreen.jsx";
import QuestionnairePage from "./pages/questionnairePage.jsx";
import QuizScreen from "./pages/QuizScreen.jsx";
import ResultsScreen from "./components/ResultsScreen.jsx";
import AboutPage from "./pages/AboutPage.jsx";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "background.default",
          display: "flex",
          flexDirection: "column",
        }}
      >
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

          {/* Protected routes for authenticated users */}
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
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Box>
    </ThemeProvider>
  );
}
