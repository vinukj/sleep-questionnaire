import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { currentUser, authReady } = useAuth();
  const location = useLocation();

  // Show loading state only if auth is not ready
  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to home if user is not authenticated or not an admin
  if (!currentUser || !currentUser.user || !currentUser.user.isAdmin) {
    return <Navigate to="/home" replace state={{ from: location }} />;
  }

  // Render children if authenticated and is admin
  return children;
}