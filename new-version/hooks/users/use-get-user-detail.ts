import { useQuery } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import type { UserEditResModel } from "@/services/api/v2";

export function useGetUserDetail(id: string, isSelf?: boolean, enabled?: boolean) {
    return useQuery<UserEditResModel>({
        queryKey: isSelf ? ["users", "detail", "me"] : ["users", "detail", id],
        queryFn: () => isSelf ? Promise.resolve({} as any) : v2.getUserEdits(id),
        staleTime: 3 * 60 * 1000, // 3 minutes
        enabled: enabled !== undefined ? enabled : (isSelf || !!id),
    });
}
