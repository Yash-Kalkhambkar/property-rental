import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "./apiError";

export function useLogin() {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      authApi.login(payload),
    onSuccess: async (res) => {
      setAccessToken(res.data.access_token);
      try {
        const me = await authApi.me();
        useAuthStore.getState().setOwner(me.data);
      } catch {
        /* owner fetch is best-effort */
      }
      toast.success("Welcome back");
      navigate({ to: "/" });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Invalid credentials")),
  });
}

export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      full_name: string;
      phone?: string;
    }) => authApi.register(payload),
    onSuccess: () => {
      toast.success("Account created — please sign in");
      navigate({ to: "/login" });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Registration failed")),
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      navigate({ to: "/login" });
    },
  });
}