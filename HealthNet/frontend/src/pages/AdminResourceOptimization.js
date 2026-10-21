import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getAuthUser } from "../utils/authStorage";
import DepartmentResources from "../components/DepartmentResources";

const RESOURCE_OPT_CACHE_PREFIX = "resource_opt_cache_v1";
const RESOURCE_OPT_CACHE_TTL_MS = 2 * 60 * 1000;

export default function AdminResourceOptimization() {
  const authUser = getAuthUser();
  const authHospitalId = authUser?.hospital_id || authUser?.hospital?.id || authUser?.hospital?._id || "";

  const [departments, setDepartments] = useState([]);
  const [resources, setResources] = useState([]);
  const [validations, setValidations] = useState([]);
  const [validationsLoading, setValidationsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [coverageRows, setCoverageRows] = useState([]);
  const [coverageSummary, setCoverageSummary] = useState(null);
  const [coverageInput, setCoverageInput] = useState(null);
  const [aiPredictions, setAiPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [resourceCsvFile, setResourceCsvFile] = useState(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [expandedDepartmentId, setExpandedDepartmentId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [fileActionId, setFileActionId] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const loadAll = async (force = false, silent = false) => {
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `${RESOURCE_OPT_CACHE_PREFIX}:${today}`;

    if (!force) {
      try {
        const cachedRaw = sessionStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const age = Date.now() - Number(cached?.timestamp || 0);
          if (cached?.data && age >= 0 && age < RESOURCE_OPT_CACHE_TTL_MS) {
            setDepartments(Array.isArray(cached.data.departments) ? cached.data.departments : []);
            setResources(Array.isArray(cached.data.resources) ? cached.data.resources : []);
            setCoverageRows(Array.isArray(cached.data.coverageRows) ? cached.data.coverageRows : []);
            setCoverageSummary(cached.data.coverageSummary || null);
            setCoverageInput(cached.data.coverageInput || null);
            setAiPredictions(Array.isArray(cached.data.aiPredictions) ? cached.data.aiPredictions : []);
            setUploadedFiles(Array.isArray(cached.data.uploadedFiles) ? cached.data.uploadedFiles : []);
            
            // Still fetch validations in background since they are real-time
            api.get("/department-resources/validations?hospital_id=" + authHospitalId + "&status=pending")
              .then(({ data }) => {
                setValidations(Array.isArray(data?.data) ? data.data : []);
                setValidationsLoading(false);
              })
              .catch(() => {
                setValidationsLoading(false);
              });

            if (!silent) {
              setLoading(false);
              setFilesLoading(false);
            }
            return;
          }
        }
      } catch {
        // Ignore cache parsing errors and continue with network requests.
      }
    }

    if (!silent) {
      setLoading(true);
      setFilesLoading(true);
      setValidationsLoading(true);
      setMessage({ type: "", text: "" });
      setAiPredictions([]);
    }

    let nextDepartments = [];
    let nextResources = [];
    let nextCoverageRows = [];
    let nextCoverageSummary = null;
    let nextCoverageInput = null;
    let nextAiPredictions = [];
    let nextUploadedFiles = [];
    let nextValidations = [];

    const [deptResult, resourceResult, coverageResult, filesResult, predictionResult, validationsResult] = await Promise.allSettled([
      api.get("/hospital-admin/departments"),
      api.get("/hospital-admin/resources"),
      api.get("/hospital-admin/resources/coverage-insights", {
        params: {
          demand_mode: "predicted",
          date: today,
          gender: "all",
        },
      }),
      api.get("/hospital-admin/resources/uploads"),
      api.get("/hospital-admin/ai/predictions-by-department", {
        params: {
          date: today,
          gender: "all",
          disease: "all",
        },
      }),
      api.get("/department-resources/validations?hospital_id=" + authHospitalId + "&status=pending"),
    ]);

    if (deptResult.status === "fulfilled") {
      nextDepartments = Array.isArray(deptResult.value?.data?.departments) ? deptResult.value.data.departments : [];
    }
    if (resourceResult.status === "fulfilled") {
      nextResources = Array.isArray(resourceResult.value?.data?.resources) ? resourceResult.value.data.resources : [];
    }
    if (coverageResult.status === "fulfilled") {
      const coverageData = coverageResult.value?.data || {};
      nextCoverageRows = Array.isArray(coverageData?.coverage) ? coverageData.coverage : Array.isArray(coverageData?.rows) ? coverageData.rows : [];
      nextCoverageSummary = coverageData?.summary || null;
      nextCoverageInput = coverageData?.input || null;
    }
    if (filesResult.status === "fulfilled") {
      nextUploadedFiles = Array.isArray(filesResult.value?.data?.files) ? filesResult.value.data.files : [];
    }
    if (predictionResult && predictionResult.status === "fulfilled") {
      const predictionData = predictionResult.value?.data || {};
      nextAiPredictions = Array.isArray(predictionData?.predictions)
        ? predictionData.predictions.map((item) => ({
            department_id: String(item?.department_id || ""),
            expected_patients: Number(item?.expected_patients || 0),
            prediction_source: item?.prediction_source || (item?.forecast_strategy ? `Patient Flow AI (${item.forecast_strategy})` : "Patient Flow AI"),
          }))
        : [];
    }
    if (validationsResult && validationsResult.status === "fulfilled") {
      nextValidations = Array.isArray(validationsResult.value?.data?.data) ? validationsResult.value.data.data : [];
    }

    setDepartments(nextDepartments);
    setResources(nextResources);
    setCoverageRows(nextCoverageRows);
    setCoverageSummary(nextCoverageSummary);
    setCoverageInput(nextCoverageInput);
    setAiPredictions(nextAiPredictions);
    setUploadedFiles(nextUploadedFiles);
    setValidations(nextValidations);

    const failure = deptResult.status === "rejected"
      ? deptResult.reason
      : resourceResult.status === "rejected"
        ? resourceResult.reason
        : null;

    if (failure) {
      setMessage({
        type: "error",
        text: failure?.response?.data?.message || "Failed to load resource optimization data.",
      });
    } else if (coverageResult.status === "rejected") {
      setMessage({
        type: "",
        text: "Forecast data unavailable. Showing saved resources and uploaded files.",
      });
    }

    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          timestamp: Date.now(),
          data: {
            departments: nextDepartments,
            resources: nextResources,
            coverageRows: nextCoverageRows,
            coverageSummary: nextCoverageSummary,
            coverageInput: nextCoverageInput,
            aiPredictions: nextAiPredictions,
            uploadedFiles: nextUploadedFiles,
          },
        })
      );
    } catch {
      // Ignore session storage failures.
    }

    setLoading(false);
    setFilesLoading(false);
    setValidationsLoading(false);
  };

  const handleApproveValidation = async (id) => {
    try {
      setMessage({ type: "", text: "" });
      await api.post(`/department-resources/validations/${id}/approve`);
      setMessage({ type: "success", text: "Resource deduction approved and inventory updated!" });
      setRefreshKey((prev) => prev + 1);
      await loadAll(true);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to approve resource deduction." });
    }
  };

  const handleRejectValidation = async (id) => {
    try {
      setMessage({ type: "", text: "" });
      await api.post(`/department-resources/validations/${id}/reject`);
      setMessage({ type: "success", text: "Resource deduction request rejected." });
      setRefreshKey((prev) => prev + 1);
      await loadAll(true);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to reject resource deduction." });
    }
  };

  useEffect(() => {
    loadAll(false);

    const handleRefresh = () => {
      loadAll(true, true);
    };
    window.addEventListener("healthnetRefreshData", handleRefresh);
    return () => window.removeEventListener("healthnetRefreshData", handleRefresh);
  }, [authHospitalId]);

  const mergedCoverageRows = useMemo(() => {
    const rows = Array.isArray(coverageRows) ? coverageRows.map((row) => ({ ...row })) : [];
    const rowsById = new Map(rows.map((row) => [String(row.department_id || ""), row]));

    for (const prediction of aiPredictions) {
      const key = String(prediction?.department_id || "");
      const row = rowsById.get(key);
      if (!row) continue;

      const predictedPatients = Math.max(0, Number(prediction?.expected_patients || 0));
      row.predicted_patients = predictedPatients;
      row.demand_patients = predictedPatients;
      row.demand_source = prediction?.prediction_source || row.demand_source || "historical_fallback";

      const availableUnits = Number(row.available_units || 0);
      const totalResources = Number(row.total_resources || 0);
      row.available_units_per_demand_patient = predictedPatients > 0 ? availableUnits / predictedPatients : null;

      if (predictedPatients === 0) row.coverage_state = "no_patient_load";
      else if (totalResources === 0) row.coverage_state = "no_resources";
      else if ((row.available_units_per_demand_patient || 0) < 0.5) row.coverage_state = "critical";
      else if ((row.available_units_per_demand_patient || 0) < 1) row.coverage_state = "strained";
      else if (!row.coverage_state) row.coverage_state = "stable";
    }

    return rows.sort((a, b) => Number(b.demand_patients || 0) - Number(a.demand_patients || 0));
  }, [coverageRows, aiPredictions]);

  const displayCoverageSummary = useMemo(() => {
    if (!Array.isArray(mergedCoverageRows) || mergedCoverageRows.length === 0) {
      return coverageSummary;
    }

    return mergedCoverageRows.reduce(
      (acc, row) => {
        acc.total_departments += 1;
        acc.total_resources += Number(row.total_resources || 0);
        acc.total_units += Number(row.total_units || 0);
        acc.total_available_units += Number(row.available_units || 0);
        acc.active_patients += Number(row.active_patients || 0);
        acc.demand_patients += Number(row.demand_patients || 0);
        if (Number(row.predicted_patients || 0) > 0) acc.predicted_departments += 1;
        if (row.coverage_state === "critical") acc.critical_departments += 1;
        if (row.coverage_state === "strained") acc.departments_strained += 1;
        if (row.coverage_state === "no_resources" && Number(row.demand_patients || 0) > 0) {
          acc.departments_missing_resources += 1;
        }
        return acc;
      },
      {
        total_departments: 0,
        total_resources: 0,
        total_units: 0,
        total_available_units: 0,
        active_patients: 0,
        demand_patients: 0,
        predicted_departments: 0,
        critical_departments: 0,
        departments_strained: 0,
        departments_missing_resources: 0,
      }
    );
  }, [coverageSummary, mergedCoverageRows]);

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "-";
    if (!Number.isFinite(Number(value))) return "-";
    return `${Number(value).toFixed(1)}%`;
  };

  const getCoverageLabel = (state) => {
    if (state === "critical") return { label: "Critical", color: "#b91c1c", bg: "#fef2f2" };
    if (state === "strained") return { label: "Strained", color: "#b45309", bg: "#fffbeb" };
    if (state === "no_resources") return { label: "No Resources", color: "#7c2d12", bg: "#fff7ed" };
    if (state === "no_patient_load") return { label: "No Patient Load", color: "#334155", bg: "#f8fafc" };
    return { label: "Stable", color: "#166534", bg: "#f0fdf4" };
  };

  const resourcesByDepartment = useMemo(() => {
    if (Array.isArray(mergedCoverageRows) && mergedCoverageRows.length > 0) {
      return mergedCoverageRows;
    }

    const map = new Map();
    for (const dept of departments) {
      map.set(String(dept._id || dept.id), {
        department_id: String(dept._id || dept.id),
        department_name: dept.name,
        total: 0,
        total_units: 0,
        available_units: 0,
        used_units: 0,
        low_stock: 0,
        out_of_stock: 0,
        maintenance: 0,
      });
    }

    for (const item of resources) {
      const deptId = item?.department_id?._id || item?.department_id;
      const key = deptId ? String(deptId) : "hospital";
      if (!map.has(key)) {
        map.set(key, {
          department_id: key,
          department_name: key === "hospital" ? "Hospital Shared Pool" : "Unknown Department",
          total: 0,
          total_units: 0,
          available_units: 0,
          used_units: 0,
          low_stock: 0,
          out_of_stock: 0,
          maintenance: 0,
        });
      }
      const row = map.get(key);
      row.total += 1;
      const totalQty = Number(item?.quantity || 0);
      const availableQty = Number(item?.available_quantity || 0);
      row.total_units += Number.isFinite(totalQty) ? totalQty : 0;
      row.available_units += Number.isFinite(availableQty) ? availableQty : 0;
      row.used_units = Math.max(0, row.total_units - row.available_units);
      if (item.status === "low_stock") row.low_stock += 1;
      if (item.status === "out_of_stock") row.out_of_stock += 1;
      if (item.status === "maintenance") row.maintenance += 1;
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [mergedCoverageRows, departments, resources]);

  const resourcesByDepartmentId = useMemo(() => {
    const grouped = new Map();
    for (const item of resources) {
      const deptId = item?.department_id?._id || item?.department_id;
      const key = deptId ? String(deptId) : "hospital";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    }

    for (const [key, list] of grouped.entries()) {
      list.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
      grouped.set(key, list);
    }

    return grouped;
  }, [resources]);

  const onUploadResourceCsv = async (event) => {
    event.preventDefault();
    if (!resourceCsvFile) {
      setMessage({ type: "error", text: "Please select a CSV file first." });
      return;
    }

    try {
      setUploadingCsv(true);
      setMessage({ type: "", text: "" });
      const formData = new FormData();
      formData.append("file", resourceCsvFile);

      // Let browser/axios set multipart boundary automatically.
      const { data } = await api.post("/hospital-admin/resources/upload-csv", formData);

      setUploadSummary(data?.summary || null);
      setMessage({ type: "success", text: data?.message || "CSV uploaded successfully." });
      setResourceCsvFile(null);
      await loadAll(true);
    } catch (error) {
      const responsePayload = error?.response?.data;
      const detailedMessage = typeof responsePayload === "string"
        ? responsePayload
        : responsePayload?.message || error?.message || "Failed to upload resource CSV.";
      setMessage({
        type: "error",
        text: detailedMessage,
      });
    } finally {
      setUploadingCsv(false);
    }
  };

  const onDownloadUploadedFile = async (file) => {
    try {
      setFileActionId(file.file_name);
      const { data } = await api.get("/hospital-admin/resources/uploads/download", {
        params: { file_key: file.relative_path },
        responseType: "blob",
      });
      const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.original_name || file.file_name || "resource.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to download uploaded resource file.",
      });
    } finally {
      setFileActionId("");
    }
  };

  const onOpenUploadedFile = async (file) => {
    try {
      setFileActionId(file.file_name);
      setPreviewLoading(true);
      setPreviewFile(file);
      const { data } = await api.get("/hospital-admin/resources/uploads/preview", {
        params: { file_key: file.relative_path },
      });
      setPreviewData(data || null);
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to open uploaded resource file.",
      });
      setPreviewFile(null);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
      setFileActionId("");
    }
  };

  const onRemoveUploadedFile = async (file) => {
    const confirmed = window.confirm(`Remove uploaded file ${file.original_name || file.file_name}?`);
    if (!confirmed) return;

    try {
      setFileActionId(file.file_name);
      await api.delete("/hospital-admin/resources/uploads", {
        params: { file_key: file.relative_path },
      });
      setMessage({ type: "success", text: "Uploaded resource file removed." });
      await loadAll(true);
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to remove uploaded resource file.",
      });
    } finally {
      setFileActionId("");
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div>
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 26 }}>Resources Optimization</h2>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
          Monitor resource coverage, stock health, and predicted patient demand across all departments.
        </p>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
          Note: Resource Types = number of resource items. Unit columns show actual quantities (total, used, available).
        </p>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
          Demand Source: {coverageInput?.demand_mode === "predicted" ? `AI forecast (${coverageInput?.date || "today"})` : "Current active patients"}.
        </p>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
          Low Stock/Out Of Stock/Maintenance are counts of resource types in those states, not total available units.
        </p>
      </div>

      {message.text && (
        <div
          style={{
            borderRadius: 10,
            padding: 12,
            border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
            background: message.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: message.type === "error" ? "#991b1b" : "#166534",
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, color: "#0f172a" }}>Upload Resource CSV</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Upload dataset snapshot file and import latest resource values by department.
          </div>
        </div>

        <form onSubmit={onUploadResourceCsv} style={{ display: "grid", gap: 10 }}>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setResourceCsvFile(e.target.files?.[0] || null)}
            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: 10, background: "#fff" }}
          />
          <button
            type="submit"
            disabled={uploadingCsv}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "10px 14px",
              background: "linear-gradient(135deg, #0f766e, #14b8a6)",
              color: "#fff",
              fontWeight: 700,
              cursor: uploadingCsv ? "not-allowed" : "pointer",
              opacity: uploadingCsv ? 0.75 : 1,
              width: "fit-content",
            }}
          >
            {uploadingCsv ? "Uploading..." : "Upload CSV"}
          </button>
        </form>

        {uploadSummary ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>CSV Rows</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{uploadSummary.total_rows || 0}</div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Created</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#065f46" }}>{uploadSummary.created_count || 0}</div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Updated</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0369a1" }}>{uploadSummary.updated_count || 0}</div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Skipped</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#9a3412" }}>{uploadSummary.skipped_count || 0}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, color: "#0f172a" }}>Uploaded Resource Files</div>
            <div style={{ color: "#64748b", fontSize: 13 }}>
              Download or remove the archived CSV uploads for this hospital.
            </div>
          </div>
          <div style={{ color: "#64748b", fontSize: 13 }}>{filesLoading ? "Loading files..." : `${uploadedFiles.length} file(s)`}</div>
        </div>

        {uploadedFiles.length === 0 ? (
          <div style={{ color: "#64748b" }}>No uploaded resource files found.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {uploadedFiles.map((file) => (
              <div
                key={file.relative_path}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{file.original_name || file.file_name}</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    Department: {file.department_name || "Unknown department"} · Uploaded: {file.uploaded_at ? new Date(file.uploaded_at).toLocaleString() : "-"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => onOpenUploadedFile(file)}
                    disabled={fileActionId === file.file_name}
                    style={{
                      border: "1px solid #2563eb",
                      borderRadius: 8,
                      padding: "8px 12px",
                      background: "#fff",
                      color: "#2563eb",
                      fontWeight: 700,
                      cursor: fileActionId === file.file_name ? "not-allowed" : "pointer",
                    }}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownloadUploadedFile(file)}
                    disabled={fileActionId === file.file_name}
                    style={{
                      border: "1px solid #0f766e",
                      borderRadius: 8,
                      padding: "8px 12px",
                      background: "#fff",
                      color: "#0f766e",
                      fontWeight: 700,
                      cursor: fileActionId === file.file_name ? "not-allowed" : "pointer",
                    }}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveUploadedFile(file)}
                    disabled={fileActionId === file.file_name}
                    style={{
                      border: "1px solid #ef4444",
                      borderRadius: 8,
                      padding: "8px 12px",
                      background: "#fff",
                      color: "#ef4444",
                      fontWeight: 700,
                      cursor: fileActionId === file.file_name ? "not-allowed" : "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewData ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setPreviewData(null);
            setPreviewFile(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 80,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(1100px, 100%)",
              maxHeight: "85vh",
              overflow: "hidden",
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.35)",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 18, paddingBottom: 12, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                  {previewFile?.original_name || previewFile?.file_name || "Resource preview"}
                </div>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  {previewData?.file?.department_name || previewFile?.department_name || "Unknown department"} · {previewData?.preview?.total_rows || 0} row(s) previewed
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => onDownloadUploadedFile(previewData.file)}
                  style={{
                    border: "1px solid #0f766e",
                    background: "#fff",
                    color: "#0f766e",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewData(null);
                    setPreviewFile(null);
                  }}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#0f172a",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{ padding: 18, display: "grid", gap: 12, overflow: "auto", flex: 1 }}>
              {previewLoading ? (
                <div style={{ color: "#64748b" }}>Opening preview...</div>
              ) : previewData?.preview?.warning ? (
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }}>
                  {previewData.preview.warning}
                </div>
              ) : null}

              {previewData?.preview?.preview_rows?.length ? (
                <div style={{ overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e2e8f0" }}>#</th>
                      {previewData.preview.columns.map((column) => (
                        <th key={column} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e2e8f0" }}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.preview.preview_rows.map((row, index) => (
                      <tr key={`${index}-${previewFile?.relative_path || "resource-preview"}`}>
                        <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>{index + 1}</td>
                        {previewData.preview.columns.map((column) => (
                          <td key={column} style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                            {row?.[column] === null || row?.[column] === undefined || row?.[column] === ""
                              ? "-"
                              : String(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              ) : !previewLoading ? (
                <div style={{ color: "#64748b" }}>No preview rows available for this file.</div>
              ) : null}
            </div>

            <div style={{ padding: 16, borderTop: "1px solid #e2e8f0", background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)", position: "sticky", bottom: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Preview bar</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Use horizontal scrolling to inspect wide files. Download if you need the original sheet or CSV.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => onDownloadUploadedFile(previewData.file)}
                    style={{
                      border: "1px solid #0f766e",
                      background: "#fff",
                      color: "#0f766e",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewData(null);
                      setPreviewFile(null);
                    }}
                    style={{
                      border: "1px solid #cbd5e1",
                      background: "#fff",
                      color: "#0f172a",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {validations.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
            color: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: "#10b981", fontWeight: 700 }}>
                Pending Prescription Resource Deductions ({validations.length})
              </h3>
              <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>
                Extracted resources from doctor prescriptions awaiting validation before inventory deduction.
              </p>
            </div>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.15)", color: "#94a3b8" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Patient / Doctor</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Department</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Prescription Details</th>
                  <th style={{ textAlign: "left", padding: "8px 12px" }}>Extracted Resources</th>
                  <th style={{ textAlign: "right", padding: "8px 12px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {validations.map((v) => (
                  <tr key={v._id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", verticalAlign: "top" }}>
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{v.patient_id?.name || "N/A"}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>By Dr. {v.doctor_id?.name || "Doctor"}</div>
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#10b981",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600
                      }}>
                        {v.department_id?.name || "N/A"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 12px", maxWidth: 250 }}>
                      <div style={{ fontWeight: 500, color: "#cbd5e1" }}>
                        Medicines: {v.prescription_id?.medicines?.join(", ") || "None"}
                      </div>
                      {v.prescription_id?.instructions && (
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontStyle: "italic" }}>
                          "{v.prescription_id.instructions}"
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      {v.resources?.map((r) => (
                        <div key={r.resource_id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                          <span style={{ color: "#38bdf8", fontWeight: 600 }}>•</span>
                          <span>{r.name}</span>
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>(Qty: {r.quantity_requested})</span>
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleApproveValidation(v._id)}
                          style={{
                            background: "#10b981",
                            color: "#fff",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: 13,
                            transition: "background 0.2s"
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectValidation(v._id)}
                          style={{
                            background: "transparent",
                            color: "#ef4444",
                            border: "1px solid #ef4444",
                            padding: "6px 12px",
                            borderRadius: 6,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: 13,
                            transition: "background 0.2s, color 0.2s"
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DepartmentResources hospitalId={authHospitalId} key={refreshKey} />
    </div>
  );
}
