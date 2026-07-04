import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import type { UserEditResModel } from "@/services/api/v2";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";

export function useUpdateUserDetail(id: string, onSuccessFn?: () => void, isSelf?: boolean) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UserEditResModel) => isSelf ? v2.updateMyUserDetail(payload) : v2.updateUserEdits(id, payload),
        onSuccess: () => {
            if (isSelf) {
                queryClient.invalidateQueries({
                    queryKey: ["users", "detail", "me"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["profile", "me"],
                });
            } else {
                queryClient.invalidateQueries({
                    queryKey: ["users", "detail", id],
                });
                queryClient.invalidateQueries({
                    queryKey: ["profile", "admin", id],
                });
            }
            queryClient.invalidateQueries({
                queryKey: ["users", "pagination"],
            });
            toast.success("Cập nhật thông tin thành công");
            onSuccessFn?.();
        },
        onError: (error) => {
            const axiosError = error as AxiosError;
            const responseData = axiosError.response?.data;
            const message =
                typeof responseData === "object" &&
                responseData !== null &&
                "message" in responseData
                    ? String((responseData as { message?: unknown }).message)
                    : axiosError.message;
            toast.danger(message);
            console.error("Failed to update student detail:", message);
        },
    });
}
