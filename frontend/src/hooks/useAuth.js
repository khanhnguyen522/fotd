import { useState } from "react";
import { clearToken, getToken } from "../api/auth";

export function useAuth() {
  const [token, setToken] = useState(() => getToken());

  const logout = () => {
    clearToken();
    setToken(null);
  };

  return { token, setToken, logout };
}
