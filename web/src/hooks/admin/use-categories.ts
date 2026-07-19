// hooks/admin/use-categories.ts
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventCategory } from "@/hooks/use-events";

export interface CategoryInput {
  name: string;
  description: string;
}

export function useCreateEventCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const res = await api.post("/api/v1/admin/events/categories", input);
      const json = await res.json();
      return json.data as EventCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
    },
  });
}

export function useUpdateEventCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: CategoryInput;
    }) => {
      const res = await api.patch(
        `/api/v1/admin/events/categories/${categoryId}`,
        data,
      );
      const json = await res.json();
      return json.data as EventCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
    },
  });
}

export function useDeleteEventCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      await api.delete(`/api/v1/admin/events/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
    },
  });
}
