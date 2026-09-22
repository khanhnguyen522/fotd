import axios from "axios";
import { clearToken, getToken } from "./auth";

export const API_URL = import.meta.env.VITE_API_URL;

const client = axios.create({ baseURL: API_URL });

// attach the JWT to every request
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// bounce back to the lock screen if the token is missing/expired (backend responds 401)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearToken();
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

export default client;
