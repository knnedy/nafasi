import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export interface UserOrderResponse {
  id: string;
  quantity: number;
  status: string;
  qr_code: string;
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
  event_title: string;
  event_slug: string;
  event_starts_at: string;
  event_ends_at: string;
  event_location?: string;
  event_venue?: string;
  event_is_online: boolean;
  event_online_url?: string;
  event_banner_url?: string;
  ticket_type_name: string;
  ticket_type_price: number;
}

export function useMyOrders() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["users", "me", "orders"],
    queryFn: async () => {
      const res = await api.get("/api/v1/users/me/orders");
      const json = await res.json();

      return (json.data || []) as UserOrderResponse[];
    },
    // Only attempt to fetch if the user is authenticated
    enabled: isAuthenticated,
  });
}
