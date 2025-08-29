import React from "react";
import Navbar from "../components/Navbar";
import "../styles/QuestionnairePage.css";
import { useNavigate } from "react-router-dom";

export default function QuestionnairePage() {
  const navigate = useNavigate();



  return (
    <div className="questionnaire-container">
      <Navbar />

      <main className="questionnaire-main">
        <h2 className="questionnaire-title">Select a Questionnaire</h2>

        <div className="button-group">
          <button
            className="questionnaire-button"
            onClick={() => navigate("/quiz/asdq/EN")}
          >
            Athlete Questionnaire
          </button>

          <button
            className="questionnaire-button"
            onClick={() => navigate("/quiz/stjn/EN")}
          >
            St John Questionnaire
          </button>

          <button
            className="questionnaire-button"
            onClick={() => navigate("/quiz/psqi/EN")}
          >
            PSQI Questionnaire
          </button>
        </div>
      </main>
    </div>
  );
}
