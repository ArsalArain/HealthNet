import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import { clearAuthSession, getAuthToken, getAuthUser } from "../utils/authStorage";

const initialHospitalForm = {
  name: "",
  address: "",
  license_number: "",
  email: "",
  phone: "",
};

export default function SystemAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getAuthUser());

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [hospitalForm, setHospitalForm] = useState(initialHospitalForm);
  const [editingHospitalId, setEditingHospitalId] = useState("");
  const [approvalSelections, setApprovalSelections] = useState({});
  const [rejectedAdmins, setRejectedAdmins] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [flaggedEvents, setFlaggedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingHospital, setSubmittingHospital] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [userFilter, setUserFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [flagSeverityFilter, setFlagSeverityFilter] = useState("all");
  const [flagSignalFilter, setFlagSignalFilter] = useState("all");
  const [audit24hOnly, setAudit24hOnly] = useState(false);
  const [selectedFlagIds, setSelectedFlagIds] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const [statsRes, usersRes, hospitalsRes, pendingRes, rejectedRes, logsRes, flaggedRes] = await Promise.allSettled([
      api.get("/admin/stats"),
      api.get("/admin/users"),
      api.get("/admin/hospitals"),
      api.get("/admin/hospital-admins/pending"),
      api.get("/admin/hospital-admins/rejected"),
      api.get("/admin/audit-logs", { params: { limit: 100 } }),
      api.get("/admin/flagged-events", { params: { status: "open", limit: 100 } }),
    ]);

    if (statsRes.status === "fulfilled") setStats(statsRes.value.data?.stats || null);
    if (usersRes.status === "fulfilled") setUsers(usersRes.value.data?.users || []);
    if (hospitalsRes.status === "fulfilled") setHospitals(hospitalsRes.value.data?.hospitals || []);
    if (pendingRes.status === "fulfilled") setPendingAdmins(pendingRes.value.data?.users || []);
    if (rejectedRes.status === "fulfilled") setRejectedAdmins(rejectedRes.value.data?.users || []);
    if (logsRes.status === "fulfilled") setAuditLogs(logsRes.value.data?.logs || []);
    if (flaggedRes.status === "fulfilled") setFlaggedEvents(flaggedRes.value.data?.events || []);

    const failed = [statsRes, usersRes, hospitalsRes, pendingRes, rejectedRes, logsRes, flaggedRes].filter(
      (r) => r.status === "rejected"
    );
    if (failed.length > 0) {
      const msg = failed[0].reason?.response?.data?.message || "Some dashboard data failed to load.";
      toast.error(msg);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // Check if user is admin after user state is populated
    const token = getAuthToken();
    const currentUser = getAuthUser();
    
    if (!token) {
      console.warn("No token found, redirecting to login");
      navigate("/login", { replace: true });
      return;
    }

    if (currentUser?.role !== "system_admin") {
      console.warn("User role is not system_admin:", currentUser?.role);
      toast.error("Admin access denied.");
      navigate("/dashboard", { replace: true });
      return;
    }

    // Update user state and load data
    setUser(currentUser);
    void refreshAll();
  }, [navigate, refreshAll]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/presence/offline");
    } catch {
      // Ignore network errors during logout.
    }
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const handleBlockUser = async (id) => {
    try {
      const { data } = await api.delete(`/admin/user/${id}`, { params: { action: "block" } });
      toast.success(data.message || "User blocked.");
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not block user.");
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const { data } = await api.delete(`/admin/user/${id}`, { params: { action: "delete" } });
      toast.success(data.message || "User deleted.");
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete user.");
    }
  };

  const handleUnblockUser = async (id) => {
    try {
      const { data } = await api.delete(`/admin/user/${id}`, { params: { action: "unblock" } });
      toast.success(data.message || "User unblocked.");
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not unblock user.");
    }
  };

  const toggleHospitalActive = async (id) => {
    try {
      const { data } = await api.patch(`/admin/hospital/${id}/toggle`);
      toast.success(data.message || "Hospital status updated.");
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update hospital status.");
    }
  };

  const handleHospitalInput = (event) => {
    const { name, value } = event.target;
    setHospitalForm((prev) => ({ ...prev, [name]: value }));
  };

  const startHospitalEdit = (hospital) => {
    setEditingHospitalId(hospital._id);
    setHospitalForm({
      name: hospital.name || "",
      address: hospital.address || "",
      license_number: hospital.license_number || "",
      email: hospital.email || "",
      phone: hospital.phone || "",
    });
  };

  const cancelHospitalEdit = () => {
    setEditingHospitalId("");
    setHospitalForm(initialHospitalForm);
  };

  const submitHospital = async (event) => {
    event.preventDefault();
    setSubmittingHospital(true);
    try {
      if (editingHospitalId) {
        const { data } = await api.put(`/admin/hospital/${editingHospitalId}`, hospitalForm);
        toast.success(data.message || "Hospital updated.");
      } else {
        const { data } = await api.post("/admin/hospital", hospitalForm);
        toast.success(data.message || "Hospital added.");
      }
      cancelHospitalEdit();
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save hospital.");
    } finally {
      setSubmittingHospital(false);
    }
  };

  const deleteHospital = async (id) => {
    try {
      const { data } = await api.delete(`/admin/hospital/${id}`);
      toast.success(data.message || "Hospital deleted.");
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete hospital.");
    }
  };

  const approveHospitalAdmin = async (adminId) => {
    const hospitalId = approvalSelections[adminId];

    try {
      const { data } = await api.post(`/admin/hospital-admin/${adminId}/approve`, {
        hospital_id: hospitalId || undefined,
      });
      toast.success(data.message || "Hospital admin approved.");
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not approve hospital admin.");
    }
  };

  const rejectHospitalAdmin = async (adminId) => {
    const reason = window.prompt("Reason for rejection (optional)", "Incomplete hospital details");

    try {
      const { data } = await api.post(`/admin/hospital-admin/${adminId}/reject`, {
        reason: reason || undefined,
      });
      toast.success(data.message || "Hospital admin rejected.");
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not reject hospital admin.");
    }
  };

  const resolveFlaggedEvent = async (eventId, status) => {
    const note = window.prompt(
      status === "resolved"
        ? "Resolution note (optional) — this will clear the user's lockout and reset failed login attempts."
        : "Dismissal note (optional) — no changes will be made to the user account.",
      ""
    );
    if (note === null) return; // cancelled

    try {
      const { data } = await api.patch(`/admin/flagged-events/${eventId}`, { status, note: note || "" });
      if (status === "resolved") {
        toast.success(data.message || "Flag resolved.");
      } else {
        toast.info(data.message || "Flag dismissed — no account changes made.");
      }
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update flagged event.");
    }
  };

  const userPresenceSummary = useMemo(() => {
    const online = users.filter((u) => Boolean(u.is_online)).length;

    return {
      online,
      offline: Math.max(0, users.length - online),
    };
  }, [users]);

  const userRoleCounts = useMemo(() => {
    const counts = {
      all: users.length,
      patient: 0,
      hospital_admin: 0,
      hospital: 0,
      system_admin: 0,
    };

    users.forEach((u) => {
      if (counts[u.role] !== undefined) {
        counts[u.role] += 1;
      }
    });

    return counts;
  }, [users]);

  const visibleUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();

    return users.filter((u) => {
      if (userFilter === "active" && u.is_blocked) return false;
      if (userFilter === "blocked" && !u.is_blocked) return false;
      if (userFilter === "online" && !u.is_online) return false;
      if (userFilter === "offline" && u.is_online) return false;
      if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
      if (search) {
        const hospitalName = String(u.hospital_id?.name || "").toLowerCase();
        const searchTarget = [u.username, u.email, u.role, hospitalName].join(" ").toLowerCase();
        if (!searchTarget.includes(search)) return false;
      }
      return true;
    });
  }, [users, userFilter, userRoleFilter, userSearch]);

  const filteredFlaggedEvents = useMemo(() => {
    return flaggedEvents.filter((event) => {
      const severityOk = flagSeverityFilter === "all" || event.severity === flagSeverityFilter;
      const signalOk = flagSignalFilter === "all" || event.signal_type === flagSignalFilter;
      return severityOk && signalOk;
    });
  }, [flaggedEvents, flagSeverityFilter, flagSignalFilter]);

  const visibleAuditLogs = useMemo(() => {
    if (!audit24hOnly) return auditLogs;
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return auditLogs.filter((log) => {
      const createdAt = new Date(log.created_at).getTime();
      return Number.isFinite(createdAt) && createdAt >= since;
    });
  }, [auditLogs, audit24hOnly]);

  const statCards = [
    { key: "users_total", label: "Total Users", value: stats?.users?.total ?? 0 },
    { key: "users_active", label: "Active Users", value: stats?.users?.active ?? 0 },
    { key: "users_online", label: "Online Users", value: userPresenceSummary.online },
    { key: "users_offline", label: "Offline Users", value: userPresenceSummary.offline },
    { key: "users_blocked", label: "Blocked Users", value: stats?.users?.blocked ?? 0 },
    { key: "hospitals_total", label: "Total Hospitals", value: stats?.hospitals?.total ?? 0 },
    { key: "admins_pending", label: "Pending Hospital Admins", value: stats?.approvals?.pending_hospital_admins ?? 0 },
    { key: "appointments", label: "Appointments", value: stats?.appointments ?? 0 },
    { key: "locked_accounts", label: "Locked Accounts", value: stats?.suspicious?.locked_accounts ?? 0 },
    { key: "failed_logins", label: "Users With Failed Logins", value: stats?.suspicious?.users_with_failed_attempts ?? 0 },
    { key: "rejected_admins", label: "Rejected Hospital Admins", value: stats?.suspicious?.rejected_hospital_admins ?? 0 },
    { key: "audit_24h", label: "Audit Events (24h)", value: stats?.suspicious?.recent_audit_events_24h ?? 0 },
    { key: "open_flags", label: "Open Flags", value: stats?.suspicious?.open_flagged_events ?? 0 },
    { key: "high_flags", label: "High Severity Flags", value: stats?.suspicious?.high_severity_open_flags ?? 0 },
  ];

  const jumpToStatDetails = (key) => {
    if (key === "users_total") {
      setUserFilter("all");
      setActiveSection("users");
      return;
    }
    if (key === "users_active") {
      setUserFilter("active");
      setActiveSection("users");
      return;
    }
    if (key === "users_online") {
      setUserFilter("online");
      setUserRoleFilter("all");
      setActiveSection("users");
      return;
    }
    if (key === "users_offline") {
      setUserFilter("offline");
      setUserRoleFilter("all");
      setActiveSection("users");
      return;
    }
    if (key === "users_blocked") {
      setUserFilter("blocked");
      setActiveSection("users");
      return;
    }
    if (key === "hospitals_total") {
      setActiveSection("hospitals");
      return;
    }
    if (key === "admins_pending") {
      setActiveSection("approvals");
      return;
    }
    if (key === "rejected_admins") {
      setActiveSection("rejected");
      return;
    }
    if (key === "audit_24h") {
      setAudit24hOnly(true);
      setActiveSection("audit");
      return;
    }
    if (key === "high_flags") {
      setFlagSeverityFilter("high");
      setFlagSignalFilter("all");
      setActiveSection("flags");
      return;
    }
    if (key === "locked_accounts") {
      setFlagSignalFilter("account_locked");
      setFlagSeverityFilter("all");
      setActiveSection("flags");
      return;
    }
    if (key === "failed_logins") {
      setFlagSignalFilter("password_failure");
      setFlagSeverityFilter("all");
      setActiveSection("flags");
      return;
    }
    if (key === "open_flags") {
      setFlagSignalFilter("all");
      setFlagSeverityFilter("all");
      setActiveSection("flags");
      return;
    }
    if (key === "appointments") {
      setActiveSection("appointments");
    }
  };

  const toggleFlagSelection = (id) => {
    setSelectedFlagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllVisibleFlags = (checked) => {
    if (!checked) {
      setSelectedFlagIds([]);
      return;
    }
    setSelectedFlagIds(filteredFlaggedEvents.map((event) => event._id));
  };

  const bulkUpdateFlags = async (status) => {
    if (selectedFlagIds.length === 0) {
      toast.info("Select at least one flag first.");
      return;
    }
    const note = window.prompt(
      status === "resolved"
        ? "Bulk resolution note (optional) — this will clear lockout for linked users where applicable."
        : "Bulk dismissal note (optional) — no account changes will be made.",
      ""
    );
    if (note === null) return;

    try {
      const results = await Promise.allSettled(
        selectedFlagIds.map((id) => api.patch(`/admin/flagged-events/${id}`, { status, note: note || "" }))
      );
      const successCount = results.filter((res) => res.status === "fulfilled").length;
      const failCount = results.length - successCount;
      if (successCount > 0) {
        toast.success(`Updated ${successCount} flagged event(s).`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} flagged event(s) failed to update.`);
      }
      setSelectedFlagIds([]);
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Bulk update failed.");
    }
  };

  const toggleUserSelection = (id) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllVisibleUsers = (checked) => {
    if (!checked) {
      setSelectedUserIds([]);
      return;
    }
    const selectableIds = visibleUsers.filter((u) => u.role !== "system_admin").map((u) => u._id);
    setSelectedUserIds(selectableIds);
  };

  const bulkUserAction = async (action) => {
    if (selectedUserIds.length === 0) {
      toast.info("Select at least one user first.");
      return;
    }
    const confirmed = window.confirm(`Apply '${action}' to ${selectedUserIds.length} selected user(s)?`);
    if (!confirmed) return;

    try {
      const results = await Promise.allSettled(
        selectedUserIds.map((id) => api.delete(`/admin/user/${id}`, { params: { action } }))
      );
      const successCount = results.filter((res) => res.status === "fulfilled").length;
      const failCount = results.length - successCount;
      if (successCount > 0) {
        toast.success(`${action} applied to ${successCount} user(s).`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} user action(s) failed.`);
      }
      setSelectedUserIds([]);
      await refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Bulk user action failed.");
    }
  };

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">Loading system admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div>
          <h1>System Admin Control Module</h1>
          <p>{user.email}</p>
        </div>
        <div className="admin-topbar-actions">
          <button className="admin-btn secondary" onClick={refreshAll}>Refresh</button>
          <button className="admin-btn danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="admin-layout">
        <aside className="admin-menu">
          <button className={`admin-menu-btn ${activeSection === "overview" ? "active" : ""}`} onClick={() => setActiveSection("overview")}>Overview</button>
          <button className={`admin-menu-btn ${activeSection === "flags" ? "active" : ""}`} onClick={() => setActiveSection("flags")}>Risk Flags</button>
          <button className={`admin-menu-btn ${activeSection === "users" ? "active" : ""}`} onClick={() => setActiveSection("users")}>Users</button>
          <button className={`admin-menu-btn ${activeSection === "hospitals" ? "active" : ""}`} onClick={() => setActiveSection("hospitals")}>Hospitals</button>
          <button className={`admin-menu-btn ${activeSection === "approvals" ? "active" : ""}`} onClick={() => setActiveSection("approvals")}>Admin Approvals</button>
          <button className={`admin-menu-btn ${activeSection === "rejected" ? "active" : ""}`} onClick={() => setActiveSection("rejected")}>Rejected Admins</button>
          <button className={`admin-menu-btn ${activeSection === "audit" ? "active" : ""}`} onClick={() => setActiveSection("audit")}>Audit Trail</button>
          <button className={`admin-menu-btn ${activeSection === "appointments" ? "active" : ""}`} onClick={() => setActiveSection("appointments")}>Appointments</button>
        </aside>

        <main className="admin-content">
          {(activeSection === "overview" || activeSection === "flags" || activeSection === "users" || activeSection === "hospitals" || activeSection === "approvals" || activeSection === "rejected" || activeSection === "audit" || activeSection === "appointments") && (
            <section className="admin-section">
              <h2>System Monitoring</h2>
              <div className="admin-stat-grid">
                {statCards.map((card) => (
                  <button key={card.key} className="admin-stat-card clickable" onClick={() => jumpToStatDetails(card.key)}>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <small>View details</small>
                  </button>
                ))}
              </div>
            </section>
          )}

          {activeSection === "flags" && (
            <section className="admin-section">
              <h2>Automated Risk Flags</h2>
              <div className="admin-toolbar">
                <select value={flagSeverityFilter} onChange={(e) => setFlagSeverityFilter(e.target.value)}>
                  <option value="all">All severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <select value={flagSignalFilter} onChange={(e) => setFlagSignalFilter(e.target.value)}>
                  <option value="all">All signals</option>
                  <option value="account_locked">Account locked</option>
                  <option value="password_failure">Password failure</option>
                  <option value="unknown_email_login_attempt">Unknown email login</option>
                  <option value="blocked_user_login_attempt">Blocked user login</option>
                  <option value="suspicious_registration">Suspicious registration</option>
                </select>
                <button className="admin-btn" onClick={() => bulkUpdateFlags("resolved")}>Resolve Selected</button>
                <button className="admin-btn secondary" onClick={() => bulkUpdateFlags("dismissed")}>Dismiss Selected</button>
              </div>

              {filteredFlaggedEvents.length === 0 ? (
                <p className="admin-empty">No open flagged events for this filter.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectedFlagIds.length > 0 && selectedFlagIds.length === filteredFlaggedEvents.length}
                            onChange={(e) => selectAllVisibleFlags(e.target.checked)}
                          />
                        </th>
                        <th>Time</th>
                        <th>Signal</th>
                        <th>Severity</th>
                        <th>Email</th>
                        <th>Reasons</th>
                        <th>IP</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFlaggedEvents.map((event) => (
                        <tr key={event._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedFlagIds.includes(event._id)}
                              onChange={() => toggleFlagSelection(event._id)}
                            />
                          </td>
                          <td>{new Date(event.created_at).toLocaleString()}</td>
                          <td>{String(event.signal_type || "").replace(/_/g, " ")}</td>
                          <td>{event.severity}</td>
                          <td>{event.user_id?.email || event.email || "-"}</td>
                          <td>{(event.reasons || []).join(" ") || "-"}</td>
                          <td>{event.ip || "-"}</td>
                          <td className="admin-row-actions">
                            <button className="admin-btn" onClick={() => resolveFlaggedEvent(event._id, "resolved")}>Resolve</button>
                            <button className="admin-btn secondary" onClick={() => resolveFlaggedEvent(event._id, "dismissed")}>Dismiss</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeSection === "users" && (
            <section className="admin-section">
              <h2>User Management</h2>
              <div className="admin-toolbar">
                <input
                  className="admin-search"
                  type="search"
                  placeholder="Search name, email, role, or hospital"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
                  <option value="all">All users</option>
                  <option value="active">Active users</option>
                  <option value="blocked">Blocked users</option>
                  <option value="online">Online users</option>
                  <option value="offline">Offline users</option>
                </select>
                <button className="admin-btn secondary" onClick={() => bulkUserAction("block")}>Block Selected</button>
                <button className="admin-btn" onClick={() => bulkUserAction("unblock")}>Unblock Selected</button>
                <button className="admin-btn danger" onClick={() => bulkUserAction("delete")}>Delete Selected</button>
              </div>

              <div className="admin-subsection-row">
                <button className={`admin-subsection-chip ${userRoleFilter === "all" ? "active" : ""}`} onClick={() => setUserRoleFilter("all")}>All ({userRoleCounts.all})</button>
                <button className={`admin-subsection-chip ${userRoleFilter === "patient" ? "active" : ""}`} onClick={() => setUserRoleFilter("patient")}>Patients ({userRoleCounts.patient})</button>
                <button className={`admin-subsection-chip ${userRoleFilter === "hospital" ? "active" : ""}`} onClick={() => setUserRoleFilter("hospital")}>Hospitals ({userRoleCounts.hospital})</button>
                <button className={`admin-subsection-chip ${userRoleFilter === "hospital_admin" ? "active" : ""}`} onClick={() => setUserRoleFilter("hospital_admin")}>Hospital Admins ({userRoleCounts.hospital_admin})</button>
                <button className={`admin-subsection-chip ${userRoleFilter === "system_admin" ? "active" : ""}`} onClick={() => setUserRoleFilter("system_admin")}>System Admins ({userRoleCounts.system_admin})</button>
              </div>

              <p className="admin-empty">Online users are actively logged in (heartbeat-based) and become Offline on logout.</p>

              {visibleUsers.length === 0 ? (
                <p className="admin-empty">No users match the current filters.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={selectedUserIds.length > 0 && selectedUserIds.length === visibleUsers.filter((u) => u.role !== "system_admin").length}
                            onChange={(e) => selectAllVisibleUsers(e.target.checked)}
                          />
                        </th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Presence</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleUsers.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(u._id)}
                              onChange={() => toggleUserSelection(u._id)}
                              disabled={u.role === "system_admin"}
                            />
                          </td>
                          <td>{u.username}</td>
                          <td>{u.email || "-"}</td>
                          <td>{u.role}</td>
                          <td>{u.is_blocked ? "Blocked" : "Active"}</td>
                          <td>
                            <span className={`admin-presence ${u.is_online ? "online" : "offline"}`}>
                              {u.is_online ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td className="admin-row-actions">
                            {u.is_blocked ? (
                              <button className="admin-btn secondary" onClick={() => handleUnblockUser(u._id)} disabled={u.role === "system_admin"}>Unblock</button>
                            ) : (
                              <button className="admin-btn secondary" onClick={() => handleBlockUser(u._id)} disabled={u.role === "system_admin"}>Block</button>
                            )}
                            <button className="admin-btn danger" onClick={() => handleDeleteUser(u._id)} disabled={u.role === "system_admin"}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeSection === "hospitals" && (
            <section className="admin-section">
              <h2>Hospital Management</h2>
              <form className="admin-form-grid" onSubmit={submitHospital}>
                <input name="name" placeholder="Hospital name" value={hospitalForm.name} onChange={handleHospitalInput} required />
                <input name="address" placeholder="Address" value={hospitalForm.address} onChange={handleHospitalInput} required />
                <input name="license_number" placeholder="License number" value={hospitalForm.license_number} onChange={handleHospitalInput} required />
                <input type="email" name="email" placeholder="Hospital email" value={hospitalForm.email} onChange={handleHospitalInput} required />
                <input name="phone" placeholder="Phone (optional)" value={hospitalForm.phone} onChange={handleHospitalInput} />
                <div className="admin-row-actions">
                  <button className="admin-btn" type="submit" disabled={submittingHospital}>{editingHospitalId ? "Update Hospital" : "Add Hospital"}</button>
                  {editingHospitalId && (
                    <button className="admin-btn secondary" type="button" onClick={cancelHospitalEdit}>Cancel</button>
                  )}
                </div>
              </form>

              <div className="admin-table-wrap" style={{ marginTop: 16 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>City</th>
                      <th>Email</th>
                      <th>License</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitals.map((h) => (
                      <tr key={h._id}>
                        <td>{h.name}</td>
                        <td>{h.city || "-"}</td>
                        <td>{h.email}</td>
                        <td>{h.license_number}</td>
                        <td>{h.is_active ? "Yes" : "No"}</td>
                        <td className="admin-row-actions">
                          <button className="admin-btn secondary" onClick={() => startHospitalEdit(h)}>Edit</button>
                          <button className="admin-btn secondary" onClick={() => toggleHospitalActive(h._id)}>{h.is_active ? "Deactivate" : "Activate"}</button>
                          <button className="admin-btn danger" onClick={() => deleteHospital(h._id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSection === "approvals" && (
            <section className="admin-section">
              <h2>Hospital Admin Approval</h2>
              {pendingAdmins.length === 0 ? (
                <p className="admin-empty">No pending hospital admin accounts.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Submitted Hospital Form</th>
                        <th>Assign Existing Hospital</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAdmins.map((admin) => (
                        <tr key={admin._id}>
                          <td>{admin.username}</td>
                          <td>{admin.email}</td>
                          <td>{admin.approval_status}</td>
                          <td>
                            <div className="admin-request-box">
                              <div><strong>Name:</strong> {admin.hospital_info?.name || "-"}</div>
                              <div><strong>City:</strong> {admin.hospital_info?.city || "-"}</div>
                              <div><strong>Address:</strong> {admin.hospital_info?.address || "-"}</div>
                              <div><strong>License:</strong> {admin.hospital_info?.license_number || "-"}</div>
                            </div>
                          </td>
                          <td>
                            <select
                              value={approvalSelections[admin._id] || ""}
                              onChange={(e) => setApprovalSelections((prev) => ({ ...prev, [admin._id]: e.target.value }))}
                            >
                              <option value="">Auto-create from request</option>
                              {hospitals.map((hospital) => (
                                <option key={hospital._id} value={hospital._id}>{hospital.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="admin-row-actions">
                            <button className="admin-btn" onClick={() => approveHospitalAdmin(admin._id)}>Approve</button>
                            <button className="admin-btn danger" onClick={() => rejectHospitalAdmin(admin._id)}>Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeSection === "rejected" && (
            <section className="admin-section">
              <h2>Rejected Hospital Admins</h2>
              {rejectedAdmins.length === 0 ? (
                <p className="admin-empty">No rejected hospital admin accounts.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Rejection Reason</th>
                        <th>Submitted Hospital</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rejectedAdmins.map((admin) => (
                        <tr key={admin._id}>
                          <td>{admin.username}</td>
                          <td>{admin.email}</td>
                          <td>{admin.rejection_reason || "-"}</td>
                          <td>
                            <div className="admin-request-box">
                              <div><strong>Name:</strong> {admin.hospital_info?.name || "-"}</div>
                              <div><strong>City:</strong> {admin.hospital_info?.city || "-"}</div>
                              <div><strong>License:</strong> {admin.hospital_info?.license_number || "-"}</div>
                            </div>
                          </td>
                          <td className="admin-row-actions">
                            <button className="admin-btn" onClick={() => approveHospitalAdmin(admin._id)}>Approve</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeSection === "audit" && (
            <section className="admin-section">
              <h2>Security & Audit Trail</h2>
              <div className="admin-toolbar">
                <label className="remember-label">
                  <input type="checkbox" checked={audit24hOnly} onChange={(e) => setAudit24hOnly(e.target.checked)} />
                  Last 24 hours only
                </label>
              </div>

              {visibleAuditLogs.length === 0 ? (
                <p className="admin-empty">No audit events for this filter.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Action</th>
                        <th>Actor</th>
                        <th>Target User</th>
                        <th>Target Hospital</th>
                        <th>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleAuditLogs.map((log) => (
                        <tr key={log._id}>
                          <td>{new Date(log.created_at).toLocaleString()}</td>
                          <td>{String(log.action || "").replace(/_/g, " ")}</td>
                          <td>{log.actor_user_id?.email || log.actor_email || "-"}</td>
                          <td>{log.target_user_id?.email || "-"}</td>
                          <td>{log.target_hospital_id?.name || "-"}</td>
                          <td>{log.ip || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeSection === "appointments" && (
            <section className="admin-section">
              <h2>Appointments Snapshot</h2>
              <p className="admin-empty">
                Total appointments: <strong>{stats?.appointments ?? 0}</strong>
              </p>
              <p className="admin-empty">
                Add appointment-level moderation/actions when appointment admin APIs are available.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
