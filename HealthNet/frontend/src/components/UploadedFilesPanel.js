import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Button, Card, CardBody, CardHeader, Table } from "./ui";

const SCOPE_OPTIONS = [
  { value: "all", label: "All files" },
  { value: "patient_records", label: "Patient records" },
  { value: "ai", label: "Patient flow AI" },
];

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

export default function UploadedFilesPanel({
  title = "Uploaded Files",
  subtitle = "Browse archived uploads and manage them from one place.",
  defaultScope = "all",
  showScopeSelector = true,
  onRetrainFile = null,
}) {
  const [scope, setScope] = useState(defaultScope);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [retrainKey, setRetrainKey] = useState("");
  const [previewKey, setPreviewKey] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setScope(defaultScope);
  }, [defaultScope]);

  useEffect(() => {
    loadFiles(scope);
  }, [scope]);

  const loadFiles = async (nextScope = scope) => {
    try {
      setLoading(true);
      const { data } = await api.get("/hospital-admin/uploads", {
        params: { scope: nextScope },
      });
      setFiles(Array.isArray(data?.files) ? data.files : []);
      setMessage("");
    } catch (error) {
      console.error("Failed to load uploaded files", error);
      setFiles([]);
      setMessage(error.response?.data?.message || "Failed to load uploaded files.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file) => {
    const key = `${file.category}:${file.relative_path}`;
    try {
      setBusyKey(key);
      const { data } = await api.get("/hospital-admin/uploads/download", {
        params: {
          category: file.category,
          file_key: file.relative_path,
        },
        responseType: "blob",
      });

      const blob = new Blob([data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.original_name || file.file_name || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download uploaded file", error);
      setMessage(error.response?.data?.message || "Failed to download file.");
    } finally {
      setBusyKey("");
    }
  };

  const handlePreview = async (file) => {
    const key = `${file.category}:${file.relative_path}`;
    try {
      setPreviewKey(key);
      setPreviewLoading(true);
      const { data } = await api.get("/hospital-admin/uploads/preview", {
        params: {
          category: file.category,
          file_key: file.relative_path,
        },
      });
      setPreviewData(data || null);
      setMessage("");
    } catch (error) {
      console.error("Failed to preview uploaded file", error);
      setMessage(error.response?.data?.message || "Failed to open preview.");
    } finally {
      setPreviewLoading(false);
      setPreviewKey("");
    }
  };

  const handleRemove = async (file) => {
    const label = file.original_name || file.file_name || "this file";
    if (!window.confirm(`Remove ${label}? This only deletes the archived upload, not the saved records or model.`)) {
      return;
    }

    const key = `${file.category}:${file.relative_path}`;
    try {
      setBusyKey(key);
      await api.delete("/hospital-admin/uploads", {
        params: {
          category: file.category,
          file_key: file.relative_path,
        },
      });
      setMessage(`${label} removed.`);
      await loadFiles(scope);
    } catch (error) {
      console.error("Failed to remove uploaded file", error);
      setMessage(error.response?.data?.message || "Failed to remove file.");
    } finally {
      setBusyKey("");
    }
  };

  const handleRetrain = async (file) => {
    if (typeof onRetrainFile !== "function") return;

    const key = `${file.category}:${file.relative_path}`;
    try {
      setRetrainKey(key);
      await onRetrainFile(file);
      setMessage(`${file.original_name || file.file_name || "File"} retrain queued.`);
    } catch (error) {
      console.error("Failed to retrain uploaded file", error);
      setMessage(error?.response?.data?.message || error?.message || "Failed to queue retrain job.");
    } finally {
      setRetrainKey("");
    }
  };

  const columns = [
    {
      key: "source",
      label: "Source",
      render: (file) => (
        <span style={{ fontWeight: 700 }}>
          {file.category === "ai" ? "Patient Flow AI" : "Patient Records"}
        </span>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (file) => file.department_name || "Unknown department",
    },
    {
      key: "file",
      label: "File",
      render: (file) => (
        <div style={{ display: "grid", gap: 2 }}>
          <strong>{file.original_name || file.file_name}</strong>
          <span style={{ color: "#64748b", fontSize: 12 }}>{file.file_name}</span>
        </div>
      ),
    },
    {
      key: "size",
      label: "Size",
      render: (file) => formatBytes(file.size_bytes),
    },
    {
      key: "uploaded_at",
      label: "Uploaded",
      render: (file) => formatDateTime(file.uploaded_at),
    },
    {
      key: "actions",
      label: "Actions",
      render: (file) => {
        const key = `${file.category}:${file.relative_path}`;
        const busy = busyKey === key;
        const retraining = retrainKey === key;
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button type="button" size="sm" variant="soft" onClick={() => handlePreview(file)} disabled={busy}>
              {previewKey === `${file.category}:${file.relative_path}` && previewLoading ? "Opening..." : "Open"}
            </Button>
            <Button type="button" size="sm" variant="soft" onClick={() => handleDownload(file)} disabled={busy}>
              {busy ? "Working..." : "Download"}
            </Button>
            {file.category === "ai" && typeof onRetrainFile === "function" ? (
              <Button type="button" size="sm" variant="primary" onClick={() => handleRetrain(file)} disabled={busy || retraining}>
                {retraining ? "Queuing..." : "Retrain"}
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="danger" onClick={() => handleRemove(file)} disabled={busy}>
              Remove
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader>
        <div style={{ display: "grid", gap: 6 }}>
          <div>{title}</div>
          <div style={{ fontSize: 13, fontWeight: 400, color: "#64748b" }}>{subtitle}</div>
        </div>
      </CardHeader>
      <CardBody style={{ display: "grid", gap: 12 }}>
        {showScopeSelector ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "grid", gap: 4, minWidth: 220 }}>
              <span style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>Filter</span>
              <select value={scope} onChange={(e) => setScope(e.target.value)}>
                {SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {message ? (
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "#eff6ff", color: "#1d4ed8" }}>
            {message}
          </div>
        ) : null}

        <Table
          columns={columns}
          rows={loading ? [] : files}
          keyField="relative_path"
          emptyText={loading ? "Loading uploaded files..." : "No uploaded files found."}
        />
      </CardBody>

      {previewData ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewData(null)}
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
                  {previewData?.file?.original_name || previewData?.file?.file_name || "File preview"}
                </div>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  {previewData?.file?.department_name || "Unknown department"} · {previewData?.preview?.total_rows || 0} row(s) previewed
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => handleDownload(previewData.file)}
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
                  onClick={() => setPreviewData(null)}
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
                      <tr key={`${index}-${previewData?.file?.relative_path || "preview"}`}>
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
                    onClick={() => handleDownload(previewData.file)}
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
                    onClick={() => setPreviewData(null)}
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
    </Card>
  );
}