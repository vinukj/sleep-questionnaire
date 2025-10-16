 import { useAuth } from "../context/AuthContext";

const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hou



// ---------------- Questionnaire cache helpers ----------------
const getQuestionnaireKey = (userId) => `questionnaire_${userId || 'anonymous'}`;

/**
 * Store questionnaire schema in localStorage for a user
 * @param {Array} schema
 * @param {string} userId
 */
export const setQuestionnaireInCache = (questionnaire, version, userId) => {
  try {
    const key = getQuestionnaireKey(userId);
   const payload = {
    data: questionnaire,
    version,
    timestamp: Date.now()
   }
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to write questionnaire cache:', err);
  }
};

/**
 * Retrieve questionnaire schema from localStorage for a user
 * @param {string} userId
 * @returns {Array|null}
 */
export const getQuestionnaireFromCache = (userId) => {
  const key = getQuestionnaireKey(userId);
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.warn('Failed to read questionnaire cache:', err);
    return null;
  }
};

export const clearQuestionnaireCache = (userId) => {
  try {
    const key = getQuestionnaireKey(userId);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Failed to clear questionnaire cache for', userId, err);
  }
};

export const setQuestionnaireCache = (schema, userId) => {
  try {
    const key = getQuestionnaireKey(userId);
    const payload = { schema, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to write questionnaire cache:', error);
  }};

  export const clearUserCache = (userId) => {
  try {
    const key = getQuestionnaireKey(userId);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Failed to clear questionnaire cache for', userId, err);
  }
};
