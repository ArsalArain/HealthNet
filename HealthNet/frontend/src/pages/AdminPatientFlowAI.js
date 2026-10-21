import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import UploadedFilesPanel from "../components/UploadedFilesPanel";

function MiniLineChart({ data }) {
  const width = 760;
  const height = 260;
  const padding = 36;

  const { pointsActual, pointsPredicted, labels, maxY } = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    const maxValue = Math.max(
      1,
      ...safeData.map((d) => Number(d.actual || 0)),
      ...safeData.map((d) => Number(d.predicted || 0))
    );

    const xStep = safeData.length > 1 ? (width - 2 * padding) / (safeData.length - 1) : 0;
    const yScale = (value) => {
      const ratio = Number(value || 0) / maxValue;
      return height - padding - ratio * (height - 2 * padding);
    };

    const actual = safeData.map((row, idx) => ({
      x: padding + idx * xStep,
      y: yScale(row.actual),
      value: Number(row.actual || 0),
    }));

    const predicted = safeData.map((row, idx) => ({
      x: padding + idx * xStep,
      y: yScale(row.predicted),
      value: Number(row.predicted || 0),
    }));

    return {
      pointsActual: actual,
      pointsPredicted: predicted,
      labels: safeData.map((row) => String(row.date || "").slice(5)),
      maxY: maxValue,
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ color: "#64748b", fontSize: 14 }}>
        No chart data available yet.
      </div>
    );
  }

  const actualPath = pointsActual.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const predictedPath = pointsPredicted.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", minWidth: 640, background: "#f8fafc", borderRadius: 12 }}>
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#94a3b8" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#94a3b8" />

        {[0.25, 0.5, 0.75, 1].map((tick) => {
          const y = height - padding - tick * (height - 2 * padding);
          return (
            <g key={tick}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x={8} y={y + 4} fill="#64748b" fontSize="11">
                {Math.round(maxY * tick)}
              </text>
            </g>
          );
        })}

        <path d={actualPath} fill="none" stroke="#0284c7" strokeWidth="3" />
        <path d={predictedPath} fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6 4" />

        {pointsActual.map((p, idx) => (
          <circle key={`a-${idx}`} cx={p.x} cy={p.y} r="4" fill="#0284c7" />
        ))}
        {pointsPredicted.map((p, idx) => (
          <circle key={`p-${idx}`} cx={p.x} cy={p.y} r="4" fill="#f59e0b" />
        ))}

        {labels.map((label, idx) => (
          <text key={label + idx} x={pointsActual[idx]?.x || 0} y={height - 12} textAnchor="middle" fill="#475569" fontSize="11">
            {label}
          </text>
        ))}
      </svg>

      <div style={{ display: "flex", gap: 16, marginTop: 10, color: "#334155", fontSize: 13 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 22, height: 3, background: "#0284c7", display: "inline-block" }} /> Actual
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 22, height: 3, background: "#f59e0b", display: "inline-block" }} /> Predicted
        </span>
      </div>
    </div>
  );
}

export default function AdminPatientFlowAI() {
  const [departments, setDepartments] = useState([]);
  const [modelStatus, setModelStatus] = useState([]);
  const [uploadForm, setUploadForm] = useState({ department_id: "", file: null });
  const nextSevenDayOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const value = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      options.push({ value, label });
    }
    return options;
  }, []);
  const [predictForm, setPredictForm] = useState({
    department_id: "",
    date: new Date().toISOString().slice(0, 10),
    disease: "all",
  });
  const [uploading, setUploading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [trainingJob, setTrainingJob] = useState(null);
  const [retrainingAll, setRetrainingAll] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [result, setResult] = useState(null);
  const [deptPredictions, setDeptPredictions] = useState([]);
  const [deptUnavailable, setDeptUnavailable] = useState([]);
  const [loadingDeptPredictions, setLoadingDeptPredictions] = useState(false);
  const [diseaseCatalog, setDiseaseCatalog] = useState([]);

  useEffect(() => {
    loadDepartments();
    loadModelStatus();
    loadDiseaseCatalog();
  }, []);

  const diseasesByDepartmentId = useMemo(
    () => new Map((diseaseCatalog || []).map((item) => [String(item.department_id), item.diseases || []])),
    [diseaseCatalog]
  );

  const selectedDepartmentDiseases = useMemo(
    () => diseasesByDepartmentId.get(String(predictForm.department_id || "")) || [],
    [diseasesByDepartmentId, predictForm.department_id]
  );

  useEffect(() => {
    const allowedDates = new Set(nextSevenDayOptions.map((item) => item.value));
    if (!allowedDates.has(String(predictForm.date || ""))) {
      const fallbackDate = nextSevenDayOptions[0]?.value || new Date().toISOString().slice(0, 10);
      setPredictForm((prev) => ({ ...prev, date: fallbackDate }));
    }
  }, [nextSevenDayOptions, predictForm.date]);

  const resultDepartmentForecast = useMemo(() => {
    if (!result?.input?.department_id) return null;
    return (deptPredictions || []).find(
      (row) => String(row?.department_id || "") === String(result.input.department_id || "")
    ) || null;
  }, [deptPredictions, result]);

  useEffect(() => {
    // Disease selection is intentionally fixed to all-disease mode.
  }, [predictForm.department_id, predictForm.disease, selectedDepartmentDiseases]);

  const loadDepartments = async () => {
    try {
      const { data } = await api.get("/hospital-admin/departments");
      const list = data?.departments || [];
      setDepartments(list);
      if (!uploadForm.department_id && list.length > 0) {
        setUploadForm((prev) => ({ ...prev, department_id: String(list[0]._id || list[0].id) }));
      }
      if (!predictForm.department_id && list.length > 0) {
        const firstDeptId = String(list[0]._id || list[0].id);
        setPredictForm((prev) => ({ ...prev, department_id: firstDeptId, disease: "all" }));
      }
    } catch (error) {
      console.error("Failed to load departments", error);
      setMessage({ type: "error", text: "Failed to load departments." });
    }
  };

  const loadModelStatus = async () => {
    try {
      setLoadingModels(true);
      const { data } = await api.get("/hospital-admin/ai/model-status");
      setModelStatus(data?.models || []);
    } catch (error) {
      console.error("Failed to load AI model status", error);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadDiseaseCatalog = async () => {
    try {
      const { data } = await api.get("/hospital-admin/ai/disease-catalog");
      setDiseaseCatalog(data?.by_department || []);
    } catch (error) {
      console.error("Failed to load disease catalog", error);
      setDiseaseCatalog([]);
    }
  };





  const fetchPredictionsByDepartment = async (date, disease = "all", departmentId = "") => {
    try {
      setLoadingDeptPredictions(true);
      const { data } = await api.get("/hospital-admin/ai/predictions-by-department", {
        params: {
          date,
          gender: "all",
          disease,
          department_id: departmentId || undefined,
        },
      });
      const rows = data?.predictions || [];
      setDeptPredictions(rows);
      setDeptUnavailable(data?.unavailable || []);

      if (
        String(disease || "").toLowerCase() === "all" &&
        rows.length > 0 &&
        rows.every((r) => !Array.isArray(r?.disease_breakdown) || r.disease_breakdown.length === 0)
      ) {
        setMessage({
          type: "error",
          text: "Disease-wise breakdown is missing from forecast response. Please restart backend and refresh forecast.",
        });
      }
    } catch (error) {
      console.error("Failed to load department predictions", error);
      setDeptPredictions([]);
      setDeptUnavailable([]);
    } finally {
      setLoadingDeptPredictions(false);
    }
  };

  const refreshSelectedDepartmentPrediction = async (form = predictForm) => {
    if (!form?.department_id || !form?.date) return;
    try {
      const { data } = await api.post("/hospital-admin/ai/predict-patient-load", {
        department_id: form.department_id,
        date: form.date,
        disease: form.disease,
        gender: "all",
      }, { timeout: 60000 });
      setResult(data || null);
    } catch (error) {
      setResult(null);
      const detail =
        error.response?.data?.message ||
        (String(error.code || "").toUpperCase() === "ECONNABORTED"
          ? "Prediction request timed out."
          : error.message || "Prediction failed.");
      setMessage({
        type: "error",
        text: `Prediction failed while refreshing selected department. ${detail}`,
      });
    }
  };

  const refreshForecastAndSelectedPrediction = async (form = predictForm) => {
    if (!form?.department_id || !form?.date) {
      setMessage({ type: "error", text: "Please select department and date first." });
      return;
    }

    await fetchPredictionsByDepartment(form.date, form.disease, form.department_id);
    await refreshSelectedDepartmentPrediction(form);
  };

  const handleUploadDataset = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!uploadForm.department_id) {
      setMessage({ type: "error", text: "Please select a department." });
      return;
    }
    if (!uploadForm.file) {
      setMessage({ type: "error", text: "Please choose a CSV file first." });
      return;
    }

    const payload = new FormData();
    payload.append("department_id", uploadForm.department_id);
    payload.append("file", uploadForm.file);

    try {
      setUploading(true);
      const { data } = await api.post("/hospital-admin/ai/upload-department-dataset-async", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTrainingJob(data?.job || null);
      setMessage({ type: "success", text: data?.message || "Training job queued." });
      setUploadForm((prev) => ({ ...prev, file: null }));

      const jobId = data?.job?.id;
      if (jobId) {
        let done = false;
        while (!done) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const statusRes = await api.get(`/hospital-admin/ai/training-jobs/${jobId}`);
          const job = statusRes?.data?.job || null;
          setTrainingJob(job);
          if (job?.status === "completed") {
            done = true;
            setMessage({ type: "success", text: `Training completed for ${job.department_name}.` });
            await loadModelStatus();
            await loadDiseaseCatalog();

            const trainedDepartmentId = String(job.department_id || uploadForm.department_id || predictForm.department_id || "");
            const nextForm = {
              ...predictForm,
              department_id: trainedDepartmentId,
            };
            setPredictForm(nextForm);
            await refreshForecastAndSelectedPrediction(nextForm);
          } else if (job?.status === "failed") {
            done = true;
            setMessage({ type: "error", text: job?.error || "Training failed." });
          }
        }
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to queue training job.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRetrainAll = async () => {
    try {
      setRetrainingAll(true);
      const { data } = await api.post("/hospital-admin/ai/retrain-all-departments");
      setMessage({ type: "success", text: data?.message || "Retrain queued." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to queue retrain jobs." });
    } finally {
      setRetrainingAll(false);
    }
  };

  const handleRetrainUploadedFile = async (file) => {
    const departmentId = String(file?.department_id || "").trim();
    const departmentName = String(file?.department_name || "").trim();

    if (!departmentId && !departmentName) {
      throw new Error("This uploaded file is missing a department reference.");
    }

    const { data } = await api.post("/hospital-admin/ai/retrain-department", {
      department_id: departmentId || undefined,
      department_name: departmentName || undefined,
    });

    const jobId = data?.job?.id;
    if (!jobId) {
      return data;
    }

    let done = false;
    while (!done) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusRes = await api.get(`/hospital-admin/ai/training-jobs/${jobId}`);
      const job = statusRes?.data?.job || null;
      setTrainingJob(job);

      if (job?.status === "completed") {
        done = true;
        setMessage({ type: "success", text: `Training completed for ${job.department_name}.` });
        await loadModelStatus();
        await loadDiseaseCatalog();

        const trainedDepartmentId = String(job.department_id || departmentId || predictForm.department_id || "");
        const nextForm = {
          ...predictForm,
          department_id: trainedDepartmentId,
        };
        setPredictForm(nextForm);
        await refreshForecastAndSelectedPrediction(nextForm);
      } else if (job?.status === "failed") {
        done = true;
        throw new Error(job?.error || "Training failed.");
      }
    }

    return data;
  };

  const handlePredict = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!predictForm.department_id || !predictForm.date) {
      setMessage({ type: "error", text: "Please select department and date." });
      return;
    }

    try {
      setPredicting(true);
      const { data } = await api.post("/hospital-admin/ai/predict-patient-load", {
        department_id: predictForm.department_id,
        date: predictForm.date,
        disease: predictForm.disease,
        gender: "all",
      }, { timeout: 60000 });
      setResult(data || null);
      await fetchPredictionsByDepartment(predictForm.date, predictForm.disease, predictForm.department_id);
    } catch (error) {
      setResult(null);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Prediction failed. Ensure dataset is uploaded and model is trained.",
      });
    } finally {
      setPredicting(false);
    }
  };











  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h2 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: 28 }}>Predict Patient Flow</h2>
        <p style={{ margin: 0, color: "#64748b" }}>
          Upload department-wise historical CSV data, train models, and predict expected patient load.
        </p>
      </div>

      <UploadedFilesPanel
        title="AI Uploads"
        subtitle="Review archived datasets used for patient-flow training, then download or remove them as needed."
        defaultScope="ai"
        showScopeSelector={false}
        onRetrainFile={handleRetrainUploadedFile}
      />

      {message.text ? (
        <div
          style={{
            border: message.type === "success" ? "1px solid #86efac" : "1px solid #fecaca",
            background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: message.type === "success" ? "#166534" : "#991b1b",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          {message.text}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <form
          onSubmit={handleUploadDataset}
          style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, display: "grid", gap: 12 }}
        >
          <h3 style={{ margin: 0, color: "#0284c7" }}>1. Upload & Train Department Model</h3>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>Department</label>
            <select
              value={uploadForm.department_id}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, department_id: e.target.value }))}
              style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
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
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
              style={{ width: "100%" }}
            />
            <small style={{ color: "#64748b" }}>
              This upload is only for patient-flow AI training. Use columns: hospital_id, date, department (or depatrment), disease, gender, patient_count.
            </small>
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "11px 12px",
              background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
              color: "#fff",
              fontWeight: 700,
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.75 : 1,
            }}
          >
            {uploading ? "Queuing Training..." : "Upload Dataset & Start Training"}
          </button>
        </form>

        <form
          onSubmit={handlePredict}
          style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, display: "grid", gap: 12 }}
        >
          <h3 style={{ margin: 0, color: "#0f766e" }}>2. Predict Patient Load (Next 7 Days)</h3>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>Department</label>
            <select
              value={predictForm.department_id}
              onChange={(e) => {
                const nextDepartmentId = e.target.value;
                setPredictForm((prev) => ({ ...prev, department_id: nextDepartmentId, disease: "all" }));
              }}
              style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
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
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>Prediction Day (Next 7 Days)</label>
            <select
              value={predictForm.date}
              onChange={(e) => setPredictForm((prev) => ({ ...prev, date: e.target.value }))}
              style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
            >
              {nextSevenDayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={predicting}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "11px 12px",
              background: "linear-gradient(135deg, #0f766e, #14b8a6)",
              color: "#fff",
              fontWeight: 700,
              cursor: predicting ? "not-allowed" : "pointer",
              opacity: predicting ? 0.75 : 1,
            }}
          >
            {predicting ? "Predicting..." : "Predict"}
          </button>
        </form>
      </div>





      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18 }}>
        <h3 style={{ marginTop: 0, color: "#0f172a" }}>Model Readiness by Department</h3>
        <button
          type="button"
          onClick={handleRetrainAll}
          disabled={retrainingAll}
          style={{
            border: "none",
            borderRadius: 8,
            padding: "9px 12px",
            background: "#0f172a",
            color: "#fff",
            fontWeight: 700,
            cursor: retrainingAll ? "not-allowed" : "pointer",
            marginBottom: 12,
            opacity: retrainingAll ? 0.75 : 1,
          }}
        >
          {retrainingAll ? "Queuing..." : "Re-train All Departments"}
        </button>
        {loadingModels ? (
          <p style={{ color: "#64748b" }}>Checking model status...</p>
        ) : modelStatus.length === 0 ? (
          <p style={{ color: "#64748b" }}>No departments found.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {modelStatus.map((item) => (
              <div
                key={item.department_id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.department_name}</div>
                  <small style={{ color: "#64748b" }}>
                    {item.metadata?.source_rows
                      ? `${item.metadata.source_rows} source rows | ${item.metadata?.rows_trained || item.metadata.source_rows} training rows`
                      : (item.metadata?.rows_trained ? `${item.metadata.rows_trained} rows trained` : "No training metadata")}
                    {item.model_freshness_days !== null ? ` | ${item.model_freshness_days} day(s) old` : ""}
                    {item.model_metrics?.rmse
                      ? ` | ${item.model_metrics?.evaluation_split === "time_split_validation" ? "Val RMSE" : "Train RMSE"} ${Number(item.model_metrics.rmse).toFixed(2)}`
                      : ""}
                  </small>
                  {Array.isArray(item.recent_training) && item.recent_training.length > 0 ? (
                    <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 12 }}>
                      Last train: {new Date(item.recent_training[0].logged_at).toLocaleString()} | model {item.recent_training[0].model_version || "n/a"}
                    </div>
                  ) : null}
                </div>
                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: item.has_model ? "#dcfce7" : "#fee2e2",
                    color: item.has_model ? "#166534" : "#991b1b",
                  }}
                >
                  {item.has_model ? "Model Ready" : "Not Trained"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {trainingJob ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, display: "grid", gap: 8 }}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Training Job Status</h3>
          <div style={{ color: "#334155" }}>
            Job: {trainingJob.id} | Department: {trainingJob.department_name || "N/A"}
          </div>
          <div style={{ color: "#334155" }}>
            Status: <strong>{trainingJob.status}</strong> | Progress: <strong>{trainingJob.progress || 0}%</strong>
          </div>
          <div style={{ height: 10, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(0, Math.min(100, Number(trainingJob.progress || 0)))}%`,
                height: "100%",
                background: trainingJob.status === "failed" ? "#ef4444" : "#22c55e",
              }}
            />
          </div>
          <small style={{ color: trainingJob.status === "failed" ? "#991b1b" : "#64748b" }}>
            {trainingJob.error || trainingJob.message || "Running"}
          </small>
        </div>
      ) : null}

      {result ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, display: "grid", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, color: "#0f172a" }}>Prediction Result</h3>
              <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                Department: {result?.input?.department_name} | Date: {result?.input?.date}
              </p>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                color: "#fff",
                borderRadius: 12,
                padding: "14px 18px",
                minWidth: 220,
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.9 }}>Expected Patients</div>
              <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>{result?.expected_patients ?? 0}</div>
              {result?.confidence_range ? (
                <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>
                  Range: {result.confidence_range.lower} - {result.confidence_range.upper}
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ color: "#475569", fontSize: 13 }}>
            {result?.model_freshness_days !== null && result?.model_freshness_days !== undefined ? `Model age: ${result.model_freshness_days} day(s)` : "Model freshness: N/A"}
            {result?.model_metrics?.rmse
              ? ` | ${result?.model_metrics?.evaluation_split === "time_split_validation" ? "Val RMSE" : "Train RMSE"}: ${Number(result.model_metrics.rmse).toFixed(2)}`
              : ""}
            {result?.model_metrics?.r2 !== undefined ? ` | R2: ${Number(result.model_metrics.r2).toFixed(3)}` : ""}
          </div>

          <div>
            <h4 style={{ marginTop: 0, color: "#334155" }}>Last 7 Days: Actual vs Predicted</h4>
            <MiniLineChart data={result?.chart_data || []} />
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", background: "#f8fafc", display: "grid", gap: 8 }}>
            <h4 style={{ margin: 0, color: "#1e293b" }}>Department Forecast Summary</h4>
            <div style={{ color: "#334155", fontSize: 14 }}>
              Department: <strong>{result?.input?.department_name || "N/A"}</strong>
            </div>
            <div style={{ color: "#334155", fontSize: 14 }}>
              Total predicted patients: <strong>{result?.expected_patients ?? 0}</strong>
            </div>

            {(() => {
              const diseaseRows =
                (Array.isArray(result?.disease_breakdown) && result.disease_breakdown.length > 0)
                  ? result.disease_breakdown
                  : (Array.isArray(resultDepartmentForecast?.disease_breakdown) ? resultDepartmentForecast.disease_breakdown : []);

              if (!diseaseRows.length) {
                return <div style={{ color: "#64748b", fontSize: 13 }}>Disease-wise predicted patients are not available for this response yet.</div>;
              }

              return (
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 13 }}>
                    Disease-wise predicted patients
                  </div>
                  {diseaseRows.map((d) => (
                    <div
                      key={`result-summary-${d.disease}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: "6px 8px",
                        background: "#fff",
                      }}
                    >
                      <div style={{ color: "#334155" }}>{d.disease}</div>
                      <div style={{ color: "#0f766e", fontWeight: 700 }}>{d.expected_patients}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

        </div>
      ) : null}

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18 }}>
        <h3 style={{ marginTop: 0, color: "#0f172a" }}>
          Per Department Prediction (All Diseases)
        </h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>
            Department Forecast to View
          </label>
          <select
            value={predictForm.department_id}
            onChange={(e) => {
              const nextDepartmentId = e.target.value;
              setPredictForm((prev) => ({ ...prev, department_id: nextDepartmentId, disease: "all" }));
            }}
            style={{ width: "100%", maxWidth: 360, border: "1px solid #cbd5e1", borderRadius: 8, padding: "10px 12px" }}
          >
            {departments.map((department) => {
              const id = String(department._id || department.id);
              return (
                <option key={`forecast-${id}`} value={id}>
                  {department.name}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => refreshForecastAndSelectedPrediction(predictForm)}
            disabled={loadingDeptPredictions}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "10px 14px",
              background: "#334155",
              color: "#fff",
              fontWeight: 600,
              cursor: loadingDeptPredictions ? "not-allowed" : "pointer",
              opacity: loadingDeptPredictions ? 0.75 : 1,
            }}
          >
            {loadingDeptPredictions ? "Loading..." : "Refresh Department Forecast"}
          </button>
        </div>

        {deptPredictions.length === 0 ? (
          deptUnavailable.length > 0 ? (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", background: "#fff" }}>
              <div style={{ color: "#334155", fontWeight: 700, marginBottom: 6 }}>Unavailable Forecasts</div>
              <div style={{ display: "grid", gap: 4 }}>
                {deptUnavailable.map((item) => (
                  <div key={`${item.department_id}-${item.reason}`} style={{ color: "#64748b", fontSize: 13 }}>
                    {item.department_name}: {item.reason}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: "#64748b", margin: 0 }}>No department forecasts available yet. Click Refresh Department Forecast.</p>
          )
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {deptUnavailable.length > 0 ? (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", background: "#fff" }}>
                <div style={{ color: "#334155", fontWeight: 700, marginBottom: 6 }}>Unavailable Forecasts</div>
                <div style={{ display: "grid", gap: 4 }}>
                  {deptUnavailable.map((item) => (
                    <div key={`${item.department_id}-${item.reason}`} style={{ color: "#64748b", fontSize: 13 }}>
                      {item.department_name}: {item.reason}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {deptPredictions.map((row, idx) => (
              <div
                key={row.department_id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: idx === 0 ? "#eff6ff" : "#fff",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "52px 1fr auto",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      background: idx === 0 ? "#0284c7" : "#e2e8f0",
                      color: idx === 0 ? "#fff" : "#334155",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ color: "#0f172a", fontWeight: 600 }}>{row.department_name}</div>
                  <div style={{ color: "#0284c7", fontWeight: 800, fontSize: 22 }}>{row.expected_patients}</div>
                </div>

                <div style={{ color: "#334155", fontSize: 13, fontWeight: 600 }}>
                  Total predicted patients: {row.expected_patients}
                </div>

                {Array.isArray(row.disease_breakdown) && row.disease_breakdown.length > 0 ? (
                  <div style={{ marginTop: 2, display: "grid", gap: 6 }}>
                    <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 13 }}>
                      Disease-wise predicted patients
                    </div>
                    {row.disease_breakdown.map((d) => (
                      <div
                        key={`${row.department_id}-${d.disease}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          padding: "6px 8px",
                          background: "#fff",
                        }}
                      >
                        <div style={{ color: "#334155" }}>{d.disease}</div>
                        <div style={{ color: "#0f766e", fontWeight: 700 }}>{d.expected_patients}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  (() => {
                    const fallbackBreakdown =
                      String(result?.input?.department_id || "") === String(row.department_id || "")
                        ? (result?.disease_breakdown || [])
                        : [];

                    if (Array.isArray(fallbackBreakdown) && fallbackBreakdown.length > 0) {
                      return (
                        <div style={{ marginTop: 2, display: "grid", gap: 6 }}>
                          <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 13 }}>
                            Disease-wise predicted patients
                          </div>
                          {fallbackBreakdown.map((d) => (
                            <div
                              key={`${row.department_id}-fallback-${d.disease}`}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                border: "1px solid #e2e8f0",
                                borderRadius: 8,
                                padding: "6px 8px",
                                background: "#fff",
                              }}
                            >
                              <div style={{ color: "#334155" }}>{d.disease}</div>
                              <div style={{ color: "#0f766e", fontWeight: 700 }}>{d.expected_patients}</div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    if (predictForm.disease) {
                      return (
                        <div style={{ marginTop: 2, display: "grid", gap: 6 }}>
                          <div style={{ color: "#1e293b", fontWeight: 700, fontSize: 13 }}>
                            Disease-wise predicted patients
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr auto",
                              border: "1px solid #e2e8f0",
                              borderRadius: 8,
                              padding: "6px 8px",
                              background: "#fff",
                            }}
                          >
                            <div style={{ color: "#334155" }}>{predictForm.disease}</div>
                            <div style={{ color: "#0f766e", fontWeight: 700 }}>{row.expected_patients}</div>
                          </div>
                        </div>
                      );
                    }

                    return <div style={{ color: "#64748b", fontSize: 13 }}>No disease-wise breakdown available.</div>;
                  })()
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
