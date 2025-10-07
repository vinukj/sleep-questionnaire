// ...existing code...
export const calculateSleepScore = async (responseData) => {
  try {
    // ESS (Epworth)
    const ess =
      responseData.epworth_score != null
        ? parseInt(responseData.epworth_score, 10)
        : responseData.ess != null
        ? parseInt(responseData.ess, 10)
        : null;

    // ISS (simple tally example; adjust weights if needed)
    let iss = 0;
    if (responseData.iss_q1 === "Yes") iss += 2;
    if (responseData.iss_q5 === "Yes") iss += 2;
    if (responseData.iss_q6 === "Yes") iss += 2;
    if (responseData.iss_q7 === "Yes") iss += 2;
    if (
      responseData.iss_q2a === "Yes" ||
      responseData.iss_q8a === "Yes" ||
      responseData.iss_q8b === "Yes" ||
      responseData.iss_q8c === "Yes" ||
      responseData.iss_q8d === "Yes" ||
      responseData.iss_q8e === "Yes"
    ) {
      iss += 10;
    }

    // BMI category
    let bmiCategory = null;
    if (responseData.bmi != null && !Number.isNaN(+responseData.bmi)) {
      const bmi = +responseData.bmi;
      if (bmi < 18.5) bmiCategory = "Underweight";
      else if (bmi < 25) bmiCategory = "Normal";
      else if (bmi < 30) bmiCategory = "Overweight";
      else bmiCategory = "Obese";
    }

    // Overall risk by ISS
    let riskLevel = null;
    if (iss != null) {
      riskLevel = iss >= 12 ? "High" : iss >= 6 ? "Moderate" : "Low";
    }

    // Return flat fields (and camelCase aliases for compatibility)
    return {
      ess,
      epworthScore: ess,
      iss,
      issScore: iss,
      bmiCategory,
      riskLevel,
    };
  } catch (error) {
    console.error("Error calculating sleep score:", error);
    throw error;
  }
};
// ...existing code...