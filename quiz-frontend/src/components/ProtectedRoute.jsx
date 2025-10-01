import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading, authReady } = useAuth();
  const location = useLocation();

  // Show loading state only if auth is not ready
  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Render children if authenticated
  return children;
}
