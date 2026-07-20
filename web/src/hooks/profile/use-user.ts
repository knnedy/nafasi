import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "ATTENDEE" | "ORGANISER" | "ADMIN";
  status: string;
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
}

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["users", "me"],
    queryFn: async () => {
      const res = await api.get("/api/v1/users/me");
      const json = await res.json();

      return json.data as UserProfile;
    },
    enabled: isAuthenticated,
  });
}

export interface UpdateProfileInput {
  name: string;
  email: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const res = await api.patch("/api/v1/users/me", data);
      const json = await res.json();
      return json.data as UserProfile;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["users", "me"], updatedUser);
    },
  });
}

export interface UpdatePasswordInput {
  current_password: string;
  new_password: string;
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (data: UpdatePasswordInput) => {
      await api.patch("/api/v1/users/me/password", data);
    },
  });
}

export interface UpdateAvatarInput {
  avatar_url: string;
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAvatarInput) => {
      const res = await api.patch("/api/v1/users/me/avatar", data);
      const json = await res.json();
      return json.data as UserProfile;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["users", "me"], updatedUser);
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await api.delete("/api/v1/users/me");
    },
  });
}
