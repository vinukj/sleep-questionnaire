import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const [isValid, setIsValid] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setIsValid(false);
      return;
    }

    fetch('http://localhost:5000/auth/verify', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Invalid token');
      })
      .then(data => setIsValid(true))
      .catch(() => {
        localStorage.removeItem('token');
        setIsValid(false);
      });
  }, [token]);

  if (isValid === null) return <div>Loading...</div>;

  return isValid ? children : <Navigate to="/login" replace />;
}
