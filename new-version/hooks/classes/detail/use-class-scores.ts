import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { v2 } from "@/services/api";

export function useClassScores(classId: string) {
  return useQuery({
    queryKey: ["class-scores", classId],
    queryFn: () => v2.getClassScores(classId),
    enabled: Boolean(classId),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000, // 1 minute
  });
}
