import pool from '../config/db.js';

export const getQuestionnaireSchema = async (req, res) => {
  try {
    const query = `
      SELECT schema 
      FROM questionnaire_schemas 
      WHERE name = $1 
      LIMIT 1
    `;
    
    const result = await pool.query(query, ['STJohnQuestionnaire']);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Questionnaire schema not found' });
    }

    // Transform the schema using the same logic as before
    const STJohnQuestionnaireJSON = result.rows[0].schema;
    const STJohnQuestionnaire = STJohnQuestionnaireJSON.map(page => ({
      ...page,
      questions: page.questions.map(question => {
        if (['neurological_disorder', 'respiratory_disorder', 'medications', 'email'].includes(question.id)) {
          return { ...question, required: false };
        }
        return question;
      })
    }));

    res.json(STJohnQuestionnaire);
  } catch (error) {
    console.error('Error fetching questionnaire schema:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
