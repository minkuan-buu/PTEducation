import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";
import { AxiosError } from "axios";
import { toast } from "@heroui/react";

export function useCreateClass(onSuccessFn: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: v2.CreateClassPayload) => v2.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", "pagination"] });
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
