// file: frontend/src/pages/HomeScreen.jsx
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import '../styles/HomeScreen.css';
import { fetchAndCacheAllQuizzes } from '../service/quizCacheService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function HomeScreen() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    // Fetch quizzes once the user is logged in
    if (currentUser) {
      fetchAndCacheAllQuizzes();
    }
  }, [currentUser]);

  if (loading || !currentUser) {
    // Show loading while AuthContext is checking session
    return <div className="home-container">Loading...</div>;
  }

  return (
    <>
      <Navbar />
    <div className="home-container">
      <main className="home-main">
        <h2>Welcome{currentUser.user.name}</h2>
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
