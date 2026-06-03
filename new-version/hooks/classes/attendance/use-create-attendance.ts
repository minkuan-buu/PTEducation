import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";
import { data } from "framer-motion/client";

export function useCreateAttendance(onSuccessFn: () => void, classId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: v2.CreateAttendancePayload) =>
      v2.createAttendance(data, classId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classes", classId],
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
      console.log("Failed to create class:", message);
    },
    onSettled: () => {
      console.log("Create class mutation settled");
    },
  });
}
