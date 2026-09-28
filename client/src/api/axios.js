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
      // A 401 from the login form itself just means "wrong email/password" —
      // it isn't an expired session, so don't clear storage or force a
      // reload here. Doing so was wiping the on-screen error message a
      // moment after it appeared (looked like the page "auto refreshed").
      // Let the calling component (Login.jsx) show its own message instead.
      const isLoginRequest = err.config?.url?.includes("/auth/login");
      const isPublicPage =
        window.location.pathname.startsWith("/respond") ||
        window.location.pathname.startsWith("/assessment") ||
        window.location.pathname.startsWith("/login");

      if (!isLoginRequest) {
        localStorage.removeItem("zas_token");
        localStorage.removeItem("zas_admin");
        if (!isPublicPage) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
