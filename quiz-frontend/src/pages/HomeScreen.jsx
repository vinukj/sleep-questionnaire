import React, { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import '../styles/variables.css';
import '../styles/components.css';
import '../styles/HomeScreen.css';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Sleep illustration SVG component
const SleepIllustration = () => (
  <svg width="200" height="200" viewBox="0 0 200 200" style={{ opacity: 0.6 }}>
    <rect x="20" y="120" width="160" height="60" rx="8" fill="#94a3b8"/>
    <rect x="30" y="100" width="140" height="30" rx="15" fill="#cbd5e1"/>
    <ellipse cx="70" cy="100" rx="40" ry="20" fill="#e2e8f0"/>
    <circle cx="70" cy="95" r="25" fill="#f1a398"/>
    <path d="M 45 95 Q 45 70 70 70 Q 95 70 95 95" fill="#4a3f35"/>
    <path d="M 60 90 Q 62 92 64 90" stroke="#2d2d2d" strokeWidth="2" fill="none"/>
    <path d="M 76 90 Q 78 92 80 90" stroke="#2d2d2d" strokeWidth="2" fill="none"/>
    <ellipse cx="110" cy="130" rx="50" ry="25" fill="#93c5fd"/>
    <text x="140" y="60" fontFamily="Arial" fontSize="24" fill="#60a5fa" opacity="0.7">Z</text>
    <text x="155" y="45" fontFamily="Arial" fontSize="18" fill="#60a5fa" opacity="0.5">z</text>
    <text x="165" y="35" fontFamily="Arial" fontSize="14" fill="#60a5fa" opacity="0.3">z</text>
  </svg>
);

// Arrow icon
const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

function HomeScreen() {
  const { currentUser, authReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authReady && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, authReady, navigate]);

  if (!authReady) {
    return (
      <div className="home-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <>
      <Navbar />
      <main className="home-main">
        <div className="home-container">
          {/* Hero Section */}
          <section className="home-hero">
            <h1 className="home-title">
              Welcome to Sleep<span className="home-title-accent">Maitrix</span>
            </h1>
            <p className="home-subtitle">
              Start your sleep analysis journey with our comprehensive AI-powered questionnaire
            </p>

            {/* Questionnaire Card */}
            <div className="home-card card">
              <div className="home-card-content">
                {/* Illustration */}
                <div className="home-illustration">
                  <div className="home-illustration-box">
                    <SleepIllustration />
                  </div>
                </div>

                {/* Content */}
                <div className="home-info">
                  <h2 className="home-card-title">Sleep Questionnaire</h2>
                  <p className="home-card-description">
                    Answer comprehensive questions about your sleep patterns, habits, and health history to
                    receive personalized AI-powered insights and recommendations.
                  </p>
                  <button
                    onClick={() => navigate('/STJohnquestionnaire')}
                    className="btn btn--primary home-start-btn"
                  >
                    Start Questionnaire
                    <ArrowIcon />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="home-footer">
              <div className="home-footer-content">
                <span>&copy; 2024 SleepMaitrix</span>
                <a href="#privacy" className="home-footer-link">Privacy</a>
                <a href="#terms" className="home-footer-link">Terms</a>
                <a href="#help" className="home-footer-link">Help</a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default HomeScreen;
