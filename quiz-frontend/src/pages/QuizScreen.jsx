import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReusableQuiz from "../components/ReusableQuiz";
import ResultsScreen from "../components/ResultsScreen"; // Assuming you have this component
import { getQuizFromCache } from "../service/quizCacheService";
import Navbar from "../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL;
export default function QuizScreen() {
  const { quizName, language } = useParams();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State to hold the final score object
  const [finalScore, setFinalScore] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const cachedQuestions = getQuizFromCache(quizName, language);
    
    if (cachedQuestions) {
      // ✅ TRANSFORM THE DATA HERE
      const formattedQuestions = cachedQuestions.map(q => ({
        id: q.question_id_string,
        question: q.question_text,
        inputType: q.input_type,
        options: q.options,
        dependsOn: q.depends_on,
      }));
      setQuestions(formattedQuestions);
    } else {
      console.error(`Quiz '${quizName}/${language}' not found in cache.`);
    }
    setIsLoading(false);
   


  }, [quizName, language]);

  // This function is passed to ReusableQuiz
  const handleQuizComplete = async (answers) => {
  try {
    const response = await fetch(
      `${API_URL}/quizzes/score/${quizName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ send cookies (accessToken, refreshToken)
        body: JSON.stringify(answers),
      }
    );

    if (!response.ok) throw new Error("Failed to calculate score.");

    const scoreData = await response.json();

    // Navigate to results page
    navigate("/results", { state: { score: scoreData } });
  } catch (err) {
    console.error(err);
    alert("Error calculating score. Please try again.");
  }
};


  const handleQuizExit = () => {
    navigate("/");
  };
  
  const handleRetake = () => {
      setFinalScore(null); // Resetting the score will show the quiz again
  };

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center", fontSize: "18px" }}>Loading Quiz...</div>;
  if (error) return <div style={{ padding: "40px", textAlign: "center", color: "red", fontSize: "18px" }}>Error: {error}</div>;

  // --- Main Render Logic ---
  // If the quiz is complete (finalScore exists), show the ResultsScreen.
  // Otherwise, show the ReusableQuiz.
  return (
    <div>
      <Navbar></Navbar>
      {finalScore ? (
        <ResultsScreen score={finalScore} onRetake={handleRetake} />
      ) : (
        <ReusableQuiz
          questions={questions}
          onComplete={handleQuizComplete}
          onExit={handleQuizExit}
        />
      )}
    </div>
  );
}