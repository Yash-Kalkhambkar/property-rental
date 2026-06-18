import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Owner } from "@/types/api.types";

interface AuthState {
  accessToken: string | null;
  owner: Owner | null;
  setAccessToken: (token: string) => void;
  setOwner: (owner: Owner) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      owner: null,
      setAccessToken: (token) => set({ accessToken: token }),
      setOwner: (owner) => set({ owner }),
      logout: () => set({ accessToken: null, owner: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: "rentease-auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist the token and owner — nothing else
      partialize: (state) => ({
        accessToken: state.accessToken,
        owner: state.owner,
      }),
    },
  ),
);
