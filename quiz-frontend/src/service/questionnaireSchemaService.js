import api from '../api/axios';

export const fetchQuestionnaireSchema = async () => {
  try {
    const response = await api.get('/api/questionnaire/schema');
    return response.data;
  } catch (error) {
    console.error('Error fetching questionnaire schema:', error);
    throw error;
  }
};