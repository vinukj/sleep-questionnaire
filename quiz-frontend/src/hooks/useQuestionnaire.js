import { useState, useEffect } from 'react';
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
  const [version, setVersion] = useState(null);

  useEffect(() => {
    if (!authReady) return;

    const uid = currentUser?.user?.id || currentUser?.id || 'anonymous';

    const hydrate = async () => {
      try {
        // 1️⃣ Get cached questionnaire
        const cached = getQuestionnaireFromCache(uid);
        console.log("Cached Version", cached?.version);

        // cached = { data: questionnaire, version: 5, timestamp: ... }

        // 2️⃣ Fetch version from backend
        let serverVersion = null;;
        try {
          const metaRes = await authFetch('/questionnaire/version');
          if (metaRes.ok) {
            const meta = await metaRes.json();
            serverVersion = meta.version;
            console.log('Fetched questionnaire version:', serverVersion);
          }
        } catch (err) {
          console.warn('Failed to fetch questionnaire version:', err);
        }

        // 3️⃣ Use cache if it exists and version matches
        if (cached && cached.version === serverVersion) {
          console.log('✅ Using cached questionnaire', cached);
          setQuestionnaire(cached.data);
          setVersion(cached.version);
          setLoading(false);
          return;
        }

        // 4️⃣ Otherwise fetch full questionnaire from API
        let fetched = null;
        try {
          const res = await authFetch('/questionnaire/schema');
          if (res.ok) {
            fetched = await res.json();
          } else {
            throw new Error(`HTTP ${res.status}`);
          }
        } catch (fetchErr) {
          console.warn('Failed to fetch schema, using fallback', fetchErr);
        }

        if (fetched) {
          setQuestionnaire(fetched.questionnaire);
          setVersion(fetched.version);
          setQuestionnaireInCache(fetched.questionnaire, fetched.version, uid);
        } else {
          // fallback to local bundle
          setQuestionnaire(STJohnQuestionnaire);
        }

      } catch (err) {
        console.error('Error loading questionnaire:', err);
        setError('Failed to load questionnaire');
        setQuestionnaire(STJohnQuestionnaire);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [authReady, currentUser, authFetch]);

  return { questionnaire, loading, error, version };
};
