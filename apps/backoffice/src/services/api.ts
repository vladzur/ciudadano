import axios from "axios";
import type {
  ApiResponse,
  LoginResponse,
  IReport,
  IInternalNote,
  ReportQueryParams,
  ReportStats,
  HeatmapPoint,
} from "@ciudadano/shared";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
  timeout: 30000,
});

/** Interceptor: añade token JWT a cada request */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Interceptor: redirige a login si 401 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/** Auth */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<ApiResponse<LoginResponse>>("/auth/login", {
    email,
    password,
  });
  return data.data;
}

/** Reports */
export async function fetchReports(params?: ReportQueryParams) {
  const { data } = await api.get("/reports", { params });
  return data;
}

export async function fetchReportById(id: string) {
  const { data } = await api.get<ApiResponse<IReport & { notes: IInternalNote[] }>>(
    `/reports/${id}`
  );
  return data.data;
}

export async function updateReportStatus(id: string, status: string) {
  const { data } = await api.patch(`/reports/${id}/status`, { status });
  return data;
}

export async function createNote(reportId: string, content: string) {
  const { data } = await api.post(`/reports/${reportId}/notes`, { content });
  return data;
}

/** Analytics */
export async function fetchHeatmapData(params?: {
  startDate?: string;
  endDate?: string;
  category?: string;
}): Promise<HeatmapPoint[]> {
  const { data } = await api.get("/reports/analytics/heatmap", { params });
  return data.data;
}

export async function fetchStats(): Promise<ReportStats> {
  const { data } = await api.get("/reports/analytics/stats");
  return data.data;
}

/** Storage */
export async function getSignedUrl(objectKey: string): Promise<string> {
  const { data } = await api.get(`/storage/signed-url/${objectKey}`);
  return data.data.url;
}

/** User management (admin only) */
export async function fetchUsers() {
  const { data } = await api.get("/auth/users");
  return data.data;
}

export async function updateUserStatus(id: string, status: string) {
  const { data } = await api.patch(`/auth/users/${id}/status`, { status });
  return data.data;
}

export async function updateUserRole(id: string, role: string) {
  const { data } = await api.patch(`/auth/users/${id}/role`, { role });
  return data.data;
}

export async function deleteUser(id: string) {
  await api.delete(`/auth/users/${id}`);
}

export default api;
