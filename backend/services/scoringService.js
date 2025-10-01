export const calculateSleepScore = async (responseData) => {
    try {
        let totalScore = 0;
        const scores = {};

        // ESS Score calculation
        if (responseData.epworth_score) {
            scores.epworthScore = parseInt(responseData.epworth_score);
        }

        // ISS Score calculation
        let issScore = 0;

        // Question 1: On waking, do you feel drowsy/unrefreshing sleep?
        if (responseData.iss_q1 === 'Yes') {
            issScore += 2;
        }

        // Questions 2a, 2b, 3, and 4 are for information only - no score

        // Question 5: Have you been told that you snore badly?
        if (responseData.iss_q5 === 'Yes') {
            issScore += 2;
        }

        // Question 6
        if (responseData.iss_q6 === 'Yes') {
            issScore += 2;
        }

        // Question 7
        if (responseData.iss_q7 === 'Yes') {
            issScore += 2;
        }

        // Question 8 (a-e): Nodding off scenarios
        // If any sub-question is Yes, add 10 points (only once)
        if (responseData.iss_q8a === 'Yes' || 
            responseData.iss_q8b === 'Yes' || 
            responseData.iss_q8c === 'Yes' || 
            responseData.iss_q8d === 'Yes' || 
            responseData.iss_q8e === 'Yes') {
            issScore += 10;
        }
        scores.issScore = issScore;

        // BMI Score categorization
        if (responseData.bmi) {
            const bmi = parseFloat(responseData.bmi);
            if (bmi < 18.5) scores.bmiCategory = 'Underweight';
            else if (bmi >= 18.5 && bmi < 25) scores.bmiCategory = 'Normal';
            else if (bmi >= 25 && bmi < 30) scores.bmiCategory = 'Overweight';
            else scores.bmiCategory = 'Obese';
        }

        // Waist/Hip Ratio risk assessment
        if (responseData.waist_hip_ratio) {
            const whr = parseFloat(responseData.waist_hip_ratio);
            const gender = responseData.gender?.toLowerCase();
            
            if (gender === 'male') {
                if (whr < 0.9) scores.whrRisk = 'Low';
                else if (whr >= 0.9 && whr < 1.0) scores.whrRisk = 'Moderate';
                else scores.whrRisk = 'High';
            } else if (gender === 'female') {
                if (whr < 0.8) scores.whrRisk = 'Low';
                else if (whr >= 0.8 && whr < 0.85) scores.whrRisk = 'Moderate';
                else scores.whrRisk = 'High';
            }
        }

        // Calculate overall risk level based on ISS score (max 18)
        let riskLevel = 'Low';
        if (scores.issScore >= 12) {
            riskLevel = 'High';
        } else if (scores.issScore >= 6) {
            riskLevel = 'Moderate';
        }

        scores.riskLevel = riskLevel;
        return scores;
    } catch (error) {
        console.error('Error calculating sleep score:', error);
        throw error;
    }
};