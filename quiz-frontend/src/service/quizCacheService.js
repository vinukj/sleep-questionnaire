import { useAuth } from "../context/AuthContext";

const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generates a user-specific cache key using currentUser.id
 * @param {string} baseKey
 * @param {string} userId
 * @returns {string}
 */
const getUserSpecificCacheKey = (baseKey, userId) => {
  return `${baseKey}_${userId || "anonymous"}`;
};

/**
 * Fetches all quizzes from the API and caches them in localStorage.
 * @param {Function} authFetch - The auth-aware fetch function from AuthContext
 * @param {string} userId - Current user's ID
 */
export const fetchAndCacheAllQuizzes = async (authFetch, userId) => {
  const uid = userId?.user?.id || userId;
  const CACHE_KEY = getUserSpecificCacheKey("all_quizzes_cache", uid);

  try {
    const cachedItem = localStorage.getItem(CACHE_KEY);
    if (cachedItem) {
      const parsed = JSON.parse(cachedItem);
      const { timestamp } = parsed;
      const isCacheStale = Date.now() - timestamp > CACHE_EXPIRATION_MS;
      if (!isCacheStale) {
        console.log("Full quiz cache is still fresh (key=", CACHE_KEY, "). Skipping fetch.");
        return;
      }
    }

    console.log("Fetching all quizzes for caching...");

    const response = await authFetch("/quizzes/all");
    if (!response.ok) throw new Error("Failed to fetch all quizzes.");

    const data = await response.json();
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));

    console.log("All quizzes have been fetched and cached (key=", CACHE_KEY, "):", data);
  } catch (error) {
    console.error("Failed to fetch and cache quizzes:", error);
  }
};

/**
 * Retrieves a specific quiz from cache
 * @param {string} quizName
 * @param {string} language
 * @param {string} userId
 * @returns {Array|null}
 */
export const getQuizFromCache = (quizName, language, userId) => {
  const CACHE_KEY = getUserSpecificCacheKey("all_quizzes_cache", userId);
  const cachedItem = localStorage.getItem(CACHE_KEY);
  if (!cachedItem) return null;

  const { data } = JSON.parse(cachedItem);
  return data?.[quizName]?.[language] || null;
};

/**
 * Clears cache for current user
 * @param {string} userId
 */
export const clearUserCache = (userId) => {
  const CACHE_KEY = getUserSpecificCacheKey("all_quizzes_cache", userId);
  localStorage.removeItem(CACHE_KEY);
};
