import React from "react";
import { useAuth } from "../AuthContext";

interface NavbarProps {
  activeTab: "dashboard" | "all" | "my-reports" | "admin";
  onTabChange: (tab: "dashboard" | "all" | "my-reports" | "admin") => void;
  onOpenReportModal: () => void;
  onOpenLoginModal: () => void;
  onOpenSignupModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenReportModal,
  onOpenLoginModal,
  onOpenSignupModal,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <div className="brand-section">
          <div className="brand-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <path d="M11 8v6M8 11h6"></path>
            </svg>
          </div>
          <div>
            <div className="brand-title">UniFind</div>
            <div className="brand-subtitle">University Lost &amp; Found Portal</div>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-link-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => onTabChange("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`nav-link-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => onTabChange("all")}
          >
            Browse All Items
          </button>
          {user && (
            <button
              className={`nav-link-btn ${activeTab === "my-reports" ? "active" : ""}`}
              onClick={() => onTabChange("my-reports")}
            >
              My Reports
            </button>
          )}
          {user?.role === "admin" && (
            <button
              className={`nav-link-btn ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => onTabChange("admin")}
              style={{
                backgroundColor: activeTab === "admin" ? "#4338ca" : "rgba(99, 102, 241, 0.2)",
                color: activeTab === "admin" ? "#ffffff" : "#c7d2fe",
                border: "1px solid rgba(165, 180, 252, 0.4)",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              Admin Portal
            </button>
          )}
        </nav>

        <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button className="btn-primary" onClick={onOpenReportModal}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Report Item
          </button>

          {/* Authentication Actions */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginLeft: "0.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {user.full_name}
                </span>
                <span
                  style={{
                    fontSize: "0.725rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    background:
                      user.role === "admin"
                        ? "rgba(245, 158, 11, 0.2)"
                        : "rgba(59, 130, 246, 0.25)",
                    color: user.role === "admin" ? "#fcd34d" : "#93c5fd",
                    border:
                      user.role === "admin"
                        ? "1px solid rgba(245, 158, 11, 0.4)"
                        : "1px solid rgba(96, 165, 250, 0.4)",
                  }}
                >
                  {user.role}
                </span>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                title="Sign Out"
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#f87171";
                  e.currentTarget.style.color = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.color = "#0f172a";
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={onOpenLoginModal}
                style={{
                  padding: "0.5rem 0.9rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#1e293b",
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onOpenSignupModal}
                style={{
                  padding: "0.5rem 0.9rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "1px solid #2563eb",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  cursor: "pointer",
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
