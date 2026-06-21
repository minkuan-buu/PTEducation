import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { v2 } from "@/services/api";

export function useGetAbsentSessions(studentId: string, classId: string) {
  return useQuery<v2.GeneralDropdownResModel[]>({
    queryKey: ["student-absent-sessions", studentId, classId],
    queryFn: () => v2.getStudentAbsentSessions(classId, studentId),
    enabled: Boolean(studentId && classId),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}
