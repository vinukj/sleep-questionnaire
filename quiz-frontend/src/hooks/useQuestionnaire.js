import { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { STJohnQuestionnaire } from '../STJOHNQuestions';
import {
  getQuestionnaireFromCache,
  setQuestionnaireInCache,
} from '../service/quizCacheService';

export const useQuestionnaire = () => {
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authFetch, currentUser, authReady } = useAuth();

  useEffect(() => {
    // Wait until auth is resolved so we can use user id for cache key
    if (!authReady) return;

    const uid = currentUser?.user?.id || currentUser?.id || 'anonymous';

    const hydrate = async () => {
      try {
        // Try cache first
        const cached = getQuestionnaireFromCache(uid);
        if (cached) {
          setQuestionnaire(cached);
          setLoading(false);
          return;
        }

        // Fetch from API using auth-aware fetch if available
        let fetched = null;
        try {
          if (authFetch) {
            const res = await authFetch('/questionnaire/schema');
            if (res.ok) {
              fetched = await res.json();
            } else {
              throw new Error(`HTTP ${res.status}`);
            }
          } else {
            // Fallback: call unauthenticated endpoint
            const r = await fetch('/questionnaire/schema');
            if (r.ok) fetched = await r.json();
            else throw new Error(`HTTP ${r.status}`);
          }
        } catch (fetchErr) {
          console.warn('Failed to fetch schema from server, using fallback', fetchErr);
        }

        if (fetched) {
          setQuestionnaire(fetched);
          // Cache for subsequent loads during this user session
          setQuestionnaireInCache(fetched, uid);
        } else {
          // Use local fallback bundle
          setQuestionnaire(STJohnQuestionnaire);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading questionnaire:', err);
        setError('Failed to load questionnaire');
        setQuestionnaire(STJohnQuestionnaire);
        setLoading(false);
      }
    };

    hydrate();
    // Re-run when authReady or currentUser changes (login/logout)
  }, [authReady, currentUser, authFetch]);

  return { questionnaire, loading, error };
};