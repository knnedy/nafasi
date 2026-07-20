import { useQuery } from "@tanstack/react-query";
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
      // Uses the authenticated api instance (assuming api.get includes the Bearer token)
      const res = await api.get("/api/v1/users/me");
      const json = await res.json();

      return json.data as UserProfile;
    },
    // Only attempt to fetch if the user is authenticated in the local store
    enabled: isAuthenticated,
  });
}
