import axios from 'axios';

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8100';
const RAG_ENABLED = (process.env.RAG_ENABLED || 'true').toLowerCase() === 'true';

export const getRagExplanation = async ({ prediction, responseData, patientId, responseId }) => {
  if (!RAG_ENABLED) {
    return { explanation: null, error: null, skipped: true };
  }

  try {
    const response = await axios.post(
      `${RAG_SERVICE_URL}/explain`,
      {
        prediction,
        response_data: responseData,
        patient_id: patientId ? String(patientId) : null,
        response_id: responseId ?? null,
      },
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return { explanation: response.data, error: null, skipped: false };
  } catch (error) {
    return {
      explanation: null,
      skipped: false,
      error: {
        message: 'Failed to fetch RAG explanation',
        detail: error.message,
        statusCode: error.response?.status,
        responseData: error.response?.data,
      },
    };
  }
};
