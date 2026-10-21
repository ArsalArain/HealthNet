import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function AdminRosterOptimization() {
  const [departments, setDepartments] = useState([]);
  const [optimizeForm, setOptimizeForm] = useState({ department_id: "" });
  const [optimizing, setOptimizing] = useState(false);
  const [loadingOptimize, setLoadingOptimize] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState(null);
  const [optimizeProposals, setOptimizeProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [processingProposalId, setProcessingProposalId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showProposals, setShowProposals] = useState(false);
  const [selectedDayDoctors, setSelectedDayDoctors] = useState(null);
  const [selectedDayName, setSelectedDayName] = useState("");
  const [selectedDepartmentRoster, setSelectedDepartmentRoster] = useState([]);

  const getDocorAvailability = (doctorName) => {
    // Look up doctor in the selected department's roster to get their shift details
    const doctor = selectedDepartmentRoster.find(doc => 
      (typeof doc === "object" && doc.doctor_name === doctorName) || 
      doc === doctorName
    );
    
    if (doctor && typeof doctor === "object") {
      // Check for various shift/timing fields in order of preference
      if (doctor.shift_window) return doctor.shift_window;
      if (doctor.shift_timing) return doctor.shift_timing;
      if (doctor.availability) return doctor.availability;
      if (doctor.shift) {
        // Map shift enum to readable times if shift_window not available
        const shiftMap = {
          "morning": "8 AM - 2 PM",
          "evening": "2 PM - 8 PM",
          "night": "8 PM - 8 AM",
          "flex": "Flexible"
        };
        return shiftMap[doctor.shift] || doctor.shift;
      }
      if (doctor.working_hours) return doctor.working_hours;
    }
    
    return "Full Day (24 hrs)";
  };

  useEffect(() => {
    loadDepartments();
    loadOptimizationProposals();
    // Load previous optimization result from localStorage
    const savedResult = localStorage.getItem("optimizationResult");
    if (savedResult) {
      try {
        setOptimizeResult(JSON.parse(savedResult));
      } catch (error) {
        console.error("Failed to load saved optimization result", error);
      }
    }
  }, []);

  const loadDepartments = async () => {
    try {
      const { data } = await api.get("/hospital-admin/departments");
      const list = data?.departments || [];
      setDepartments(list);
    } catch (error) {
      console.error("Failed to load departments", error);
      setMessage({ type: "error", text: "Failed to load departments." });
    }
  };

  const loadOptimizationProposals = async (status = "") => {
    try {
      setLoadingOptimize(true);
      const params = {};
      if (status) params.status = status;
      const { data } = await api.get("/hospital-admin/ai/smart-scheduling/optimize/proposals", { params });
      setOptimizeProposals(Array.isArray(data?.proposals) ? data.proposals : []);
    } catch (error) {
      console.error("Failed to load optimization proposals", error);
      setOptimizeProposals([]);
    } finally {
      setLoadingOptimize(false);
    }
  };

  const handleOptimizeScheduling = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      setOptimizing(true);
      const payload = {};
      if (optimizeForm.department_id) {
        payload.department_id = optimizeForm.department_id;
      }

      const { data } = await api.post("/hospital-admin/ai/smart-scheduling/optimize", payload, { timeout: 120000 });
      setOptimizeResult(data || null);
      setSelectedDayDoctors(null);
      // Save result to localStorage for persistence across navigation
      if (data) {
        localStorage.setItem("optimizationResult", JSON.stringify(data));
      }
      setMessage({ type: "success", text: data?.message || "Optimization proposal generated." });
      await loadOptimizationProposals();
    } catch (error) {
      const detail = error.response?.data?.message || error.message || "Failed to generate optimization proposal.";
      setMessage({ type: "error", text: detail });
    } finally {
      setOptimizing(false);
    }
  };

  const handleApproveProposal = async (proposalId) => {
    if (!proposalId) return;
    try {
      setProcessingProposalId(String(proposalId));
      const { data } = await api.post(`/hospital-admin/ai/smart-scheduling/optimize/${proposalId}/approve`, {
        feedback: "Approved by admin"
      });
      setMessage({ type: "success", text: data?.message || "Proposal approved successfully." });
      await loadOptimizationProposals();
      setSelectedProposal(null);
    } catch (error) {
      const detail = error.response?.data?.message || error.message || "Failed to approve proposal.";
      setMessage({ type: "error", text: detail });
    } finally {
      setProcessingProposalId("");
    }
  };

  const handleRejectProposal = async (proposalId) => {
    if (!proposalId) return;
    try {
      setProcessingProposalId(String(proposalId));
      const { data } = await api.post(`/hospital-admin/ai/smart-scheduling/optimize/${proposalId}/reject`, {
        reason: "Rejected by admin review"
      });
      setMessage({ type: "success", text: data?.message || "Proposal rejected." });
      await loadOptimizationProposals();
      setSelectedProposal(null);
    } catch (error) {
      const detail = error.response?.data?.message || error.message || "Failed to reject proposal.";
      setMessage({ type: "error", text: detail });
    } finally {
      setProcessingProposalId("");
    }
  };

  return (
    <div style={{ padding: 20, display: "grid", gap: 20 }}>
      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 28, marginBottom: 8 }}>Optimize Weekly Roster</h2>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
          Generate optimal doctor schedules with 6-day work weeks, personal holidays, and 24-hour coverage guaranteed
        </p>
      </div>

      {/* MESSAGE */}
      {message.text && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: message.type === "error" ? "#fee2e2" : "#dcfce7",
            color: message.type === "error" ? "#991b1b" : "#166534",
            fontSize: 14,
            border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* OPTIMIZATION FORM */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, display: "grid", gap: 14 }}>
        <div>
          <h3 style={{ margin: 0, color: "#065f46" }}>Generate Optimization Proposal</h3>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Analyze staffing and generate recommendations to achieve optimal 24/7 coverage
          </p>
        </div>

        <form onSubmit={handleOptimizeScheduling} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>Department Scope</label>
            <select
              value={optimizeForm.department_id}
              onChange={(e) => setOptimizeForm((prev) => ({ ...prev, department_id: e.target.value }))}
              style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
            >
              <option value="">All Departments</option>
              {departments.map((department) => {
                const id = String(department._id || department.id);
                return (
                  <option key={`optimize-${id}`} value={id}>
                    {department.name}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="submit"
            disabled={optimizing}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "11px 14px",
              background: "linear-gradient(135deg, #047857, #10b981)",
              color: "#fff",
              fontWeight: 700,
              cursor: optimizing ? "not-allowed" : "pointer",
              opacity: optimizing ? 0.75 : 1,
            }}
          >
            {optimizing ? "Generating Proposal..." : "Generate Optimization Proposal"}
          </button>
        </form>
      </div>

      {/* OPTIMIZATION RESULT */}
      {optimizeResult ? (
        <div style={{ border: "1px solid #d1fae5", borderRadius: 12, background: "#f0fdf4", padding: 14, display: "grid", gap: 12 }}>
          <div style={{ color: "#065f46", fontWeight: 700 }}>Optimization Analysis & Proposal</div>

          {optimizeResult?.proposal ? (
            <div style={{ border: "1px solid #a7f3d0", borderRadius: 10, padding: 10, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ color: "#0f172a", fontWeight: 700 }}>
                  Proposal ID: {optimizeResult.proposal.id}
                </div>
                <div style={{ color: "#065f46", fontWeight: 700, textTransform: "uppercase" }}>
                  {optimizeResult.proposal.status}
                </div>
              </div>
              <div style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>
                Changes: {optimizeResult.proposal.changes_count || 0} | Doctors affected: {optimizeResult.proposal?.summary?.doctors_affected || 0} | Appointments to review: {optimizeResult.proposal?.summary?.appointments_to_review || 0}
              </div>
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
            <div style={{ background: "#fff", border: "1px solid #a7f3d0", borderRadius: 10, padding: 10 }}>
              <div style={{ color: "#059669", fontSize: 12 }}>Coverage Gaps</div>
              <div style={{ color: "#065f46", fontWeight: 800, fontSize: 20 }}>{optimizeResult?.analysis?.total_coverage_gaps ?? 0}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #a7f3d0", borderRadius: 10, padding: 10 }}>
              <div style={{ color: "#059669", fontSize: 12 }}>Departments Analyzed</div>
              <div style={{ color: "#065f46", fontWeight: 800, fontSize: 20 }}>{optimizeResult?.analysis?.total_departments ?? 0}</div>
            </div>
          </div>

          {Array.isArray(optimizeResult?.analysis?.departments) && optimizeResult.analysis.departments.length > 0 ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ color: "#065f46", fontWeight: 700 }}>Roster by Department</div>
              {optimizeResult.analysis.departments.map((dept) => (
                <div key={dept.department_id} style={{ border: "1px solid #d1fae5", borderRadius: 10, padding: 10, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{dept.department_name}</div>
                    <div style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>
                      {dept.schedule ? "Optimized Schedule" : "Coverage Analysis"}
                    </div>
                  </div>

                  {dept.status === "optimal_schedule" ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
                        ✓ Optimized Schedule: 6 days/doctor, 3+ doctors/day
                      </div>

                      <div style={{ borderTop: "1px solid #d1fae5", paddingTop: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#065f46", marginBottom: 6 }}>
                          Doctor Assignments:
                        </div>
                        <div style={{ display: "grid", gap: 6, maxHeight: 250, overflowY: "auto" }}>
                          {dept.schedule?.roster.map((doc, idx) => (
                            <div key={`roster-${idx}`} style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: 8 }}>
                              <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4, fontSize: 13 }}>
                                {doc.doctor_name}
                              </div>
                              <div style={{ fontSize: 11, color: "#059669", marginBottom: 3 }}>
                                Days: {doc.work_days.join(", ")}
                              </div>
                              <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>
                                Holiday: {doc.holiday}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid #d1fae5", paddingTop: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#065f46", marginBottom: 6 }}>
                          Daily Coverage (Min 3):
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8 }}>
                          {dept.weekday_coverage.map((day) => {
                            const hasMinCoverage = day.doctor_count >= 3;
                            return (
                              <div key={`coverage-${day.weekday}`} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 4,
                                    border: hasMinCoverage ? "1px solid #a7f3d0" : "2px solid #fecaca",
                                    borderRadius: 8,
                                    padding: 8,
                                    background: hasMinCoverage ? "#ecfdf5" : "#fef2f2",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: hasMinCoverage ? "#065f46" : "#991b1b",
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {day.weekday}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 800,
                                      color: hasMinCoverage ? "#059669" : "#dc2626",
                                    }}
                                  >
                                    {day.doctor_count} doc
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDayDoctors(day.doctors || []);
                                    setSelectedDayName(day.weekday);
                                    setSelectedDepartmentRoster(dept.schedule?.roster || []);
                                  }}
                                  style={{
                                    border: "1px solid #cbd5e1",
                                    borderRadius: 6,
                                    padding: "6px 8px",
                                    background: "#f1f5f9",
                                    color: "#0f172a",
                                    cursor: "pointer",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = "#e2e8f0";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = "#f1f5f9";
                                  }}
                                >
                                  👥 View Doctors
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : dept.status === "insufficient_staff" ? (
                    <div
                      style={{
                        padding: 10,
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        color: "#991b1b",
                        fontSize: 12,
                      }}
                    >
                      {dept.message}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* RECENT PROPOSALS - COLLAPSIBLE */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
        <button
          type="button"
          onClick={() => {
            setShowProposals(!showProposals);
            if (!showProposals) loadOptimizationProposals();
          }}
          style={{
            border: "none",
            borderRadius: 8,
            padding: "11px 16px",
            background: showProposals ? "linear-gradient(135deg, #0f766e, #14b8a6)" : "linear-gradient(135deg, #1e293b, #334155)",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
            transition: "all 0.3s ease",
          }}
        >
          {showProposals ? "▼ Hide" : "▶ Show"} Proposal History
        </button>
      </div>

      {showProposals && (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, display: "grid", gap: 14 }}>
        <div>
          <h3 style={{ margin: 0, color: "#065f46" }}>Recent Optimization Proposals</h3>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Review and approve optimization proposals
          </p>
        </div>

        {loadingOptimize ? (
          <div style={{ color: "#64748b", fontSize: 14 }}>Loading proposals...</div>
        ) : optimizeProposals.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 14 }}>No optimization proposals generated yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {optimizeProposals.map((proposal) => (
              <div
                key={proposal.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: 12,
                  background: "#fff",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {proposal.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      ID: {proposal.id} | Status: <span style={{ fontWeight: 600, color: proposal.status === "pending" ? "#9a3412" : "#059669" }}>
                        {String(proposal.status).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {proposal.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApproveProposal(proposal.id)}
                          disabled={processingProposalId === String(proposal.id)}
                          style={{
                            border: "none",
                            borderRadius: 6,
                            padding: "8px 12px",
                            background: "#10b981",
                            color: "#fff",
                            cursor: processingProposalId === String(proposal.id) ? "not-allowed" : "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            opacity: processingProposalId === String(proposal.id) ? 0.6 : 1,
                          }}
                        >
                          {processingProposalId === String(proposal.id) ? "Processing..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleRejectProposal(proposal.id)}
                          disabled={processingProposalId === String(proposal.id)}
                          style={{
                            border: "1px solid #fecaca",
                            borderRadius: 6,
                            padding: "8px 12px",
                            background: "#fff",
                            color: "#dc2626",
                            cursor: processingProposalId === String(proposal.id) ? "not-allowed" : "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            opacity: processingProposalId === String(proposal.id) ? 0.6 : 1,
                          }}
                        >
                          {processingProposalId === String(proposal.id) ? "Processing..." : "Reject"}
                        </button>
                      </>
                    )}
                    {proposal.status === "approved" && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#059669", textTransform: "uppercase" }}>✓ Approved</span>
                    )}
                    {proposal.status === "rejected" && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", textTransform: "uppercase" }}>✗ Rejected</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#475569" }}>
                  Changes: {proposal.changes_count} | Doctors affected: {proposal.summary?.doctors_affected || 0} | Created: {new Date(proposal.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* DOCTORS MODAL */}
      {selectedDayDoctors !== null && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedDayDoctors(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              maxWidth: 400,
              maxHeight: 500,
              overflowY: "auto",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#0f172a", textTransform: "capitalize", fontSize: 16 }}>
                Doctors Available on {selectedDayName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDayDoctors(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            {selectedDayDoctors.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {selectedDayDoctors.map((doctor, idx) => {
                  const doctorName = typeof doctor === "string" ? doctor : doctor.name || doctor;
                  const timing = getDocorAvailability(doctorName);
                  return (
                    <div
                      key={`${selectedDayName}-${idx}`}
                      style={{
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        borderRadius: 8,
                        padding: 12,
                        color: "#0f172a",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        {idx + 1}. {doctorName}
                      </div>
                      <div style={{ fontSize: 11, color: "#047857", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                        ⏰ {timing}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#64748b", textAlign: "center", padding: "20px 0" }}>
                No doctors available on this day
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
