import { useState, useEffect, useCallback } from 'react';

export const useQuestionnaireForm = () => {
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [storageKey, setStorageKey] = useState('questionnaireAnswers');

  // Load saved answers from localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setAnswers(prev => {
            if (JSON.stringify(prev) === JSON.stringify(parsed.data)) return prev;
            return parsed.data || {};
          });
          setIsDirty(false);
        }
      }
    } catch (e) {
      console.warn('Failed to restore saved form data:', e);
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const saveToLocalStorage = useCallback((data) => {
    const saveData = { data, timestamp: Date.now() };
    localStorage.setItem(storageKey, JSON.stringify(saveData));
  }, [storageKey]);

  const handleAnswerChange = useCallback((questionId, value) => {
    setAnswers(prev => {
      if (prev[questionId] === value) return prev;
      const newAnswers = { ...prev, [questionId]: value };
      saveToLocalStorage(newAnswers);
      return newAnswers;
    });
    
    setIsDirty(true);
    
    // Clear error when user provides an answer
    if (errors[questionId]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  }, [errors, saveToLocalStorage]);

  const handleDateTimeChange = useCallback((questionId, type, value) => {
    setAnswers(prev => {
      const currentAnswer = prev[questionId] || {};
      if (currentAnswer[type] === value) return prev;
      
      const newAnswer = { ...currentAnswer, [type]: value };
      const newAnswers = { ...prev, [questionId]: newAnswer };
      saveToLocalStorage(newAnswers);
      return newAnswers;
    });

    setIsDirty(true);

    if (errors[questionId]) {
      setErrors(prev => {
        if (!prev[questionId]) return prev;
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  }, [errors, saveToLocalStorage]);

  const validateAnswers = useCallback((questions) => {
    const newErrors = {};
    let isValid = true;

    questions.forEach(question => {
      if (question.required) {
        const answer = answers[question.id];
        const isEmpty = !answer || 
          (Array.isArray(answer) && answer.length === 0) ||
          (typeof answer === 'string' && !answer.trim());

        if (isEmpty) {
          newErrors[question.id] = true;
          isValid = false;
        }
      }
    });

    // Only update errors if they've changed
    setErrors(prev => {
      if (JSON.stringify(prev) === JSON.stringify(newErrors)) return prev;
      return newErrors;
    });

    return isValid;
  }, [answers]);

  const resetForm = useCallback(() => {
    setAnswers({});
    setErrors({});
    setIsDirty(false);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    answers,
    errors,
    isSubmitting,
    isDirty,
    setIsSubmitting,
    setIsDirty,
    handleAnswerChange,
    handleDateTimeChange,
    validateAnswers,
    resetForm,
    setStorageKey
  };
};

export default useQuestionnaireForm;