import { useState, useEffect, useCallback } from "react";
import { Item, ItemInput, ItemStatus, Stats, FilterState } from "./types";
import {
  fetchStats,
  fetchItems,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem,
} from "./api";
import { Navbar } from "./components/Navbar";
import { StatsCards } from "./components/StatsCards";
import { FiltersBar } from "./components/FiltersBar";
import { ItemCard } from "./components/ItemCard";
import { ItemDetailModal } from "./components/ItemDetailModal";
import { ItemFormModal } from "./components/ItemFormModal";
import { Toast, ToastMessage } from "./components/Toast";

export default function App() {
  // Navigation tab: 'dashboard' | 'all' | 'my-reports'
  const [activeTab, setActiveTab] = useState<"dashboard" | "all" | "my-reports">("dashboard");

  // Items and Statistics state
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, lost: 0, found: 0, returned: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "all",
    category: "all",
    status: "all",
  });

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load items and statistics from FastAPI backend
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [itemsData, statsData] = await Promise.all([
        fetchItems(filters),
        fetchStats(),
      ]);

      setItems(itemsData);
      setStats(statsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to connect to backend.";
      setError(msg);
      addToast("error", `Backend error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // 1. Create or Update handler
  const handleFormSubmit = async (formData: ItemInput) => {
    if (editingItem) {
      // UPDATE: PUT /api/items/{id}
      await updateItem(editingItem.id, formData);
      addToast("success", `Updated report: "${formData.title}"`);
      setEditingItem(null);
    } else {
      // CREATE: POST /api/items
      const created = await createItem(formData);
      addToast("success", `Created new report: "${created.title}"`);
    }
    loadData();
  };

  // 2. Quick Status Update handler (PATCH /api/items/{id}/status)
  const handleQuickStatus = async (id: string, newStatus: ItemStatus) => {
    try {
      await updateItemStatus(id, newStatus);
      addToast("success", `Item status changed to ${newStatus.toUpperCase()}`);
      loadData();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to update status");
    }
  };

  // 3. Delete handler (DELETE /api/items/{id})
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteItem(deleteConfirm.id);
      addToast("success", `Deleted report: "${deleteConfirm.title}"`);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Failed to delete item");
    }
  };

  // Filter items for "My Reports" tab (simulated user management view)
  const displayedItems =
    activeTab === "my-reports"
      ? items.filter((item) => item.contact_email.includes("bashar") || item.contact_email.includes("student"))
      : items;

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReportModal={() => {
          setEditingItem(null);
          setFormModalOpen(true);
        }}
      />

      <main className="main-content">
        {/* Hero Section */}
        {activeTab === "dashboard" && (
          <section className="hero-banner">
            <div className="hero-content">
              <h1 className="hero-heading">Reuniting Lost Belongings Across Campus</h1>
              <p className="hero-lead">
                UniFind helps university students report lost property, catalog found belongings,
                and connect quickly with rightful owners.
              </p>
              <div className="hero-cta-group">
                <button
                  className="btn-secondary-light"
                  onClick={() => setActiveTab("all")}
                >
                  Browse Campus Catalog ({stats.total} Items)
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Tab Header for 'all' and 'my-reports' */}
        {activeTab === "all" && (
          <div className="page-header">
            <div>
              <h1 className="page-title">Campus Lost &amp; Found Directory</h1>
              <p className="page-subtitle">
                Explore all active lost and found reports submitted by university students and faculty.
              </p>
            </div>
          </div>
        )}

        {activeTab === "my-reports" && (
          <div className="page-header">
            <div>
              <h1 className="page-title">Manage Item Reports</h1>
              <p className="page-subtitle">
                Update status, edit details, or remove reports as items are returned to their owners.
              </p>
            </div>
          </div>
        )}

        {/* Summary Metric Cards */}
        <StatsCards
          stats={stats}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Search & Filter Toolbar */}
        <FiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Backend Error Banner */}
        {error && (
          <div className="error-alert">
            <div className="error-alert-content">
              <strong>⚠️ Backend Communication Error:</strong> {error}
              <p className="error-hint">
                Ensure the FastAPI backend server is running with: <code>uvicorn main:app --reload</code> in the <code>backend/</code> folder.
              </p>
            </div>
            <button className="btn-secondary" onClick={loadData}>
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching records from FastAPI backend...</p>
          </div>
        )}

        {/* Items Grid */}
        {!loading && (
          <section className="catalog-section">
            <div className="section-header">
              <h2 className="section-title">
                {activeTab === "my-reports" ? "My Submissions" : "Reported Items"} ({displayedItems.length})
              </h2>
              {filters.search && (
                <span className="search-query-tag">
                  Matching: &ldquo;{filters.search}&rdquo;
                </span>
              )}
            </div>

            {displayedItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No items found</h3>
                <p>
                  No items match your active filters. Try clearing filters or create a new report.
                </p>
                <div className="empty-actions">
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      setFilters({ search: "", type: "all", category: "all", status: "all" })
                    }
                  >
                    Clear All Filters
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setEditingItem(null);
                      setFormModalOpen(true);
                    }}
                  >
                    Report Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="items-grid">
                {displayedItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onView={(itm) => setDetailItem(itm)}
                    onEdit={(itm) => {
                      setEditingItem(itm);
                      setFormModalOpen(true);
                    }}
                    onDelete={(id, title) => setDeleteConfirm({ id, title })}
                    onQuickStatus={handleQuickStatus}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Create / Edit Form Modal */}
      <ItemFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        editItem={editingItem}
      />

      {/* Read Single Detail Modal */}
      <ItemDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={(itm) => {
          setEditingItem(itm);
          setFormModalOpen(true);
        }}
        onDelete={(id, title) => setDeleteConfirm({ id, title })}
        onQuickStatus={handleQuickStatus}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-container confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3 className="confirm-title">Delete Item Report?</h3>
            <p className="confirm-text">
              Are you sure you want to permanently delete <strong>&ldquo;{deleteConfirm.title}&rdquo;</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteConfirm}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
