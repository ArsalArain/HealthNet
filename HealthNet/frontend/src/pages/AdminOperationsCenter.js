import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const SEVERITY_SCORE = { critical: 3, high: 2, warning: 1, info: 0 };
const OPS_CENTER_CACHE_PREFIX = "ops_center_cache_v1";
const OPS_CENTER_CACHE_TTL_MS = 2 * 60 * 1000;

function getSeverityPalette(level) {
  if (level === "critical") return { fg: "#991b1b", bg: "#fef2f2", border: "#fecaca" };
  if (level === "high") return { fg: "#9a3412", bg: "#fff7ed", border: "#fed7aa" };
  if (level === "warning") return { fg: "#92400e", bg: "#fffbeb", border: "#fde68a" };
  return { fg: "#1e3a8a", bg: "#eff6ff", border: "#bfdbfe" };
}

export default function AdminOperationsCenter() {
  const today = new Date().toISOString().slice(0, 10);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [reviewingRequestId, setReviewingRequestId] = useState("");
  const [highPredictionThreshold, setHighPredictionThreshold] = useState(120);

  const [coverageInput, setCoverageInput] = useState(null);
  const [coverageRows, setCoverageRows] = useState([]);
  const [resources, setResources] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [predictionUnavailable, setPredictionUnavailable] = useState([]);
  const [analyticsAlerts, setAnalyticsAlerts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const loadAll = async (force = false) => {
    const cacheKey = `${OPS_CENTER_CACHE_PREFIX}:${today}`;

    if (!force) {
      try {
        const cachedRaw = sessionStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const age = Date.now() - Number(cached?.timestamp || 0);
          if (cached?.data && age >= 0 && age < OPS_CENTER_CACHE_TTL_MS) {
            setCoverageInput(cached.data.coverageInput || null);
            setCoverageRows(Array.isArray(cached.data.coverageRows) ? cached.data.coverageRows : []);
            setResources(Array.isArray(cached.data.resources) ? cached.data.resources : []);
            setPredictions(Array.isArray(cached.data.predictions) ? cached.data.predictions : []);
            setPredictionUnavailable(Array.isArray(cached.data.predictionUnavailable) ? cached.data.predictionUnavailable : []);
            setAnalyticsAlerts(Array.isArray(cached.data.analyticsAlerts) ? cached.data.analyticsAlerts : []);
            setPendingRequests(Array.isArray(cached.data.pendingRequests) ? cached.data.pendingRequests : []);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Ignore cache parsing errors and continue with network requests.
      }
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const coveragePreferred = api.get("/hospital-admin/resources/coverage-insights", {
        params: {
          demand_mode: "predicted",
          date: today,
          gender: "all",
        },
      });
      const predictionReq = api.get("/hospital-admin/ai/predictions-by-department", {
        params: {
          date: today,
          gender: "all",
          disease: "all",
        },
      });
      const analyticsReq = api.get("/hospital-admin/hospital-analytics");
      const requestsReq = api.get("/hospital-admin/doctor-schedule-requests", { params: { status: "pending" } });
      const resourcesReq = api.get("/hospital-admin/resources");

      const settled = await Promise.allSettled([coveragePreferred, predictionReq, analyticsReq, requestsReq, resourcesReq]);

      let partialFailures = 0;
      let nextCoverageInput = null;
      let nextCoverageRows = [];
      let nextResources = [];
      let nextPredictions = [];
      let nextPredictionUnavailable = [];
      let nextAnalyticsAlerts = [];
      let nextPendingRequests = [];

      // Coverage insights (with fallback to active demand mode)
      if (settled[0]?.status === "fulfilled") {
        const coverageData = settled[0].value?.data || {};
        nextCoverageInput = coverageData?.input || null;
        nextCoverageRows = Array.isArray(coverageData?.coverage) ? coverageData.coverage : [];
      } else {
        partialFailures += 1;
        try {
          const fallbackCoverage = await api.get("/hospital-admin/resources/coverage-insights", {
            params: {
              demand_mode: "active",
              date: today,
              gender: "all",
            },
          });
          const fallbackData = fallbackCoverage?.data || {};
          nextCoverageInput = fallbackData?.input || { demand_mode: "active", date: today, gender: "all" };
          nextCoverageRows = Array.isArray(fallbackData?.coverage) ? fallbackData.coverage : [];
        } catch {
          nextCoverageInput = { demand_mode: "active", date: today, gender: "all" };
          nextCoverageRows = [];
        }
      }

      if (settled[1]?.status === "fulfilled") {
        const predictionData = settled[1].value?.data || {};
        nextPredictions = Array.isArray(predictionData?.predictions) ? predictionData.predictions : [];
        nextPredictionUnavailable = Array.isArray(predictionData?.unavailable) ? predictionData.unavailable : [];
      } else {
        partialFailures += 1;
        nextPredictions = [];
        nextPredictionUnavailable = [];
      }

      if (settled[2]?.status === "fulfilled") {
        const analyticsData = settled[2].value?.data || {};
        nextAnalyticsAlerts = Array.isArray(analyticsData?.ai_alerts) ? analyticsData.ai_alerts : [];
      } else {
        partialFailures += 1;
        nextAnalyticsAlerts = [];
      }

      if (settled[3]?.status === "fulfilled") {
        const requestData = settled[3].value?.data || {};
        nextPendingRequests = Array.isArray(requestData?.requests) ? requestData.requests : [];
      } else {
        partialFailures += 1;
        nextPendingRequests = [];
      }

      if (settled[4]?.status === "fulfilled") {
        const resourceData = settled[4].value?.data || {};
        nextResources = Array.isArray(resourceData?.resources) ? resourceData.resources : [];
      } else {
        partialFailures += 1;
        nextResources = [];
      }

      setCoverageInput(nextCoverageInput);
      setCoverageRows(nextCoverageRows);
      setResources(nextResources);
      setPredictions(nextPredictions);
      setPredictionUnavailable(nextPredictionUnavailable);
      setAnalyticsAlerts(nextAnalyticsAlerts);
      setPendingRequests(nextPendingRequests);

      if (partialFailures > 0 && partialFailures < settled.length) {
        setMessage({ type: "", text: "" });
      }

      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: {
              coverageInput: nextCoverageInput,
              coverageRows: nextCoverageRows,
              resources: nextResources,
              predictions: nextPredictions,
              predictionUnavailable: nextPredictionUnavailable,
              analyticsAlerts: nextAnalyticsAlerts,
              pendingRequests: nextPendingRequests,
            },
          })
        );
      } catch {
        // Ignore session storage failures.
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to load operations center data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(false);
  }, []);

  const resourceAlerts = useMemo(() => {
    const rows = (coverageRows || []).filter((row) => String(row?.department_id || "") !== "hospital");
    const grouped = new Map();
    for (const item of resources || []) {
      const deptIdRaw = item?.department_id?._id || item?.department_id;
      const deptId = deptIdRaw ? String(deptIdRaw) : "hospital";
      if (!grouped.has(deptId)) grouped.set(deptId, { low: [], out: [], maintenance: [] });
      const bucket = grouped.get(deptId);
      const name = String(item?.name || "Unknown");
      const status = String(item?.status || "").toLowerCase();
      if (status === "low_stock") bucket.low.push(name);
      if (status === "out_of_stock") bucket.out.push(name);
      if (status === "maintenance") bucket.maintenance.push(name);
    }

    const alerts = [];

    for (const row of rows) {
      const bucket = grouped.get(String(row?.department_id || "")) || { low: [], out: [], maintenance: [] };
      if (bucket.out.length > 0) {
        alerts.push({
          level: "critical",
          title: `${row.department_name}: Out of stock`,
          message: bucket.out.join(", "),
          meta: `${bucket.out.length} resource type(s) | Available units ${row.available_units || 0}`,
        });
      }
      if (bucket.low.length > 0) {
        alerts.push({
          level: "warning",
          title: `${row.department_name}: Low stock`,
          message: bucket.low.join(", "),
          meta: `${bucket.low.length} resource type(s) | Available units ${row.available_units || 0}`,
        });
      }
      if (bucket.maintenance.length > 0) {
        alerts.push({
          level: "info",
          title: `${row.department_name}: Maintenance`,
          message: bucket.maintenance.join(", "),
          meta: `${bucket.maintenance.length} resource type(s) in maintenance`,
        });
      }
      if (String(row?.coverage_state || "") === "critical" && Number(row?.demand_patients || 0) > 0) {
        alerts.push({
          level: "high",
          title: `${row.department_name}: Critical coverage state`,
          message: `Forecast demand ${row.demand_patients || 0}, available units ${row.available_units || 0}.`,
          meta: `Demand source: ${row.demand_source || "unknown"}`,
        });
      }
    }

    return alerts;
  }, [coverageRows, resources]);

  const predictionAlerts = useMemo(() => {
    const rows = Array.isArray(predictions) ? predictions : [];
    return rows
      .filter((row) => Number(row?.expected_patients || 0) >= Number(highPredictionThreshold || 0))
      .map((row) => ({
        level: Number(row?.expected_patients || 0) >= Number(highPredictionThreshold || 0) * 1.5 ? "critical" : "warning",
        title: `${row.department_name}: High predicted patient load`,
        message: `${row.expected_patients} patients predicted for ${today}.`,
        meta: `Model freshness ${row.model_freshness_days ?? "n/a"} day(s)`,
      }));
  }, [predictions, highPredictionThreshold, today]);

  const normalizedAnalyticsAlerts = useMemo(() => {
    return (analyticsAlerts || [])
      .filter((a) => {
        const msg = String(a?.message || "").toLowerCase();
        return !msg.includes("resource(s) are out of stock") && !msg.includes("resource(s) are running low");
      })
      .map((a) => ({
        level: String(a?.level || "info").toLowerCase(),
        title: "System Alert",
        message: String(a?.message || ""),
        meta: "Hospital analytics",
      }));
  }, [analyticsAlerts]);

  const allAlerts = useMemo(() => {
    const list = [...resourceAlerts, ...predictionAlerts, ...normalizedAnalyticsAlerts];
    return list.sort((a, b) => (SEVERITY_SCORE[b.level] || 0) - (SEVERITY_SCORE[a.level] || 0));
  }, [resourceAlerts, predictionAlerts, normalizedAnalyticsAlerts]);

  const highPredictionRows = useMemo(() => {
    return [...(predictions || [])]
      .sort((a, b) => Number(b?.expected_patients || 0) - Number(a?.expected_patients || 0))
      .filter((row) => Number(row?.expected_patients || 0) >= Number(highPredictionThreshold || 0));
  }, [predictions, highPredictionThreshold]);

  const fallbackPredictionRows = useMemo(() => {
    const rows = [...(predictions || [])].sort(
      (a, b) => Number(b?.expected_patients || 0) - Number(a?.expected_patients || 0)
    );
    return rows.slice(0, 5);
  }, [predictions]);

  const watchlistRows = highPredictionRows.length > 0 ? highPredictionRows : fallbackPredictionRows;

  const cardStats = useMemo(() => {
    const critical = allAlerts.filter((a) => a.level === "critical").length;
    const warning = allAlerts.filter((a) => a.level === "warning" || a.level === "high").length;
    const lowStockDepts = (coverageRows || []).filter((row) => Number(row?.low_stock || 0) > 0).length;
    const outOfStockDepts = (coverageRows || []).filter((row) => Number(row?.out_of_stock || 0) > 0).length;
    
    // Count total low stock items
    const totalLowStockItems = (coverageRows || []).reduce((sum, row) => sum + Number(row?.low_stock || 0), 0);
    // Count total out of stock items
    const totalOutOfStockItems = (coverageRows || []).reduce((sum, row) => sum + Number(row?.out_of_stock || 0), 0);
    // Count total maintenance items
    const totalMaintenanceItems = (coverageRows || []).reduce((sum, row) => sum + Number(row?.maintenance || 0), 0);
    
    // Total problems = all stock issues + all alerts
    const totalProblems = totalLowStockItems + totalOutOfStockItems + totalMaintenanceItems + allAlerts.length;
    
    return {
      critical,
      warning,
      lowStockDepts,
      outOfStockDepts,
      totalLowStockItems,
      totalOutOfStockItems,
      totalMaintenanceItems,
      totalProblems,
      highPrediction: highPredictionRows.length,
      pendingRequests: pendingRequests.length,
    };
  }, [allAlerts, coverageRows, highPredictionRows, pendingRequests]);

  useEffect(() => {
    // Save problem count to localStorage and dispatch custom event
    localStorage.setItem("operationsCenterProblemCount", String(cardStats.totalProblems || 0));
    window.dispatchEvent(new CustomEvent("operationsCenterProblemCountChanged", { detail: { count: cardStats.totalProblems } }));
  }, [cardStats.totalProblems]);

  const reviewRequest = async (requestId, action) => {
    try {
      setReviewingRequestId(String(requestId));
      const reviewNote = window.prompt(
        action === "approve" ? "Optional approval note:" : "Reason for rejection:",
        ""
      );

      await api.put(`/hospital-admin/doctor-schedule-requests/${requestId}`, {
        action,
        review_note: String(reviewNote || "").trim(),
      });

      setMessage({
        type: "success",
        text: action === "approve" ? "Request approved successfully." : "Request rejected successfully.",
      });
      await loadAll(true);
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Failed to review request.",
      });
    } finally {
      setReviewingRequestId("");
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div>
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 26 }}>Operations Center</h2>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
          Central hub for low-stock alerts, warnings, high patient predictions, and request handling.
        </p>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>
          Demand mode: {coverageInput?.demand_mode || "predicted"} | Forecast date: {coverageInput?.date || today}
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>CRITICAL ALERTS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#b91c1c", marginTop: 4 }}>{cardStats.critical}</div>
        </div>
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>WARNINGS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#9a3412", marginTop: 4 }}>{cardStats.warning}</div>
        </div>
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>OUT OF STOCK ITEMS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#b91c1c", marginTop: 4 }}>{cardStats.totalOutOfStockItems}</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{cardStats.outOfStockDepts} dept(s)</div>
        </div>
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>LOW STOCK ITEMS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#b45309", marginTop: 4 }}>{cardStats.totalLowStockItems}</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{cardStats.lowStockDepts} dept(s)</div>
        </div>
        <div style={{ background: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>IN MAINTENANCE</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0369a1", marginTop: 4 }}>{cardStats.totalMaintenanceItems}</div>
        </div>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>HIGH PREDICTIONS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#1d4ed8", marginTop: 4 }}>{cardStats.highPrediction}</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>threshold: {highPredictionThreshold}</div>
        </div>
        <div style={{ background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>PENDING REQUESTS</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{cardStats.pendingRequests}</div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 700, color: "#0f172a" }}>Alerts And Warnings</div>
          <button
            type="button"
            onClick={() => loadAll(true)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              background: "#fff",
              padding: "8px 12px",
              cursor: "pointer",
              color: "#0f172a",
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ color: "#64748b" }}>Loading alerts...</div>
        ) : allAlerts.length === 0 ? (
          <div style={{ color: "#64748b" }}>No active alerts right now.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {allAlerts.map((alert, idx) => {
              const palette = getSeverityPalette(alert.level);
              return (
                <div
                  key={`${alert.title}-${idx}`}
                  style={{
                    border: `1px solid ${palette.border}`,
                    background: palette.bg,
                    color: palette.fg,
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 4, textTransform: "capitalize" }}>{alert.level}</div>
                  <div style={{ fontWeight: 700 }}>{alert.title}</div>
                  <div style={{ marginTop: 4 }}>{alert.message}</div>
                  <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>{alert.meta}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 700, color: "#0f172a" }}>Low Stock / Out Of Stock Overview</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Department</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Low Stock</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Out Of Stock</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Maintenance</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Available Units</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Coverage State</th>
              </tr>
            </thead>
            <tbody>
              {(coverageRows || [])
                .filter((row) => String(row?.department_id || "") !== "hospital")
                .sort((a, b) => Number((b?.out_of_stock || 0) + (b?.low_stock || 0)) - Number((a?.out_of_stock || 0) + (a?.low_stock || 0)))
                .map((row) => (
                  <tr key={`stock-${row.department_id}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 6px", color: "#0f172a", fontWeight: 600 }}>{row.department_name}</td>
                    <td style={{ padding: "10px 6px", color: "#b45309", fontWeight: 700 }}>{row.low_stock || 0}</td>
                    <td style={{ padding: "10px 6px", color: "#b91c1c", fontWeight: 700 }}>{row.out_of_stock || 0}</td>
                    <td style={{ padding: "10px 6px", color: "#0369a1", fontWeight: 700 }}>{row.maintenance || 0}</td>
                    <td style={{ padding: "10px 6px", color: "#166534", fontWeight: 700 }}>{row.available_units || 0}</td>
                    <td style={{ padding: "10px 6px", color: "#334155", textTransform: "capitalize" }}>
                      {String(row.coverage_state || "stable").replaceAll("_", " ")}
                    </td>
                  </tr>
                ))}
              {(!(coverageRows || []).filter((row) => String(row?.department_id || "") !== "hospital").length) && (
                <tr>
                  <td colSpan={6} style={{ padding: "14px 6px", color: "#64748b" }}>
                    No department stock data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 700, color: "#0f172a" }}>High Prediction Watchlist</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, color: "#64748b" }}>Threshold</label>
            <input
              type="number"
              min={1}
              value={highPredictionThreshold}
              onChange={(e) => setHighPredictionThreshold(Math.max(1, Number(e.target.value || 1)))}
              style={{ width: 90, border: "1px solid #cbd5e1", borderRadius: 8, padding: "6px 8px" }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Department</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Predicted Patients</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Model Freshness (Days)</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Flag</th>
              </tr>
            </thead>
            <tbody>
              {watchlistRows.map((row) => (
                <tr key={String(row.department_id)} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 6px", color: "#0f172a", fontWeight: 600 }}>{row.department_name}</td>
                  <td style={{ padding: "10px 6px", color: "#1d4ed8", fontWeight: 800 }}>{Number(row.expected_patients || 0)}</td>
                  <td style={{ padding: "10px 6px", color: "#334155" }}>{row.model_freshness_days ?? "n/a"}</td>
                  <td style={{ padding: "10px 6px" }}>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "4px 8px",
                        fontSize: 12,
                        fontWeight: 700,
                        color:
                          Number(row.expected_patients || 0) >= Number(highPredictionThreshold || 0)
                            ? Number(row.expected_patients || 0) >= Number(highPredictionThreshold || 0) * 1.5
                              ? "#991b1b"
                              : "#92400e"
                            : "#1e3a8a",
                        background:
                          Number(row.expected_patients || 0) >= Number(highPredictionThreshold || 0)
                            ? Number(row.expected_patients || 0) >= Number(highPredictionThreshold || 0) * 1.5
                              ? "#fee2e2"
                              : "#fef3c7"
                            : "#eff6ff",
                      }}
                    >
                      {Number(row.expected_patients || 0) >= Number(highPredictionThreshold || 0)
                        ? Number(row.expected_patients || 0) >= Number(highPredictionThreshold || 0) * 1.5
                          ? "Critical"
                          : "Warning"
                        : "Below Threshold"}
                    </span>
                  </td>
                </tr>
              ))}
              {watchlistRows.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "14px 6px", color: "#64748b" }}>
                    {predictionUnavailable.length > 0
                      ? `No predictions available: ${predictionUnavailable.map((u) => u.reason).join(", ")} (${predictionUnavailable.length} dept(s))`
                      : "No departments crossed the selected threshold."}
                  </td>
                </tr>
              )}
              {highPredictionRows.length === 0 && watchlistRows.length > 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "12px 6px", color: "#1e3a8a", background: "#eff6ff" }}>
                    No departments crossed threshold {highPredictionThreshold}. Showing top predicted departments instead.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 700, color: "#0f172a" }}>Request Handling (Doctor Schedule Requests)</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Doctor</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Current Shift</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Requested Shift</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Requested Days</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Reason</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((req) => (
                <tr key={String(req._id)} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 6px", color: "#0f172a", fontWeight: 600 }}>{req?.doctor_id?.name || "Doctor"}</td>
                  <td style={{ padding: "10px 6px", color: "#334155", textTransform: "capitalize" }}>{req?.current_shift || "-"}</td>
                  <td style={{ padding: "10px 6px", color: "#334155", textTransform: "capitalize" }}>{req?.requested_shift || "-"}</td>
                  <td style={{ padding: "10px 6px", color: "#334155" }}>
                    {Array.isArray(req?.requested_available_days) && req.requested_available_days.length > 0
                      ? req.requested_available_days.join(", ")
                      : "-"}
                  </td>
                  <td style={{ padding: "10px 6px", color: "#334155", maxWidth: 260 }}>{req?.reason || "-"}</td>
                  <td style={{ padding: "10px 6px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      disabled={String(reviewingRequestId) === String(req._id)}
                      onClick={() => reviewRequest(req._id, "approve")}
                      style={{
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 10px",
                        background: "#16a34a",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        opacity: String(reviewingRequestId) === String(req._id) ? 0.7 : 1,
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={String(reviewingRequestId) === String(req._id)}
                      onClick={() => reviewRequest(req._id, "reject")}
                      style={{
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 10px",
                        background: "#dc2626",
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        opacity: String(reviewingRequestId) === String(req._id) ? 0.7 : 1,
                      }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
              {pendingRequests.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "14px 6px", color: "#64748b" }}>
                    No pending requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
