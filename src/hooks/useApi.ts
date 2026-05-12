import { useState, useEffect, useCallback, useRef } from "react";
import { ApiError } from "../services/apiClient";

// ─── useApi ───────────────────────────────────────────────────────────────────

interface UseApiState<T> {
  data:      T | null;
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps:    unknown[] = []
): UseApiState<T> {
  const [data,      setData]      = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const mountedRef                = useRef(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof ApiError ? err.message : "Erreur inattendue");
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─── useMutation ──────────────────────────────────────────────────────────────
// ✅ Fix: TArgs generic tuple — mutate(...args) TypeScript-safe

interface UseMutationOptions<T> {
  onSuccess?: (data: T)     => void;
  onError?:   (error: string) => void;
}

interface UseMutationResult<T, TArgs extends unknown[]> {
  data:      T | null;
  isLoading: boolean;
  error:     string | null;
  mutate:    (...args: TArgs) => Promise<T | null>;
  reset:     () => void;
}

export function useMutation<T, TArgs extends unknown[] = unknown[]>(
  mutationFn: (...args: TArgs) => Promise<T>,
  options?:   UseMutationOptions<T>
): UseMutationResult<T, TArgs> {
  const [data,      setData]      = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // ✅ Fix: on garde une ref stable de mutationFn pour éviter re-renders
  const fnRef = useRef(mutationFn);
  fnRef.current = mutationFn;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(
    async (...args: TArgs): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fnRef.current(...args);
        setData(result);
        optionsRef.current?.onSuccess?.(result);
        return result;
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Erreur inattendue";
        setError(msg);
        optionsRef.current?.onError?.(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [] // ✅ Fix: deps vide — fnRef.current gère les updates
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, isLoading, error, mutate, reset };
}