import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  UserRole,
  AdminStats,
  Item,
  ItemStatus,
} from "../types";
import {
  fetchAdminStats,
  fetchAdminUsers,
  banUserApi,
  changeUserRoleApi,
  fetchItems,
  updateItemStatus,
  deleteItem,
} from "../api";
import { useAuth } from "../AuthContext";

interface AdminDashboardProps {
  onBackToFeed: () => void;
  onShowToast: (message: string, type: "success" | "error") => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToFeed,
  onShowToast,
}) => {
  const { user: currentAdmin } = useAuth();

  // Active Tab: 'users' or 'items'
  const [activeTab, setActiveTab] = useState<"users" | "items">("users");

  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Users state & filters
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Items state & filters
  const [items, setItems] = useState<Item[]>([]);
  const [itemSearch, setItemSearch] = useState<string>("");
  const [itemStatusFilter, setItemStatusFilter] = useState<string>("all");

  // Ban Modal state
  const [banModalUser, setBanModalUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState<string>("Repeated spam or false reports");
  const [customBanReason, setCustomBanReason] = useState<string>("");
  const [isSubmittingBan, setIsSubmittingBan] = useState<boolean>(false);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, itemsData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchItems(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setItems(itemsData);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to load admin data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !u.is_banned) ||
        (statusFilter === "banned" && u.is_banned);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearch, roleFilter, statusFilter]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.location.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.contact_email.toLowerCase().includes(itemSearch.toLowerCase());
      const matchesStatus =
        itemStatusFilter === "all" || item.status === itemStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, itemSearch, itemStatusFilter]);

  // Handle Ban / Unban
  const isCurrentMainAdmin = currentAdmin?.email.toLowerCase() === "admin@univ.edu";

  const handleOpenBanModal = (u: User) => {
    if (u.id === currentAdmin?.id) {
      onShowToast("Safety Guard: You cannot ban your own administrator account.", "error");
      return;
    }
    if (u.email.toLowerCase() === "admin@univ.edu") {
      onShowToast("Safety Guard: University Proctor is the Main Administrator and cannot be banned.", "error");
      return;
    }
    if (u.role === "admin" && !isCurrentMainAdmin) {
      onShowToast("Safety Guard: Second administrators cannot ban other administrators.", "error");
      return;
    }
    setBanModalUser(u);
    setBanReason("Repeated spam or false reports");
    setCustomBanReason("");
  };

  const handleConfirmBan = async () => {
    if (!banModalUser) return;
    const finalReason = banReason === "Custom" ? customBanReason.trim() : banReason;
    if (!finalReason) {
      onShowToast("Please specify a reason for suspending this user.", "error");
      return;
    }

    setIsSubmittingBan(true);
    try {
      const updated = await banUserApi(banModalUser.id, true, finalReason);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      onShowToast(`User ${updated.full_name} suspended. Sessions revoked immediately.`, "success");
      setBanModalUser(null);
      // Refresh stats
      const newStats = await fetchAdminStats();
      setStats(newStats);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to suspend user", "error");
    } finally {
      setIsSubmittingBan(false);
    }
  };

  const handleUnban = async (u: User) => {
    try {
      const updated = await banUserApi(u.id, false);
      setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)));
      onShowToast(`Account for ${updated.full_name} has been restored.`, "success");
      const newStats = await fetchAdminStats();
      setStats(newStats);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to unban user", "error");
    }
  };

  // Handle Role Change
  const handleChangeRole = async (targetUser: User, newRole: UserRole) => {
    if (targetUser.id === currentAdmin?.id && newRole !== "admin") {
      onShowToast("Safety Guard 2: You cannot demote your own administrator privileges.", "error");
      return;
    }
    if (targetUser.email.toLowerCase() === "admin@univ.edu" && newRole !== "admin") {
      onShowToast("Safety Guard: University Proctor is the permanent Main Administrator and cannot be demoted.", "error");
      return;
    }
    if (targetUser.role === "admin" && !isCurrentMainAdmin) {
      onShowToast("Safety Guard: Only the Main Administrator (University Proctor) can demote administrators.", "error");
      return;
    }

    const confirmMsg =
      newRole === "admin"
        ? `Promote "${targetUser.full_name}" to Administrator? They will have full moderation access.`
        : `Demote "${targetUser.full_name}" to regular Student account?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const updated = await changeUserRoleApi(targetUser.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      onShowToast(`Role updated for ${updated.full_name} (${updated.role.toUpperCase()}).`, "success");
      const newStats = await fetchAdminStats();
      setStats(newStats);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to change role", "error");
    }
  };

  // Handle Item Status Change by Admin
  const handleItemStatus = async (item: Item, newStatus: ItemStatus) => {
    try {
      const updated = await updateItemStatus(item.id, newStatus);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      onShowToast(`Item "${updated.title}" marked as ${newStatus}.`, "success");
      const newStats = await fetchAdminStats();
      setStats(newStats);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to update item status", "error");
    }
  };

  // Handle Item Delete by Admin
  const handleItemDelete = async (item: Item) => {
    if (!window.confirm(`Admin Action: Permanently delete report "${item.title}"?`)) return;
    try {
      await deleteItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onShowToast(`Report "${item.title}" deleted by administrator.`, "success");
      const newStats = await fetchAdminStats();
      setStats(newStats);
    } catch (err: any) {
      onShowToast(err?.message || "Failed to delete item", "error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Top Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ fontSize: "1.65rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                UniFind Admin Portal
              </h1>
              <span style={{ backgroundColor: "#4338ca", color: "#e0e7ff", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "9999px", letterSpacing: "0.05em" }}>
                MODERATION HUB
              </span>
            </div>
            <p style={{ margin: "0.35rem 0 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
              Administrator: <strong style={{ color: "#e2e8f0" }}>{currentAdmin?.full_name}</strong> ({currentAdmin?.email})
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #334155",
                backgroundColor: "#1e293b",
                color: "#e2e8f0",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🔄 Refresh
            </button>
            <button
              onClick={onBackToFeed}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ← Back to Campus Feed
            </button>
          </div>
        </div>

        {/* Real-time Summary Cards */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "0.75rem", padding: "1.2rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Total Campus Items</div>
              <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "#ffffff", marginTop: "0.3rem" }}>{stats.total_items}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Lost: {stats.lost_items} | Found: {stats.found_items}</div>
            </div>

            <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "0.75rem", padding: "1.2rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Resolved / Returned</div>
              <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "#10b981", marginTop: "0.3rem" }}>{stats.returned_items}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Reunited with owners</div>
            </div>

            <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "0.75rem", padding: "1.2rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Registered Users</div>
              <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "#38bdf8", marginTop: "0.3rem" }}>{stats.total_users}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Students: {stats.student_users} | Admins: {stats.admin_users}</div>
            </div>

            <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "0.75rem", padding: "1.2rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Suspended Accounts</div>
              <div style={{ fontSize: "1.85rem", fontWeight: 700, color: stats.banned_users > 0 ? "#ef4444" : "#94a3b8", marginTop: "0.3rem" }}>
                {stats.banned_users}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Revoked sessions</div>
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div style={{ display: "flex", borderBottom: "1px solid #334155", marginBottom: "1.5rem" }}>
          <button
            onClick={() => setActiveTab("users")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "users" ? "3px solid #38bdf8" : "3px solid transparent",
              color: activeTab === "users" ? "#38bdf8" : "#94a3b8",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            👥 Campus User Governance ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("items")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "items" ? "3px solid #38bdf8" : "3px solid transparent",
              color: activeTab === "items" ? "#38bdf8" : "#94a3b8",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            📦 Campus Item Oversight ({items.length})
          </button>
        </div>

        {/* TAB 1: USER GOVERNANCE */}
        {activeTab === "users" && (
          <div>
            {/* Filter Controls */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="🔍 Search user by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  flex: "1 1 250px",
                  padding: "0.6rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #334155",
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                }}
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #334155",
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                }}
              >
                <option value="all">All Roles</option>
                <option value="user">Students Only</option>
                <option value="admin">Administrators Only</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #334155",
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="banned">Suspended Only</option>
              </select>
            </div>

            {/* Users Table */}
            <div style={{ backgroundColor: "#1e293b", borderRadius: "0.75rem", border: "1px solid #334155", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                    <th style={{ padding: "0.85rem 1rem" }}>User</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Role</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Account Status</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Joined</th>
                    <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Moderation Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8" }}>
                        No campus users match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.id === currentAdmin?.id;
                      const isTargetMainAdmin = u.email.toLowerCase() === "admin@univ.edu";
                      const isTargetAdmin = u.role === "admin";

                      return (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: "1px solid #334155",
                            backgroundColor: isSelf ? "rgba(56, 189, 248, 0.05)" : isTargetMainAdmin ? "rgba(245, 158, 11, 0.05)" : "transparent",
                          }}
                        >
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <div style={{ fontWeight: 600, color: "#ffffff" }}>
                              {u.full_name} {isSelf && <span style={{ color: "#38bdf8", fontSize: "0.75rem" }}>(You)</span>}
                            </div>
                            <div style={{ color: "#94a3b8", fontSize: "0.775rem" }}>{u.email}</div>
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            {isTargetMainAdmin ? (
                              <span style={{ backgroundColor: "#78350f", color: "#fef3c7", border: "1px solid #f59e0b", padding: "0.2rem 0.55rem", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 700 }}>
                                MAIN ADMIN
                              </span>
                            ) : isTargetAdmin ? (
                              <span style={{ backgroundColor: "#4338ca", color: "#e0e7ff", padding: "0.2rem 0.55rem", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 700 }}>
                                SUB-ADMIN
                              </span>
                            ) : (
                              <span style={{ backgroundColor: "#334155", color: "#cbd5e1", padding: "0.2rem 0.55rem", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 600 }}>
                                STUDENT
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "0.85rem 1rem" }}>
                            {u.is_banned ? (
                              <div>
                                <span style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid #ef4444", padding: "0.2rem 0.55rem", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 700 }}>
                                  SUSPENDED
                                </span>
                                {u.ban_reason && (
                                  <div style={{ color: "#fca5a5", fontSize: "0.75rem", marginTop: "0.25rem", fontStyle: "italic" }}>
                                    "{u.ban_reason}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid #10b981", padding: "0.2rem 0.55rem", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 600 }}>
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontSize: "0.8rem" }}>
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                              {isSelf ? (
                                <span style={{ color: "#64748b", fontSize: "0.75rem", fontStyle: "italic" }}>
                                  {isCurrentMainAdmin ? "Main Admin (You)" : "(You) Protected Account"}
                                </span>
                              ) : isTargetMainAdmin ? (
                                <span style={{ color: "#f59e0b", fontSize: "0.75rem", fontWeight: 700 }}>
                                  Main Admin (Untouchable)
                                </span>
                              ) : (
                                <>
                                  {/* Ban / Unban Button */}
                                  {u.is_banned ? (
                                    <button
                                      onClick={() => handleUnban(u)}
                                      style={{
                                        backgroundColor: "#059669",
                                        color: "#ffffff",
                                        border: "none",
                                        padding: "0.35rem 0.75rem",
                                        borderRadius: "0.375rem",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                      }}
                                    >
                                      ♻️ Unban
                                    </button>
                                  ) : isTargetAdmin && !isCurrentMainAdmin ? (
                                    <button
                                      disabled
                                      title="Safety Guard: Second administrators cannot ban other administrators."
                                      style={{
                                        backgroundColor: "#334155",
                                        color: "#64748b",
                                        border: "none",
                                        padding: "0.35rem 0.75rem",
                                        borderRadius: "0.375rem",
                                        fontSize: "0.75rem",
                                        cursor: "not-allowed",
                                      }}
                                    >
                                      🔒 Ban Protected
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenBanModal(u)}
                                      style={{
                                        backgroundColor: "#dc2626",
                                        color: "#ffffff",
                                        border: "none",
                                        padding: "0.35rem 0.75rem",
                                        borderRadius: "0.375rem",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                      }}
                                    >
                                      🚫 Suspend
                                    </button>
                                  )}

                                  {/* Role Promotion / Demotion */}
                                  {u.role === "user" ? (
                                    <button
                                      onClick={() => handleChangeRole(u, "admin")}
                                      style={{
                                        backgroundColor: "#4f46e5",
                                        color: "#ffffff",
                                        border: "none",
                                        padding: "0.35rem 0.75rem",
                                        borderRadius: "0.375rem",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                      }}
                                    >
                                      ⬆️ Make Admin
                                    </button>
                                  ) : isCurrentMainAdmin ? (
                                    <button
                                      onClick={() => handleChangeRole(u, "user")}
                                      style={{
                                        backgroundColor: "#b91c1c",
                                        color: "#fee2e2",
                                        border: "1px solid #ef4444",
                                        padding: "0.35rem 0.75rem",
                                        borderRadius: "0.375rem",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                      }}
                                    >
                                      ⬇️ Demote
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      title="Safety Guard: Second administrators cannot demote other administrators."
                                      style={{
                                        backgroundColor: "#334155",
                                        color: "#64748b",
                                        border: "none",
                                        padding: "0.35rem 0.75rem",
                                        borderRadius: "0.375rem",
                                        fontSize: "0.75rem",
                                        cursor: "not-allowed",
                                      }}
                                    >
                                      🔒 Demote Locked
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ITEM OVERSIGHT */}
        {activeTab === "items" && (
          <div>
            {/* Filter Controls */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="🔍 Search items by title, location, or reporter..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                style={{
                  flex: "1 1 250px",
                  padding: "0.6rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #334155",
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                }}
              />
              <select
                value={itemStatusFilter}
                onChange={(e) => setItemStatusFilter(e.target.value)}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #334155",
                  backgroundColor: "#1e293b",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                }}
              >
                <option value="all">All Item Statuses</option>
                <option value="missing">Missing</option>
                <option value="found">Found</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            {/* Items Oversight Table */}
            <div style={{ backgroundColor: "#1e293b", borderRadius: "0.75rem", border: "1px solid #334155", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                    <th style={{ padding: "0.85rem 1rem" }}>Item Report</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Type / Category</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                    <th style={{ padding: "0.85rem 1rem" }}>Contact / Reporter</th>
                    <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Moderation Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "2.5rem", textAlign: "center", color: "#94a3b8" }}>
                        No campus item reports found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ fontWeight: 600, color: "#ffffff" }}>{item.title}</div>
                          <div style={{ color: "#94a3b8", fontSize: "0.775rem" }}>📍 {item.location} • {item.date}</div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                            <span style={{
                              backgroundColor: item.type === "lost" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                              color: item.type === "lost" ? "#f87171" : "#34d399",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "0.25rem",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}>
                              {item.type}
                            </span>
                            <span style={{ color: "#cbd5e1", fontSize: "0.8rem" }}>{item.category}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <select
                            value={item.status}
                            onChange={(e) => handleItemStatus(item, e.target.value as ItemStatus)}
                            style={{
                              backgroundColor: "#0f172a",
                              color: item.status === "returned" ? "#34d399" : "#e2e8f0",
                              border: "1px solid #475569",
                              padding: "0.3rem 0.6rem",
                              borderRadius: "0.375rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            <option value="missing">Missing</option>
                            <option value="found">Found</option>
                            <option value="returned">Returned</option>
                          </select>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#94a3b8", fontSize: "0.8rem" }}>
                          {item.contact_email}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                          <button
                            onClick={() => handleItemDelete(item)}
                            style={{
                              backgroundColor: "rgba(239, 68, 68, 0.15)",
                              color: "#f87171",
                              border: "1px solid #ef4444",
                              padding: "0.35rem 0.75rem",
                              borderRadius: "0.375rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            🗑️ Delete Report
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* SUSPENSION / BAN MODAL */}
      {banModalUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#1e293b",
              borderRadius: "0.75rem",
              border: "1px solid #475569",
              width: "100%",
              maxWidth: "480px",
              padding: "1.75rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🚫</span>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                Suspend Campus Student Account
              </h2>
            </div>

            <p style={{ color: "#cbd5e1", fontSize: "0.875rem", marginBottom: "1.25rem", lineHeight: 1.5 }}>
              You are suspending <strong style={{ color: "#ffffff" }}>{banModalUser.full_name}</strong> ({banModalUser.email}).
            </p>

            <div style={{ backgroundColor: "#0f172a", border: "1px solid #ef4444", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ color: "#f87171", fontSize: "0.8rem", fontWeight: 700 }}>
                ⚠️ Safety Guard 3 — Instant Session Revocation
              </div>
              <div style={{ color: "#cbd5e1", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                All active JWT tokens and sessions for this student will be revoked immediately in the database.
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                Suspension Reason
              </label>
              <select
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #475569",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                <option value="Repeated spam or false reports">Repeated spam or false reports</option>
                <option value="Inappropriate or abusive language in descriptions">Inappropriate or abusive language in descriptions</option>
                <option value="University policy violation">University policy violation</option>
                <option value="Suspicious claiming of high-value items">Suspicious claiming of high-value items</option>
                <option value="Custom">Other (Custom Reason)</option>
              </select>

              {banReason === "Custom" && (
                <textarea
                  placeholder="Explain why this student account is being suspended..."
                  rows={3}
                  value={customBanReason}
                  onChange={(e) => setCustomBanReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #475569",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    resize: "vertical",
                  }}
                />
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={() => setBanModalUser(null)}
                disabled={isSubmittingBan}
                style={{
                  padding: "0.55rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #475569",
                  backgroundColor: "#334155",
                  color: "#e2e8f0",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                disabled={isSubmittingBan}
                style={{
                  padding: "0.55rem 1.25rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {isSubmittingBan ? "Suspending..." : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
