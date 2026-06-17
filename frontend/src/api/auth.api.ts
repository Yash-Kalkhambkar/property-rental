import axios from "axios";
import api, { API_BASE_URL } from "./axios";
import type { ApiResponse, LoginResponse, Owner } from "@/types/api.types";

export const authApi = {
  register: async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }): Promise<ApiResponse<Owner>> => {
    const { data } = await api.post("/auth/register", payload);
    return data;
  },
  login: async (payload: {
    email: string;
    password: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await api.post("/auth/login", payload);
    return data;
  },
  me: async (): Promise<ApiResponse<Owner>> => {
    const { data } = await api.get("/auth/me");
    return data;
  },
  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },
  refresh: async (): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    return data;
  },
};