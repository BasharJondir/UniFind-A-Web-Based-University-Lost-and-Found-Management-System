import React, { useState } from "react";
import { useAuth } from "../AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
  onSuccess: (message: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignup,
  onSuccess,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      onSuccess("Welcome back! Signed in successfully.");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "student" | "admin") => {
    if (role === "admin") {
      setEmail("admin@univ.edu");
      setPassword("Pass123!");
    } else {
      setEmail("student@univ.edu");
      setPassword("Pass123!");
    }
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: "440px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ fontSize: "1.35rem" }}>
              Sign In to UniFind
            </h2>
            <p className="modal-subtitle">
              Enter your university credentials to manage your reports
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "8px",
              fontSize: "0.875rem",
              margin: "1rem 1.5rem 0",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: "1.25rem 1.5rem" }}>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">University Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. student@univ.edu"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Quick Demo Credentials Autofill for Grading */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: "8px",
              padding: "0.6rem 0.8rem",
              marginBottom: "1.25rem",
              fontSize: "0.8rem",
            }}
          >
            <span style={{ fontWeight: 600, color: "#475569" }}>
              Quick Demo Fill:
            </span>{" "}
            <button
              type="button"
              onClick={() => fillDemo("student")}
              style={{
                background: "#e2e8f0",
                border: "none",
                borderRadius: "4px",
                padding: "2px 8px",
                marginRight: "6px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => fillDemo("admin")}
              style={{
                background: "#e0e7ff",
                color: "#3730a3",
                border: "none",
                borderRadius: "4px",
                padding: "2px 8px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Admin
            </button>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div
            style={{
              textAlign: "center",
              marginTop: "1rem",
              fontSize: "0.875rem",
              color: "#64748b",
            }}
          >
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              style={{
                background: "none",
                border: "none",
                color: "#2563eb",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
