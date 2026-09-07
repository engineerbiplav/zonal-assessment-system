import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("zas_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("zas_token");
      localStorage.removeItem("zas_admin");
      const isPublicPage =
        window.location.pathname.startsWith("/respond") || window.location.pathname.startsWith("/assessment");
      if (!isPublicPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
