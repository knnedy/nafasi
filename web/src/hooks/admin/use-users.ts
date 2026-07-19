import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
}

export function useAdminUsers(params?: {
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.role && params.role !== "All") {
        searchParams.set("role", params.role);
      }
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
        `/api/v1/admin/users${queryStr ? `?${queryStr}` : ""}`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const json = await res.json();

      return (json.data ?? []) as UserResponse[];
    },
  });
}
