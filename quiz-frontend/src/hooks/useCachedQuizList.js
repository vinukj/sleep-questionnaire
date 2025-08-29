import { useState, useEffect } from 'react';

const CACHE_KEY = 'quiz_list';
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

export function useCachedQuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndCacheList = async () => {
      try {
        // 1. Check for cached data
        const cachedItem = localStorage.getItem(CACHE_KEY);
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

        // 2. Fetch from API if no valid cache
        console.log('Fetching quiz list from API...');
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        
        const response = await fetch(`http://localhost:5000/quizzes`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Could not fetch the list of questionnaires.');
        }

        const data = await response.json();
        
        // 3. Update cache
        const cacheData = { data, timestamp: Date.now() };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        
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