import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface AdminStatsResponse {
  total_users: number;
  total_organisers: number;
  total_attendees: number;
  total_events: number;
  published_events: number;
  total_orders: number;
  paid_orders: number;
  total_revenue: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await api.get("/api/v1/admin/stats");

      if (!res.ok) {
        throw new Error("Failed to fetch platform stats");
      }

      const json = await res.json();

      return json.data as AdminStatsResponse;
    },
  });
}
