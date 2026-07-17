import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

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
