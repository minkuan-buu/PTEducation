import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import type { StudentsPage } from "@/services/api/v2";

export function useClassStudents(
  classId: string,
  { pageIndex = 1, pageSize = 10, keyword = "", isPendingFilter = false } = {},
) {
  return useQuery<StudentsPage>({
    queryKey: [
      "class-students",
      classId,
      "pagination",
      pageIndex,
      pageSize,
      keyword,
      isPendingFilter,
    ],
    queryFn: () =>
      v2.getStudentsInClass(classId, {
        pageIndex,
        pageSize,
        keyword,
        isPendingFilter,
      }),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}
