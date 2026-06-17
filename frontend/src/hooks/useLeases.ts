import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { leasesApi } from "@/api/leases.api";
import type {
  CreateLeasePayload,
  TerminateLeasePayload,
  LeaseStatus,
} from "@/types/api.types";
import { getApiErrorMessage } from "./apiError";

export const LEASE_KEYS = {
  all: ["leases"] as const,
  list: (params?: object) => [...LEASE_KEYS.all, "list", params] as const,
  detail: (id: string) => [...LEASE_KEYS.all, "detail", id] as const,
};

export function useLeases(params?: {
  status?: LeaseStatus;
  expiring_in_days?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: LEASE_KEYS.list(params),
    queryFn: () => leasesApi.list(params),
    select: (res) => res.data,
  });
}

export function useLease(leaseId: string) {
  return useQuery({
    queryKey: LEASE_KEYS.detail(leaseId),
    queryFn: () => leasesApi.getById(leaseId),
    select: (res) => res.data,
    enabled: !!leaseId,
  });
}

export function useCreateLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeasePayload) => leasesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEASE_KEYS.all });
      toast.success("Lease created");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to create lease")),
  });
}

export function useTerminateLease(leaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TerminateLeasePayload) =>
      leasesApi.terminate(leaseId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEASE_KEYS.detail(leaseId) });
      qc.invalidateQueries({ queryKey: LEASE_KEYS.list() });
      toast.success("Lease terminated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to terminate lease")),
  });
}