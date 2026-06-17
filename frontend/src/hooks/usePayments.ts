import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { paymentsApi } from "@/api/payments.api";
import type {
  CreatePaymentPayload,
  UpdatePaymentPayload,
  PaymentStatus,
} from "@/types/api.types";
import { getApiErrorMessage } from "./apiError";

export const PAYMENT_KEYS = {
  all: ["payments"] as const,
  list: (params?: object) => [...PAYMENT_KEYS.all, "list", params] as const,
  detail: (id: string) => [...PAYMENT_KEYS.all, "detail", id] as const,
};

export function usePayments(params?: {
  status?: PaymentStatus;
  lease_id?: string;
  month?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: PAYMENT_KEYS.list(params),
    queryFn: () => paymentsApi.list(params),
    select: (res) => res.data,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => paymentsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
      toast.success("Payment recorded");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to record payment")),
  });
}

export function useUpdatePayment(paymentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePaymentPayload) =>
      paymentsApi.update(paymentId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
      toast.success("Payment updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to update payment")),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => paymentsApi.delete(paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
      toast.success("Payment deleted");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to delete payment")),
  });
}