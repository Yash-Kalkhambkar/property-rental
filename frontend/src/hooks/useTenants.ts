import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tenantsApi } from "@/api/tenants.api";
import type { CreateTenantPayload, UpdateTenantPayload } from "@/types/api.types";
import { getApiErrorMessage } from "./apiError";

export const TENANT_KEYS = {
  all: ["tenants"] as const,
  list: (params?: object) => [...TENANT_KEYS.all, "list", params] as const,
  detail: (id: string) => [...TENANT_KEYS.all, "detail", id] as const,
};

export function useTenants(params?: { search?: string; page?: number }) {
  return useQuery({
    queryKey: TENANT_KEYS.list(params),
    queryFn: () => tenantsApi.list(params),
    select: (res) => res.data,
  });
}

export function useTenant(tenantId: string) {
  return useQuery({
    queryKey: TENANT_KEYS.detail(tenantId),
    queryFn: () => tenantsApi.getById(tenantId),
    select: (res) => res.data,
    enabled: !!tenantId,
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTenantPayload) => tenantsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANT_KEYS.all });
      toast.success("Tenant added");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to add tenant")),
  });
}

export function useUpdateTenant(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTenantPayload) => tenantsApi.update(tenantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANT_KEYS.detail(tenantId) });
      qc.invalidateQueries({ queryKey: TENANT_KEYS.list() });
      toast.success("Tenant updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to update tenant")),
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => tenantsApi.delete(tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TENANT_KEYS.all });
      toast.success("Tenant deleted");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to delete tenant")),
  });
}