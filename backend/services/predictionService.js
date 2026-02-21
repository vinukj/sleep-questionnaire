import axios from 'axios';

/**
 * Build and validate prediction payload from questionnaire data
 * @param {Object} responseData - The questionnaire response data
 * @returns {Object} - { valid, missingFields, payload }
 */
export const buildPredictionPayload = (responseData) => {
    // Helper to convert gender abbreviations to full words
    const convertGender = (gender) => {
        if (!gender) return gender;
        const g = gender.toString().toUpperCase();
        if (g === 'F' || g === 'FEMALE') return 'Female';
        if (g === 'M' || g === 'MALE') return 'Male';
        return gender; // return as-is if already correct
    };
    
    // Helper to ensure numeric values
    const toNumber = (value) => {
        if (value === null || value === undefined || value === '') return value;
        const num = Number(value);
        return isNaN(num) ? value : num;
    };
    
    // Helper to normalize binary Yes/No responses
    const toBinary = (value) => {
        if (!value) return value;
        const v = value.toString().toLowerCase().trim();
        if (v === 'yes' || v === 'y' || v === 'true' || v === '1') return 'Yes';
        if (v === 'no' || v === 'n' || v === 'false' || v === '0') return 'No';
        return value; // return as-is if already correct
    };
    
    // Handle conditional fields - if not snoring, witnessed_apnea should be "No"
    let witnessedApnea = responseData.witnessed_apneas || responseData.witnessed_apnea || responseData.witnessedApnea;
    if (!witnessedApnea && toBinary(responseData.is_snoring || responseData.snoring) === 'No') {
        witnessedApnea = 'No';
    }
    
    const payload = {
        age: toNumber(responseData.age),
        sex: convertGender(responseData.gender),
        daytime_sleepiness: toBinary(responseData.daytime_sleepiness),
        snoring: toBinary(responseData.is_snoring || responseData.snoring),
        witnessed_apnea: toBinary(witnessedApnea),
        htn: toBinary(responseData.hypertension),
        dm: toBinary(responseData.diabetes),
        ihd: toBinary(responseData.ihd),
        cva: toBinary(responseData.stroke),
        hypot3: toBinary(responseData.hypothyroidism),
        bmi: toNumber(responseData.bmi),
        nc: toNumber(responseData.neck),
        malampatti: toNumber(responseData.mallampati),
        ess: toNumber(responseData.ess),
        iss: toNumber(responseData.iss)
    };

    // Validate all required fields are present
    const requiredFields = ['age', 'sex', 'daytime_sleepiness', 'is_snoring', 'witnessed_apnea', 
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
