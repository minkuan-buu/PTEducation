import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";
import { data } from "framer-motion/client";

export function useCheckAttendance(
  //   onSuccessFn: () => void,
  attendanceId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: v2.CheckAttendancePayload) =>
      v2.checkAttendance(attendanceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attendance-session-detail", attendanceId],
      });
      //   onSuccessFn();
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
      console.log("Failed to check attendance:", message);
    },
    onSettled: () => {
      console.log("Check attendance mutation settled");
    },
  });
}
