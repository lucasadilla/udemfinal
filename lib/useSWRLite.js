import { useEffect, useRef, useState } from 'react';

const cache = new Map();

export default function useSWRLite(key, fetcher, options = {}) {
  const { fallbackData, revalidateOnFocus = false } = options;
  const initialFromCache = key && cache.has(key) ? cache.get(key) : undefined;
  const initialData = initialFromCache ?? fallbackData;

  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isValidating, setIsValidating] = useState(false);
  const mountedRef = useRef(false);

  const revalidate = async () => {
    if (!key || !fetcher) return;
    setIsValidating(true);
    try {
      const result = await fetcher(key);
      cache.set(key, result);
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(!initialData);
    if (key) {
      revalidate();
    }
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialData]);

  useEffect(() => {
    if (!revalidateOnFocus || typeof window === 'undefined') return undefined;
    const onFocus = () => revalidate();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revalidateOnFocus, key]);

  const mutate = (nextData, mutateOptions = {}) => {
    if (!key) return;
    const { revalidate: shouldRevalidate = false } = mutateOptions;

    const applyData = (value) => {
      cache.set(key, value);
      if (mountedRef.current) {
        setData(value);
        setError(null);
      }
    };

    if (typeof nextData === 'function') {
      nextData = nextData(data);
    }

    if (nextData instanceof Promise) {
      setIsValidating(true);
      nextData
        .then((resolved) => {
          applyData(resolved);
          if (!shouldRevalidate && mountedRef.current) {
            setIsValidating(false);
          }
          if (shouldRevalidate) {
            revalidate();
          }
        })
        .catch((err) => {
          if (mountedRef.current) {
            setError(err);
            setIsValidating(false);
          }
        });
      return;
    }

    applyData(nextData);
    if (shouldRevalidate) {
      revalidate();
    }
  };

  return { data, error, isLoading, isValidating, mutate, revalidate };
}
