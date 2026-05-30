import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { v2 } from "@/services/api";

export function useAttendanceSessionDetail(attendanceId: string | null) {
  return useQuery({
    queryKey: ["attendance-session-detail", attendanceId],
    queryFn: () => v2.getAttendanceSessionDetail(attendanceId ?? ""),
    enabled: Boolean(attendanceId),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}
