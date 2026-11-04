import React from "react";
import { Stats, FilterState } from "../types";

interface StatsCardsProps {
  stats: Stats;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, filters, onFilterChange }) => {
  return (
    <div className="stats-grid">
      <div
        className={`stat-card ${filters.type === "all" && filters.status === "all" ? "selected" : ""}`}
        onClick={() => onFilterChange({ type: "all", status: "all" })}
      >
        <div className="stat-card-header">
          <span className="stat-label">Total Reports</span>
          <span className="stat-icon total-icon">📦</span>
        </div>
        <div className="stat-value">{stats.total}</div>
        <div className="stat-subtext">All active &amp; resolved items</div>
      </div>

      <div
        className={`stat-card ${filters.type === "lost" ? "selected" : ""}`}
        onClick={() => onFilterChange({ type: "lost", status: "all" })}
      >
        <div className="stat-card-header">
          <span className="stat-label">Lost Items</span>
          <span className="stat-icon lost-icon">🔍</span>
        </div>
        <div className="stat-value text-red">{stats.lost}</div>
        <div className="stat-subtext">Reported missing by students</div>
      </div>

      <div
        className={`stat-card ${filters.type === "found" ? "selected" : ""}`}
        onClick={() => onFilterChange({ type: "found", status: "all" })}
      >
        <div className="stat-card-header">
          <span className="stat-label">Found Items</span>
          <span className="stat-icon found-icon">🏷️</span>
        </div>
        <div className="stat-value text-green">{stats.found}</div>
        <div className="stat-subtext">Waiting to be claimed</div>
      </div>

      <div
        className={`stat-card ${filters.status === "returned" ? "selected" : ""}`}
        onClick={() => onFilterChange({ status: "returned", type: "all" })}
      >
        <div className="stat-card-header">
          <span className="stat-label">Reunited</span>
          <span className="stat-icon returned-icon">🤝</span>
        </div>
        <div className="stat-value text-blue">{stats.returned}</div>
        <div className="stat-subtext">Returned to rightful owners</div>
      </div>
    </div>
  );
};
