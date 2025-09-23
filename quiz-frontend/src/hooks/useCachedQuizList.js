import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

const getUserSpecificCacheKey = (userId) => {
  return `quiz_list_${userId || "anonymous"}`;
};

export function useCachedQuizList() {
  const { currentUser, authFetch } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    // normalize user id shape (support both { user: { id } } and { id })
    const userId = currentUser?.user?.id || currentUser?.id;

    const fetchAndCacheList = async () => {
      try {
        const cacheKey = getUserSpecificCacheKey(userId);
        const cachedItem = localStorage.getItem(cacheKey);

        if (cachedItem) {
          const { data, timestamp } = JSON.parse(cachedItem);
          const isCacheStale = Date.now() - timestamp > CACHE_EXPIRATION_MS;

          if (!isCacheStale) {
            console.log("Loading quiz list from cache (key=", cacheKey, "):", data);
            setQuizzes(data);
            setIsLoading(false);
            return;
          }
        }

        console.log("Fetching quiz list from API...");
        const response = await authFetch("/quizzes");

        if (!response.ok) {
          throw new Error("Could not fetch the list of questionnaires.");
        }

        const data = await response.json();

        localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        setQuizzes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndCacheList();
  }, [currentUser, authFetch]);

  return { quizzes, isLoading, error };
}
