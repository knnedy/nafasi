import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface EventCategory {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
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

export interface AvailableTicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  is_free: boolean;
}

// Fetch Categories (Public)
export function useEventCategories() {
  return useQuery({
    queryKey: ["event-categories"],
    queryFn: async () => {
      const res = await api.public.get("/api/v1/event-categories");
      const json = await res.json();

      return (json.data || []) as EventCategory[];
    },
  });
}

// Fetch Published Events (Public)
export function usePublishedEvents(
  category: string | null,
  page: number,
  limit: number = 9,
) {
  return useQuery({
    queryKey: ["events", "published", { category, page, limit }],
    queryFn: async () => {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (category) params.append("category", category);

      const res = await api.public.get(
        `/api/v1/events/published?${params.toString()}`,
      );
      const json = await res.json();

      return (json.data || []) as Event[];
    },
    placeholderData: (prev) => prev,
  });
}

// Fetch Upcoming Events (Public)
export function useUpcomingEvents(
  category: string | null,
  page: number,
  limit: number = 20,
) {
  return useQuery({
    queryKey: ["events", "upcoming", { category, page, limit }],
    queryFn: async () => {
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (category) params.append("category", category);

      const res = await api.public.get(
        `/api/v1/events/upcoming?${params.toString()}`,
      );
      const json = await res.json();

      return (json.data || []) as Event[];
    },
    placeholderData: (prev) => prev,
  });
}

export function useEventBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["event", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug is required");
      const res = await api.public.get(`/api/v1/events/slug/${slug}`);
      const json = await res.json();

      return json.data as Event;
    },
    enabled: !!slug,
  });
}

export function useEventTicketTypes(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-tickets", eventId],
    queryFn: async () => {
      if (!eventId) throw new Error("Event ID is required");

      const res = await api.public.get(
        `/api/v1/events/${eventId}/ticket-types/available`,
      );
      const json = await res.json();

      return (json.data || []) as AvailableTicketType[];
    },
    enabled: !!eventId, // This ensures it only runs AFTER the event is fetched
  });
}
