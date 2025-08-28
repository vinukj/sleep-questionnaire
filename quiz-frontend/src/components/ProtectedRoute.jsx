import React from 'react';
import { Navigate } from 'react-router-dom';

// This component is a wrapper that checks for a JWT.
// If the token exists, it renders the child component (the quiz screen).
// If not, it redirects the user to the login page.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
