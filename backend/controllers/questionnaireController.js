import pool from '../config/db.js';
import { 
    saveQuestionnaireResponse, 
    getQuestionnaireResponsesByUser, 
    getAllQuestionnaireResponses,
    updateQuestionnaireResponse,
    deleteQuestionnaireResponseById,
    savePredictionToResponse 
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

        // Run DB save and prediction in parallel - both are independent
        const [dbResult, predictionResult] = await Promise.allSettled([
            saveQuestionnaireResponse(userId, sanitized),
            getPrediction(sanitized)
        ]);

        // Handle DB save result (non-blocking)
        let savedResponse = null;
        let dbError = null;
        if (dbResult.status === 'fulfilled') {
            savedResponse = dbResult.value;
        } else {
            dbError = {
                message: 'Failed to save to database',
                error: dbResult.reason.message
            };
            console.error('Database save failed:', dbResult.reason);
        }

        // Handle prediction result (non-blocking)
        let prediction = null;
        let predictionError = null;
        let mlPayload = null;
        if (predictionResult.status === 'fulfilled') {
            prediction = predictionResult.value.prediction;
            predictionError = predictionResult.value.predictionError;
            mlPayload = predictionResult.value.mlPayload;
        } else {
            predictionError = {
                message: 'Prediction service error',
                error: predictionResult.reason.message
            };
            console.error('Prediction failed:', predictionResult.reason);
        }

        // If both DB save and prediction succeeded, update the DB record with prediction and payload
        if (savedResponse && prediction) {
            try {
                await savePredictionToResponse(savedResponse.id, prediction, mlPayload);
                console.log('Prediction and ML payload saved to database for response ID:', savedResponse.id);
            } catch (predError) {
                console.error('Failed to save prediction to database:', predError);
                // Don't fail the entire request if prediction save fails
            }
        }

        // Return response based on what succeeded
        const success = savedResponse !== null;
        const statusCode = success ? 201 : 500;

        res.status(statusCode).json({
            success: success,
            message: success 
                ? 'Questionnaire response saved successfully' 
                : 'Failed to save questionnaire response',
            data: savedResponse,
            scores: flatScores,
            prediction: prediction,
            mlPayload: mlPayload,
            predictionError: predictionError,
            dbError: dbError
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

        // Run DB update and prediction in parallel - both are independent
        const [dbResult, predictionResult] = await Promise.allSettled([
            updateQuestionnaireResponse(id, sanitized),
            getPrediction(sanitized)
        ]);

        // Handle DB update result (non-blocking)
        let updatedResponse = null;
        let dbError = null;
        if (dbResult.status === 'fulfilled') {
            updatedResponse = dbResult.value;
            if (!updatedResponse) {
                return res.status(404).json({
                    success: false,
                    message: 'Questionnaire response not found'
                });
            }
        } else {
            dbError = {
                message: 'Failed to update database',
                error: dbResult.reason.message
            };
            console.error('Database update failed:', dbResult.reason);
        }

        // Handle prediction result (non-blocking)
        let prediction = null;
        let predictionError = null;
        let mlPayload = null;
        if (predictionResult.status === 'fulfilled') {
            prediction = predictionResult.value.prediction;
            predictionError = predictionResult.value.predictionError;
            mlPayload = predictionResult.value.mlPayload;
        } else {
            predictionError = {
                message: 'Prediction service error',
                error: predictionResult.reason.message
            };
            console.error('Prediction failed:', predictionResult.reason);
        }

        // If both DB update and prediction succeeded, update the DB record with prediction and payload
        if (updatedResponse && prediction) {
            try {
                await savePredictionToResponse(id, prediction, mlPayload);
                console.log('Prediction and ML payload saved to database for response ID:', id);
            } catch (predError) {
                console.error('Failed to save prediction to database:', predError);
                // Don't fail the entire request if prediction save fails
            }
        }

        // Return response based on what succeeded
        const success = updatedResponse !== null;
        const statusCode = success ? 200 : 500;

        res.status(statusCode).json({
            success: success,
            message: success 
                ? 'Questionnaire response updated successfully' 
                : 'Failed to update questionnaire response',
            data: updatedResponse,
            scores: flatScores,
            prediction: prediction,
            mlPayload: mlPayload,
            predictionError: predictionError,
            dbError: dbError
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

export const deleteResponse = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Response ID is required' 
            });
        }

        const deletedResponse = await deleteQuestionnaireResponseById(id);
        
        if (!deletedResponse) {
            return res.status(404).json({ 
                success: false, 
                message: 'Response not found' 
            });
        }

        res.json({
            success: true,
            message: 'Response deleted successfully',
            data: deletedResponse
        });
    } catch (error) {
        console.error('Error deleting questionnaire response:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete questionnaire response',
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