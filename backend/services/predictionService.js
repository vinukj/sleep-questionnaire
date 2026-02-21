import axios from 'axios';

/**
 * Build and validate prediction payload from questionnaire data
 * @param {Object} responseData - The questionnaire response data
 * @returns {Object} - { valid, missingFields, payload }
 */
export const buildPredictionPayload = (responseData) => {
    const payload = {
        age: responseData.age,
        sex: responseData.gender,
        daytime_sleepiness: responseData.daytime_sleepiness,
        snoring: responseData.snoring,
        witnessed_apnea: responseData.witnessed_apneas,
        htn: responseData.hypertension,
        dm: responseData.diabetes,
        ihd: responseData.ihd,
        cva: responseData.stroke,
        hypot3: responseData.hypothyroidism,
        bmi: responseData.bmi,
        nc: responseData.neck,
        malampatti: responseData.mallampati,
        ess: responseData.ess,
        iss: responseData.iss
    };

    // Validate all required fields are present
    const requiredFields = ['age', 'sex', 'daytime_sleepiness', 'snoring', 'witnessed_apnea', 
                           'htn', 'dm', 'ihd', 'cva', 'hypot3', 'bmi', 'nc', 'malampatti', 'ess', 'iss'];
    
    const missingFields = requiredFields.filter(field => 
        payload[field] === undefined || payload[field] === null || payload[field] === ''
    );

    if (missingFields.length > 0) {
        return { 
            valid: false, 
            missingFields,
            payload: null 
        };
    }

    return { 
        valid: true, 
        missingFields: [],
        payload 
    };
};

/**
 * Call the ML prediction endpoint
 * @param {Object} responseData - The questionnaire response data
 * @returns {Object} - { prediction, predictionError }
 */
export const getPrediction = async (responseData) => {
    // Build and validate prediction payload
    const predictionPayloadResult = buildPredictionPayload(responseData);
    
    let prediction = null;
    let predictionError = null;

    if (!predictionPayloadResult.valid) {
        // Missing required fields for prediction
        predictionError = {
            message: 'Cannot generate prediction: missing required fields',
            missingFields: predictionPayloadResult.missingFields
        };
        console.warn('Skipping prediction due to missing fields:', predictionPayloadResult.missingFields);
        return { prediction, predictionError };
    }

    // Send prediction request to internal ML server
    try {
        console.log('Sending prediction payload:', JSON.stringify(predictionPayloadResult.payload, null, 2));
        
        const predictionResponse = await axios.post(
            'http://127.0.0.1:8000/predict', 
            predictionPayloadResult.payload, 
            {
                timeout: 5000, // 5 second timeout
                headers: { 'Content-Type': 'application/json' }
            }
        );
        prediction = predictionResponse.data;
        console.log('Prediction received:', prediction);
    } catch (error) {
        predictionError = {
            message: 'Failed to get prediction from ML server',
            error: error.message,
            statusCode: error.response?.status,
            responseData: error.response?.data
        };
        console.error('Prediction API error:', error.message);
        console.error('Status code:', error.response?.status);
        console.error('Response data:', error.response?.data);
        console.error('Sent payload was:', JSON.stringify(predictionPayloadResult.payload, null, 2));
    }

    return { prediction, predictionError };
};
