// import React from "react";
// import Navbar from "../components/Navbar";
// import "../styles/QuestionnairePage.css";
// import { useNavigate } from "react-router-dom";

// export default function QuestionnairePage() {
//   const navigate = useNavigate();



//   return (
//     <div className="questionnaire-container">
//       <Navbar />

//       <main className="questionnaire-main">
//         <h2 className="questionnaire-title">Select a Questionnaire</h2>

//         <div className="button-group">
//           <button
//             className="questionnaire-button"
//             onClick={() => navigate("/quiz/asdq/EN")}
//           >
//             Athlete Questionnaire
//           </button>

//           <button
//             className="questionnaire-button"
//             onClick={() => navigate("/quiz/stjn/EN")}
//           >
//             St John Questionnaire
//           </button>

//           <button
//             className="questionnaire-button"
//             onClick={() => navigate("/quiz/psqi/EN")}
//           >
//             PSQI Questionnaire
//           </button>
//         </div>
//       </main>
//     </div>
//   );
// }


// file: frontend/src/pages/QuestionnaireSelectionScreen.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useCachedQuizList } from '../hooks/useCachedQuizList'; // Import the new hook
import '../styles/QuestionnairePage.css';
import Navbar from '../components/Navbar';

const QuestionnaireSelectionScreen = () => {
  // Replace the old useState and useEffect with this single line
  const { quizzes, isLoading, error } = useCachedQuizList();

  if (isLoading) return <div className="loading-message">Loading Questionnaires...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

   return (
    // This new wrapper helps center the content vertically on large screens
    <div className="questionnaire-page-container">
      <Navbar />
      <main className="selection-container">
        <h1 className="selection-title">Select a Questionnaire</h1>
        <div className="quiz-list">
          {quizzes.map((quiz) => (
            <Link to={`/quiz/${quiz.quiz_name}/EN`} key={quiz.quiz_name} className="quiz-card-link">
              <div className="quiz-card">
                <h2 className="quiz-card-title">{quiz.name}</h2>
                <p className="quiz-card-description">{quiz.description || 'Take this quiz to learn more.'}</p>
                <span className="quiz-card-button">Start Quiz &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default QuestionnaireSelectionScreen;