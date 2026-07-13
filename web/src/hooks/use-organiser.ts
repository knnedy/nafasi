import { useQuery, useQueries } from "@tanstack/react-query";
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

// Parallel fetch for all event stats to power the dashboard totals
export function useAllEventsStats(events: EventResponse[] = []) {
  return useQueries({
    queries: events.map((event) => ({
      queryKey: ["organiser", "events", event.id, "stats"],
      queryFn: async () => {
        // Based on the handlers provided, these return map[string]int64 directly
        const [ticketsRes, revenueRes, ordersRes, checkInRes] =
          await Promise.all([
            api.get(`/api/v1/organiser/events/${event.id}/tickets-sold`),
            api.get(`/api/v1/organiser/events/${event.id}/revenue`),
            api.get(`/api/v1/organiser/events/${event.id}/orders/count`),
            api.get(`/api/v1/organiser/events/${event.id}/checkin/count`),
          ]);

        const [tickets, revenue, orders, checkin] = await Promise.all([
          ticketsRes.json(),
          revenueRes.json(),
          ordersRes.json(),
          checkInRes.json(),
        ]);

        return {
          eventId: event.id,
          // Extracting exactly as defined in your Go maps
          tickets_sold: tickets.total_tickets_sold || 0,
          revenue: revenue.revenue || 0,
          orders: orders.total_orders || 0,
          checked_in: checkin.checked_in_count || 0,
        };
      },
      staleTime: 1000 * 60 * 5, // Cache stats for 5 minutes
    })),
  });
}
