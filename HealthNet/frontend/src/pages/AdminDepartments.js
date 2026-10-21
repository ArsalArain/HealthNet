import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Button, Card, CardBody, CardHeader, FormField, Modal } from "../components/ui";

export default function AdminDepartments() {
  const [departmentList, setDepartmentList] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState(new Set());
  const [showDeptSelector, setShowDeptSelector] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [creatingDefaultDepts, setCreatingDefaultDepts] = useState(false);
  const [loadingDeptList, setLoadingDeptList] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customDeptForm, setCustomDeptForm] = useState({ name: "", description: "" });
  const [addDoctorOption, setAddDoctorOption] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    experience_years: "",
    shift: "morning",
    available_days: "Monday,Tuesday,Wednesday,Thursday,Friday",
    max_patients_per_day: 12,
  });
  const [generatedPassword, setGeneratedPassword] = useState("");

  const [predictionDate, setPredictionDate] = useState(new Date().toISOString().slice(0, 10));
  const [loadingAiInsights, setLoadingAiInsights] = useState(false);
  const [modelStatusList, setModelStatusList] = useState([]);
  const [departmentPredictions, setDepartmentPredictions] = useState([]);
  const [departmentUnavailable, setDepartmentUnavailable] = useState([]);

  useEffect(() => {
    loadDepartments();
    loadAiInsights(new Date().toISOString().slice(0, 10));
  }, []);

  const loadDepartments = async () => {
    try {
      const { data } = await api.get("/hospital-admin/departments");
      setDepartmentList(data?.departments || []);
    } catch (err) {
      console.error("Error loading departments:", err);
    }
  };

  const loadAiInsights = async (dateValue = predictionDate) => {
    setLoadingAiInsights(true);
    let modelError = null;
    let predictionError = null;

    try {
      const modelRes = await api.get("/hospital-admin/ai/model-status");
      setModelStatusList(modelRes?.data?.models || []);
    } catch (err) {
      modelError = err;
      console.error("Error loading AI model status:", err);
      setModelStatusList([]);
    }

    try {
      const predictionRes = await api.get("/hospital-admin/ai/predictions-by-department", {
        params: { date: dateValue, gender: "all" },
      });
      setDepartmentPredictions(predictionRes?.data?.predictions || []);
      setDepartmentUnavailable(predictionRes?.data?.unavailable || []);
    } catch (err) {
      predictionError = err;
      console.error("Error loading department predictions:", err);
      setDepartmentPredictions([]);
      setDepartmentUnavailable([]);
    } finally {
      setLoadingAiInsights(false);
    }

    if (modelError && predictionError) {
      setActionMessage({ type: "error", text: "Failed to load AI model and forecast details. Please refresh again." });
    } else if (modelError) {
      setActionMessage({ type: "error", text: "Failed to load AI model status. Please refresh again." });
    } else if (predictionError) {
      setActionMessage({ type: "error", text: "Model status loaded. Forecast details are temporarily unavailable." });
    }
  };

  const handleLoadAvailableDepartments = async () => {
    setActionMessage({ type: "", text: "" });
    setLoadingDeptList(true);
    try {
      const { data } = await api.get("/hospital-admin/departments/batch/available");
      if (data?.available_departments && Array.isArray(data.available_departments)) {
        const filtered = data.available_departments.filter((dept) => !dept.exists);
        if (filtered.length === 0) {
          setActionMessage({
            type: "success",
            text: "All default departments have already been created. You can create custom departments using '+ Add Custom Department'.",
          });
          setShowDeptSelector(false);
        } else {
          setAvailableDepartments(filtered);
          setSelectedDepartments(new Set());
          setShowDeptSelector(true);
        }
      } else {
        setActionMessage({ type: "error", text: "Failed to load departments." });
      }
    } catch (err) {
      const status = err.response?.status;
      let displayMsg = err.response?.data?.message || err.message || "Network error";
      if (status === 401) displayMsg = "Session expired. Please log in again.";
      if (status === 403) displayMsg = "Access denied. Make sure you are a hospital admin.";
      if (status === 500) displayMsg = "Server error. Please check the backend logs.";

      setActionMessage({ type: "error", text: `Failed to load departments: ${displayMsg}` });
    } finally {
      setLoadingDeptList(false);
    }
  };

  const handleDepartmentToggle = (deptName) => {
    setSelectedDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deptName)) {
        newSet.delete(deptName);
      } else {
        newSet.add(deptName);
      }
      return newSet;
    });
  };

  const handleCreateSelectedDepartments = async () => {
    if (selectedDepartments.size === 0) {
      setActionMessage({ type: "error", text: "Please select at least one department." });
      return;
    }

    setActionMessage({ type: "", text: "" });
    setCreatingDefaultDepts(true);
    try {
      const { data } = await api.post("/hospital-admin/departments/batch/create-defaults", {
        departments: Array.from(selectedDepartments),
      });
      setActionMessage({
        type: "success",
        text: `${data?.created_count || 0}/${data?.requested_count || 0} departments created successfully!`,
      });
      await Promise.all([loadDepartments(), loadAiInsights(predictionDate)]);
      setShowDeptSelector(false);
      setSelectedDepartments(new Set());
    } catch (err) {
      console.error("Department creation error:", err.response?.data || err.message);
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create departments.",
      });
    } finally {
      setCreatingDefaultDepts(false);
    }
  };

  const handleDeleteDepartment = async (deptId, deptName) => {
    if (!window.confirm(`Are you sure you want to delete the "${deptName}" department? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/hospital-admin/departments/${deptId}`);
      setActionMessage({
        type: "success",
        text: `"${deptName}" department deleted successfully.`,
      });
      await Promise.all([loadDepartments(), loadAiInsights(predictionDate)]);
    } catch (err) {
      console.error("Delete department error:", err.response?.data || err.message);
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete department.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCustomDepartment = async (e) => {
    e.preventDefault();
    
    const deptName = customDeptForm.name.trim();
    if (!deptName) {
      setActionMessage({ type: "error", text: "Department name is required." });
      return;
    }

    const nameExists = departmentList.some(
      (d) => d.name.toLowerCase() === deptName.toLowerCase()
    );
    if (nameExists) {
      setActionMessage({
        type: "error",
        text: `A department named "${deptName}" already exists in your hospital.`,
      });
      return;
    }

    if (addDoctorOption) {
      const docName = doctorForm.name.trim();
      const docEmail = doctorForm.email.trim();

      if (!docName) {
        setActionMessage({ type: "error", text: "Doctor name is required." });
        return;
      }

      if (!docEmail) {
        setActionMessage({ type: "error", text: "Doctor email is required." });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(docEmail)) {
        setActionMessage({ type: "error", text: "Please enter a valid doctor email address." });
        return;
      }

      if (doctorForm.experience_years !== "") {
        const exp = Number(doctorForm.experience_years);
        if (isNaN(exp) || exp < 0) {
          setActionMessage({ type: "error", text: "Experience years must be a non-negative number." });
          return;
        }
      }

      if (doctorForm.max_patients_per_day !== "") {
        const maxPatients = Number(doctorForm.max_patients_per_day);
        if (isNaN(maxPatients) || maxPatients <= 0) {
          setActionMessage({ type: "error", text: "Max patients per day must be a positive number." });
          return;
        }
      }
    }

    setActionLoading(true);
    setActionMessage({ type: "", text: "" });
    setGeneratedPassword("");

    try {
      // 1. Create the Department
      const deptRes = await api.post("/hospital-admin/departments", {
        name: deptName,
        description: customDeptForm.description.trim(),
      });

      const createdDept = deptRes.data?.department;
      const deptId = createdDept?._id || createdDept?.id;

      let docMessage = "";
      let docPassword = "";

      // 2. Create the Doctor if option is selected
      if (addDoctorOption && deptId) {
        const doctorPayload = {
          name: doctorForm.name.trim(),
          email: doctorForm.email.trim(),
          phone: doctorForm.phone.trim(),
          specialization: doctorForm.specialization.trim(),
          department_id: deptId,
          experience_years: doctorForm.experience_years ? Number(doctorForm.experience_years) : 0,
          shift: doctorForm.shift,
          available_days: doctorForm.available_days.split(",").map(d => d.trim()).filter(Boolean),
          max_patients_per_day: doctorForm.max_patients_per_day ? Number(doctorForm.max_patients_per_day) : 12,
          status: "active",
        };

        try {
          const docRes = await api.post("/hospital-admin/doctors", doctorPayload);
          docPassword = docRes.data?.generated_password || "";
          if (docPassword) {
            setGeneratedPassword(docPassword);
            docMessage = ` and Doctor created successfully (Generated Password: ${docPassword})`;
          } else {
            docMessage = ` and Doctor created successfully`;
          }
        } catch (docErr) {
          console.error("Error creating doctor for new department:", docErr);
          docMessage = `, but doctor creation failed: ${docErr.response?.data?.message || docErr.message}`;
        }
      }

      setActionMessage({
        type: "success",
        text: `Department "${deptName}" created successfully${docMessage}.`,
      });

      // Reset custom form
      setCustomDeptForm({ name: "", description: "" });
      setAddDoctorOption(false);
      setDoctorForm({
        name: "",
        email: "",
        phone: "",
        specialization: "",
        experience_years: "",
        shift: "morning",
        available_days: "Monday,Tuesday,Wednesday,Thursday,Friday",
        max_patients_per_day: 12,
      });
      setShowCustomModal(false);

      await Promise.all([loadDepartments(), loadAiInsights(predictionDate)]);

    } catch (err) {
      console.error("Error creating custom department:", err);
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create department.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const modelByDepartmentId = new Map(
    (modelStatusList || []).map((item) => [String(item.department_id), item])
  );
  const predictionByDepartmentId = new Map(
    (departmentPredictions || []).map((item) => [String(item.department_id), item])
  );
  const unavailableByDepartmentId = new Map(
    (departmentUnavailable || []).map((item) => [String(item.department_id), item])
  );

  const totalModelsReady = (modelStatusList || []).filter((m) => m.has_model).length;

  return (
    <div>
      <div className="hnu-page-head">
        <h2 className="hnu-page-title">Departments Management</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="button"
            onClick={() => setShowCustomModal(true)}
            variant="primary"
          >
            + Add Custom Department
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: 18 }}>
        <CardBody>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, color: "#1e3a8a", marginBottom: 4 }}>AI Readiness Overview</div>
            <div style={{ fontSize: 13, color: "#1d4ed8" }}>
              Models ready: {totalModelsReady}/{departmentList.length} departments
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FormField>
              <input
                type="date"
                value={predictionDate}
                onChange={(e) => setPredictionDate(e.target.value)}
              />
            </FormField>
            <Button
              type="button"
              onClick={() => loadAiInsights(predictionDate)}
              disabled={loadingAiInsights}
              variant="primary"
            >
              {loadingAiInsights ? "Refreshing..." : "Refresh AI Details"}
            </Button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#334155" }}>
          Department cards now include model status, trained rows, dataset range, and expected load for selected date.
        </div>
        </CardBody>
      </Card>

      {actionMessage.text && (
        <div className={`hnu-message ${actionMessage.type === "success" ? "success" : "error"}`}>
          {actionMessage.text}
        </div>
      )}

      {generatedPassword && (
        <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid #86efac", background: "#f0fdf4", color: "#166534", fontSize: 13 }}>
          New doctor account created! Generated password: <strong>{generatedPassword}</strong> (Please save this password as it will not be shown again).
        </div>
      )}

      {showCustomModal && (
        <Modal
          open={showCustomModal}
          title="Create New Custom Department"
          onClose={() => {
            setShowCustomModal(false);
            setGeneratedPassword("");
          }}
          size="lg"
        >
          <form onSubmit={handleCreateCustomDepartment} style={{ display: "grid", gap: 12 }}>
            <FormField label="Department Name *">
              <input
                placeholder="e.g. Cardiology"
                value={customDeptForm.name}
                onChange={(e) => setCustomDeptForm((p) => ({ ...p, name: e.target.value }))}
                style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
                required
              />
            </FormField>

            <FormField label="Description">
              <textarea
                placeholder="Department description..."
                value={customDeptForm.description}
                onChange={(e) => setCustomDeptForm((p) => ({ ...p, description: e.target.value }))}
                style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", minHeight: 80, fontFamily: "inherit" }}
              />
            </FormField>

            <div style={{ margin: "8px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, color: "#0f172a" }}>
                <input
                  type="checkbox"
                  checked={addDoctorOption}
                  onChange={(e) => setAddDoctorOption(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                Add a Doctor to this Department
              </label>
            </div>

            {addDoctorOption && (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
                <h4 style={{ margin: "0 0 4px 0", color: "#1e293b" }}>Doctor Details</h4>
                
                <FormField label="Doctor Name *">
                  <input
                    placeholder="Full Name"
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, name: e.target.value }))}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
                    required
                  />
                </FormField>

                <FormField label="Email *">
                  <input
                    placeholder="email@example.com"
                    type="email"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, email: e.target.value }))}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
                    required
                  />
                </FormField>

                <FormField label="Phone">
                  <input
                    placeholder="Phone Number"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, phone: e.target.value }))}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
                  />
                </FormField>

                <FormField label="Specialization">
                  <input
                    placeholder="e.g. Cardiologist"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, specialization: e.target.value }))}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
                  />
                </FormField>

                <FormField label="Experience Years">
                  <input
                    placeholder="e.g. 5"
                    type="number"
                    min="0"
                    value={doctorForm.experience_years}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, experience_years: e.target.value }))}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
                  />
                </FormField>

                <FormField label="Shift">
                  <select
                    value={doctorForm.shift}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, shift: e.target.value }))}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", width: "100%" }}
                  >
                    <option value="morning">Morning (8 AM - 2 PM)</option>
                    <option value="evening">Evening (2 PM - 8 PM)</option>
                    <option value="night">Night (8 PM - 8 AM)</option>
                    <option value="flex">Flex</option>
                  </select>
                </FormField>

                <FormField label="Available Days (comma separated)">
                  <input
                    placeholder="Monday,Tuesday,Wednesday"
                    value={doctorForm.available_days}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, available_days: e.target.value }))}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
                  />
                </FormField>

                <FormField label="Max Patients Per Day">
                  <input
                    placeholder="12"
                    type="number"
                    min="1"
                    value={doctorForm.max_patients_per_day}
                    onChange={(e) => setDoctorForm((p) => ({ ...p, max_patients_per_day: e.target.value }))}
                    style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
                  />
                </FormField>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button
                type="submit"
                disabled={actionLoading}
                variant="primary"
                block
              >
                {actionLoading ? "Creating..." : "Create Department"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowCustomModal(false);
                  setGeneratedPassword("");
                }}
                variant="outline"
                block
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {showDeptSelector && availableDepartments.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: "#065f46" }}>Select Departments</h3>
            <Button
              type="button"
              onClick={() => {
                setShowDeptSelector(false);
                setSelectedDepartments(new Set());
              }}
              variant="ghost"
              size="sm"
            >
              ×
            </Button>
          </div>
          </CardHeader>
          <CardBody>

          <p style={{ color: "#047857", fontSize: 13, marginBottom: 12 }}>
            {availableDepartments.length} departments available • {selectedDepartments.size} selected
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {availableDepartments.map((dept, idx) => (
              <label
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: 10,
                  background: selectedDepartments.has(dept.name) ? "#dbeafe" : "#fff",
                  border: `2px solid ${selectedDepartments.has(dept.name) ? "#0284c7" : "#d1fae5"}`,
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedDepartments.has(dept.name)}
                  onChange={() => handleDepartmentToggle(dept.name)}
                  style={{ marginTop: 3, cursor: "pointer" }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: selectedDepartments.has(dept.name) ? "#0284c7" : "#065f46",
                      fontSize: 13,
                    }}
                  >
                    {dept.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#047857", marginTop: 3 }}>{dept.description}</div>
                </div>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="button"
              onClick={() => setSelectedDepartments(new Set(availableDepartments.map((d) => d.name)))}
              variant="soft"
              className="hnu-btn-block"
            >
              Select All
            </Button>
            <Button
              type="button"
              onClick={() => setSelectedDepartments(new Set())}
              variant="soft"
              className="hnu-btn-block"
            >
              Clear All
            </Button>
            <Button
              type="button"
              onClick={handleCreateSelectedDepartments}
              disabled={creatingDefaultDepts || selectedDepartments.size === 0}
              variant="success"
              className="hnu-btn-block"
            >
              {creatingDefaultDepts ? "Creating..." : `Create ${selectedDepartments.size} Department${selectedDepartments.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
          </CardBody>
        </Card>
      )}

      <div>
        <style>{`
          .dept-table-wrapper {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02), 0 4px 6px -2px rgba(0, 0, 0, 0.01);
            overflow: hidden;
            margin-top: 16px;
            animation: fadeInUp 0.5s ease forwards;
          }
          .dept-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }
          .dept-table th {
            background: #f8fafc;
            padding: 16px 20px;
            font-size: 0.75rem;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e2e8f0;
          }
          .dept-table td {
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 0.85rem;
            color: #334155;
            vertical-align: middle;
          }
          .dept-table tr:last-child td {
            border-bottom: none;
          }
          .dept-table tr {
            transition: all 0.2s ease;
          }
          .dept-table tr:hover td {
            background-color: #f8fafc;
          }
          .dept-name-cell {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .dept-desc-cell {
            font-size: 0.8rem;
            color: #64748b;
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.7rem;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
          .badge-active {
            background: rgba(16, 185, 129, 0.08);
            border: 1px solid rgba(16, 185, 129, 0.15);
            color: #059669;
          }
          .badge-inactive {
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.15);
            color: #dc2626;
          }
          .badge-ai-ready {
            background: rgba(37, 99, 235, 0.08);
            border: 1px solid rgba(37, 99, 235, 0.15);
            color: #2563eb;
          }
          .badge-ai-missing {
            background: rgba(100, 116, 139, 0.06);
            border: 1px solid rgba(100, 116, 139, 0.1);
            color: #64748b;
          }
          .forecast-num {
            font-size: 1.05rem;
            font-weight: 800;
            color: #0284c7;
          }
          .rows-num {
            font-weight: 600;
            color: #0f172a;
          }
          .date-range {
            font-size: 0.75rem;
            color: #64748b;
            font-family: monospace;
          }
          .btn-delete-row {
            background: transparent;
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 0.75rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .btn-delete-row:hover {
            background: #ef4444;
            color: #ffffff;
            border-color: #ef4444;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
          }
        `}</style>

        <h3 style={{ margin: "0 0 12px 0", color: "#0f172a" }}>Hospital Departments ({departmentList.length})</h3>
        {departmentList.length === 0 ? (
          <p style={{ color: "#64748b" }}>No departments created yet.</p>
        ) : (
          <div className="dept-table-wrapper">
            <table className="dept-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Status</th>
                  <th>AI Model</th>
                  <th>Expected Load ({predictionDate})</th>
                  <th>Data Volume (Trained / Total)</th>
                  <th>Dataset Date Range</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departmentList.map((dept) => {
                  const model = modelByDepartmentId.get(String(dept._id));
                  const forecast = predictionByDepartmentId.get(String(dept._id));
                  const hasModel = !!model?.has_model;
                  const dateMin = model?.metadata?.date_min || "--";
                  const dateMax = model?.metadata?.date_max || "--";

                  return (
                    <tr key={dept._id}>
                      <td>
                        <div className="dept-name-cell">{dept.name}</div>
                        <div className="dept-desc-cell" title={dept.description || "No description"}>
                          {dept.description || "No description"}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${String(dept.status || "active").toLowerCase() === "active" ? "badge-active" : "badge-inactive"}`}>
                          {dept.status || "active"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${hasModel ? "badge-ai-ready" : "badge-ai-missing"}`}>
                          {hasModel ? "READY" : "NOT TRAINED"}
                        </span>
                      </td>
                      <td>
                        <span className="forecast-num">{forecast?.expected_patients ?? "--"}</span>
                      </td>
                      <td>
                        <span className="rows-num">{model?.metadata?.rows_trained ?? 0}</span>
                        <span style={{ color: "#94a3b8" }}> / </span>
                        <span>{model?.metadata?.source_rows ?? 0}</span>
                      </td>
                      <td>
                        <span className="date-range">{dateMin} to {dateMax}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteDepartment(dept._id, dept.name)}
                          disabled={actionLoading}
                          className="btn-delete-row"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
