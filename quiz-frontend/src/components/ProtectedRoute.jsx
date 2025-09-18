import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, loading, verifySession } = useAuth();
  const [isVerifying, setIsVerifying] = React.useState(true);
  const location = useLocation();

  // Verify session on each protected route access
  React.useEffect(() => {
    const verify = async () => {
      setIsVerifying(true);
      const isValid = await verifySession();
      if (!isValid) {
        console.log('Session invalid, redirecting to login');
      }
      setIsVerifying(false);
    };
    verify();
  }, [verifySession, location.pathname]); // Re-verify on path change

  if (loading || isVerifying) return <div>Loading...</div>;

  if (!currentUser) {
    console.log('No current user, redirecting to login');
    // Force navigation to login
    window.location.href = '/login';
    return null;
  }

  return children;
}
