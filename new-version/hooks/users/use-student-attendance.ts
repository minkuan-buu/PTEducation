import { useQuery } from "@tanstack/react-query";
import {
    getStudentAttendanceMonths,
    getStudentAttendanceByMonth,
    type AttendanceMonthResModel,
    type AttendanceStudentResModel
} from "@/services/api/v2/student";

export function useStudentAttendanceMonths({ enabled = false } = {}) {
    return useQuery<AttendanceMonthResModel[]>({
        queryKey: ["student-attendance-months"],
        queryFn: async () => {
            try {
                const data = await getStudentAttendanceMonths();
                return data || [];
            } catch (error) {
                console.error("Error fetching attendance months:", error);
                return [];
            }
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

export function useStudentAttendanceByMonth(month: number, year: number, { enabled = false } = {}) {
    return useQuery<AttendanceStudentResModel | null>({
        queryKey: ["student-attendance", month, year],
        queryFn: async () => {
            try {
                const res = await getStudentAttendanceByMonth(month, year);
                return res;
            } catch (err) {
                console.error("Error fetching student attendance logs:", err);
                return null;
            }
        },
        enabled: enabled && !!month && !!year,
        staleTime: 5 * 60 * 1000,
    });
}
