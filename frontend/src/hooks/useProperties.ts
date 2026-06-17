import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { propertiesApi } from "@/api/properties.api";
import type {
  CreatePropertyPayload,
  UpdatePropertyPayload,
  CreateUnitPayload,
  UpdateUnitPayload,
  UnitStatus,
} from "@/types/api.types";
import { getApiErrorMessage } from "./apiError";

export const PROPERTY_KEYS = {
  all: ["properties"] as const,
  list: (params?: object) => [...PROPERTY_KEYS.all, "list", params] as const,
  detail: (id: string) => [...PROPERTY_KEYS.all, "detail", id] as const,
  units: (id: string, params?: object) =>
    [...PROPERTY_KEYS.all, "units", id, params] as const,
};

export function useProperties(params?: { page?: number; city?: string }) {
  return useQuery({
    queryKey: PROPERTY_KEYS.list(params),
    queryFn: () => propertiesApi.list(params),
    select: (res) => res.data,
  });
}

export function useProperty(propertyId: string) {
  return useQuery({
    queryKey: PROPERTY_KEYS.detail(propertyId),
    queryFn: () => propertiesApi.getById(propertyId),
    select: (res) => res.data,
    enabled: !!propertyId,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePropertyPayload) => propertiesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all });
      toast.success("Property added");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to add property")),
  });
}

export function useUpdateProperty(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePropertyPayload) =>
      propertiesApi.update(propertyId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.detail(propertyId) });
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all });
      toast.success("Property updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to update property")),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) => propertiesApi.delete(propertyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all });
      toast.success("Property deleted");
    },
    onError: (err: any) => {
      if (err?.response?.status === 409)
        toast.error("Cannot delete — one or more units have active leases");
      else toast.error(getApiErrorMessage(err, "Failed to delete property"));
    },
  });
}

export function usePropertyUnits(propertyId: string, params?: { status?: UnitStatus }) {
  return useQuery({
    queryKey: PROPERTY_KEYS.units(propertyId, params),
    queryFn: () => propertiesApi.listUnits(propertyId, params),
    select: (res) => res.data,
    enabled: !!propertyId,
  });
}

export function useCreateUnit(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUnitPayload) =>
      propertiesApi.createUnit(propertyId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.detail(propertyId) });
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all });
      toast.success("Unit added");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to add unit")),
  });
}

export function useUpdateUnit(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, payload }: { unitId: string; payload: UpdateUnitPayload }) =>
      propertiesApi.updateUnit(unitId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.detail(propertyId) });
      toast.success("Unit updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to update unit")),
  });
}

export function useDeleteUnit(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (unitId: string) => propertiesApi.deleteUnit(unitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.detail(propertyId) });
      toast.success("Unit deleted");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to delete unit")),
  });
}