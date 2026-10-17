import axios from "axios";
import type { ApiError } from "./contracts";
export const token = () => localStorage.getItem("kurio.token") || "";
export function guestId() {
  let id = localStorage.getItem("kurio.guest");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("kurio.guest", id);
  }
  return id;
}
export const api = axios.create({ baseURL: "/api", timeout: 10000 });
api.interceptors.request.use((config) => {
  config.headers.set("X-Guest-Id", guestId());
  if (token()) config.headers.set("Authorization", `Bearer ${token()}`);
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      error.response?.status === 401 &&
      token() &&
      error.config?.headers?.get("Authorization") === `Bearer ${token()}`
    ) {
      localStorage.removeItem("kurio.token");
      window.dispatchEvent(new Event("kurio:expired"));
    }
    return Promise.reject(error);
  },
);
export function errorData(error: unknown): ApiError {
  if (axios.isAxiosError<ApiError>(error))
    return (
      error.response?.data || {
        message:
          "Não foi possível conectar. Verifique a conexão e tente novamente.",
      }
    );
  return {
    message: error instanceof Error ? error.message : "Algo deu errado.",
  };
}
export async function get<T>(url: string, signal?: AbortSignal) {
  return (await api.get<T>(url, { signal })).data;
}
