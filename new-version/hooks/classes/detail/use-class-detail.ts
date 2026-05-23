import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { v1 } from "@/services/api";

export function useClasses({ id = "" } = {}) {
  return useQuery({
    queryKey: ["classes", id],
    // queryFn: () => v1.getAdminClassById(id),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}
