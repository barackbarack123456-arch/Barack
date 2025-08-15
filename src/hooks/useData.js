import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for fetching data from a service.
 * It handles loading, error, and data states automatically.
 *
 * @param {Function} fetcher - The async function that fetches the data.
 * @param {Array} deps - A dependency array to control when the fetcher is recalled.
 * @returns {{data: any[], loading: boolean, error: Error|null, refetch: Function}}
 */
function useData(fetcher, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err);
      setData([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  }, [fetcher, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export default useData;
