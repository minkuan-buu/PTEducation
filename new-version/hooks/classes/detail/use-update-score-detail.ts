import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";

export function useUpdateScoreDetail(onSuccessFn?: () => void, scoreId?: string | null, classId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: v2.ScoreDetailUpdateReqModel) => v2.updateScoreDetail(payload),
    onSuccess: () => {
      if (scoreId) {
        queryClient.invalidateQueries({
          queryKey: ["score-detail", scoreId],
        });
      }
      if (classId) {
        queryClient.invalidateQueries({
          queryKey: ["class-scores", classId],
        });
      }
      toast.success("Cập nhật điểm thành công");
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
      console.error("Failed to update scores:", message);
    },
  });
}
