import api from "./axios";
import type { ApiResponse, Dashboard } from "@/types/api.types";

export const dashboardApi = {
  get: async (): Promise<ApiResponse<Dashboard>> => {
    const { data } = await api.get("/dashboard");
    return data;
  },
};