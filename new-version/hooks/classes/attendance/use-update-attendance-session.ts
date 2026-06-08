import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";

export function useUpdateAttendanceSession(onSuccessFn: () => void, classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: v2.UpdateAttendanceSessionPayload) =>
      v2.updateAttendanceSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classes", classId],
      });
      queryClient.invalidateQueries({
        queryKey: ["class-attendance-sessions", classId],
      });
      queryClient.invalidateQueries({
        queryKey: ["class-calendar-indicators", classId],
      });
      queryClient.invalidateQueries({
        queryKey: ["attendance-session-detail"],
      });
      onSuccessFn();
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
      console.log("Failed to update attendance session:", message);
    },
    onSettled: () => {
      console.log("Update attendance session mutation settled");
    },
  });
}
