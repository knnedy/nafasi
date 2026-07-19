import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface AdminEventResponse {
  id: string;
  organiser_id: string;
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
  organiser_name: string;
}

export function useAdminEvents(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["admin", "events", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.status && params.status !== "All") {
        searchParams.set("status", params.status);
      }
      if (params?.limit) {
        searchParams.set("limit", params.limit.toString());
      }
      if (params?.offset) {
        searchParams.set("offset", params.offset.toString());
      }

      const queryStr = searchParams.toString();
      const res = await api.get(
        `/api/v1/admin/events${queryStr ? `?${queryStr}` : ""}`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch events");
      }

      const json = await res.json();

      return (json.data ?? []) as AdminEventResponse[];
    },
  });
}
