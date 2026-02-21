import pool from '../config/db.js';
import { 
    saveQuestionnaireResponse, 
    getQuestionnaireResponsesByUser, 
    getAllQuestionnaireResponses,
    updateQuestionnaireResponse 
} from '../models/userModel.js';

import {
    getAllQuestionnaireResponsesPaginated,
    getTotalResponseCount
} from '../models/userModel.js';

import {calculateSleepScore} from '../services/scoringService.js';
import {getPrediction} from '../services/predictionService.js';

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

        // Get prediction from ML model
        const { prediction, predictionError } = await getPrediction(sanitized);

        res.status(201).json({
            success: true,
            message: 'Questionnaire response saved successfully',
            data: savedResponse,
            scores: flatScores,
            prediction: prediction,
            predictionError: predictionError
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
        // Parse pagination parameters
        const page = Math.max(0, parseInt(req.query.page) || 0);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const offset = page * limit;
        
        // Get search query parameter
        const searchQuery = req.query.search || '';
        
        // Fetch responses and count with search filter
        const [responses, countResult] = await Promise.all([
            getAllQuestionnaireResponsesPaginated(offset, limit, searchQuery),
            getTotalResponseCount(searchQuery)
        ]);

        // Log admin access
        if (req.user) {
            const searchInfo = searchQuery ? ` (Search: "${searchQuery}")` : '';
            console.log(`Admin ${req.user.email} accessed questionnaire responses - Page ${page}${searchInfo}`);
        }

        res.json({
            success: true,
            responses: responses,
            pagination: {
                total: parseInt(countResult.count),
                page,
                pageSize: limit,
                totalPages: Math.ceil(countResult.count / limit),
                hasNextPage: (page + 1) * limit < countResult.count,
                hasPrevPage: page > 0
            },
            search: searchQuery || null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching questionnaire responses:', error);
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

        // Sanitize and normalize the data
        const sanitized = { ...responseData };

        // Recalculate scores with the updated data
        const flatScores = await calculateSleepScore(sanitized);

        // Remove any nested scores object from incoming payload
        if ('scores' in sanitized) {
            delete sanitized.scores;
        }

        // Merge recalculated scores into the updated data
        Object.assign(sanitized, flatScores);

        // Update the response in the database with recalculated scores
        const updatedResponse = await updateQuestionnaireResponse(id, sanitized);

        if (!updatedResponse) {
            return res.status(404).json({
                success: false,
                message: 'Questionnaire response not found'
            });
        }

        // Get updated prediction from ML model
        const { prediction, predictionError } = await getPrediction(sanitized);

        res.json({
            success: true,
            message: 'Questionnaire response updated successfully',
            data: updatedResponse,
            scores: flatScores, // Echo of recalculated scores
            prediction: prediction,
            predictionError: predictionError
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

export const getVersion = async(req,res)=>{
    const result = await pool.query("SELECT version FROM questionnaire_schemas WHERE name = 'STJohnQuestionnaire'");
    const version = result.rows[0]?.version;
   res.json({
       success: true,
       version
   });
}