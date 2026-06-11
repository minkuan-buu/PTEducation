import { useQuery } from "@tanstack/react-query";
import {
    getStudentScoreMonths,
    getStudentScoresByMonth,
    type ScoreMonthResModel,
    type ScoreStudentResModel
} from "@/services/api/v2/student";

export function useStudentScoreMonths({ enabled = false } = {}) {
    return useQuery<ScoreMonthResModel[]>({
        queryKey: ["student-score-months"],
        queryFn: async () => {
            try {
                const data = await getStudentScoreMonths();
                return data || [];
            } catch (error) {
                console.error("Error fetching score months:", error);
                return [];
            }
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });
}

export function useStudentScoresByMonth(month: number, year: number, { enabled = false } = {}) {
    return useQuery<ScoreStudentResModel | null>({
        queryKey: ["student-scores", month, year],
        queryFn: async () => {
            try {
                const res = await getStudentScoresByMonth(month, year);
                return res;
            } catch (err) {
                console.error("Error fetching student scores:", err);
                return null;
            }
        },
        enabled: enabled && !!month && !!year,
        staleTime: 5 * 60 * 1000,
    });
}
