import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { v2 } from "@/services/api";

export function useScoreDetail(scoreId: string | null) {
  return useQuery({
    queryKey: ["score-detail", scoreId],
    queryFn: () => v2.getScoreDetail(scoreId!),
    enabled: Boolean(scoreId),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000, // 1 minute
  });
}
