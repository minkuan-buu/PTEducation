import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { v1 } from "@/services/api";

export function useClasses({ pageIndex = 1, pageSize = 10 } = {}) {
  return useQuery({
    queryKey: ["classes", "pagination", pageIndex, pageSize],
    queryFn: () => v1.getAdminClasses({ pageIndex }),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}
