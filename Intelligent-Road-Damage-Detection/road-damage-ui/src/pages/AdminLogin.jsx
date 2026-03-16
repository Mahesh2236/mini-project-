import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, {
        username,
        password,
      });

      if (response.data.token) {
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem("adminName", response.data.name);
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="hero-blur pink"></div>
      <div className="hero-blur blue"></div>
      
      <div className="login-card glass-morphism">
        <div className="login-header">
          <span className="login-icon">🔐</span>
          <h1>Authority Login</h1>
          <p>National Road Infrastructure Assessment System</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error-box">⚠️ {error}</div>}
          
          <div className="login-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Admin Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="login-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 Ministry of Road Transport & Highways</p>
        </div>
      </div>

      <style jsx>{`
        .admin-login-container {
          min-height: calc(100vh - 200px);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 2rem;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          border-radius: 20px;
          z-index: 10;
          animation: fadeInUp 0.6s ease-out;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .login-header h1 {
          font-size: 1.8rem;
          color: #003366;
          margin-bottom: 0.25rem;
        }

        .login-header p {
          color: #666;
          font-size: 0.9rem;
        }

        .login-group {
          margin-bottom: 1.25rem;
        }

        .login-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .login-group input {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          background: rgba(255,255,255,0.8);
          font-size: 1rem;
        }

        .btn-login {
          width: 100%;
          padding: 1rem;
          background: var(--gov-blue, #003366);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }

        .btn-login:hover {
          background: #002244;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .login-error-box {
          background: rgba(192, 57, 43, 0.1);
          color: #c0392b;
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(192, 57, 43, 0.2);
          margin-bottom: 1.25rem;
          font-size: 0.9rem;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.8rem;
          color: #888;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
