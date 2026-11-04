import React from "react";
import { Item, ItemStatus } from "../types";

interface ItemCardProps {
  item: Item;
  onView: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string, title: string) => void;
  onQuickStatus: (id: string, newStatus: ItemStatus) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onView,
  onEdit,
  onDelete,
  onQuickStatus,
}) => {
  const isLost = item.type === "lost";

  // Category fallback icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "electronics":
        return "💻";
      case "cards & ids":
        return "🪪";
      case "keys":
        return "🔑";
      case "books & study materials":
        return "📚";
      case "clothing":
        return "👕";
      case "personal belongings":
        return "🎒";
      default:
        return "📦";
    }
  };

  return (
    <div className={`item-card ${item.status === "returned" ? "returned-card" : ""}`}>
      {/* Top Banner with Badges */}
      <div className="item-card-top">
        <span className={`badge-type ${isLost ? "type-lost" : "type-found"}`}>
          {isLost ? "LOST" : "FOUND"}
        </span>

        <span className={`badge-status status-${item.status}`}>
          {item.status.toUpperCase()}
        </span>
      </div>

      {/* Image or Category Fallback */}
      <div className="item-thumbnail" onClick={() => onView(item)}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            onError={(e) => {
              // fallback if image fails to load
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="thumbnail-fallback">
            <span className="fallback-emoji">{getCategoryIcon(item.category)}</span>
          </div>
        )}
        <span className="category-tag">{item.category}</span>
      </div>

      {/* Body Details */}
      <div className="item-card-body">
        <h3 className="item-title" onClick={() => onView(item)} title={item.title}>
          {item.title}
        </h3>

        <p className="item-desc">{item.description}</p>

        <div className="item-meta">
          <div className="meta-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span className="meta-text">{item.location}</span>
          </div>

          <div className="meta-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span className="meta-text">{item.date}</span>
          </div>

          <div className="meta-row">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <a href={`mailto:${item.contact_email}`} className="meta-email" onClick={(e) => e.stopPropagation()}>
              {item.contact_email}
            </a>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="item-card-footer">
        <button className="btn-card-action btn-view" onClick={() => onView(item)}>
          View
        </button>

        {item.status !== "returned" ? (
          <button
            className="btn-card-action btn-return"
            onClick={() => onQuickStatus(item.id, "returned")}
            title="Mark as returned to owner"
          >
            ✓ Mark Returned
          </button>
        ) : (
          <button
            className="btn-card-action btn-reopen"
            onClick={() => onQuickStatus(item.id, item.type === "lost" ? "missing" : "found")}
            title="Re-open report"
          >
            ↺ Reopen
          </button>
        )}

        <button className="btn-card-action btn-edit" onClick={() => onEdit(item)} title="Edit report">
          Edit
        </button>

        <button
          className="btn-card-action btn-delete"
          onClick={() => onDelete(item.id, item.title)}
          title="Delete report permanently"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};
