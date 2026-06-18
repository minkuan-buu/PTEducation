import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import type { UserEditResModel } from "@/services/api/v2";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";

export function useUpdateUserDetail(id: string, onSuccessFn?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UserEditResModel) => v2.updateUserEdits(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["users", "detail", id],
            });
            queryClient.invalidateQueries({
                queryKey: ["users", "pagination"],
            });
            toast.success("Cập nhật thông tin học viên thành công");
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
