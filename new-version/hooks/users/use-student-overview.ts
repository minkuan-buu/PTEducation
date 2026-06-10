import { useQuery } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import type { StudentOverviewResModel } from "@/services/api/v2";

export function useStudentOverview({ userId = "", enabled = false } = {}) {
  return useQuery<StudentOverviewResModel>({
    queryKey: ["student-overview", userId],
    queryFn: async () => {
      try {
        const data = await v2.getStudentOverview();
        if (!data) throw new Error("No data received from API");
        return data;
      } catch (error) {
        console.error("Error loading overview, using fallback mock data:", error);
      }
    },
    enabled: enabled && !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}
