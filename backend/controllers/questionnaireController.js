import { 
    saveQuestionnaireResponse, 
    getQuestionnaireResponsesByUser, 
    getAllQuestionnaireResponses,
    updateQuestionnaireResponse 
} from '../models/userModel.js';

import {calculateSleepScore} from '../services/scoringService.js';

// Save questionnaire response
// ...existing code...
export const submitQuestionnaireResponse = async (req, res) => {
   try {
        const { responseData } = req.body;
        const userId = req.user?.id ?? req.userId;

        if (!responseData || typeof responseData !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid response payload' });
        }

        // Basic sanitize/normalize (preserve arrays and primitives)
        const sanitized = { ...responseData };

        // Calculate flat scores
        const flatScores = await calculateSleepScore(sanitized);

        // Remove any nested scores object from incoming payload
        if ('scores' in sanitized) {
          delete sanitized.scores;
        }

        // Merge flat scores directly
        Object.assign(sanitized, flatScores);

        // Save the response to database
        const savedResponse = await saveQuestionnaireResponse(userId, sanitized);

        res.status(201).json({
            success: true,
            message: 'Questionnaire response saved successfully',
            data: savedResponse,
            scores: flatScores // optional echo of computed values for the client
        });
    } catch (error) {
        console.error('Error saving questionnaire response:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save questionnaire response',
            error: error.message
        });
    }
};
// ...existing code...

// Get user's questionnaire responses
export const getUserQuestionnaireResponses = async (req, res) => {
    try {
        const userId = req.user?.id; // From auth middleware

        const responses = await getQuestionnaireResponsesByUser(userId);

        res.json({
            success: true,
            data: responses
        });
    } catch (error) {
        console.error('Error fetching user questionnaire responses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch questionnaire responses',
            error: error.message
        });
    }
};

// Get all questionnaire responses (admin only)
export const getAllResponses = async (req, res) => {
    try {
        const responses = await getAllQuestionnaireResponses();

        // Log admin access (if user exists in request)
        if (req.user) {
            console.log(`Admin ${req.user.email} accessed all questionnaire responses`);
        }

        res.json({
            success: true,
            responses: responses,
            total: responses.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching all questionnaire responses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch questionnaire responses',
            error: error.message
        });
    }
};

// Update questionnaire response
export const updateResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { responseData } = req.body;

        if (!responseData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Response data is required' 
            });
        }

        const updatedResponse = await updateQuestionnaireResponse(id, responseData);

        if (!updatedResponse) {
            return res.status(404).json({
                success: false,
                message: 'Questionnaire response not found'
            });
        }

        res.json({
            success: true,
            message: 'Questionnaire response updated successfully',
            data: updatedResponse
        });
    } catch (error) {
        console.error('Error updating questionnaire response:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update questionnaire response',
            error: error.message
        });
    }
};