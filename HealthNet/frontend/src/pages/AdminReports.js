import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Button, Card, CardBody, CardHeader } from "../components/ui";

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/hospital-admin/hospital-analytics");
      setReports(data?.data || data || null);
    } catch (err) {
      console.error("Error loading reports:", err);
      setError(err.response?.data?.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, icon = "📊" }) => (
    <Card>
      <CardBody>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>{value}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>{label}</div>
        </div>
      </CardBody>
    </Card>
  );

  const DetailCard = ({ title, items }) => (
    <Card>
      <CardHeader>{title}</CardHeader>
      <CardBody>
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: idx !== items.length - 1 ? "1px solid var(--surface-border)" : "none",
                paddingBottom: 8,
              }}
            >
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{item.label}</span>
              <strong style={{ color: "var(--text-main)", fontSize: 14 }}>{item.value}</strong>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div>
      <div className="hnu-page-head">
        <div>
          <h2 className="hnu-page-title">Hospital Analytics & Reports</h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 }}>
            Comprehensive overview of hospital operations and performance
          </p>
        </div>
        <Button onClick={loadReports} variant="primary">Refresh Analytics</Button>
      </div>

      {loading && (
        <Card>
          <CardBody>
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>
              <div style={{ fontSize: 18, marginBottom: 8 }}>Loading analytics...</div>
              <p style={{ margin: 0 }}>Fetching hospital data</p>
            </div>
          </CardBody>
        </Card>
      )}

      {error && <div className="hnu-message error">{error}</div>}

      {!loading && reports && (
        <div style={{ display: "grid", gap: 16 }}>
          <Card>
            <CardBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Hospital Name</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{reports?.hospital?.name || "N/A"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Location & Status</div>
                  <div style={{ marginTop: 6, fontWeight: 700 }}>
                    {reports?.hospital?.city || "N/A"} • {reports?.hospital?.status || "N/A"}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <StatCard icon="👨‍⚕️" label="Total Doctors" value={reports?.staff?.by_role?.doctors || 0} />
            <StatCard icon="👩‍⚕️" label="Total Nurses" value={reports?.staff?.by_role?.nurses || 0} />
            <StatCard icon="📞" label="Receptionists" value={reports?.staff?.by_role?.receptionists || 0} />
            <StatCard icon="👥" label="Staff Members" value={reports?.staff?.by_role?.staff || 0} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            <DetailCard
              title="Staff Summary"
              items={[
                { label: "Total Staff", value: reports?.staff?.total || 0 },
                { label: "Active", value: reports?.staff?.active || 0 },
                { label: "Suspended", value: reports?.staff?.suspended || 0 },
              ]}
            />
            <DetailCard
              title="Departments"
              items={[
                { label: "Total", value: reports?.departments?.total || 0 },
                { label: "Active", value: reports?.departments?.active || 0 },
                { label: "Inactive", value: reports?.departments?.inactive || 0 },
              ]}
            />
            <DetailCard
              title="Patients"
              items={[
                { label: "Total", value: reports?.patients?.total || 0 },
                { label: "Active", value: reports?.patients?.active || 0 },
                { label: "Discharged", value: reports?.patients?.discharged || 0 },
                { label: "Deceased", value: reports?.patients?.deceased || 0 },
              ]}
            />
          </div>

          <DetailCard
            title="Resources Inventory"
            items={[
              { label: "Total Resources", value: reports?.resources?.total || 0 },
              { label: "Available", value: reports?.resources?.available || 0 },
              { label: "Low Stock", value: reports?.resources?.low_stock || 0 },
              { label: "Out of Stock", value: reports?.resources?.out_of_stock || 0 },
              { label: "Maintenance", value: reports?.resources?.maintenance || 0 },
            ]}
          />

          {reports?.ai_alerts && reports.ai_alerts.length > 0 && (
            <Card>
              <CardHeader>AI Alerts ({reports.ai_alerts.length})</CardHeader>
              <CardBody>
                <div style={{ display: "grid", gap: 8 }}>
                  {reports.ai_alerts.map((alert, idx) => (
                    <div key={idx} className="hnu-message error" style={{ marginBottom: 0 }}>
                      {typeof alert === "string" ? alert : (alert?.message || "Alert")}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
