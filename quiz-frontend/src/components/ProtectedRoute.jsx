import React, { use } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigate = useNavigate();
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
    navigate("/login", { replace: true, state: { from: location } });
    return null;
  }

  return children;
}
