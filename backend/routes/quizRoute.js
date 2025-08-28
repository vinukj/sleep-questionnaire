// File: routes/quizRoutes.js

import express from 'express';
import pool from '../config/db.js';
import { verifyTokens } from '../middleware/authMiddleware.js'; // 1. IMPORT your middleware

const router = express.Router();

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

export default router;
