const CACHE_KEY = 'all_quizzes_cache';
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetches all quizzes from the API and stores them in localStorage.
 * This should be called once when the application loads.
 */
export const fetchAndCacheAllQuizzes = async () => {
  try {
    const cachedItem = localStorage.getItem(CACHE_KEY);
    if (cachedItem) {
      const { timestamp } = JSON.parse(cachedItem);
      const isCacheStale = Date.now() - timestamp > CACHE_EXPIRATION_MS;
      if (!isCacheStale) {
        console.log('Full quiz cache is still fresh. Skipping fetch.');
        return; // Cache is valid, do nothing
      }
    }

    console.log('Fetching all questionnaires for caching...');
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication token not found.");

    const response = await fetch(`http://localhost:5000/quizzes/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to fetch all quizzes.');

    const data = await response.json();
    const cacheData = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('All questionnaires have been fetched and cached.');

  } catch (error) {
    console.error('Failed to fetch and cache quizzes:', error);
  }
};

/**
 * Retrieves a specific quiz from the localStorage cache.
 * @returns {Array|null} The array of questions or null if not found.
 */
export const getQuizFromCache = (quizName, language) => {
  const cachedItem = localStorage.getItem(CACHE_KEY);
  if (!cachedItem) return null;

  const { data } = JSON.parse(cachedItem);
  return data?.[quizName]?.[language] || null;
};