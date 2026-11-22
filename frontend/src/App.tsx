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
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthPage } from "./components/AuthPage";
import { Navbar } from "./components/Navbar";
import { StatsCards } from "./components/StatsCards";
import { FiltersBar } from "./components/FiltersBar";
import { ItemCard } from "./components/ItemCard";
import { ItemDetailModal } from "./components/ItemDetailModal";
import { ItemFormModal } from "./components/ItemFormModal";
import { Toast, ToastMessage } from "./components/Toast";

interface UniFindContentProps {
  toasts: ToastMessage[];
  addToast: (type: "success" | "error" | "info", message: string) => void;
  removeToast: (id: string) => void;
}

function UniFindContent({ toasts, addToast, removeToast }: UniFindContentProps) {
  const { user } = useAuth();

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
      addToast("error", `Backend communication: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [filters, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // 1. Create or Update handler
  const handleFormSubmit = async (formData: ItemInput) => {
    try {
      if (editingItem) {
        // UPDATE: PUT /api/items/{id}
        await updateItem(editingItem.id, formData);
        addToast("success", `Updated report: "${formData.title}"`);
        setEditingItem(null);
      } else {
        // CREATE: POST /api/items
        const dataToSubmit = {
          ...formData,
          user_id: user ? user.id : undefined,
          contact_email: formData.contact_email || user?.email || "",
        };
        const created = await createItem(dataToSubmit);
        addToast("success", `Created new report: "${created.title}"`);
      }
      loadData();
    } catch (err: any) {
      addToast("error", err?.message || "Operation failed");
    }
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

  // Filter items for "My Reports" tab
  const displayedItems =
    activeTab === "my-reports"
      ? items.filter(
          (item) =>
            (user && item.user_id && item.user_id === user.id) ||
            (user && item.contact_email.toLowerCase() === user.email.toLowerCase())
        )
      : items;

  return (
    <div className="app-layout">
      {/* Top Navigation Bar with Logged In User & Logout */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReportModal={() => {
          setEditingItem(null);
          setFormModalOpen(true);
        }}
        onOpenLoginModal={() => {}}
        onOpenSignupModal={() => {}}
      />

      <main className="main-content">
        {/* Hero Section */}
        {activeTab === "dashboard" && (
          <section className="hero-banner">
            <div className="hero-content">
              <h1 className="hero-heading">Reuniting Lost Belongings Across Campus</h1>
              <p className="hero-lead">
                Welcome, <strong>{user?.full_name}</strong>! UniFind helps you report lost property,
                catalog found belongings, and connect quickly with rightful owners.
              </p>
              <div className="hero-cta-group">
                <button
                  className="btn-secondary-light"
                  onClick={() => setActiveTab("all")}
                >
                  Browse Campus Catalog ({stats.total} Items)
                </button>
                <button
                  className="btn-secondary-light"
                  style={{ background: "rgba(255, 255, 255, 0.25)" }}
                  onClick={() => setActiveTab("my-reports")}
                >
                  View My Submissions
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
              <h1 className="page-title">My Lost &amp; Found Reports</h1>
              <p className="page-subtitle">
                Manage, update, and resolve the reports you have submitted across campus.
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
                Ensure the FastAPI backend server is running in the <code>backend/</code> folder.
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
                  {activeTab === "my-reports"
                    ? "You haven't submitted any reports yet."
                    : "No items match your active filters. Try clearing filters or create a new report."}
                </p>
                <div className="empty-actions">
                  <button
                    className="btn-secondary"
                    onClick={() =>
                      setFilters({ search: "", type: "all", category: "all", status: "all" })
                    }
                  >
                    Reset Filters
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setEditingItem(null);
                      setFormModalOpen(true);
                    }}
                  >
                    Submit a Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="items-grid">
                {displayedItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onView={(i: Item) => setDetailItem(i)}
                    onEdit={(i: Item) => {
                      setEditingItem(i);
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

      {/* Item Form Modal (Create / Edit) */}
      <ItemFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        editItem={editingItem}
      />

      {/* Item Detail View Modal */}
      <ItemDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={(i) => {
          setDetailItem(null);
          setEditingItem(i);
          setFormModalOpen(true);
        }}
        onDelete={(id, title) => {
          setDetailItem(null);
          setDeleteConfirm({ id, title });
        }}
        onQuickStatus={(id, s) => {
          handleQuickStatus(id, s);
          setDetailItem(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div
            className="modal-container delete-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px" }}
          >
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: "#dc2626" }}>
                Confirm Deletion
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => setDeleteConfirm(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "1.25rem 1.5rem" }}>
              <p style={{ color: "#475569", marginBottom: "1.5rem", lineHeight: "1.5" }}>
                Are you sure you want to permanently delete{" "}
                <strong>&ldquo;{deleteConfirm.title}&rdquo;</strong>? This action cannot be undone.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: "#dc2626", borderColor: "#dc2626" }}
                  onClick={handleDeleteConfirm}
                >
                  Delete Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Stack */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

function UniFindGate() {
  const { user, loading } = useAuth();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Session Loading State
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#94a3b8",
        }}
      >
        <div className="spinner"></div>
        <p style={{ marginTop: "1rem", fontWeight: 500 }}>
          Connecting to UniFind Portal...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated: Show standalone Login / Signup Page
  if (!user) {
    return (
      <>
        <AuthPage onSuccess={(msg) => addToast("success", msg)} />
        <Toast toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  // 3. Authenticated: Show full UniFind Dashboard & Management Portal
  return (
    <UniFindContent
      toasts={toasts}
      addToast={addToast}
      removeToast={removeToast}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UniFindGate />
    </AuthProvider>
  );
}
