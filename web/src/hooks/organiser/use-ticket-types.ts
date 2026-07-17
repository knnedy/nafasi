import { TicketTypeForm } from "@/app/(main)/dashboard/organiser/events/[id]/ticket-types/page";
import { api, APIError } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

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

export interface UpdateTicketTypeInput {
  name: string;
  description?: string;
  price: string;
  quantity: number;
  is_free: boolean;
  sale_starts?: string;
  sale_ends?: string;
}

export function useUpdateTicketType(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketTypeId,
      data,
    }: {
      ticketTypeId: string;
      data: UpdateTicketTypeInput;
    }) => {
      // Format dates to strict RFC3339 ISO strings if provided
      const formattedData = {
        ...data,
        sale_starts: data.sale_starts
          ? new Date(data.sale_starts).toISOString()
          : "",
        sale_ends: data.sale_ends ? new Date(data.sale_ends).toISOString() : "",
      };

      const res = await api.patch(
        `/api/v1/events/${eventId}/ticket-types/${ticketTypeId}`,
        formattedData,
      );

      const json = await res.json();
      return json.data as TicketTypeResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events", eventId, "ticket-types"],
      });
      toast.success("Ticket type updated successfully.");
    },
    onError: (err) => {
      if (err instanceof APIError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update ticket type.");
      }
    },
  });
}

export function useDeleteTicketType(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketTypeId: string) => {
      await api.delete(
        `/api/v1/events/${eventId}/ticket-types/${ticketTypeId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["events", eventId, "ticket-types"],
      });
      toast.success("Ticket type deleted.");
    },
    onError: (err) => {
      if (err instanceof APIError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete ticket type.");
      }
    },
  });
}
