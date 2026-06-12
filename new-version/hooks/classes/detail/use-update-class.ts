import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";

export function useUpdateClass(classId: string, onSuccessFn?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: v2.UpdateClassPayload) => v2.updateClass(classId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classes", classId],
      });
      toast.success("Cập nhật lớp học thành công");
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
      console.error("Failed to update class:", message);
    },
  });
}
