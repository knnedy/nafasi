import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ATTENDEE" | "ORGANISER" | "ADMIN";
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),

  setAccessToken: (accessToken) => set({ accessToken }),
}));
