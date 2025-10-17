import { STJohnQuestionnaire as STJohnQuestionnaireJSON } from "../STJOHNQuestions.js";
import pool from "../config/db.js";

async function seedQuestionnaire() {
  try {
    // Insert or update the questionnaire schema
    const query = `
    DELETE FROM questionnaire_responses
WHERE LOWER(response_data->>'name') IN ('qwertyu','walilama','md z4id','drt','qwertyu','john doe','ert','aman diallo');



    `;

    // const values = [
    //   "STJohnQuestionnaire",
    //   JSON.stringify(STJohnQuestionnaireJSON),
    // ];
    const result = await pool.query(query);

    console.log(
      "Questionnaire updated",

    );
//     const secquery = `UPDATE questionnaire_schemas
// SET version = version + 1
// WHERE name = 'STJohnQuestionnaire';`;
//     await pool.query(secquery);
    // console.log("Incremented version number for STJohnQuestionnaire schema");
  } catch (error) {
    console.error("Error seeding questionnaire:", error);
  } finally {
    // Don't close the pool as it might be used by other parts of the application
    // If this script is run standalone, you can add process.exit() here
  }
}

seedQuestionnaire();
