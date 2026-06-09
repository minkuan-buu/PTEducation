import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";

export function useDeleteScore(onSuccessFn?: () => void, classId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scoreId: string) => v2.deleteScore(scoreId),
    onSuccess: () => {
      if (classId) {
        queryClient.invalidateQueries({
          queryKey: ["class-scores", classId],
        });
      }
      toast.success("Xóa bài kiểm tra thành công");
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
      console.error("Failed to delete score session:", message);
    },
  });
}
