import api from "./axios";
import type {
  ApiResponse,
  PaginatedResponse,
  Payment,
  CreatePaymentPayload,
  UpdatePaymentPayload,
  PaymentStatus,
} from "@/types/api.types";

export const paymentsApi = {
  list: async (params?: {
    status?: PaymentStatus;
    lease_id?: string;
    month?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Payment>>> => {
    const { data } = await api.get("/payments", { params });
    return data;
  },
  create: async (payload: CreatePaymentPayload): Promise<ApiResponse<Payment>> => {
    const { data } = await api.post("/payments", payload);
    return data;
  },
  getById: async (paymentId: string): Promise<ApiResponse<Payment>> => {
    const { data } = await api.get(`/payments/${paymentId}`);
    return data;
  },
  update: async (
    paymentId: string,
    payload: UpdatePaymentPayload,
  ): Promise<ApiResponse<Payment>> => {
    const { data } = await api.patch(`/payments/${paymentId}`, payload);
    return data;
  },
  delete: async (paymentId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`/payments/${paymentId}`);
    return data;
  },
};