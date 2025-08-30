// File: routes/quizRoutes.js

import express from 'express';
import pool from '../config/db.js';
import { verifyTokens } from '../middleware/authMiddleware.js';
import { handlePsqiScore } from '../controllers/scoringController.js';

const router = express.Router();

/**
 * @route   GET /quizzes
 * @desc    Get a list of all available quizzes
 * @access  PRIVATE
 */
router.get('/', verifyTokens, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT quiz_name, name, description FROM questionnaires ORDER BY name ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching questionnaire list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /quizzes/:quizName/:language
 * @desc    Get all questions for a specific quiz and language
 * @access  PRIVATE
 */
router.get('/:quizName/:language', verifyTokens, async (req, res) => {
  const { quizName, language } = req.params;

  try {
    const { rows } = await pool.query(
      'SELECT * FROM questions WHERE quiz_name = $1 AND language = $2 ORDER BY display_order ASC',
      [quizName, language]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found for the specified language' });
    }

    const formattedQuestions = rows.map(q => ({
      id: q.question_id_string,
      question: q.question_text,
      options: q.options,
      dependsOn: q.depends_on,
      inputType: q.input_type,
    }));

    res.json(formattedQuestions);
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /quizzes/score/:quizName
 * @desc    Submit quiz answers and get score
 * @access  PRIVATE
 */
router.post('/score/:quizName', verifyTokens, async (req, res) => {
  const { quizName } = req.params;
  const userAnswers = req.body;
  const userId = req.user.id; // from middleware

  try {
    let result;

    if (quizName === 'psqi') {
      result = await handlePsqiScore(userAnswers);
    } else {
      // Generic scoring logic
      const rulesResult = await pool.query(
        'SELECT question_key, answer_value, score_value FROM scoring_rules WHERE quiz_name = $1',
        [quizName]
      );
      const rules = rulesResult.rows;
      if (!rules.length) return res.status(404).json({ error: `Scoring rules for quiz '${quizName}' not found.` });

      const defaultRules = rules.filter(r => r.question_key === null);
      const specificRules = rules.filter(r => r.question_key !== null);

      let globalScore = 0;
      for (const [questionKey, userAnswer] of Object.entries(userAnswers)) {
        const rule =
          specificRules.find(r => r.question_key === questionKey && r.answer_value === userAnswer) ||
          defaultRules.find(r => r.answer_value === userAnswer);
        if (rule) globalScore += Number(rule.score_value);
      }

      const interpretationResult = await pool.query(
        `SELECT interpretation_text 
         FROM result_interpretations 
         WHERE quiz_name = $1 AND (min_score IS NULL OR $2 >= min_score) AND (max_score IS NULL OR $2 <= max_score)`,
        [quizName, globalScore]
      );

      const interpretation = interpretationResult.rows[0]?.interpretation_text || 'No interpretation available for this score.';
      result = { quizName, globalScore, interpretation };
    }

    // Save the score
    if (result && result.globalScore !== undefined) {
      await pool.query(
        `INSERT INTO user_scores (user_id, quiz_name, score, interpretation, answers)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, quizName, result.globalScore, result.interpretation, userAnswers]
      );
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(`Scoring failed for quiz ${quizName}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @route   GET /quizzes/all
 * @desc    Get all questions for all quizzes, structured by quiz and language
 * @access  PRIVATE
 */
router.get('/all', verifyTokens, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM questions ORDER BY quiz_name, language, display_order ASC');

    const structuredQuizzes = rows.reduce((acc, q) => {
      const { quiz_name, language, ...questionData } = q;
      acc[quiz_name] = acc[quiz_name] || {};
      acc[quiz_name][language] = acc[quiz_name][language] || [];
      acc[quiz_name][language].push(questionData);
      return acc;
    }, {});

    res.json(structuredQuizzes);
  } catch (error) {
    console.error('Error fetching all questionnaires:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
