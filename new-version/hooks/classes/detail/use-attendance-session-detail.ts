import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { v2 } from "@/services/api";
import type { AttendanceSessionDetail } from "@/services/api/v2/attendances";

export function useAttendanceSessionDetail(attendanceId: string | null, classId: string) {
  return useQuery<AttendanceSessionDetail | null>({
    queryKey: ["attendance-session-detail", attendanceId, classId],
    queryFn: () => v2.getAttendanceSessionDetail(attendanceId ?? "", classId),
    enabled: Boolean(attendanceId),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}
