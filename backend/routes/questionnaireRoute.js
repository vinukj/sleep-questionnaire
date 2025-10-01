import express from 'express';
import { 
    submitQuestionnaireResponse, 
    getUserQuestionnaireResponses, 
    getAllResponses,
    updateResponse 
} from '../controllers/questionnaireController.js';
import { verifyTokens, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Submit questionnaire response (authenticated users)
router.post('/submit', verifyTokens, submitQuestionnaireResponse);

// Get user's own questionnaire responses (authenticated users)
router.get('/my-responses', verifyTokens, getUserQuestionnaireResponses);

// Get all questionnaire responses (for admin/export functionality - requires auth)
router.get('/admin/all-responses', verifyTokens, requireAdmin, getAllResponses);

// Removed public all-responses route for production security. Use the admin endpoint above.

// Update questionnaire response (authenticated users)
router.put('/update/:id', verifyTokens, updateResponse);

export default router;