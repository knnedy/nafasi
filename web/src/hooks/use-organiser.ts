import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api, APIError } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { TicketTypeForm } from "@/app/(main)/dashboard/organiser/events/[id]/setup/page";

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

export interface TicketTypeResponse {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  quantity_sold: number;
  is_free: boolean;
  sale_starts?: string;
  sale_ends?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailableTicketTypeResponse {
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

export function useEventTicketTypes(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "ticket-types"],
    queryFn: async () => {
      if (!eventId) return [];

      const res = await api.get(
        `/api/v1/organiser/events/${eventId}/ticket-types`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch ticket types");
      }

      const json = await res.json();

      return (json.data || json || []) as TicketTypeResponse[];
    },
    enabled: !!eventId,
  });
}

interface UseCreateTicketTypeProps {
  eventId: string;
  onSuccess: (newTicket: TicketTypeResponse) => void;
}

export function useCreateTicketType({
  eventId,
  onSuccess,
}: UseCreateTicketTypeProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutate = async (data: TicketTypeForm) => {
    setIsSubmitting(true);
    try {
      // Format dates to strict RFC3339 ISO strings for the Go time parser, or leave empty for omitempty
      const saleStarts = data.sale_starts
        ? new Date(data.sale_starts).toISOString()
        : "";
      const saleEnds = data.sale_ends
        ? new Date(data.sale_ends).toISOString()
        : "";

      const res = await api.post(`/api/v1/events/${eventId}/ticket-types`, {
        name: data.name,
        description: data.description ?? "",
        price: data.is_free ? "0" : (data.price ?? "0"),
        quantity: data.quantity,
        is_free: data.is_free,
        sale_starts: saleStarts,
        sale_ends: saleEnds,
      });

      const json = await res.json();

      // Explicitly pull from the verified successResponse envelope structure
      const newTicket: TicketTypeResponse = json.data;

      toast.success(`"${data.name}" added.`);
      onSuccess(newTicket);
      return true;
    } catch (err) {
      if (err instanceof APIError) {
        toast.error(err.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { mutate, isSubmitting };
}
