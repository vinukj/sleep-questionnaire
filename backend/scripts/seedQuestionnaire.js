import { STJohnQuestionnaire as STJohnQuestionnaireJSON } from '../STJOHNQuestions.js';
import pool from '../config/db.js';

async function seedQuestionnaire() {
  try {
    // Insert or update the questionnaire schema
    const query = `
      INSERT INTO questionnaire_schemas (name, schema)
      VALUES ($1, $2)
      ON CONFLICT (name) 
      DO UPDATE SET 
        schema = EXCLUDED.schema,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id;
    `;

    const values = ['STJohnQuestionnaire', JSON.stringify(STJohnQuestionnaireJSON)];
    const result = await pool.query(query, values);

    console.log('Questionnaire schema stored successfully with ID:', result.rows[0].id);
  } catch (error) {
    console.error('Error seeding questionnaire:', error);
  } finally {
    // Don't close the pool as it might be used by other parts of the application
    // If this script is run standalone, you can add process.exit() here
  }
}

seedQuestionnaire();