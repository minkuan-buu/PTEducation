import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { v2 } from "@/services/api";

export function useClassStudentsForScore(classId: string) {
  return useQuery({
    queryKey: ["class-students-for-score", classId],
    queryFn: () => v2.getStudentsInClassForScore(classId),
    enabled: Boolean(classId),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
