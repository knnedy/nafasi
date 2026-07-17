import { useQueries } from "@tanstack/react-query";
import { EventResponse } from "./use-events";
import { api } from "@/lib/api";

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
