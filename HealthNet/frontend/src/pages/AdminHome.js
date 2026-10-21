import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminHome({ onNavigate }) {
  const [stats, setStats] = useState({
    doctors: 0,
    staff: 0,
    departments: 0,
    patients: 0,
    appointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get("/hospital-admin/stats");
        if (response.data && response.data.success) {
          setStats(response.data.stats);
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      label: "Doctors",
      value: stats.doctors,
      icon: "👨‍⚕️",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
      iconBg: "rgba(59, 130, 246, 0.1)",
      targetPage: "doctors",
    },
    {
      label: "Staff Members",
      value: stats.staff,
      icon: "👥",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      iconBg: "rgba(16, 185, 129, 0.1)",
      targetPage: "staff",
    },
    {
      label: "Departments",
      value: stats.departments,
      icon: "🏢",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      iconBg: "rgba(245, 158, 11, 0.1)",
      targetPage: "departments",
    },
    {
      label: "Patients Registered",
      value: stats.patients,
      icon: "🏥",
      gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      iconBg: "rgba(239, 68, 68, 0.1)",
      targetPage: "patients",
    },
    {
      label: "Appointments Booked",
      value: stats.appointments,
      icon: "📅",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      iconBg: "rgba(139, 92, 246, 0.1)",
      targetPage: "reports",
    },
  ];

  return (
    <div className="admin-dashboard-container animate-fade-in">
      <style>{`
        .admin-dashboard-container {
          padding: 32px;
          font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
          background: radial-gradient(circle at 0% 0%, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes flowGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes iconWiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-8deg) scale(1.1); }
          75% { transform: rotate(8deg) scale(1.1); }
        }

        .animate-fade-in {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Banner */
        .welcome-banner {
          background: linear-gradient(-45deg, #0f172a, #1e293b, #334155, #0f172a);
          background-size: 400% 400%;
          animation: flowGradient 15s ease infinite;
          border-radius: 28px;
          padding: 40px;
          color: white;
          margin-bottom: 36px;
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.3);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .welcome-banner::after {
          content: '';
          position: absolute;
          right: -10%;
          bottom: -30%;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(255, 255, 255, 0) 70%);
          pointer-events: none;
        }
        .welcome-banner h1 {
          margin: 0 0 12px 0;
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(120deg, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .welcome-banner p {
          margin: 0;
          color: #94a3b8;
          font-size: 1.05rem;
          max-width: 650px;
          line-height: 1.6;
        }

        /* Live Indicator */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #059669;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 24px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s infinite;
        }

        /* Header */
        .dashboard-header {
          margin-bottom: 28px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .dashboard-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
          letter-spacing: -0.025em;
        }
        .dashboard-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
        }

        /* Stats Grid & Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }
        .stat-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(226, 232, 240, 0.7);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02), 0 4px 6px -2px rgba(0, 0, 0, 0.01);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 6px;
          background: var(--card-gradient);
          transition: height 0.4s ease;
        }
        .stat-card:hover {
          transform: translateY(-8px) scale(1.02);
          background: #ffffff;
          box-shadow: 0 25px 35px -12px rgba(0, 0, 0, 0.08), 0 12px 16px -8px rgba(0, 0, 0, 0.04);
          border-color: rgba(203, 213, 225, 0.9);
        }
        .stat-card:hover::before {
          height: 10px;
        }
        .stat-card:hover .stat-icon-wrapper {
          animation: iconWiggle 0.6s ease-in-out;
        }
        .stat-icon-wrapper {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 22px;
          box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        .stat-value {
          font-size: 2.75rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 8px;
          letter-spacing: -0.04em;
        }
        .stat-label {
          font-size: 0.9rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Quick Actions */
        .quick-actions-section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 32px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02);
        }
        .quick-actions-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 20px 0;
          letter-spacing: -0.02em;
        }
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .action-button {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #334155;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .action-button:hover {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -8px rgba(15, 23, 42, 0.25);
        }
        .action-icon {
          font-size: 1.25rem;
        }

        /* Spinner & Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 350px;
          color: #64748b;
        }
        .spinner {
          width: 44px;
          height: 44px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="welcome-banner">
        <div className="status-badge">
          <span className="status-dot"></span>
          Live Database Connected
        </div>
        <h1>Welcome to Hospital Dashboard</h1>
        <p>
          Monitor hospital metrics, manage departments and staff, and handle patient flows effectively with real-time statistical insights.
        </p>
      </div>

      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">System Overview</h2>
          <p className="dashboard-subtitle">Real-time counts of hospital resources and activity</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <div>Loading hospital statistics...</div>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="stat-card"
                style={{ "--card-gradient": card.gradient }}
                onClick={() => {
                  if (onNavigate && card.targetPage) {
                    onNavigate(card.targetPage);
                    localStorage.setItem("adminPage", card.targetPage);
                  }
                }}
              >
                <div className="stat-icon-wrapper" style={{ backgroundColor: card.iconBg }}>
                  {card.icon}
                </div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="quick-actions-section">
            <h3 className="quick-actions-title">⚡ Quick Management Channels</h3>
            <div className="actions-grid">
              <button className="action-button" onClick={() => onNavigate("departments")}>
                <span className="action-icon">🏢</span> Add / Edit Departments
              </button>
              <button className="action-button" onClick={() => onNavigate("doctors")}>
                <span className="action-icon">👨‍⚕️</span> Manage Doctor Rosters
              </button>
              <button className="action-button" onClick={() => onNavigate("staff")}>
                <span className="action-icon">👥</span> Staff Directory
              </button>
              <button className="action-button" onClick={() => onNavigate("patients")}>
                <span className="action-icon">🏥</span> View Patient Profiles
              </button>
              <button className="action-button" onClick={() => onNavigate("roster-optimization")}>
                <span className="action-icon">📋</span> Roster Optimizer AI
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
