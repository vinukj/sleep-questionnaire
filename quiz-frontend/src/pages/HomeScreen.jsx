import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000';
import Navbar from '../components/Navbar.jsx';
import '../styles/HomeScreen.css';
import { fetchAndCacheAllQuizzes } from '../service/quizCacheService.js';
function HomeScreen() {
  const [user, setUser] = useState(null); // store user data

   const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    // Fetch all quizzes as soon as the user is authenticated
    if (isAuthenticated) {
      fetchAndCacheAllQuizzes();
    }
  }, [isAuthenticated]);

  const getProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unauthorized or invalid token");
      }

      const data = await response.json();
      console.log("Profile Data:", data);
      setUser(data.user); // save user object in state
    } catch (error) {
      console.error("Error fetching profile:", error.message);
    }
  };
  const handleLogout = () => {
  localStorage.removeItem('token');
  // optionally call backend to revoke session (if you support refresh tokens)
  window.location.href = '/login'; // hard reload or:
  // navigate('/login', { replace: true }); // if using react-router hook
};


  useEffect(() => {
    getProfile();
  }, []);

  return (
    <div className="home-container">
      <Navbar />
      <main className="home-main">
        <h2>Welcome to Sleep Questionnaire App</h2>
        <p>Track your sleep, answer questionnaires, and monitor your progress.</p>

        <div className="placeholder-content">
          <p>Questionnaire content will go here.</p>
        </div>
      </main>
    </div>
  );
}

export default HomeScreen;
