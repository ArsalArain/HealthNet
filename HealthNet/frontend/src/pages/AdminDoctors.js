import React, { useEffect, useState } from "react";
import api from "../services/api";
import { getAuthUser } from "../utils/authStorage";
import { Button, Card, CardBody, CardHeader, FormField, Modal } from "../components/ui";

export default function AdminDoctors() {
  const authUser = getAuthUser();
  const authHospitalId = authUser?.hospital_id || authUser?.hospital?.id || authUser?.hospital?._id || "";

  const defaultDoctorForm = {
    name: "",
    email: "",
    phone: "",
    specialization: "",
    department_id: "",
    shift: "",
    available_days: "",
    max_patients_per_day: "",
    experience_years: "",
    status: "active",
  };

  const [doctorsList, setDoctorsList] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [resolvedHospitalId, setResolvedHospitalId] = useState(authHospitalId);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nextDoctorId, setNextDoctorId] = useState("");
  const [editingDoctorId, setEditingDoctorId] = useState("");
  const [editingDoctorCode, setEditingDoctorCode] = useState("");
  const [lastGeneratedPassword, setLastGeneratedPassword] = useState("");
  const [selectedDepartmentName, setSelectedDepartmentName] = useState("");
  const [doctorForm, setDoctorForm] = useState(defaultDoctorForm);
  const [scheduleChangeRequests, setScheduleChangeRequests] = useState([]);
  const [recentScheduleRequests, setRecentScheduleRequests] = useState([]);
  const [reviewingRequestId, setReviewingRequestId] = useState("");

  const isEditing = Boolean(editingDoctorId);

  const getAutoScheduleByDepartment = (departmentName, experienceYears) => {
    const dept = String(departmentName || "").trim().toLowerCase();
    const shift = dept === "emergency" ? "night" : dept === "pediatrics" ? "evening" : "morning";
    const availableDaysByShift = {
      morning: "Monday,Tuesday,Wednesday,Thursday,Friday",
      evening: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
      night: "Sunday,Monday,Tuesday,Wednesday,Thursday",
      flex: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
    };
    const capacityByShift = {
      morning: 12,
      evening: 12,
      night: 24,
      flex: 16,
    };
    const capacity = capacityByShift[shift] || 12;
    return {
      shift,
      available_days: availableDaysByShift[shift],
      max_patients_per_day: capacity,
    };
  };

  const shiftTimeMap = {
    morning: "8 AM - 2 PM",
    evening: "2 PM - 8 PM",
    night: "8 PM - 8 AM",
    flex: "Flexible",
  };

  const getShiftLabel = (shiftValue) => {
    const shift = String(shiftValue || "").trim().toLowerCase();
    if (!shift) return "";
    const base = `${shift.charAt(0).toUpperCase()}${shift.slice(1)}`;
    const window = shiftTimeMap[shift] || "";
    return window ? `${base} (${window})` : base;
  };

  const getShiftCapacity = (shiftValue) => {
    const shift = String(shiftValue || "").trim().toLowerCase();
    if (shift === "morning") return 12;
    if (shift === "evening") return 12;
    if (shift === "night") return 24;
    if (shift === "flex") return 16;
    return 12;
  };

  const getNormalizedDoctorCapacity = (doctor) => {
    const auto = getAutoScheduleByDepartment(doctor?.department, doctor?.experience_years);
    const shift = String(doctor?.shift || auto.shift || "morning").toLowerCase();
    const shiftCapacity = getShiftCapacity(shift);
    const raw = Number(doctor?.max_patients_per_day);
    if (!Number.isFinite(raw) || raw <= 0) return auto.max_patients_per_day;
    return Math.min(Math.round(raw), shiftCapacity);
  };

  const getDisplayDoctorId = (doctor) => {
    const direct = String(doctor?.doctor_id || "").trim();
    if (direct) return direct;

    const local = String(doctor?.email || "").split("@")[0] || "";
    const prefixCandidate = local.split("_")[0] || "";
    const cleaned = prefixCandidate.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleaned.length >= 4) return cleaned;

    const idSuffix = String(doctor?.id || "").slice(-6).toUpperCase();
    return idSuffix ? `DOC-${idSuffix}` : "DOC-PENDING";
  };

  const toTitle = (value) => {
    const text = String(value || "").trim();
    if (!text) return "";
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
  };

  const getDepartmentNameById = (departmentId) => {
    const match = (departmentList || []).find((d) => String(d._id || d.id) === String(departmentId || ""));
    return match?.name || "";
  };

  const resetDoctorForm = (departmentId = "") => {
    setDoctorForm({
      ...defaultDoctorForm,
      department_id: departmentId || defaultDoctorForm.department_id,
    });
    setEditingDoctorId("");
    setEditingDoctorCode("");
  };

  const doctorsByDepartment = (doctorsList || []).reduce((acc, doc) => {
    const departmentName = String(doc.department || "Unassigned").trim() || "Unassigned";
    if (!acc[departmentName]) acc[departmentName] = [];
    acc[departmentName].push(doc);
    return acc;
  }, {});

  const sortedDepartmentNames = Object.keys(doctorsByDepartment).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (!sortedDepartmentNames.length) {
      setSelectedDepartmentName("");
      return;
    }
    if (!selectedDepartmentName || (selectedDepartmentName !== "all" && !sortedDepartmentNames.includes(selectedDepartmentName))) {
      setSelectedDepartmentName("all");
    }
  }, [selectedDepartmentName, sortedDepartmentNames]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      loadData({ silent: true });
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!doctorForm.department_id || isEditing) {
      setNextDoctorId("");
      return;
    }
    fetchNextDoctorId(doctorForm.department_id);
  }, [doctorForm.department_id, isEditing]);

  const loadData = async ({ silent = false } = {}) => {
    try {
      const [doctorsRes, deptsRes, profileRes, pendingRequestsRes, allRequestsRes] = await Promise.all([
        api.get("/hospital-admin/doctors").catch(() => ({ data: { doctors: [] } })),
        api.get("/hospital-admin/departments").catch(() => ({ data: { departments: [] } })),
        api.get("/hospital-admin/profile").catch(() => ({ data: { profile: null } })),
        api.get("/hospital-admin/doctor-schedule-requests", { params: { status: "pending" } }).catch((error) => ({ error })),
        api.get("/hospital-admin/doctor-schedule-requests").catch((error) => ({ error })),
      ]);
      const loadedDoctors = doctorsRes.data?.doctors || [];
      setDoctorsList(loadedDoctors);

      const pendingRequestError = pendingRequestsRes?.error;
      const allRequestError = allRequestsRes?.error;
      const pendingRequests = pendingRequestError ? [] : (pendingRequestsRes?.data?.requests || []);
      const allRequests = allRequestError ? [] : (allRequestsRes?.data?.requests || []);

      setScheduleChangeRequests(pendingRequests);
      setRecentScheduleRequests(allRequests.slice(0, 8));

      if (!silent && (pendingRequestError || allRequestError)) {
        const firstError = pendingRequestError || allRequestError;
        const detail = firstError?.response?.data?.message
          || (typeof firstError?.response?.data === "string" ? firstError.response.data : "")
          || firstError?.message
          || "Schedule request endpoint unavailable.";
        setActionMessage({ type: "error", text: `Doctor schedule request panel issue: ${detail}` });
      }

      const deps = deptsRes.data?.departments || [];
      setDepartmentList(deps);

      const profileHospitalId =
        profileRes?.data?.profile?.hospital?._id ||
        profileRes?.data?.profile?.hospital?.id ||
        "";
      const doctorsHospitalId = loadedDoctors[0]?.hospital_id || "";
      setResolvedHospitalId(profileHospitalId || authHospitalId || doctorsHospitalId || "");

      if (!doctorForm.department_id && deps.length > 0 && !isEditing) {
        setDoctorForm((prev) => ({ ...prev, department_id: String(deps[0]._id || deps[0].id), shift: "morning", available_days: "Monday,Tuesday,Wednesday,Thursday,Friday", max_patients_per_day: 12 }));
      } else if (!doctorForm.department_id && loadedDoctors.length > 0 && !isEditing) {
        const fallbackDepartmentId = String(loadedDoctors[0]?.department_id || "");
        if (fallbackDepartmentId) {
          setDoctorForm((prev) => ({ ...prev, department_id: fallbackDepartmentId, shift: prev.shift || "morning", available_days: prev.available_days || "Monday,Tuesday,Wednesday,Thursday,Friday", max_patients_per_day: prev.max_patients_per_day || 12 }));
        }
      }

      const doctorsMissingIds = loadedDoctors.filter((d) => !String(d?.doctor_id || "").trim());
      if (doctorsMissingIds.length > 0) {
        await Promise.all(
          doctorsMissingIds.map((d) => api.put(`/hospital-admin/doctors/${d.id}`, { status: d.status || "active" }).catch(() => null))
        );
        const refreshed = await api.get("/hospital-admin/doctors").catch(() => ({ data: { doctors: loadedDoctors } }));
        const refreshedDoctors = refreshed.data?.doctors || loadedDoctors;
        setDoctorsList(refreshedDoctors);
        const stillMissing = (refreshedDoctors || []).filter((d) => !String(d?.doctor_id || "").trim()).length;
        if (stillMissing > 0) {
          setActionMessage({ type: "error", text: "Some doctor IDs are still pending assignment. Open Modify and Save to finalize IDs." });
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const fetchNextDoctorId = async (departmentId) => {
    try {
      const { data } = await api.get("/hospital-admin/doctors-next-id", {
        params: { department_id: departmentId },
      });
      setNextDoctorId(data?.doctor_id || "");
    } catch {
      setNextDoctorId("");
    }
  };

  const handleSubmitDoctor = async (e) => {
    e.preventDefault();
    if (!doctorForm.name || !doctorForm.email || !doctorForm.department_id) {
      setActionMessage({ type: "error", text: "Please fill all required fields." });
      return;
    }

    setActionLoading(true);
    try {
      const departmentName = getDepartmentNameById(doctorForm.department_id);
      const autoSchedule = getAutoScheduleByDepartment(departmentName, doctorForm.experience_years);
      const payload = {
        ...doctorForm,
        shift: String(doctorForm.shift || "").trim().toLowerCase() || autoSchedule.shift,
        available_days: String(doctorForm.available_days || autoSchedule.available_days)
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        max_patients_per_day: Math.min(
          String(doctorForm.max_patients_per_day || "").trim() === ""
          ? autoSchedule.max_patients_per_day
          : Number(doctorForm.max_patients_per_day),
          getShiftCapacity(String(doctorForm.shift || autoSchedule.shift || "morning"))
        ),
      };

      if (isEditing) {
        await api.put(`/hospital-admin/doctors/${editingDoctorId}`, payload);
        setLastGeneratedPassword("");
        setActionMessage({ type: "success", text: "Doctor details updated successfully." });
      } else {
        const { data } = await api.post("/hospital-admin/doctors", payload);
        const generatedPassword = data?.generated_password || "";
        setLastGeneratedPassword(generatedPassword);
        setActionMessage({
          type: "success",
          text: generatedPassword
            ? `Doctor created successfully. Generated password: ${generatedPassword}`
            : "Doctor created successfully!",
        });
      }

      const departmentToKeep = doctorForm.department_id;
      resetDoctorForm(departmentToKeep);
      setShowForm(false);
      await loadData();
      if (!isEditing) {
        await fetchNextDoctorId(departmentToKeep);
      }
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || (isEditing ? "Failed to update doctor." : "Failed to create doctor."),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartCreate = () => {
    if (showForm && !isEditing) {
      setShowForm(false);
      return;
    }
    const departmentId =
      doctorForm.department_id ||
      (departmentList[0]?._id ? String(departmentList[0]._id) : "") ||
      (doctorsList[0]?.department_id ? String(doctorsList[0].department_id) : "");
    const departmentName = getDepartmentNameById(departmentId);
    const autoSchedule = getAutoScheduleByDepartment(departmentName, 0);
    resetDoctorForm(departmentId);
    setDoctorForm((prev) => ({
      ...prev,
      department_id: departmentId,
      shift: autoSchedule.shift,
      available_days: autoSchedule.available_days,
      max_patients_per_day: autoSchedule.max_patients_per_day,
    }));
    setShowForm(true);
  };

  const handleStartEditDoctor = (doc) => {
    const departmentId = String(doc.department_id || "");
    const autoSchedule = getAutoScheduleByDepartment(doc.department, doc.experience_years);
    setEditingDoctorId(String(doc.id));
    setEditingDoctorCode(String(doc.doctor_id || ""));
    setDoctorForm({
      name: String(doc.name || ""),
      email: String(doc.email || ""),
      phone: String(doc.phone || ""),
      specialization: String(doc.specialization || ""),
      department_id: departmentId,
      shift: String(doc.shift || autoSchedule.shift),
      available_days: (Array.isArray(doc.available_days) && doc.available_days.length > 0)
        ? doc.available_days.join(",")
        : autoSchedule.available_days,
      max_patients_per_day: getNormalizedDoctorCapacity(doc),
      experience_years: String(doc.experience_years ?? ""),
      status: String(doc.status || "active"),
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    const departmentId = departmentList[0]?._id ? String(departmentList[0]._id) : "";
    resetDoctorForm(departmentId);
    setShowForm(false);
  };

  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (!window.confirm(`Delete doctor "${doctorName}"?`)) return;

    setActionLoading(true);
    try {
      await api.delete(`/hospital-admin/doctors/${doctorId}`);
      setActionMessage({ type: "success", text: `${doctorName} deleted successfully.` });
      await loadData();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete doctor.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewScheduleRequest = async (requestId, action) => {
    const reviewNote = window.prompt(
      action === "approve"
        ? "Optional approval note"
        : "Rejection reason (optional but recommended)",
      ""
    );

    setReviewingRequestId(requestId);
    try {
      await api.put(`/hospital-admin/doctor-schedule-requests/${requestId}`, {
        action,
        review_note: reviewNote || "",
      });

      setActionMessage({
        type: "success",
        text: action === "approve" ? "Schedule request approved." : "Schedule request rejected.",
      });
      await loadData();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to review schedule request.",
      });
    } finally {
      setReviewingRequestId("");
    }
  };

  return (
    <div>
      <div className="hnu-page-head">
        <h2 className="hnu-page-title">Doctors Management</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            onClick={handleStartCreate}
            variant="soft"
          >
            {showForm && !isEditing ? "Cancel" : "+ Add Doctor"}
          </Button>
        </div>
      </div>

      {actionMessage.text && (
        <div className={`hnu-message ${actionMessage.type === "success" ? "success" : "error"}`}>
          {actionMessage.text}
        </div>
      )}

      <Card style={{ marginBottom: 20 }}>
        <CardBody>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>
            Doctor Schedule Change Requests ({scheduleChangeRequests.length})
          </h3>
          <Button
            type="button"
            onClick={() => loadData()}
            variant="outline"
            size="sm"
          >
            Refresh
          </Button>
        </div>
        {scheduleChangeRequests.length === 0 ? (
          <>
            <p style={{ margin: 0, color: "#64748b" }}>No pending requests.</p>
            {recentScheduleRequests.length > 0 ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Recent Request History</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {recentScheduleRequests.map((req) => (
                    <div key={req._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                        {req.doctor_id?.name || "Doctor"} ({req.doctor_id?.doctor_id || "-"})
                      </div>
                      <div style={{ fontSize: 12, color: "#334155" }}>
                        Status: {String(req.status || "pending").toUpperCase()} | Shift: {req.requested_shift || "-"} | Days: {(req.requested_available_days || []).join(", ") || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {scheduleChangeRequests.map((req) => (
              <div key={req._id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                  {req.doctor_id?.name || "Doctor"} ({req.doctor_id?.doctor_id || "-"})
                </div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                  <div>Current: Shift {req.current_shift || "-"}, Status {req.current_status || "-"}</div>
                  <div>Current Days: {(req.current_available_days || []).join(", ") || "-"}</div>
                  <div>Requested: Shift {req.requested_shift || "-"}, Status {req.requested_status || "-"}</div>
                  <div>Requested Days: {(req.requested_available_days || []).join(", ") || "-"}</div>
                  <div>Reason: {req.reason || "-"}</div>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <Button
                    onClick={() => handleReviewScheduleRequest(req._id, "approve")}
                    disabled={reviewingRequestId === req._id}
                    variant="success"
                    size="sm"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReviewScheduleRequest(req._id, "reject")}
                    disabled={reviewingRequestId === req._id}
                    variant="danger"
                    size="sm"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        </CardBody>
      </Card>

      {showForm && (
        <Modal
          open={showForm}
          title={isEditing ? "Modify Doctor" : "Create New Doctor"}
          onClose={handleCancelForm}
          size="lg"
        >
        <form
          onSubmit={handleSubmitDoctor}
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          <FormField label="Hospital ID">
            <input placeholder="Hospital ID" value={resolvedHospitalId || ""} readOnly />
          </FormField>

          <FormField label="Doctor ID (Auto)">
            <input placeholder="Doctor ID (Auto)" value={isEditing ? editingDoctorCode : nextDoctorId} readOnly />
          </FormField>
          
          <input
            placeholder="Full Name"
            value={doctorForm.name}
            onChange={(e) => setDoctorForm((p) => ({ ...p, name: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          />
          <input
            placeholder="Email"
            type="email"
            value={doctorForm.email}
            onChange={(e) => setDoctorForm((p) => ({ ...p, email: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          />
          <div style={{ color: "#475569", fontSize: 13, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 8, padding: "10px 12px" }}>
            Password is auto-generated securely when account is created.
          </div>
          <input
            placeholder="Phone"
            value={doctorForm.phone}
            onChange={(e) => setDoctorForm((p) => ({ ...p, phone: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          />
          <select
            value={doctorForm.department_id}
            onChange={(e) => {
              const departmentId = e.target.value;
              const departmentName = getDepartmentNameById(departmentId);
              const autoSchedule = getAutoScheduleByDepartment(departmentName, doctorForm.experience_years);
              setDoctorForm((p) => ({
                ...p,
                department_id: departmentId,
                shift: p.shift || autoSchedule.shift,
                available_days: p.available_days || autoSchedule.available_days,
                max_patients_per_day: p.max_patients_per_day || autoSchedule.max_patients_per_day,
              }));
            }}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          >
            <option value="">Select Department</option>
            {departmentList.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
          <input
            placeholder="Specialization"
            value={doctorForm.specialization}
            onChange={(e) => setDoctorForm((p) => ({ ...p, specialization: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          />
          <select
            value={doctorForm.shift}
            onChange={(e) => setDoctorForm((p) => ({ ...p, shift: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          >
            <option value="morning">Morning (8 AM - 2 PM)</option>
            <option value="evening">Evening (2 PM - 8 PM)</option>
            <option value="night">Night (8 PM - 8 AM)</option>
            <option value="flex">Flex</option>
          </select>
          <input
            placeholder="Available Days (comma separated)"
            value={doctorForm.available_days}
            onChange={(e) => setDoctorForm((p) => ({ ...p, available_days: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          />
          <input
            placeholder="Max Patients Per Day"
            type="number"
            min="1"
            value={doctorForm.max_patients_per_day}
            onChange={(e) => setDoctorForm((p) => ({ ...p, max_patients_per_day: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          />
          <input
            placeholder="Experience Years"
            type="number"
            min="0"
            value={doctorForm.experience_years}
            onChange={(e) => setDoctorForm((p) => ({ ...p, experience_years: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          />
          <select
            value={doctorForm.status}
            onChange={(e) => setDoctorForm((p) => ({ ...p, status: e.target.value }))}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="leave">Leave</option>
          </select>

          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="submit"
              disabled={actionLoading}
              variant="primary"
              className="hnu-btn-block"
            >
              {isEditing ? "Save Changes" : "Create Doctor"}
            </Button>
            <Button
              type="button"
              onClick={handleCancelForm}
              variant="outline"
              className="hnu-btn-block"
            >
              Cancel
            </Button>
          </div>
        </form>
        </Modal>
      )}

      <div style={{ paddingBottom: "250px" }}>
        <style>{`
          .doc-section-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            padding: 24px;
            margin-bottom: 28px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02);
            animation: fadeInUp 0.5s ease forwards;
          }
          .doc-section-title {
            font-size: 1.15rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .doc-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
            gap: 20px;
          }
          .doc-profile-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 20px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
            position: relative;
            overflow: hidden;
          }
          .doc-profile-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
            border-color: #cbd5e1;
          }
          .doc-avatar-wrap {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
          }
          .doc-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1rem;
            box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
          }
          .doc-info {
            flex: 1;
          }
          .doc-name {
            font-size: 1rem;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.2;
            margin-bottom: 2px;
          }
          .doc-specialty {
            font-size: 0.8rem;
            color: #2563eb;
            font-weight: 600;
          }
          .doc-meta-list {
            margin-top: 12px;
            display: grid;
            gap: 6px;
          }
          .doc-meta-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 0.8rem;
            color: #475569;
          }
          .doc-meta-icon {
            font-size: 0.85rem;
            color: #94a3b8;
            width: 16px;
            text-align: center;
          }
          .doc-actions {
            display: flex;
            gap: 8px;
            margin-top: 18px;
            border-top: 1px solid #f1f5f9;
            padding-top: 14px;
          }
          .badge-doc-status {
            display: inline-flex;
            align-items: center;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.025em;
            margin-left: auto;
          }
          .badge-doc-status.active {
            background: rgba(16, 185, 129, 0.08);
            color: #059669;
          }
          .badge-doc-status.suspended {
            background: rgba(239, 68, 68, 0.08);
            color: #dc2626;
          }
          .badge-doc-status.leave {
            background: rgba(245, 158, 11, 0.08);
            color: #d97706;
          }
        `}</style>

        {sortedDepartmentNames.length > 0 ? (
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ color: "#334155", fontWeight: 600 }}>Department View:</label>
            <select
              value={selectedDepartmentName}
              onChange={(e) => setSelectedDepartmentName(e.target.value)}
              style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 10px", minWidth: 220 }}
            >
              <option value="all">Show All Departments</option>
              {sortedDepartmentNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        ) : null}
        <h3 style={{ margin: "0 0 12px 0", color: "#0f172a" }}>Doctors List ({doctorsList.length})</h3>
        {lastGeneratedPassword ? (
          <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid #86efac", background: "#f0fdf4", color: "#166534", fontSize: 13 }}>
            Last generated password: <strong>{lastGeneratedPassword}</strong>
          </div>
        ) : null}
        {doctorsList.length === 0 ? (
          <p style={{ color: "#64748b" }}>No doctors yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {(selectedDepartmentName && selectedDepartmentName !== "all" ? [selectedDepartmentName] : sortedDepartmentNames).map((departmentName) => (
              <div key={departmentName} className="doc-section-card">
                <h4 className="doc-section-title">🏥 {departmentName} ({doctorsByDepartment[departmentName].length})</h4>
                <div className="doc-grid">
                  {doctorsByDepartment[departmentName].map((doc) => {
                    const initials = String(doc.name || "")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const statusClass = String(doc.status || "active").toLowerCase();

                    return (
                      <div key={doc.id} className="doc-profile-card">
                        <div>
                          <div className="doc-avatar-wrap">
                            <div className="doc-avatar">{initials}</div>
                            <div className="doc-info">
                              <div className="doc-name">{doc.name}</div>
                              <div className="doc-specialty">{doc.specialization || "General Practice"}</div>
                            </div>
                            <span className={`badge-doc-status ${statusClass}`}>
                              {doc.status || "active"}
                            </span>
                          </div>

                          <div className="doc-meta-list">
                            <div className="doc-meta-item">
                              <span className="doc-meta-icon">🆔</span>
                              <span>ID: <strong>{getDisplayDoctorId(doc)}</strong></span>
                            </div>
                            <div className="doc-meta-item">
                              <span className="doc-meta-icon">✉️</span>
                              <span style={{ wordBreak: "break-all" }}>{doc.email}</span>
                            </div>
                            {doc.phone && (
                              <div className="doc-meta-item">
                                <span className="doc-meta-icon">📞</span>
                                <span>{doc.phone}</span>
                              </div>
                            )}
                            <div className="doc-meta-item">
                              <span className="doc-meta-icon">🕒</span>
                              <span>Shift: {getShiftLabel(doc.shift || getAutoScheduleByDepartment(doc.department, doc.experience_years).shift)}</span>
                            </div>
                            <div className="doc-meta-item">
                              <span className="doc-meta-icon">📅</span>
                              <span>
                                Days: {(doc.available_days || []).length > 0
                                  ? (doc.available_days || []).join(", ")
                                  : getAutoScheduleByDepartment(doc.department, doc.experience_years).available_days
                                }
                              </span>
                            </div>
                            <div className="doc-meta-item">
                              <span className="doc-meta-icon">📊</span>
                              <span>Max Capacity: <strong>{getNormalizedDoctorCapacity(doc)} patients/day</strong></span>
                            </div>
                            <div className="doc-meta-item">
                              <span className="doc-meta-icon">🎖️</span>
                              <span>Experience: <strong>{doc.experience_years} years</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="doc-actions">
                          <Button
                            onClick={() => handleStartEditDoctor(doc)}
                            disabled={actionLoading}
                            variant="soft"
                            size="sm"
                            className="hnu-btn-block"
                          >
                            Modify
                          </Button>
                          <Button
                            onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                            disabled={actionLoading}
                            variant="danger"
                            size="sm"
                            className="hnu-btn-block"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
