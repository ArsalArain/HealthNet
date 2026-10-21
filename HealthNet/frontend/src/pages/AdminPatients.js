import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Button, Card, CardBody, CardHeader, FormField, Modal, Table } from "../components/ui";
import UploadedFilesPanel from "../components/UploadedFilesPanel";

export default function AdminPatients() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("all");
  const [patientRecords, setPatientRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploadForm, setUploadForm] = useState({ department_id: "", file: null });
  const [uploading, setUploading] = useState(false);
  const [activePatient, setActivePatient] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0, has_next: false, has_prev: false });
  const [loading, setLoading] = useState(true);

  const [appliedSearch, setAppliedSearch] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const { data } = await api.get("/hospital-admin/departments", { params: { status: "active" } });
      const list = data?.departments || [];
      setDepartments(list);

      const firstId = list.length > 0 ? String(list[0]._id || list[0].id) : "";
      setUploadForm((prev) => ({ ...prev, department_id: firstId }));
      await loadAuditLogs();
    } catch (err) {
      console.error("Error loading departments:", err);
      setMessage({ type: "error", text: "Failed to load departments." });
    }
  };

  useEffect(() => {
    if (!selectedDepartmentId) return;
    
    let isMounted = true;
    setLoading(true);
    setMessage({ type: "", text: "" });

    const fetchPatients = async () => {
      try {
        const { data } = await api.get("/hospital-admin/patients", {
          params: {
            department_id: selectedDepartmentId !== "all" ? selectedDepartmentId : undefined,
            search: appliedSearch.trim() || undefined,
            page: page,
            page_size: pageSize,
            sort_by: sortBy,
            sort_order: sortOrder,
          },
        });

        if (!isMounted) return;

        const serverPatients = Array.isArray(data?.patients) ? data.patients : [];
        const serverPagination = data?.pagination;

        if (serverPagination) {
          setPatientRecords(serverPatients);
          setPagination(serverPagination);
        } else {
          const safePageSize = Math.max(1, Number(pageSize || 25));
          const total = serverPatients.length;
          const totalPages = Math.max(1, Math.ceil(total / safePageSize));
          const safePage = Math.min(Math.max(1, Number(page || 1)), totalPages);
          const start = (safePage - 1) * safePageSize;
          const paged = serverPatients.slice(start, start + safePageSize);

          setPatientRecords(paged);
          setPagination({
            page: safePage,
            page_size: safePageSize,
            total,
            total_pages: totalPages,
            has_next: safePage < totalPages,
            has_prev: safePage > 1,
          });
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading patients:", err);
          setMessage({ type: "error", text: "Failed to load patient records." });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPatients();

    return () => {
      isMounted = false;
    };
  }, [selectedDepartmentId, appliedSearch, sortBy, sortOrder, pageSize, page, refreshTrigger]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedSearch(search);
    setPage(1);
  };

  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartmentId(departmentId);
    setUploadForm((prev) => ({ ...prev, department_id: departmentId }));
    setPage(1);
  };

  const loadAuditLogs = async () => {
    try {
      const { data } = await api.get("/hospital-admin/audit-logs", {
        params: { limit: 12, action: "patient" },
      });
      setAuditLogs(data?.logs || []);
    } catch (err) {
      console.error("Failed to load audit logs", err);
      setAuditLogs([]);
    }
  };

  const handleUploadDataset = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!uploadForm.department_id) {
      setMessage({ type: "error", text: "Please select a department first." });
      return;
    }
    if (!uploadForm.file) {
      setMessage({ type: "error", text: "Please choose a CSV or Excel (.xlsx/.xls) file to upload." });
      return;
    }

    const payload = new FormData();
    payload.append("department_id", uploadForm.department_id);
    payload.append("file", uploadForm.file);

    try {
      setUploading(true);
      const { data } = await api.post("/hospital-admin/patients/upload-dataset", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const summary = data?.import_summary || {};
      const dedupe = summary?.dedupe || {};
      setMessage({
        type: "success",
        text: `Dataset uploaded. Imported: ${summary.imported || 0}, Updated: ${summary.updated || 0}, Skipped: ${summary.skipped || 0}. Updated by Source ID: ${dedupe.updated_by_source_id || 0}, by Email: ${dedupe.updated_by_email || 0}, by Phone+Name: ${dedupe.updated_by_phone_name || 0}`,
      });
      setUploadForm((prev) => ({ ...prev, file: null }));
      setPage(1);
      setRefreshTrigger((prev) => prev + 1);
      await loadAuditLogs();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to upload patient dataset." });
    } finally {
      setUploading(false);
    }
  };

  const handleOpenDetails = async (patientId) => {
    try {
      setDetailLoading(true);
      const { data } = await api.get(`/hospital-admin/patients/${patientId}`);
      setActivePatient(data?.patient || null);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to load patient details." });
    } finally {
      setDetailLoading(false);
    }
  };

  const selectedDepartment = departments.find((d) => String(d._id || d.id) === String(selectedDepartmentId));

  const detailRows = activePatient
    ? Object.entries(activePatient.source_data || {}).sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  const patientColumns = [
    { key: "name", label: "Name", render: (p) => <strong>{p.name}</strong> },
    { key: "department", label: "Department", render: (p) => p.department_id?.name || "Unassigned" },
    { key: "email", label: "Email", render: (p) => p.email || "N/A" },
    { key: "phone", label: "Phone", render: (p) => p.phone || "N/A" },
    {
      key: "source",
      label: "Source ID",
      render: (p) => p.source_record_id || p.source_data?.source_patient_id || p.source_data?.source_id || "-",
    },
    {
      key: "status",
      label: "Status",
      render: (p) => (
        <span style={{
          background: p.status === "active" ? "#d1fae5" : "#fee2e2",
          color: p.status === "active" ? "#065f46" : "#881337",
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
        }}>
          {p.status || "active"}
        </span>
      ),
    },
    {
      key: "admitted_date",
      label: "Admitted Date",
      render: (p) => (p.created_at ? new Date(p.created_at).toLocaleDateString() : "N/A"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (p) => (
        <Button type="button" onClick={() => handleOpenDetails(p._id)} variant="soft" size="sm">
          {detailLoading ? "Loading..." : "Details"}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="hnu-page-head">
        <h2 className="hnu-page-title">Patient Records</h2>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <CardHeader>Upload Patient Dataset</CardHeader>
        <CardBody>
        <form onSubmit={handleUploadDataset} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormField label="Department">
            <select
              value={uploadForm.department_id}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, department_id: e.target.value }))}
            >
              {departments.map((department) => {
                const id = String(department._id || department.id);
                return (
                  <option key={id} value={id}>
                    {department.name}
                  </option>
                );
              })}
            </select>
            </FormField>
            <FormField label="Dataset file">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
              />
            </FormField>
          </div>
          <Button
            type="submit"
            disabled={uploading}
            variant="primary"
          >
            {uploading ? "Uploading..." : "Upload Patient Records Dataset"}
          </Button>
        </form>
        </CardBody>
      </Card>

      <UploadedFilesPanel
        title="Patient Record Files"
        subtitle="Download or remove archived patient-record uploads only."
        defaultScope="patient_records"
        showScopeSelector={false}
      />

      <div
        style={{
          marginBottom: 16,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <select
            value={selectedDepartmentId}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          >
              <option value="all">All Departments</option>
            {departments.map((department) => {
              const id = String(department._id || department.id);
              return (
                <option key={id} value={id}>
                  {department.name}
                </option>
              );
            })}
          </select>

          <form onSubmit={handleSearchSubmit} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
            <input
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                setSearch(val);
                if (val.trim() === "") {
                  setAppliedSearch("");
                  setPage(1);
                }
              }}
              placeholder="Search by name, email, phone, source id"
              style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
            />
            <button
              type="submit"
              style={{
                border: "1px solid #0ea5e9",
                borderRadius: 8,
                padding: "10px 12px",
                background: "#f0f9ff",
                color: "#0369a1",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </form>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}>
            <option value="created_at">Sort: Created Date</option>
            <option value="name">Sort: Name</option>
            <option value="status">Sort: Status</option>
            <option value="email">Sort: Email</option>
            <option value="source_record_id">Sort: Source ID</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}>
            <option value="desc">Order: Descending</option>
            <option value="asc">Order: Ascending</option>
          </select>
          <select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))} style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
            <option value="250">250 per page</option>
          </select>
          <div
            style={{
              border: "1px solid #bae6fd",
              borderRadius: 8,
              padding: "10px 12px",
              background: "#f0f9ff",
              color: "#0369a1",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Auto Apply Enabled
          </div>
        </div>
        <small style={{ color: "#64748b" }}>
          Showing records for: <strong>{selectedDepartmentId === "all" ? "All Departments" : (selectedDepartment?.name || "No department selected")}</strong> | Total: <strong>{pagination.total || 0}</strong>
        </small>
      </div>

      {message.text ? <div className={`hnu-message ${message.type === "error" ? "error" : "success"}`}>{message.text}</div> : null}

      <div
        style={{
          marginBottom: 16,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 8,
        }}
      >
        <h3 style={{ margin: 0, color: "#0f172a" }}>Recent Action Logs</h3>
        {auditLogs.length === 0 ? (
          <small style={{ color: "#64748b" }}>No recent logs.</small>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {auditLogs.slice(0, 8).map((log) => (
              <div key={log._id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", color: "#334155", fontSize: 13 }}>
                <strong>{log.action}</strong> | {new Date(log.created_at).toLocaleString()}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading patient records...</p>
      ) : patientRecords.length === 0 ? (
        <p style={{ color: "#64748b" }}>No patient records yet.</p>
      ) : (
        <Table columns={patientColumns} rows={patientRecords} keyField="_id" />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <Button
          type="button"
          onClick={() => {
            if (!pagination.has_prev) return;
            setPage((prev) => Math.max(1, prev - 1));
          }}
          disabled={!pagination.has_prev}
          variant="outline"
        >
          Previous
        </Button>
        <div style={{ color: "#475569", fontSize: 14 }}>
          Page {pagination.page || 1} of {pagination.total_pages || 1}
        </div>
        <Button
          type="button"
          onClick={() => {
            if (!pagination.has_next) return;
            setPage((prev) => prev + 1);
          }}
          disabled={!pagination.has_next}
          variant="outline"
        >
          Next
        </Button>
      </div>

      {activePatient ? (
        <Modal open={Boolean(activePatient)} title="Patient Full Details" onClose={() => setActivePatient(null)} size="lg">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
              <div><strong>Name:</strong> {activePatient.name || "N/A"}</div>
              <div><strong>Email:</strong> {activePatient.email || "N/A"}</div>
              <div><strong>Phone:</strong> {activePatient.phone || "N/A"}</div>
              <div><strong>Department:</strong> {activePatient.department_id?.name || "Unassigned"}</div>
              <div><strong>Gender:</strong> {activePatient.gender || "N/A"}</div>
              <div><strong>Blood Type:</strong> {activePatient.blood_type || "N/A"}</div>
              <div><strong>Status:</strong> {activePatient.status || "N/A"}</div>
              <div><strong>Source ID:</strong> {activePatient.source_record_id || activePatient.source_data?.source_patient_id || activePatient.source_data?.source_id || "N/A"}</div>
              <div><strong>Created:</strong> {activePatient.created_at ? new Date(activePatient.created_at).toLocaleString() : "N/A"}</div>
              <div><strong>Updated:</strong> {activePatient.updated_at ? new Date(activePatient.updated_at).toLocaleString() : "N/A"}</div>
              <div><strong>Created By:</strong> {activePatient.created_by?.username || activePatient.created_by?.email || "N/A"}</div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 10px 0", color: "#1e293b" }}>All Uploaded Columns</h4>
              {detailRows.length === 0 ? (
                <p style={{ margin: 0, color: "#64748b" }}>No source columns available for this record.</p>
              ) : (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>Column</th>
                        <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRows.map(([key, value]) => (
                        <tr key={key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: 10, color: "#334155", fontWeight: 600 }}>{key}</td>
                          <td style={{ padding: 10, color: "#475569" }}>{String(value ?? "") || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
        </Modal>
      ) : null}
    </div>
  );
}
