import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { v1 } from "@/services/api";
import type { ManagersPage } from "@/services/api/v1";

export function useManagers({ pageIndex = 1, keyword = "" } = {}) {
    return useQuery<ManagersPage>({
        queryKey: ["users", "pagination", "managers", pageIndex, keyword],
        queryFn: () => v1.getManagers({ params: { pageIndex, keyword } }),
        placeholderData: keepPreviousData,
        staleTime: 3 * 60 * 1000, // 3 minutes
    });
}
