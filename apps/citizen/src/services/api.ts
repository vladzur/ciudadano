import axios from "axios";
import type { IReport, ApiResponse } from "@ciudadano/shared";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  timeout: 30000,
});

/** Interceptor: adjunta token JWT de ciudadano a cada request */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("citizenAccessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Interceptor: limpia sesión si el token expiró */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("citizenAccessToken");
    }
    return Promise.reject(error);
  }
);

/** Intercambia token Firebase por JWT del backend */
export async function citizenLogin(idToken: string): Promise<{ accessToken: string; user: any }> {
  const { data } = await api.post("/auth/citizen", { idToken });
  return data.data;
}

/** Envía una denuncia con imagen opcional */
export async function submitReport(data: {
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  image?: File;
}): Promise<IReport> {
  const formData = new FormData();
  formData.append("description", data.description);
  formData.append("category", data.category);
  formData.append("latitude", String(data.latitude));
  formData.append("longitude", String(data.longitude));
  if (data.image) {
    formData.append("image", data.image);
  }

  const response = await api.post<ApiResponse<IReport>>("/reports", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

export default api;
