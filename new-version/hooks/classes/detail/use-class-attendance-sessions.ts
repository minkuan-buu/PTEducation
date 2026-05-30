import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { v2 } from "@/services/api";

export function useClassAttendanceSessions(classId: string, date: string) {
  return useQuery({
    queryKey: ["class-attendance-sessions", classId, date],
    queryFn: () =>
      v2.getClassAttendanceSessions(classId, {
        date,
      }),
    enabled: Boolean(classId && date),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}
