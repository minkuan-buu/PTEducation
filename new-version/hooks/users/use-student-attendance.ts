import { useQuery } from "@tanstack/react-query";
import {
    getStudentAttendanceMetadata,
    getStudentAttendanceByMonth,
    type AttendanceMonthResModel,
    type AttendanceStudentResModel,
    type AttendanceMetadataResModel
} from "@/services/api/v2/student";

export function useStudentAttendanceMetadata({ enabled = false } = {}) {
    return useQuery<AttendanceMetadataResModel | null>({
        queryKey: ["student-attendance-metadata"],
        queryFn: async () => {
            try {
                const data = await getStudentAttendanceMetadata();
                return data || null;
            } catch (error) {
                console.error("Error fetching attendance metadata:", error);
                return null;
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
