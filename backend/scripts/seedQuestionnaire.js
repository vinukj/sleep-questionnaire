import { STJohnQuestionnaire as STJohnQuestionnaireJSON } from "../STJOHNQuestions.js";
import pool from "../config/db.js";

async function seedQuestionnaire() {
  try {
    // First, ensure version column exists
    await pool.query(`
      ALTER TABLE questionnaire_schemas 
      ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
    `);

    // Update the questionnaire schema and increment version
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
    } else {
      console.log("No schema found with name 'STJohnQuestionnaire'. Creating new one...");
      
      // If no rows updated, insert new schema
      const insertQuery = `
        INSERT INTO questionnaire_schemas (name, schema, version)
        VALUES ($1, $2, 1)
        RETURNING id, name, version, created_at;
      `;
      const insertResult = await pool.query(insertQuery, ["STJohnQuestionnaire", JSON.stringify(STJohnQuestionnaireJSON)]);
      console.log("✅ New questionnaire schema created!");
      console.log(`Schema: ${insertResult.rows[0].name}`);
      console.log(`Version: ${insertResult.rows[0].version}`);
      console.log(`Created at: ${insertResult.rows[0].created_at}`);
    }
  } catch (error) {
    console.error("❌ Error seeding questionnaire:", error);
  } finally {
    // Exit the process
    process.exit();
  }
}

seedQuestionnaire();
