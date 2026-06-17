import type { AxiosError } from "axios";
import type { ApiError } from "@/types/api.types";

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  const axiosErr = err as AxiosError<ApiError>;
  return axiosErr?.response?.data?.detail ?? fallback;
}