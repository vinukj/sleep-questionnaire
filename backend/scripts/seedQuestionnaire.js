import { STJohnQuestionnaire as STJohnQuestionnaireJSON } from "../STJOHNQuestions.js";
import { 
  getQuestionnaireSchema, 
  updateQuestionnaireSchema,
  initializeTables 
} from "../models/questionnaireModel.js";
import pool from "../config/db.js";
import { deleteQuestionnaireResponsesByName } from "../models/userModel.js";

async function seedQuestionnaire() {
  try {
    // Initialize tables first (creates table if doesn't exist)
    await initializeTables();

    // First, ensure version column exists
    await pool.query(`
      ALTER TABLE questionnaire_schemas 
      ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
    `);

    // Check if schema already exists
    const existingSchema = await getQuestionnaireSchema("STJohnQuestionnaire");

    if (existingSchema) {
      // Update existing schema using the model function
      console.log("Updating existing questionnaire schema...");
      
      const query = `
        UPDATE questionnaire_schemas 
        SET schema = $1, 
            version = COALESCE(version, 0) + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE name = $2
        RETURNING id, name, version, updated_at;
      `;

      const values = [
        JSON.stringify(STJohnQuestionnaireJSON),
        "STJohnQuestionnaire",
      ];
      
      const result = await pool.query(query, values);

      if (result.rows.length > 0) {
        console.log("✅ Questionnaire schema updated successfully!");
        console.log(`Schema: ${result.rows[0].name}`);
        console.log(`Version: ${result.rows[0].version}`);
        console.log(`Updated at: ${result.rows[0].updated_at}`);
      }
    } else {
      // Schema doesn't exist, it will be created by initializeTables
      console.log("✅ Questionnaire schema initialized successfully!");
    }
  } catch (error) {
    console.error("❌ Error seeding questionnaire:", error);
  } finally {
    // Close the pool and exit
    await pool.end();
    process.exit();
  }
}

async function deleteUser(name) {
  try {
    await deleteQuestionnaireResponsesByName(name)
    console.log("Deleted")
  }catch (error) {
    console.error('Error deleting questionnaire schema:', error);
    throw error;
  }

}

deleteUser("QWERTYU");
