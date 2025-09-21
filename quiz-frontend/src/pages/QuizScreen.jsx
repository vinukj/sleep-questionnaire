import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Alert, Snackbar } from "@mui/material";
import ReusableQuiz from "../components/ReusableQuiz";
import ResultsScreen from "../components/ResultsScreen";
import { getQuizFromCache } from "../service/quizCacheService";
import Navbar from "../components/Navbar";
import LoadingScreen from "../components/LoadingScreen";
import ErrorDisplay from "../components/ErrorDisplay";

const API_URL = import.meta.env.VITE_API_URL;

export default function QuizScreen() {
  const { quizName, language } = useParams();
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const cachedQuestions = getQuizFromCache(quizName, language);
      if (cachedQuestions && cachedQuestions.length > 0) {
        const formattedQuestions = cachedQuestions.map(q => ({
          id: q.question_id_string,
          question: q.question_text,
          inputType: q.input_type,
          options: q.options,
          dependsOn: q.depends_on,
        }));
        setQuestions(formattedQuestions);
      } else {
        setError(`Quiz '${quizName}' not found. Please check if the quiz exists.`);
      }
    } catch (err) {
      setError("Failed to load quiz questions. Please try again.");
      console.error("Quiz loading error:", err);
    }
    setIsLoading(false);
  }, [quizName, language]);

  const handleQuizComplete = async (answers) => {
    try {
      setSubmitError(null);
      const response = await fetch(
        `${API_URL}/quizzes/score/${quizName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(answers),
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to calculate score: ${response.status}`);
      }
      const scoreData = await response.json();
      navigate("/results", { state: { score: scoreData, quizName } });
    } catch (err) {
      console.error("Score calculation error:", err);
      setSubmitError("Unable to calculate your score. Please check your connection and try again.");
    }
  };

  const handleQuizExit = () => {
    navigate("/questionnaire");
  };

  const handleRetake = () => {
    setFinalScore(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Navbar />
        <LoadingScreen message="Preparing your questionnaire..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Navbar />
        <ErrorDisplay
          error={error}
          title="Quiz Not Available"
          onRetry={() => {
            setError(null);
            setIsLoading(true);
            // Retry logic here
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      <Navbar />
      {finalScore ? (
        <ResultsScreen score={finalScore} onRetake={handleRetake} />
      ) : (
        <ReusableQuiz
          questions={questions}
          onComplete={handleQuizComplete}
          onExit={handleQuizExit}
          quizName={quizName}
        />
      )}
      {/* Error Snackbar */}
      <Snackbar
        open={!!submitError}
        autoHideDuration={6000}
        onClose={() => setSubmitError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSubmitError(null)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {submitError}
        </Alert>
      </Snackbar>
    </Box>
  );
}