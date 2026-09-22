import { useState } from "react";
import { setToken } from "../api/auth";
import client from "../api/client";
import "./LoginScreen.css";
import Wordmark from "./Wordmark";

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await client.post("/auth/login", { password });
      setToken(res.data.token);
      onLogin(res.data.token);
    } catch (err) {
      setError("Wrong password, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <Wordmark />
        <p className="tagline">Fit of the Day</p>

        <form onSubmit={handleSubmit} className="lock-form">
          <input
            type="password"
            className="lock-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="generate-btn" disabled={loading}>
            {loading ? "Unlocking..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
