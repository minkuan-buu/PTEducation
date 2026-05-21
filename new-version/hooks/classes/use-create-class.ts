import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v2 } from "@/services/api";

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: v2.CreateClassPayload) => v2.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", "pagination"] });
    },
    onError: (error) => {
      console.error("Failed to create class:", error);
    },
    onSettled: () => {
      console.log("Create class mutation settled");
    },
  });
}
