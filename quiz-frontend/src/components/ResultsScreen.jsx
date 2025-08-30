// file: components/ResultsScreen.js

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/ResultsScreen.css'; // We'll create this CSS file next
import Navbar from './NavBar';

const ResultsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the score object passed from the previous screen
  const { score } = location.state || {};

  // If someone navigates here directly without a score, show a message.
  if (!score) {
    return (
      <div className="results-container">
        <h1>No results found.</h1>
        <p>Please complete a quiz to see your score.</p>
        <button className="button" onClick={() => navigate('/home')}>
          Go to Homepage
        </button>
      </div>
    );
  }

  const componentLabels = {
    c1: 'Subjective Sleep Quality',
    c2: 'Sleep Latency',
    c3: 'Sleep Duration',
    c4: 'Sleep Efficiency',
    c5: 'Sleep Disturbances',
    c6: 'Use of Medication',
    c7: 'Daytime Dysfunction',
  };

  const hasDetailedComponents = score.c1 !== undefined;

  return (
    <>
    <Navbar></Navbar>
    <div className="results-container">
      <div className="header-container">
        <h1 className="header-title">Your Results</h1>
        <p className="quiz-name">{score.quizName.toUpperCase()}</p>
      </div>

      <div className="score-card">
        <p className="score-label">Global Score</p>
        <p className="score-value">{score.globalScore}</p>
        <p className="interpretation">{score.interpretation}</p>
      </div>

      {hasDetailedComponents && (
        <div className="breakdown-container">
          <h2 className="breakdown-title">Detailed Breakdown</h2>
          {Object.keys(componentLabels).map((key) => (
            <div key={key} className="component-row">
              <span className="component-label">{componentLabels[key]}</span>
              <span className="component-score">{score[key]}</span>
            </div>
          ))}
        </div>
      )}

      <button className="button" onClick={() => navigate('/questionnaire')}>
        Done
      </button>
    </div>
    </>
  );
};

export default ResultsScreen;