import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { v1 } from "@/services/api";

export function useClasses({
  pageIndex = 1,
  pageSize = 10,
  keyword = "",
} = {}) {
  return useQuery({
    queryKey: ["classes", "pagination", pageIndex, pageSize, keyword],
    queryFn: () => v1.getAdminClasses({ pageIndex, keyword }),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}
