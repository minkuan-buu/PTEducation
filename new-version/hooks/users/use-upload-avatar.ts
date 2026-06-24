import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";

export function useUploadAvatar(id: string, onSuccessFn?: () => void) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => v2.uploadAvatar(id, file),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["users", "detail", id],
            });
            queryClient.invalidateQueries({
                queryKey: ["users", "pagination"],
            });
            toast.success("Cập nhật ảnh đại diện thành công");
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
            console.error("Failed to upload avatar:", message);
        },
    });
}
