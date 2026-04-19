import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar.jsx';
import '../styles/variables.css';
import '../styles/components.css';
import '../styles/HomeScreen.css';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { createAudioStreamer, StreamState } from '../utils/streamAudio.js';

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamState, setStreamState] = useState(StreamState.IDLE);
  const [transcriptions, setTranscriptions] = useState([]);
  const [geminiResult, setGeminiResult] = useState(null);
  const audioStreamerRef = useRef(null);

  useEffect(() => {
    if (authReady && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, authReady, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
    };
  }, []);

  const handleConversationToggle = async () => {
    if (!isStreaming) {
      // Start streaming
      try {
        audioStreamerRef.current = createAudioStreamer({
          onStateChange: (state) => {
            console.log('Stream State Changed:', state);
            setStreamState(state);
          },
          onTranscription: (data) => {
            console.log('Transcription received:', data);
            setTranscriptions(prev => [...prev, data]);
          },
          onGeminiResult: (result) => {
            console.log('Gemini result received:', result);
            setGeminiResult(result);
          },
          onError: (error) => {
            console.error('Audio Streaming Error:', error);
            alert(`Error: ${error.message}`);
            setIsStreaming(false);
          }
        });

        await audioStreamerRef.current.start();
        setIsStreaming(true);
      } catch (error) {
        console.error('Failed to start audio streaming:', error);
        alert('Failed to start conversation. Please check microphone permissions.');
      }
    } else {
      // Stop streaming
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
        console.log('=== Audio Stream Output ===');
        console.log('Total transcriptions received:', transcriptions.length);
        console.log('Transcriptions:', transcriptions);
        console.log('=========================');
      }
      setIsStreaming(false);
      setGeminiResult(null);
      setStreamState(StreamState.IDLE);
    }
  };

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
               <button
                    onClick={handleConversationToggle}
                    className={`btn ${isStreaming ? 'btn--danger' : 'btn--secondary'} home-start-btn`}
                    style={{ marginTop: '1rem' }}
                    disabled={streamState === StreamState.CONNECTING}
                  >
                    {streamState === StreamState.CONNECTING ? 'Connecting...' : 
                     isStreaming ? 'Stop Conversation' : 'Start Conversation'}
                    {!isStreaming && <ArrowIcon />}
                  </button>
                   {isStreaming && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '0.5rem 1rem', 
                      backgroundColor: '#dcfce7', 
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#16a34a', 
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }}></span>
                      Recording... ({transcriptions.length} transcriptions)
                    </div>
                  )}
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

      {/* Gemini Result Modal */}
      {geminiResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setGeminiResult(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '1.5rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Clinical Analysis Result</h2>
              <button
                onClick={() => setGeminiResult(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  lineHeight: 1,
                  padding: '0 0.25rem'
                }}
              >
                ×
              </button>
            </div>

            {typeof geminiResult === 'object' ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {/* Gemini clinical fields */}
                {Object.entries(geminiResult)
                  .filter(([key, v]) =>
                    v !== null &&
                    !['ml_prediction', 'ml_prediction_error', 'ml_payload_sent'].includes(key)
                  )
                  .map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      <span style={{
                        textTransform: 'capitalize',
                        fontWeight: 500,
                        color: '#475569',
                        fontSize: '0.875rem'
                      }}>
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span style={{
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                      }}>
                        {String(value)}
                      </span>
                    </div>
                  ))}

                {/* ML Prediction Section */}
                {geminiResult.ml_prediction && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: '#eff6ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe'
                  }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#1e40af' }}>
                      🤖 ML Prediction
                    </h3>
                    {Object.entries(geminiResult.ml_prediction).map(([key, value]) => (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.35rem 0.5rem',
                          borderBottom: '1px solid #dbeafe'
                        }}
                      >
                        <span style={{
                          textTransform: 'capitalize',
                          fontWeight: 500,
                          color: '#3b82f6',
                          fontSize: '0.8rem'
                        }}>
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span style={{
                          fontWeight: 600,
                          color: '#1e3a5f',
                          fontSize: '0.8rem'
                        }}>
                          {typeof value === 'number' ? value.toFixed(3) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {geminiResult.ml_prediction_error && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#fef2f2',
                    borderRadius: '6px',
                    border: '1px solid #fecaca',
                    fontSize: '0.8rem',
                    color: '#991b1b'
                  }}>
                    ⚠️ Prediction unavailable: {geminiResult.ml_prediction_error.message}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: '1rem',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#334155',
                whiteSpace: 'pre-wrap'
              }}>
                {String(geminiResult)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default HomeScreen;
