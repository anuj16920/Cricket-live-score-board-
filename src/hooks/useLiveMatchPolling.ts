import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMatchDetail, fetchMatches } from '../api/client';
import type { Delivery, MatchDetail } from '../types/cricket';
import { calculateNextBackoffMs, detectNewDeliveries } from '../utils/cricketMath';

function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(() =>
    typeof document !== 'undefined' ? !document.hidden : true
  );

  useEffect(() => {
    const handleVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return isVisible;
}

export function useMatchesPolling() {
  const isVisible = usePageVisibility();
  const [failureCount, setFailureCount] = useState(0);

  const query = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      try {
        const res = await fetchMatches();
        setFailureCount(0);
        return res;
      } catch (err) {
        setFailureCount((c) => c + 1);
        throw err;
      }
    },
    refetchInterval: () => {
      if (!isVisible) return false;
      return calculateNextBackoffMs(failureCount, 15_000, 120_000);
    },
    staleTime: 10_000,
    retry: false,
    placeholderData: (prev) => prev,
  });

  const lastUpdated = query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null;
  const isStale = Boolean(
    query.isError || (query.dataUpdatedAt > 0 && Date.now() - query.dataUpdatedAt > 60_000)
  );

  return {
    ...query,
    isVisible,
    failureCount,
    lastUpdated,
    isStale,
  };
}

export function useLiveMatchDetail(
  matchId: string | null,
  onNewDelivery?: (delivery: Delivery) => void
) {
  const isVisible = usePageVisibility();
  const queryClient = useQueryClient();
  const [failureCount, setFailureCount] = useState(0);

  const seenDeliveryIdsRef = useRef<Set<string>>(new Set());
  const hydratedMatchIdRef = useRef<string | null>(null);
  const onNewDeliveryRef = useRef(onNewDelivery);
  onNewDeliveryRef.current = onNewDelivery;

  // Reset deduplication state when switching to a different match
  useEffect(() => {
    if (hydratedMatchIdRef.current !== matchId) {
      seenDeliveryIdsRef.current = new Set();
      hydratedMatchIdRef.current = null;
    }
  }, [matchId]);

  const processDeliveries = useCallback((detail: MatchDetail) => {
    const hasHydrated = hydratedMatchIdRef.current === detail.id;
    const fresh = detectNewDeliveries(seenDeliveryIdsRef.current, detail.deliveries, hasHydrated);

    for (const d of detail.deliveries) {
      seenDeliveryIdsRef.current.add(d.id);
    }
    hydratedMatchIdRef.current = detail.id;

    if (fresh.length > 0 && onNewDeliveryRef.current) {
      // Trigger animation for the newest genuine delivery
      onNewDeliveryRef.current(fresh[fresh.length - 1]);
    }
  }, []);

  const query = useQuery({
    queryKey: ['match-detail', matchId],
    enabled: Boolean(matchId),
    queryFn: async () => {
      if (!matchId) throw new Error('No match selected');
      try {
        const detail = await fetchMatchDetail(matchId);
        setFailureCount(0);
        processDeliveries(detail);
        return detail;
      } catch (err) {
        setFailureCount((c) => c + 1);
        throw err;
      }
    },
    refetchInterval: (q) => {
      if (!isVisible) return false;
      const status = q.state.data?.status;
      if (status && status !== 'live') return false;
      return calculateNextBackoffMs(failureCount, 15_000, 120_000);
    },
    staleTime: 8_000,
    retry: false,
    placeholderData: (prev) => prev,
  });

  // Helper to apply an immediate simulated/pushed delivery without duplicate animation
  const applyPushedMatchState = useCallback(
    (updatedMatch: MatchDetail, triggeredDelivery?: Delivery) => {
      if (triggeredDelivery) {
        seenDeliveryIdsRef.current.add(triggeredDelivery.id);
      }
      for (const d of updatedMatch.deliveries) {
        seenDeliveryIdsRef.current.add(d.id);
      }
      hydratedMatchIdRef.current = updatedMatch.id;
      queryClient.setQueryData(['match-detail', updatedMatch.id], updatedMatch);
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      if (triggeredDelivery && onNewDeliveryRef.current) {
        onNewDeliveryRef.current(triggeredDelivery);
      }
    },
    [queryClient]
  );

  const lastUpdated = query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null;
  const isStale = Boolean(
    query.isError || (query.dataUpdatedAt > 0 && Date.now() - query.dataUpdatedAt > 60_000)
  );

  return {
    ...query,
    isVisible,
    failureCount,
    lastUpdated,
    isStale,
    applyPushedMatchState,
  };
}
