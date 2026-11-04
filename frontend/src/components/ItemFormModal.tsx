import React, { useState, useEffect } from "react";
import { Item, ItemInput, ItemType, ItemStatus } from "../types";

const CATEGORIES = [
  "Personal Belongings",
  "Cards & IDs",
  "Electronics",
  "Books & Study Materials",
  "Keys",
  "Clothing",
  "Accessories",
  "Other",
];

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ItemInput) => Promise<void>;
  editItem?: Item | null;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editItem,
}) => {
  const isEditing = Boolean(editItem);

  const [type, setType] = useState<ItemType>("lost");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Personal Belongings");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [contactEmail, setContactEmail] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<ItemStatus>("missing");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editItem) {
      setType(editItem.type);
      setTitle(editItem.title);
      setCategory(editItem.category);
      setLocation(editItem.location);
      setDate(editItem.date);
      setContactEmail(editItem.contact_email);
      setImageUrl(editItem.image_url || "");
      setStatus(editItem.status);
      setDescription(editItem.description);
    } else {
      setType("lost");
      setTitle("");
      setCategory("Personal Belongings");
      setLocation("");
      setDate(new Date().toISOString().split("T")[0]);
      setContactEmail("");
      setImageUrl("");
      setStatus("missing");
      setDescription("");
    }
    setError("");
  }, [editItem, isOpen]);

  // Adjust default status if type changes while creating
  const handleTypeChange = (newType: ItemType) => {
    setType(newType);
    if (!isEditing) {
      setStatus(newType === "lost" ? "missing" : "found");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Item title is required.");
      return;
    }
    if (!location.trim()) {
      setError("Campus location is required.");
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      setError("Please provide a valid contact email.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        category,
        location: location.trim(),
        date,
        contact_email: contactEmail.trim(),
        image_url: imageUrl.trim() || undefined,
        status,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item report.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {isEditing ? "Edit Item Report" : "Report Lost or Found Item"}
            </h2>
            <p className="modal-subtitle">
              {isEditing
                ? "Update details or status of this report"
                : "Submit information to help reunite items with students"}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="item-form">
          {error && <div className="form-error-banner">{error}</div>}

          {/* Type Selector (Lost vs Found) */}
          <div className="form-group">
            <label className="form-label">Report Type</label>
            <div className="segmented-type-toggle">
              <button
                type="button"
                className={`toggle-option ${type === "lost" ? "active-lost" : ""}`}
                onClick={() => handleTypeChange("lost")}
              >
                🔴 I Lost an Item
              </button>
              <button
                type="button"
                className={`toggle-option ${type === "found" ? "active-found" : ""}`}
                onClick={() => handleTypeChange("found")}
              >
                🟢 I Found an Item
              </button>
            </div>
          </div>

          {/* Title & Category */}
          <div className="form-row">
            <div className="form-group flex-2">
              <label className="form-label">Item Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Navy Blue Hydro Flask, Student ID Card"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Date */}
          <div className="form-row">
            <div className="form-group flex-2">
              <label className="form-label">Campus Location *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Central Library 3rd Floor, Cafeteria Table 4"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contact Email & Status */}
          <div className="form-row">
            <div className="form-group flex-2">
              <label className="form-label">Contact Email *</label>
              <input
                type="email"
                className="form-input"
                placeholder="student@univ.edu"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
              >
                <option value="missing">Missing</option>
                <option value="found">Found / Unclaimed</option>
                <option value="returned">Returned / Resolved</option>
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div className="form-group">
            <label className="form-label">
              Image URL <span className="optional-tag">(Optional)</span>
            </label>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Detailed Description *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe distinguishing marks, colors, brand, serial number or contents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Report" : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
