import React from "react";

interface NavbarProps {
  activeTab: "dashboard" | "all" | "my-reports";
  onTabChange: (tab: "dashboard" | "all" | "my-reports") => void;
  onOpenReportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenReportModal,
}) => {
  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        <div className="brand-section">
          <div className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <button
            className={`nav-link-btn ${activeTab === "my-reports" ? "active" : ""}`}
            onClick={() => onTabChange("my-reports")}
          >
            Manage Reports
          </button>
        </nav>

        <div className="nav-actions">
          <button className="btn-primary" onClick={onOpenReportModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Report Item
          </button>
        </div>
      </div>
    </header>
  );
};
