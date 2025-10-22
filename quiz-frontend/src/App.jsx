import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthRedirect } from "./hooks/useAuthRedirect";
import AuthScreen from "./pages/authScreen.jsx";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import HomeScreen from "./pages/HomeScreen.jsx";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import Questionnaire from "./components/Questionnaire.jsx";

export default function App() {
  // Set up auth redirect handling
  useAuthRedirect();

  return (
    <Routes>
      {/* for the login/signup page */}
      <Route path="/login" element={<AuthScreen />} />

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
        element={
          <ProtectedRoute>
            <Questionnaire />
          </ProtectedRoute>
        }
      ></Route>

  
      {/* Admin Dashboard Route */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            {" "}
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Admin Export Route */}

      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
