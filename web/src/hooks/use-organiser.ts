import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";

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

export interface OrganiserOrderResponse {
  id: string;
  user_id: string;
  event_id: string;
  ticket_type_id: string;
  quantity: number;
  status: string;
  payment_method?: string;
  payment_ref?: string;
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
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

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";

interface UpdateEventStatusVariables {
  id: string;
  status: EventStatus;
}

export interface AvailableTicketTypesResponse {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  is_free: boolean;
}

// Fetch all events for the organiser
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

export function useOrganiserOrders(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["organiser", "orders", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status && params.status !== "All") {
        searchParams.set("status", params.status.toUpperCase());
      }
      if (params?.limit) {
        searchParams.set("limit", params.limit.toString());
      }
      if (params?.offset) {
        searchParams.set("offset", params.offset.toString());
      }

      const queryStr = searchParams.toString();
      const res = await api.get(
        `/api/v1/organiser/orders${queryStr ? `?${queryStr}` : ""}`,
      );
      const json = await res.json();

      // Based on your Go handler, the response is written directly as an array
      return (json || []) as OrganiserOrderResponse[];
    },
  });
}

export function useOrganiserRecentOrders(limit: number = 5) {
  return useQuery({
    queryKey: ["organiser", "orders", "recent", { limit }],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: limit.toString() });
      const res = await api.get(
        `/api/v1/organiser/orders?${params.toString()}`,
      );
      const json = await res.json();
      return (json.data || []) as OrganiserOrderResponse[];
    },
  });
}

export function useAllEventsStats(events: EventResponse[] = []) {
  return useQueries({
    queries: events.map((event) => ({
      queryKey: ["organiser", "events", event.id, "stats"],
      queryFn: async () => {
        const [ticketsRes, revenueRes, ordersRes, checkInRes] =
          await Promise.all([
            api.get(`/api/v1/organiser/events/${event.id}/tickets-sold`),
            api.get(`/api/v1/organiser/events/${event.id}/revenue`),
            api.get(`/api/v1/organiser/events/${event.id}/orders/count`),
            api.get(`/api/v1/organiser/events/${event.id}/checkin/count`),
          ]);

        if (
          !ticketsRes.ok ||
          !revenueRes.ok ||
          !ordersRes.ok ||
          !checkInRes.ok
        ) {
          throw new Error(`Failed to fetch stats for event ${event.id}`);
        }

        const [tickets, revenue, orders, checkin] = await Promise.all([
          ticketsRes.json(),
          revenueRes.json(),
          ordersRes.json(),
          checkInRes.json(),
        ]);

        return {
          eventId: event.id,
          tickets_sold: tickets.total_tickets_sold || 0,
          revenue: revenue.revenue || 0,
          orders: orders.total_orders || 0,
          checked_in: checkin.checked_in_count || 0,
        };
      },
      staleTime: 1000 * 60 * 5,
    })),
  });
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

export function useEventOrders(
  eventId: string,
  params?: {
    status?: string;
    limit?: number;
    offset?: number;
  },
) {
  return useQuery({
    queryKey: ["organiser", "events", eventId, "orders", params],
    queryFn: async () => {
      if (!eventId) return [];

      const searchParams = new URLSearchParams();

      if (params?.status && params.status !== "All") {
        searchParams.set("status", params.status.toUpperCase());
      }
      if (params?.limit) {
        searchParams.set("limit", params.limit.toString());
      }
      if (params?.offset) {
        searchParams.set("offset", params.offset.toString());
      }

      const queryStr = searchParams.toString();
      const url = `/api/v1/organiser/events/${eventId}/orders${queryStr ? `?${queryStr}` : ""}`;

      const res = await api.get(url);

      if (!res.ok) {
        throw new Error("Failed to fetch event orders");
      }

      const json = await res.json();

      // Go handler returns directly using response.WriteJSON
      return (json.data || json || []) as OrganiserOrderResponse[];
    },
    enabled: !!eventId,
  });
}

export function useEventAvailableTicketTypes(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "ticket-types", "available"],
    queryFn: async () => {
      if (!eventId) return [];

      const res = await api.get(
        `/api/v1/events/${eventId}/ticket-types/available`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch ticket types");
      }

      const json = await res.json();

      return (json.data || json || []) as AvailableTicketTypesResponse[];
    },
    enabled: !!eventId,
  });
}
