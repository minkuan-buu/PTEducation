import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import type { StudentsPage } from "@/services/api/v2";

export function useUsers({ pageIndex = 1, pageSize = 10, keyword = "" } = {}) {
  return useQuery<StudentsPage>({
    queryKey: ["users", "pagination", pageIndex, pageSize, keyword],
    queryFn: () => v2.getAdminStudents({ pageIndex, pageSize, keyword }),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}
