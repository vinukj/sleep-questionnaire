// file: frontend/src/pages/HomeScreen.jsx
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import '../styles/HomeScreen.css';
import { fetchAndCacheAllQuizzes } from '../service/quizCacheService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function HomeScreen() {
  const { currentUser, loading, authFetch,authReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if auth check finished and user is not authenticated
    if (authReady && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, authReady, navigate]);

  useEffect(() => {
    // Fetch quizzes once the user is logged in
    if (currentUser) {
      fetchAndCacheAllQuizzes(authFetch, currentUser.user.id);
    }
  }, [currentUser, authFetch]);

  if (!authReady) {
    return (
      <div className="home-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <>
      <Navbar />
      <div className="home-container">
        <main className="home-main">
          <h2>Welcome {currentUser.user ? currentUser.user.email : currentUser.email}</h2>
          <p>Track your sleep, answer questionnaires, and monitor your progress.</p>

          <div className="placeholder-content">
            {/* <p>Questionnaire content will go here.</p> */}
          </div>
        </main>
      </div>
    </>
  );
}

export default HomeScreen;
