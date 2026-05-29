import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { v2 } from "@/services/api";

export function useClassCalendarIndicators(
  classId: string,
  fromDate: string,
  toDate: string,
) {
  return useQuery({
    queryKey: ["class-calendar-indicators", classId, fromDate, toDate],
    queryFn: () =>
      v2.getClassCalendarIndicators(classId, {
        fromDate,
        toDate,
      }),
    enabled: Boolean(classId && fromDate && toDate),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
  });
}
