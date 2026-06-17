import api from "./axios";
import type {
  ApiResponse,
  PaginatedResponse,
  Lease,
  CreateLeasePayload,
  TerminateLeasePayload,
  LeaseStatus,
} from "@/types/api.types";

export const leasesApi = {
  list: async (params?: {
    status?: LeaseStatus;
    expiring_in_days?: number;
    unit_id?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Lease>>> => {
    const { data } = await api.get("/leases", { params });
    return data;
  },
  create: async (payload: CreateLeasePayload): Promise<ApiResponse<Lease>> => {
    const { data } = await api.post("/leases", payload);
    return data;
  },
  getById: async (leaseId: string): Promise<ApiResponse<Lease>> => {
    const { data } = await api.get(`/leases/${leaseId}`);
    return data;
  },
  update: async (
    leaseId: string,
    payload: Partial<Pick<CreateLeasePayload, "notes" | "end_date">>,
  ): Promise<ApiResponse<Lease>> => {
    const { data } = await api.patch(`/leases/${leaseId}`, payload);
    return data;
  },
  terminate: async (
    leaseId: string,
    payload: TerminateLeasePayload,
  ): Promise<ApiResponse<Lease>> => {
    const { data } = await api.patch(`/leases/${leaseId}/terminate`, payload);
    return data;
  },
  uploadAgreement: async (
    leaseId: string,
    file: File,
  ): Promise<ApiResponse<{ document_url: string; presigned_url: string }>> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post(`/leases/${leaseId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  getDocumentUrl: async (
    leaseId: string,
  ): Promise<ApiResponse<{ presigned_url: string }>> => {
    const { data } = await api.get(`/leases/${leaseId}/documents`);
    return data;
  },
};