const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generates a user-specific cache key
 * @param {string} baseKey - The base cache key
 * @returns {string} The user-specific cache key
 */
const getUserSpecificCacheKey = (baseKey) => {
  // Get the JWT token from cookies (we'll only use it for the key generation)
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
  const userIdentifier = tokenCookie ? tokenCookie.split('=')[1] : 'anonymous';
  
  return `${baseKey}_${userIdentifier}`;
};

const API_URL = import.meta.env.VITE_API_URL ;

/**
 * Fetches all quizzes from the API and stores them in localStorage.
 * This should be called once when the application loads.
 */
export const fetchAndCacheAllQuizzes = async () => {
  const CACHE_KEY = getUserSpecificCacheKey('all_quizzes_cache');
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

    // Send cookies to backend; token is now handled via HttpOnly cookie
    const response = await fetch(`${API_URL}/quizzes/all`, {
      credentials: 'include', // important for sending cookies
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
 * @param {string} quizName
 * @param {string} language
 * @returns {Array|null} The array of questions or null if not found.
 */
export const getQuizFromCache = (quizName, language) => {
  const CACHE_KEY = getUserSpecificCacheKey('all_quizzes_cache');
  const cachedItem = localStorage.getItem(CACHE_KEY);
  if (!cachedItem) return null;

  const { data } = JSON.parse(cachedItem);
  return data?.[quizName]?.[language] || null;
};

/**
 * Clears the cache for the current user
 */
export const clearUserCache = () => {
  const CACHE_KEY = getUserSpecificCacheKey('all_quizzes_cache');
  localStorage.removeItem(CACHE_KEY);
};
