import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export function useAdminUser(userId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const res = await api.get(`/api/v1/admin/users/${userId}`);

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      const json = await res.json();

      return json.data as UserResponse;
    },
    enabled: !!userId,
  });
}

export function useUpdateUserVerification(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isVerified: boolean) => {
      const res = await api.patch(
        `/api/v1/admin/users/${userId}/verification`,
        { is_verified: isVerified },
      );
      const json = await res.json();
      return json.data as UserResponse;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["admin", "users", userId], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useBanUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/v1/admin/users/${userId}/ban`, {});
      const json = await res.json();
      return json.data as UserResponse;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["admin", "users", userId], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUnbanUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/v1/admin/users/${userId}/unban`, {});
      const json = await res.json();
      return json.data as UserResponse;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["admin", "users", userId], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function usePromoteToAdmin(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/api/v1/admin/users/${userId}/promote`, {});
      const json = await res.json();
      return json.data as UserResponse;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["admin", "users", userId], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/api/v1/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
