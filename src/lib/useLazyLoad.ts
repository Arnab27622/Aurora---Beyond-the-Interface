'use client';

import { useEffect, useState, RefObject } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerImmediately?: boolean;
}

/**
 * Hook for lazy loading components based on visibility
 * Uses Intersection Observer to detect when component enters viewport
 */
export const useLazyLoad = (
  ref: RefObject<HTMLElement>,
  options: UseLazyLoadOptions = {}
) => {
  const [isVisible, setIsVisible] = useState(options.triggerImmediately ?? false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (isVisible) return; // Already visible

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: options.threshold ?? 0.1,
        rootMargin: options.rootMargin ?? '50px',
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, isVisible, options.threshold, options.rootMargin]);

  return isVisible;
};

/**
 * Hook for conditionally loading heavy resources (like PDF.js)
 */
export const useLazyResource = <T,>(
  loadFn: () => Promise<T>,
  shouldLoad: boolean = true
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!shouldLoad) return;

    setLoading(true);
    setError(null);

    loadFn()
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });
  }, [shouldLoad, loadFn]);

  return { data, loading, error };
};

/**
 * Hook to debounce lazy loading triggers
 * Prevents loading too many components at once
 */
export const useDebouncedLazyLoad = (
  ref: RefObject<HTMLElement>,
  delay: number = 300,
  options?: UseLazyLoadOptions
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const id = setTimeout(() => {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }, delay);

          setTimeoutId(id);
        }
      },
      {
        threshold: options?.threshold ?? 0.1,
        rootMargin: options?.rootMargin ?? '50px',
      }
    );

    observer.observe(element);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      observer.unobserve(element);
    };
  }, [ref, isVisible, delay, options?.threshold, options?.rootMargin, timeoutId]);

  return isVisible;
};
