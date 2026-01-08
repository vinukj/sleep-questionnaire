import pool from '../config/db.js';
import {STJohnQuestionnaire } from '../STJOHNQuestions.js'

const initializeTables = async () => {
  try {
    // Create questionnaire_schemas table with index in a single transaction
    await pool.query(` CREATE TABLE IF NOT EXISTS questionnaire_schemas (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          schema JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        

       
    `);
    await pool.query(`
  CREATE INDEX IF NOT EXISTS idx_questionnaire_schemas_name ON questionnaire_schemas(name);
`);


    // Check if the STJohnQuestionnaire already exists
    const existingQuery = 'SELECT id FROM questionnaire_schemas WHERE name = $1';
    const existingResult = await pool.query(existingQuery, ['STJohnQuestionnaire']);

    if (existingResult.rows.length === 0) {
      // Insert the default questionnaire schema if it doesn't exist
      const insertQuery = `
        INSERT INTO questionnaire_schemas (name, schema)
        VALUES ($1, $2)
        RETURNING id
      `;
      const insertResult = await pool.query(insertQuery, [
        'STJohnQuestionnaire',
        JSON.stringify(STJohnQuestionnaire)
      ]);
      console.log('Default questionnaire schema created with ID:', insertResult.rows[0].id);
    } else {
      console.log('Default questionnaire schema already exists');
    }

    console.log('Questionnaire schema table initialized successfully');
  } catch (error) {
    console.error('Error initializing questionnaire schema table:', error);
    throw error;
  }
};

// Function to get questionnaire schema
const getQuestionnaireSchema = async (name = 'STJohnQuestionnaire') => {
  try {
    const query = 'SELECT schema FROM questionnaire_schemas WHERE name = $1';
    const result = await pool.query(query, [name]);
    return result.rows[0]?.schema || null;
  } catch (error) {
    console.error('Error fetching questionnaire schema:', error);
    throw error;
  }
};

// Function to update questionnaire schema
const updateQuestionnaireSchema = async (name, schema) => {
  try {
    const query = `
      UPDATE questionnaire_schemas 
      SET schema = $1, updated_at = CURRENT_TIMESTAMP
      WHERE name = $2
      RETURNING id
    `;
    const result = await pool.query(query, [JSON.stringify(schema), name]);
    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Error updating questionnaire schema:', error);
    throw error;
  }
};

// Function to delete questionnaire schema by name
const deleteQuestionnaireSchema = async (name) => {
  try {
    const query = `
      DELETE FROM questionnaire_schemas 
      WHERE name = $1
      RETURNING id, name
    `;
    const result = await pool.query(query, [name]);
    
    if (result.rows.length === 0) {
      return { success: false, message: `Questionnaire schema '${name}' not found` };
    }
    
    return { 
      success: true, 
      message: `Questionnaire schema '${name}' deleted successfully`,
      deletedId: result.rows[0].id 
    };
  } catch (error) {
    console.error('Error deleting questionnaire schema:', error);
    throw error;
  }
};

// Function to get all questionnaire schema names
const getAllQuestionnaireSchemaNames = async () => {
  try {
    const query = 'SELECT id, name, created_at, updated_at FROM questionnaire_schemas ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching questionnaire schema names:', error);
    throw error;
  }
};


export {
  initializeTables,
  getQuestionnaireSchema,
  updateQuestionnaireSchema,
  deleteQuestionnaireSchema,
  getAllQuestionnaireSchemaNames
};
