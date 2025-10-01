import { 
    saveQuestionnaireResponse, 
    getQuestionnaireResponsesByUser, 
    getAllQuestionnaireResponses,
    updateQuestionnaireResponse 
} from '../models/userModel.js';

import {calculateSleepScore} from '../services/scoringService.js';

// Save questionnaire response
export const submitQuestionnaireResponse = async (req, res) => {
    try {
        const { responseData } = req.body;
        const userId = req.user?.id; // From auth middleware

        if (!responseData) {
            return res.status(400).json({ 
                success: false, 
                message: 'Response data is required' 
            });
        }

        // Basic server-side validation/sanitization to prevent huge payloads or unexpected types
        if (typeof responseData !== 'object' || Array.isArray(responseData)) {
            return res.status(400).json({ success: false, message: 'Invalid response data format' });
        }
        const sanitized = {};
        const MAX_VALUE_LEN = 4000;
        const MAX_FIELDS = 200;
        const entries = Object.entries(responseData).slice(0, MAX_FIELDS);
        for (const [k, v] of entries) {
            const key = String(k).slice(0, 200);
            let value;
            if (v == null) value = '';
            else if (Array.isArray(v)) value = v.map(x => String(x).slice(0, MAX_VALUE_LEN));
            else if (typeof v === 'object') value = JSON.stringify(v).slice(0, MAX_VALUE_LEN);
            else value = String(v).slice(0, MAX_VALUE_LEN);
            sanitized[key] = value;
        }

        // Calculate scores
        const scores = await calculateSleepScore(sanitized);
        
        // Add scores to the response data
        sanitized.scores = scores;

        // Save the response to database
        const savedResponse = await saveQuestionnaireResponse(userId, sanitized);

        res.status(201).json({
            success: true,
            message: 'Questionnaire response saved successfully',
            data: savedResponse,
            scores: scores
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