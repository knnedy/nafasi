import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface EventResponse {
  id: string;
  organiser_id: string;
  category_id: string;
  title: string;
  slug: string;
  description?: string;
  location?: string;
  venue?: string;
  banner_url?: string;
  starts_at: string;
  ends_at: string;
  status: string;
  is_online: boolean;
  online_url?: string;
  created_at: string;
  updated_at: string;
}

export function useOrganiserEvents() {
  return useQuery({
    queryKey: ["organiser", "events"],
    queryFn: async () => {
      const res = await api.get("/api/v1/organiser/events");
      const json = await res.json();
      return (json.data || []) as EventResponse[];
    },
  });
}

export interface CreateEventInput {
  title: string;
  category_id: string;
  description?: string;
  location?: string;
  venue?: string;
  starts_at: string;
  ends_at: string;
  is_online: boolean;
  online_url?: string;
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const res = await api.post("/api/v1/events", input);
      return res.json();
    },
    onSuccess: () => {
      // Automatically refetch the events list when a new event is created
      queryClient.invalidateQueries({ queryKey: ["organiser", "events"] });
    },
  });
}

export interface UpdateEventInput {
  title: string;
  category_id: string;
  description?: string;
  location?: string;
  venue?: string;
  starts_at: string;
  ends_at: string;
  is_online: boolean;
  online_url?: string;
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateEventInput;
    }) => {
      const res = await api.patch(`/api/v1/events/${id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the main events list
      queryClient.invalidateQueries({ queryKey: ["organiser", "events"] });
      // Invalidate any queries relying on this specific event's data
      queryClient.invalidateQueries({
        queryKey: ["organiser", "events", variables.id],
      });
    },
  });
}

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";

interface UpdateEventStatusVariables {
  id: string;
  status: EventStatus;
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdateEventStatusVariables) => {
      const res = await api.patch(`/api/v1/events/${id}/status`, { status });
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific event cache
      queryClient.invalidateQueries({
        queryKey: ["organiser", "events", variables.id],
      });
      // Invalidate the general list cache so the status tag updates everywhere
      queryClient.invalidateQueries({
        queryKey: ["organiser", "events"],
      });
    },
  });
}
