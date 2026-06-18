import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuthStore } from "@/store/authStore";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    // Token is persisted in localStorage via Zustand persist middleware.
    // If it's missing the user was never logged in or explicitly logged out.
    if (!useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
    // Token expiry / cookie validity is handled by the axios interceptor in
    // axios.ts — it automatically calls /auth/refresh on any 401 and redirects
    // to /login if the refresh cookie is also gone. No extra check needed here.
  },
  component: AppLayout,
});
