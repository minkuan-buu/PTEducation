import { useQuery } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import type { UserEditResModel } from "@/services/api/v2";

export function useGetUserDetail(id: string) {
    return useQuery<UserEditResModel>({
        queryKey: ["users", "detail", id],
        queryFn: () => v2.getUserEdits(id),
        staleTime: 3 * 60 * 1000, // 3 minutes
        enabled: !!id,
    });
}
