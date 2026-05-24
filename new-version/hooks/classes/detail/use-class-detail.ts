import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { v2 } from "@/services/api";

export function useClasses({ classId = "" } = {}) {
  return useQuery({
    queryKey: ["classes", classId],
    queryFn: () => v2.getClassDetails(classId),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}
