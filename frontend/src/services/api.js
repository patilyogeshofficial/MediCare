import axios from "axios";

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT automatically to every API request.
api.interceptors.request.use(
  (config) => {
    try {
      const storedAuth = localStorage.getItem("medicare_auth");

      if (storedAuth) {
        const authData = JSON.parse(storedAuth);

        if (authData.token) {
          config.headers.Authorization = `Bearer ${authData.token}`;
        }
      }
    } catch (error) {
      localStorage.removeItem("medicare_auth");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;