import React from "react";
import { FilterState } from "../types";

const CATEGORIES = [
  "All Categories",
  "Personal Belongings",
  "Cards & IDs",
  "Electronics",
  "Books & Study Materials",
  "Keys",
  "Clothing",
  "Accessories",
  "Other",
];

interface FiltersBarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onFilterChange,
}) => {
  return (
    <div className="filters-container">
      {/* Search Input */}
      <div className="search-box">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Search by item name, description, location..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
        {filters.search && (
          <button className="clear-btn" onClick={() => onFilterChange({ search: "" })}>
            ✕
          </button>
        )}
      </div>

      {/* Type Pill Selector */}
      <div className="type-pills">
        <button
          className={`pill ${filters.type === "all" ? "active" : ""}`}
          onClick={() => onFilterChange({ type: "all" })}
        >
          All Types
        </button>
        <button
          className={`pill pill-lost ${filters.type === "lost" ? "active" : ""}`}
          onClick={() => onFilterChange({ type: "lost" })}
        >
          Lost Only
        </button>
        <button
          className={`pill pill-found ${filters.type === "found" ? "active" : ""}`}
          onClick={() => onFilterChange({ type: "found" })}
        >
          Found Only
        </button>
      </div>

      {/* Category Dropdown */}
      <select
        className="dropdown-select"
        value={filters.category}
        onChange={(e) => onFilterChange({ category: e.target.value === "All Categories" ? "all" : e.target.value })}
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat === "All Categories" ? "all" : cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* Status Dropdown */}
      <select
        className="dropdown-select"
        value={filters.status}
        onChange={(e) => onFilterChange({ status: e.target.value as any })}
      >
        <option value="all">All Statuses</option>
        <option value="missing">Missing</option>
        <option value="found">Found / Unclaimed</option>
        <option value="returned">Returned / Resolved</option>
      </select>
    </div>
  );
};
