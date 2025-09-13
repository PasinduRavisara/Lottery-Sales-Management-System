import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post("/auth/login", credentials),

  logout: () => api.post("/auth/logout"),

  getMe: () => api.get("/auth/me"),

  setupDemo: () => api.post("/auth/setup-demo"),
};

// Submissions API
export const submissionsAPI = {
  getAll: (params?: { page?: number; limit?: number; isDraft?: boolean }) =>
    api.get("/submissions", { params }),

  getById: (id: string) => api.get(`/submissions/${id}`),

  create: (data: any) => api.post("/submissions", data),

  update: (id: string, data: any) => api.post("/submissions", { id, ...data }),

  delete: (id: string) => api.delete(`/submissions/${id}`),
};

// Reports API
export const reportsAPI = {
  getSummary: (params?: {
    startDate?: string;
    endDate?: string;
    district?: string;
    city?: string;
  }) => api.get("/reports/summary", { params }),

  getDashboard: () => api.get("/reports/dashboard"),

  export: (params?: {
    startDate?: string;
    endDate?: string;
    district?: string;
    city?: string;
    format?: "csv" | "json";
  }) =>
    api.get("/reports/export", {
      params,
      responseType: params?.format === "csv" ? "blob" : "json",
    }),
};

export default api;
