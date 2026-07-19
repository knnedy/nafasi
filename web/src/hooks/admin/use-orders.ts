import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface AdminOrderDetailResponse {
  id: string;
  user_id: string;
  event_id: string;
  quantity: number;
  status: string;
  payment_method?: string;
  payment_ref?: string;
  checked_in: boolean;
  created_at: string;
  user_name: string;
  user_email: string;
  event_title: string;
}

export function useAdminOrders(params: {
  status: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["admin", "orders", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams({ status: params.status });
      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.offset) searchParams.set("offset", params.offset.toString());

      const res = await api.get(
        `/api/v1/admin/orders?${searchParams.toString()}`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch orders");
      }

      const json = await res.json();

      return (json.data ?? []) as AdminOrderDetailResponse[];
    },
  });
}

export function useAdminRecentOrders(limit: number = 5) {
  return useQuery({
    queryKey: ["admin", "orders", "recent", { limit }],
    queryFn: async () => {
      const res = await api.get(`/api/v1/admin/orders/recent?limit=${limit}`);

      if (!res.ok) {
        throw new Error("Failed to fetch recent orders");
      }

      const json = await res.json();

      return (json.data ?? []) as AdminOrderDetailResponse[];
    },
  });
}
