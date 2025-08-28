import React, { useState, useEffect } from "react";
import "../styles/ReusableQuiz.css"; // We will create this stylesheet next

// --- MAIN REUSABLE QUIZ COMPONENT ---
export default function ReusableQuiz({
  questions,
  calculateScore,
  onComplete,
  onExit,
  ResultsComponent,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [visibleQuestions, setVisibleQuestions] = useState([]);

  // This effect recalculates which questions should be visible whenever answers change
  useEffect(() => {
    const getVisibleQuestions = () => {
      return questions.filter((q) => {
        if (!q.dependsOn) return true; // Always show if no dependency
        const parentAnswer = answers[q.dependsOn.id];
        return parentAnswer === q.dependsOn.value;
      });
    };
    const newVisibleQuestions = getVisibleQuestions();
    setVisibleQuestions(newVisibleQuestions);

    // Adjust currentIndex if the current question is no longer visible
    if (!newVisibleQuestions.find(q => q.id === visibleQuestions[currentIndex]?.id)) {
        // Find the index of the last answered visible question to avoid skipping
        const lastVisibleAnsweredIndex = newVisibleQuestions.map(q => q.id).lastIndexOf(Object.keys(answers).pop());
        setCurrentIndex(Math.max(0, lastVisibleAnsweredIndex));
    }

  }, [answers, questions]);

  const currentQuestion = visibleQuestions[currentIndex];

  const handleAnswer = (answer) => {
    setAnswers((prev) => {
      const updated = { ...prev, [currentQuestion.id]: answer };
      // Clean up answers for questions that are now hidden
      questions.forEach((q) => {
        if (q.dependsOn?.id === currentQuestion.id && answer !== q.dependsOn.value) {
          delete updated[q.id];
        }
      });
      return updated;
    });
  };

  const handleTimeChange = (event) => {
    handleAnswer(event.target.value);
  };

  const goToNextQuestion = () => {
    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const result = calculateScore(answers);
    onComplete(answers, result);
    setScore(result);
  };

  const handleRetake = () => {
    setScore(null);
    setAnswers({});
    setCurrentIndex(0);
  };

  // Render a loading state if questions aren't ready yet
  if (!currentQuestion) {
    return <div className="quiz-container">Loading quiz...</div>;
  }
  
  // Render the results component if the quiz is finished
  if (score) {
    return <ResultsComponent score={score} onRetake={handleRetake} />;
  }

  const isAnswerSelected = !!answers[currentQuestion.id];

  return (
    <div className="quiz-safe-area">
      <button className="quiz-close-btn" onClick={onExit}>
        &times;
      </button>
      <div className="quiz-container">
        <p className="quiz-progress">
          Question {currentIndex + 1} of {visibleQuestions.length}
        </p>
        <h2 className="quiz-question">{currentQuestion.question}</h2>

        <div className="quiz-options-container">
          {currentQuestion.options ? (
            currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                className={`quiz-option-button ${answers[currentQuestion.id] === option ? "selected" : ""}`}
                onClick={() => handleAnswer(option)}
              >
                {option}
              </button>
            ))
          ) : currentQuestion.inputType === "time" ? (
            <input
              type="time"
              className="quiz-input time"
              value={answers[currentQuestion.id] || ""}
              onChange={handleTimeChange}
            />
          ) : (
            <input
              className="quiz-input"
              type={currentQuestion.inputType === "number" ? "number" : "text"}
              placeholder={currentQuestion.inputType === "number" ? "e.g., 8" : "Type your answer"}
              onChange={(e) => handleAnswer(e.target.value)}
              value={answers[currentQuestion.id] || ""}
            />
          )}
        </div>

        <div className="quiz-navigation-container">
          <button
            className="quiz-nav-button"
            onClick={goToPreviousQuestion}
            disabled={currentIndex === 0}
          >
            Back
          </button>
          <button
            className="quiz-nav-button"
            onClick={currentIndex === visibleQuestions.length - 1 ? handleSubmit : goToNextQuestion}
            disabled={!isAnswerSelected}
          >
            {currentIndex === visibleQuestions.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
