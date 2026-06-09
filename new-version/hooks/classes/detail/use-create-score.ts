import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";

export function useCreateScore(onSuccessFn?: () => void, classId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: v2.ScoreCreateReqModel) => v2.createScore(payload),
    onSuccess: () => {
      if (classId) {
        queryClient.invalidateQueries({
          queryKey: ["class-scores", classId],
        });
        queryClient.invalidateQueries({
          queryKey: ["classes", classId],
        });
      }
      toast.success("Tạo điểm kiểm tra thành công");
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
      console.error("Failed to create score:", message);
    },
  });
}
