// SWR configuration and utilities
import useSWR from 'swr';

// Default fetcher function
const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// SWR configuration options
export const swrConfig = {
  revalidateOnFocus: false, // Don't revalidate on window focus
  revalidateOnReconnect: true, // Revalidate when network reconnects
  dedupingInterval: 2000, // Dedupe requests within 2 seconds
  refreshInterval: 0, // Disable automatic polling
  errorRetryCount: 3, // Retry failed requests 3 times
  errorRetryInterval: 5000, // Wait 5 seconds between retries
};

/**
 * Custom hook for fetching data with SWR
 * @param {string} key - The cache key (usually the URL)
 * @param {object} options - Additional SWR options
 * @returns {object} - { data, error, isLoading, mutate }
 */
export function useSWRData(key, options = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    key,
    fetcher,
    {
      ...swrConfig,
      ...options,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export default useSWRData;

