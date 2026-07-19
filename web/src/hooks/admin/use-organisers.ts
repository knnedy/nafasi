import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { UserResponse } from "@/hooks/admin/use-users";

export function useAdminOrganisers(params?: {
  status?: "all" | "pending" | "approved";
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["admin", "organisers", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.status && params.status !== "all") {
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
        `/api/v1/admin/organisers${queryStr ? `?${queryStr}` : ""}`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch organisers");
      }

      const json = await res.json();

      return (json.data ?? []) as UserResponse[];
    },
  });
}
