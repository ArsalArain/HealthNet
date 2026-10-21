import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [staffPasswordErrors, setStaffPasswordErrors] = useState([]);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "staff",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [staffRes, deptsRes] = await Promise.all([
        api.get("/hospital-admin/staff").catch(() => ({ data: { staff: [] } })),
        api.get("/hospital-admin/departments").catch(() => ({ data: { departments: [] } })),
      ]);
      setStaffList(staffRes.data?.staff || []);
      setDepartmentList(deptsRes.data?.departments || []);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("One number");
    if (!/[!@#$%^&*]/.test(pwd)) errors.push("One special character (!@#$%^&*)");
    return errors;
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.email || !staffForm.password) {
      setActionMessage({ type: "error", text: "Please fill all required fields." });
      return;
    }

    const errors = validatePassword(staffForm.password);
    if (errors.length > 0) {
      setStaffPasswordErrors(errors);
      return;
    }

    setActionLoading(true);
    try {
      await api.post("/hospital-admin/staff", staffForm);
      setActionMessage({ type: "success", text: "Staff member created successfully!" });
      setStaffForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "staff",
      });
      setShowForm(false);
      setStaffPasswordErrors([]);
      await loadData();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create staff.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (!window.confirm(`Delete staff member "${staffName}"?`)) return;

    setActionLoading(true);
    try {
      await api.delete(`/hospital-admin/staff/${staffId}`);
      setActionMessage({ type: "success", text: `${staffName} deleted successfully.` });
      await loadData();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete staff.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "#0f172a" }}>Staff Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            border: "1px solid #10b981",
            borderRadius: 8,
            background: "#d1fae5",
            color: "#065f46",
            padding: "10px 16px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {showForm ? "Cancel" : "+ Add Staff"}
        </button>
      </div>

      {actionMessage.text && (
        <div style={{
          marginBottom: 16,
          borderRadius: 8,
          padding: "12px 16px",
          border: actionMessage.type === "success" ? "1px solid #86efac" : "1px solid #fecaca",
          background: actionMessage.type === "success" ? "#f0fdf4" : "#fef2f2",
          color: actionMessage.type === "success" ? "#166534" : "#991b1b",
        }}>
          {actionMessage.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreateStaff} style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          display: "grid",
          gap: 12,
        }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#0f172a" }}>Create New Staff Member</h3>
          
          <input
            placeholder="Full Name"
            value={staffForm.name}
            onChange={(e) => setStaffForm((p) => ({ ...p, name: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          />
          <input
            placeholder="Email"
            type="email"
            value={staffForm.email}
            onChange={(e) => setStaffForm((p) => ({ ...p, email: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          />
          <div>
            <input
              placeholder="Password"
              type={showStaffPassword ? "text" : "password"}
              value={staffForm.password}
              onChange={(e) => {
                setStaffForm((p) => ({ ...p, password: e.target.value }));
                if (e.target.value) setStaffPasswordErrors(validatePassword(e.target.value));
              }}
              style={{
                width: "100%",
                border: staffPasswordErrors.length > 0 && staffForm.password ? "1px solid #f87171" : "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "10px 12px",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowStaffPassword(!showStaffPassword)}
              style={{
                marginTop: 6,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                background: "#f8fafc",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {showStaffPassword ? "Hide" : "Show"} Password
            </button>
            {staffPasswordErrors.length > 0 && (
              <div style={{ fontSize: 12, color: "#dc2626", marginTop: 8 }}>
                <strong>Requirements:</strong>
                <ul style={{ margin: "4px 0 0 20px" }}>
                  {staffPasswordErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <input
            placeholder="Phone"
            value={staffForm.phone}
            onChange={(e) => setStaffForm((p) => ({ ...p, phone: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          />
          <select
            value={staffForm.role}
            onChange={(e) => setStaffForm((p) => ({ ...p, role: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          >
            <option value="staff">General Staff</option>
            <option value="receptionist">Receptionist</option>
            <option value="nurse">Nurse</option>
          </select>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={actionLoading}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 8,
                background: "#0284c7",
                color: "#fff",
                padding: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Create Staff
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                flex: 1,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                background: "#f8fafc",
                padding: "10px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div>
        <h3 style={{ margin: "0 0 12px 0", color: "#0f172a" }}>Staff List ({staffList.length})</h3>
        {staffList.length === 0 ? (
          <p style={{ color: "#64748b" }}>No staff members yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {staffList.map((staff) => (
              <div key={staff._id} style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{staff.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{staff.email}</div>
                  <div style={{ fontSize: 13, color: "#334155" }}>
                    <div>Role: <strong>{staff.role}</strong></div>
                    <div>Phone: {staff.phone || "N/A"}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteStaff(staff._id, staff.name)}
                  disabled={actionLoading}
                  style={{
                    border: "1px solid #fecaca",
                    borderRadius: 6,
                    background: "#fee2e2",
                    color: "#dc2626",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
