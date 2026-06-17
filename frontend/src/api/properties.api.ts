import api from "./axios";
import type {
  ApiResponse,
  PaginatedResponse,
  Property,
  Unit,
  CreatePropertyPayload,
  UpdatePropertyPayload,
  CreateUnitPayload,
  UpdateUnitPayload,
  UnitStatus,
} from "@/types/api.types";

export const propertiesApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    city?: string;
  }): Promise<ApiResponse<PaginatedResponse<Property>>> => {
    const { data } = await api.get("/properties", { params });
    return data;
  },
  create: async (payload: CreatePropertyPayload): Promise<ApiResponse<Property>> => {
    const { data } = await api.post("/properties", payload);
    return data;
  },
  getById: async (
    propertyId: string,
  ): Promise<ApiResponse<Property & { units: Unit[] }>> => {
    const { data } = await api.get(`/properties/${propertyId}`);
    return data;
  },
  update: async (
    propertyId: string,
    payload: UpdatePropertyPayload,
  ): Promise<ApiResponse<Property>> => {
    const { data } = await api.patch(`/properties/${propertyId}`, payload);
    return data;
  },
  delete: async (propertyId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`/properties/${propertyId}`);
    return data;
  },
  listUnits: async (
    propertyId: string,
    params?: { status?: UnitStatus },
  ): Promise<ApiResponse<Unit[]>> => {
    const { data } = await api.get(`/properties/${propertyId}/units`, { params });
    return data;
  },
  createUnit: async (
    propertyId: string,
    payload: CreateUnitPayload,
  ): Promise<ApiResponse<Unit>> => {
    const { data } = await api.post(`/properties/${propertyId}/units`, payload);
    return data;
  },
  getUnit: async (unitId: string): Promise<ApiResponse<Unit>> => {
    const { data } = await api.get(`/units/${unitId}`);
    return data;
  },
  updateUnit: async (
    unitId: string,
    payload: UpdateUnitPayload,
  ): Promise<ApiResponse<Unit>> => {
    const { data } = await api.patch(`/units/${unitId}`, payload);
    return data;
  },
  deleteUnit: async (unitId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`/units/${unitId}`);
    return data;
  },
};