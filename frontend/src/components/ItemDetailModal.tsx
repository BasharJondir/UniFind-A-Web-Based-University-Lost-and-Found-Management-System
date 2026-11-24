import React from "react";
import { Item, ItemStatus } from "../types";
import { useAuth } from "../AuthContext";

interface ItemDetailModalProps {
  item: Item | null;
  onClose: () => void;
  onEdit: (item: Item) => void;
  onDelete: (id: string, title: string) => void;
  onQuickStatus: (id: string, status: ItemStatus) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onDelete,
  onQuickStatus,
}) => {
  const { user } = useAuth();
  if (!item) return null;

  // Check ownership
  const isOwner = Boolean(
    user &&
      ((item.user_id && item.user_id === user.id) ||
        (item.contact_email &&
          user.email &&
          item.contact_email.toLowerCase() === user.email.toLowerCase()))
  );
  const canManage = isOwner || user?.role === "admin";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="detail-header-left">
            <span className={`badge-type ${item.type === "lost" ? "type-lost" : "type-found"}`}>
              {item.type.toUpperCase()}
            </span>
            <span className={`badge-status status-${item.status}`}>
              {item.status.toUpperCase()}
            </span>
            <span className="badge-category">{item.category}</span>
            {isOwner && (
              <span
                style={{
                  fontSize: "0.725rem",
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: "9999px",
                  background: "#dcfce7",
                  color: "#15803d",
                  border: "1px solid #bbf7d0",
                }}
              >
                ★ MY SUBMISSION
              </span>
            )}
          </div>

          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="detail-modal-body">
          {item.image_url && (
            <div className="detail-image-box">
              <img
                src={item.image_url}
                alt={item.title}
                onError={(e) => ((e.currentTarget as HTMLElement).style.display = "none")}
              />
            </div>
          )}

          <h2 className="detail-title">{item.title}</h2>

          <div className="detail-info-grid">
            <div className="info-cell">
              <span className="info-label">📍 Campus Location</span>
              <span className="info-val">{item.location}</span>
            </div>
            <div className="info-cell">
              <span className="info-label">📅 Date Reported</span>
              <span className="info-val">{item.date}</span>
            </div>
            <div className="info-cell">
              <span className="info-label">✉️ Contact Email</span>
              <span className="info-val">
                <a href={`mailto:${item.contact_email}`}>{item.contact_email}</a>
              </span>
            </div>
            <div className="info-cell">
              <span className="info-label">🆔 Item UUID</span>
              <span className="info-val code-text">{item.id}</span>
            </div>
          </div>

          <div className="detail-description-section">
            <h4>Description &amp; Identifying Details</h4>
            <p className="detail-desc-text">{item.description}</p>
          </div>

          <div className="detail-timestamps">
            <small>Created: {new Date(item.created_at).toLocaleString()}</small>
            <small>Last updated: {new Date(item.updated_at).toLocaleString()}</small>
          </div>
        </div>

        <div className="modal-footer detail-modal-footer">
          <div className="detail-footer-actions">
            {canManage ? (
              <>
                {item.status !== "returned" ? (
                  <button
                    className="btn-success"
                    onClick={() => {
                      onQuickStatus(item.id, "returned");
                      onClose();
                    }}
                  >
                    ✓ Mark as Returned
                  </button>
                ) : (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      onQuickStatus(item.id, item.type === "lost" ? "missing" : "found");
                      onClose();
                    }}
                  >
                    ↺ Mark Unresolved
                  </button>
                )}

                <button
                  className="btn-primary"
                  onClick={() => {
                    onClose();
                    onEdit(item);
                  }}
                >
                  ✏️ Edit Report
                </button>

                <button
                  className="btn-danger"
                  onClick={() => {
                    onClose();
                    onDelete(item.id, item.title);
                  }}
                >
                  🗑️ Delete
                </button>
              </>
            ) : (
              <a
                href={`mailto:${item.contact_email}?subject=UniFind:%20Regarding%20${encodeURIComponent(item.title)}`}
                className="btn-primary"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                ✉️ Email Reporter
              </a>
            )}
          </div>

          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
