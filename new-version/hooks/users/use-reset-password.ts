import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";

export function useResetPassword(userId: string, onSuccessFn?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: { password?: string | null }) => v2.resetPassword(userId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["users", "detail", userId],
            });
            toast.success("Đặt lại mật khẩu thành công");
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
            console.error("Failed to reset password:", message);
        },
    });
}
