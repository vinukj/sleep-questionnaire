import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // keep this until profile fetch completes

  if (!currentUser) return <Navigate to="/login" replace />;

  return children;
}
