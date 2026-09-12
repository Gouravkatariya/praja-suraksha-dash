// React Query hooks — auto-switch between mock and live backend.

import { useQuery } from "@tanstack/react-query";
import { usePlatform } from "./platform-context";
import { fetchWorkDetail, fetchWorks, fetchRiskFlagsForWork, type WorksParams } from "./api-client";

export function useWorksLive(params: WorksParams = {}) {
  const { mode, endpoint } = usePlatform();
  return useQuery({
    queryKey: ["works", endpoint, params],
    queryFn: () => fetchWorks(endpoint, params),
    enabled: mode === "live",
    staleTime: 30_000,
  });
}

export function useWorkDetailLive(workId: number | null) {
  const { mode, endpoint } = usePlatform();
  return useQuery({
    queryKey: ["work", endpoint, workId],
    queryFn: () => fetchWorkDetail(endpoint, workId!),
    enabled: mode === "live" && workId !== null,
    staleTime: 60_000,
  });
}

export function useRiskFlagsForWorkLive(workId: number | null) {
  const { mode, endpoint } = usePlatform();
  return useQuery({
    queryKey: ["risk-flags-work", endpoint, workId],
    queryFn: () => fetchRiskFlagsForWork(endpoint, workId!),
    enabled: mode === "live" && workId !== null,
    staleTime: 60_000,
  });
}

export function useTotalWorksCount() {
  const { mode, endpoint } = usePlatform();
  const query = useQuery({
    queryKey: ["total-works", endpoint],
    queryFn: () => fetchWorks(endpoint, { page: 1, page_size: 1 }),
    enabled: mode === "live",
    staleTime: 120_000,
  });
  if (mode === "mock") return 10_000;
  return query.data?.pagination.total ?? null;
}
