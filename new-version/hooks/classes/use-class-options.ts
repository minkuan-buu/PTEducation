import { useQuery } from "@tanstack/react-query";
import { getClassOptions } from "@/services/api/v2/classes";

export function useClassOptions() {
    return useQuery({
        queryKey: ["class-options"],
        queryFn: () => getClassOptions(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
