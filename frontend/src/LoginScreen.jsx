import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { password });
      localStorage.setItem("fotd_token", res.data.token);
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
        <div className="wordmark">
          <span className="wordmark-hole" />
          <span className="wordmark-text">FOTD</span>
        </div>
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
