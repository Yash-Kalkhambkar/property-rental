import { create } from "zustand";
import type { Owner } from "@/types/api.types";

interface AuthState {
  accessToken: string | null;
  owner: Owner | null;
  setAccessToken: (token: string) => void;
  setOwner: (owner: Owner) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  owner: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setOwner: (owner) => set({ owner }),
  logout: () => set({ accessToken: null, owner: null }),
  isAuthenticated: () => !!get().accessToken,
}));