import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReusableQuiz from "../components/ReusableQuiz"; // Import the quiz component

// --- Scoring logic and Results Component ---
const calculateHealthScore = (answers) => {
  let score = 0;
  // Example: Give points for not snoring
  if (answers["13"] === "No") score += 25;
  // Example: Give points for not feeling sleepy during the day
  if (answers["12"] === "No") score += 25;
  // Add more scoring rules based on the questionnaire's medical logic
  return { score };
};

const HealthResults = ({ score, onRetake }) => (
  <div className="quiz-container" style={{ margin: 'auto' }}>
    <h2 style={{ fontSize: '24px' }}>Quiz Complete!</h2>
    <p style={{ fontSize: '22px', color: '#3b82f6' }}>Your Score: {score.score}</p>
    <button className="quiz-nav-button" onClick={onRetake} style={{ width: 'auto', padding: '15px 30px' }}>
      Retake Quiz
    </button>
  </div>
);

// --- Main Host Screen Component ---
export default function QuizScreen() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login'); // Redirect if no token is found
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/quizzes/st-johns-quiz/en', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.ok) {
          // Handle specific auth errors vs. general server errors
          if (response.status === 401 || response.status === 403) {
            throw new Error('Authentication failed. Please log in again.');
          } else {
            throw new Error('Failed to fetch quiz data from the server.');
          }
        }

        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [navigate]);

  const handleQuizComplete = (answers, score) => {
    console.log("Final Answers:", answers);
    console.log("Final Score:", score);
    // In a real application, you would save these results to your database here
  };

  const handleQuizExit = () => {
    console.log("User exited the quiz.");
    // You could navigate to a dashboard or home page here, e.g., navigate('/dashboard');
  };

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px' }}>Loading Quiz...</div>;
  }

  if (error) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'red', fontSize: '18px' }}>Error: {error}</div>;
  }

  return (
    <ReusableQuiz
      questions={questions}
      calculateScore={calculateHealthScore}
      onComplete={handleQuizComplete}
      onExit={handleQuizExit}
      ResultsComponent={HealthResults}
    />
  );
}
