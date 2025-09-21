import { useState, useEffect } from 'react';

const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

// Get user-specific cache key
const getUserSpecificCacheKey = () => {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
  const userIdentifier = tokenCookie ? tokenCookie.split('=')[1] : 'anonymous';
  return `quiz_list_${userIdentifier}`;
};

export function useCachedQuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndCacheList = async () => {
      try {
        // 1. Check for cached data
        const cacheKey = getUserSpecificCacheKey();
        const cachedItem = localStorage.getItem(cacheKey);
        if (cachedItem) {
          const { data, timestamp } = JSON.parse(cachedItem);
          const isCacheStale = Date.now() - timestamp > CACHE_EXPIRATION_MS;

          if (!isCacheStale) {
            console.log('Loading quiz list from cache.');
            setQuizzes(data);
            setIsLoading(false);
            return;
          }
        }

        // 2. Fetch from API using HttpOnly cookies
        console.log('Fetching quiz list from API...');
        const API_URL = import.meta.env.VITE_API_URL ;
        
        const response = await fetch(`${API_URL}/quizzes`, {
          credentials: 'include', // <-- important for sending cookies
        });

        if (!response.ok) {
          throw new Error('Could not fetch the list of questionnaires.');
        }

        const data = await response.json();
        
        // 3. Update cache with user-specific key
        const cacheData = { data, timestamp: Date.now() };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        
        setQuizzes(data);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndCacheList();
  }, []); // Runs once on component mount

  return { quizzes, isLoading, error };
}
