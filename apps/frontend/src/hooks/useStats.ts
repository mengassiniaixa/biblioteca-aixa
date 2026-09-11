import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";

const LIBRARY_STATS_KEY = "stats/library";

export function useLibraryStats(enabled = true) {
  const { api, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: [LIBRARY_STATS_KEY],
    queryFn: () => api.stats.library(),
    enabled: isAuthenticated && enabled,
  });
}
