// File: routes/quizRoutes.js

import express from 'express';
import pool from '../config/db.js';
import { verifyTokens } from '../middleware/authMiddleware.js'; // 1. IMPORT your middleware
import  { handlePsqiScore } from '../controllers/scoringController.js';

const router = express.Router();



// In backend/routes/quizRoutes.js

// ... (at the top with other routes)

/**
 * @route   GET /api/quizzes
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

// ... (your other routes like /:quizName/:language and /score/:quizName)


/**
 * @route   GET /api/quizzes/:quizName/:language
 * @desc    Get all questions for a specific quiz and language
 * @access  PRIVATE - This route is now protected
 */
// 2. ADD the 'verifyTokens' middleware to the route
router.get('/:quizName/:language', verifyTokens, async (req, res) => {
    // Because the middleware ran successfully, we know the user is authenticated.
    // We could even use req.user.id if we wanted to log who is taking the quiz.
    
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



// --- SCORING ENDPOINT ---
// router.post('/score/:quizName',verifyTokens, async (req, res) => {
//     const { quizName } = req.params;
//     const userAnswers = req.body;
//     const userId = req.user.id;

//     // Route to special handlers for complex quizzes
//     if (quizName === 'psqi') {
//         return handlePsqiScore(userAnswers, res);
//     }

//     // --- GENERIC LOGIC FOR SIMPLE QUIZZES (like 'asdq') ---
//     try {
//         // Fetch all rules for the given quiz
//         const rulesResult = await pool.query(
//             'SELECT question_key, answer_value, score_value FROM scoring_rules WHERE quiz_name = $1',
//             [quizName]
//         );
//         const rules = rulesResult.rows;

//         if (rules.length === 0) {
//             return res.status(404).json({ error: `Scoring rules for quiz '${quizName}' not found.` });
//         }
        
//         // Separate default rules (where question_key is null) from specific ones
//         const defaultRules = rules.filter(r => r.question_key === null);
//         const specificRules = rules.filter(r => r.question_key !== null);

//         let globalScore = 0;
//         for (const [questionKey, userAnswer] of Object.entries(userAnswers)) {
//             // First, look for a rule specific to this question
//             let rule = specificRules.find(r => r.question_key === questionKey && r.answer_value === userAnswer);
            
//             // If no specific rule is found, fall back to the default rules
//             if (!rule) {
//                 rule = defaultRules.find(r => r.answer_value === userAnswer);
//             }
            
//             if (rule) {
//                 globalScore += Number(rule.score_value);
//             }
//         }
        
//         // Fetch the correct interpretation based on the final score
//         const interpretationResult = await pool.query(
//             `SELECT interpretation_text FROM result_interpretations 
//              WHERE quiz_name = $1 
//              AND (min_score IS NULL OR $2 >= min_score) 
//              AND (max_score IS NULL OR $2 <= max_score)`,
//             [quizName, globalScore]
//         );
        
//         const interpretation = interpretationResult.rows.length > 0 
//             ? interpretationResult.rows[0].interpretation_text 
//             : 'No interpretation available for this score.';
            
//         return res.status(200).json({
//             quizName,
//             globalScore,
//             interpretation
//         });

//     } catch (error) {
//         console.error('Generic scoring failed:', error);
//         return res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

router.post('/score/:quizName', verifyTokens, async (req, res) => {
    const { quizName } = req.params;
    const userAnswers = req.body;
    const userId = req.user.id; // Get user ID from middleware

    try {
        let result;

        // Route to the correct scoring logic
        if (quizName === 'psqi') {
            result = await handlePsqiScore(userAnswers); // Assume handlePsqiScore is now async and returns the result object
        } else {
            // --- GENERIC LOGIC ---
            const rulesResult = await pool.query('SELECT question_key, answer_value, score_value FROM scoring_rules WHERE quiz_name = $1', [quizName]);
            const rules = rulesResult.rows;
            if (rules.length === 0) return res.status(404).json({ error: `Scoring rules for quiz '${quizName}' not found.` });
            
            const defaultRules = rules.filter(r => r.question_key === null);
            const specificRules = rules.filter(r => r.question_key !== null);

            let globalScore = 0;
            for (const [questionKey, userAnswer] of Object.entries(userAnswers)) {
                let rule = specificRules.find(r => r.question_key === questionKey && r.answer_value === userAnswer) || defaultRules.find(r => r.answer_value === userAnswer);
                if (rule) {
                    globalScore += Number(rule.score_value);
                }
            }
            
            const interpretationResult = await pool.query(
                `SELECT interpretation_text FROM result_interpretations WHERE quiz_name = $1 AND (min_score IS NULL OR $2 >= min_score) AND (max_score IS NULL OR $2 <= max_score)`,
                [quizName, globalScore]
            );
            const interpretation = interpretationResult.rows[0]?.interpretation_text || 'No interpretation available for this score.';
            
            result = { quizName, globalScore, interpretation };
        }

        // --- SAVE THE RESULT TO THE DATABASE ---
        // This block runs after either scoring logic is complete
        if (result && result.globalScore !== undefined) {
            await pool.query(
                `INSERT INTO user_scores (user_id, quiz_name, score, interpretation, answers)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, quizName, result.globalScore, result.interpretation, userAnswers]
            );
        }
        
        // --- SEND RESPONSE TO FRONTEND ---
        return res.status(200).json(result);

    } catch (error) {
        console.error(`Scoring failed for quiz ${quizName}:`, error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


/**
 * @route   GET /api/quizzes/all
 * @desc    Get all questions for all quizzes, structured by quiz and language
 * @access  PRIVATE
 */
router.get('/all', verifyTokens, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM questions ORDER BY quiz_name, language, display_order ASC');

    // Restructure the flat data from the DB into a nested object
    const structuredQuizzes = rows.reduce((acc, q) => {
      const { quiz_name, language, ...questionData } = q;
      if (!acc[quiz_name]) {
        acc[quiz_name] = {};
      }
      if (!acc[quiz_name][language]) {
        acc[quiz_name][language] = [];
      }
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
