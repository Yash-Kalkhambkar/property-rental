import api from "./axios";
import type {
  ApiResponse,
  PaginatedResponse,
  Tenant,
  CreateTenantPayload,
  UpdateTenantPayload,
} from "@/types/api.types";

export const tenantsApi = {
  list: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Tenant>>> => {
    const { data } = await api.get("/tenants", { params });
    return data;
  },
  create: async (payload: CreateTenantPayload): Promise<ApiResponse<Tenant>> => {
    const { data } = await api.post("/tenants", payload);
    return data;
  },
  getById: async (tenantId: string): Promise<ApiResponse<Tenant>> => {
    const { data } = await api.get(`/tenants/${tenantId}`);
    return data;
  },
  update: async (
    tenantId: string,
    payload: UpdateTenantPayload,
  ): Promise<ApiResponse<Tenant>> => {
    const { data } = await api.patch(`/tenants/${tenantId}`, payload);
    return data;
  },
  delete: async (tenantId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`/tenants/${tenantId}`);
    return data;
  },
  uploadDocument: async (
    tenantId: string,
    file: File,
  ): Promise<ApiResponse<{ document_url: string; presigned_url: string }>> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post(`/tenants/${tenantId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};