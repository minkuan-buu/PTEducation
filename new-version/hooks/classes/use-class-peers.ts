import { useQuery } from "@tanstack/react-query";
import { v2 } from "@/services/api";

export function useClassPeers(classId: string) {
    return useQuery({
        queryKey: ["class-peers", classId],
        queryFn: () => v2.getClassPeers(classId),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
