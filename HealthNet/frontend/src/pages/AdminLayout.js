import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getAuthUser } from "../utils/authStorage";
import api from "../services/api";

export default function AdminLayout({ children, currentPage: parentCurrentPage, setCurrentPage: parentSetCurrentPage }) {
  const navigate = useNavigate();
  const user = getAuthUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("healthnetTheme") || "light");
  const [operationsProblemCount, setOperationsProblemCount] = useState(() => {
    const saved = localStorage.getItem("operationsCenterProblemCount");
    return saved ? parseInt(saved, 10) : 0;
  });
  const currentPage = parentCurrentPage ?? (localStorage.getItem("adminPage") || "home");
  const setCurrentPage = parentSetCurrentPage || (() => {});

  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const notificationsOpenRef = useRef(notificationsOpen);
  const notificationsRef = useRef(notifications);

  useEffect(() => {
    notificationsOpenRef.current = notificationsOpen;
  }, [notificationsOpen]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/hospital-admin/notifications");
      if (data?.success) {
        const rawList = data.notifications || [];
        const seenIds = JSON.parse(localStorage.getItem("seenNotifications") || "[]");
        const clearedIds = JSON.parse(localStorage.getItem("clearedNotifications") || "[]");

        // Filter out cleared ones
        let filtered = rawList.filter((n) => !clearedIds.includes(n.id));

        // If dropdown is NOT open, filter out seen ones too
        if (!notificationsOpenRef.current) {
          filtered = filtered.filter((n) => !seenIds.includes(n.id));
        }

        setNotifications(filtered);

        // Unread count is items not seen and not cleared
        const unread = rawList.filter((n) => !seenIds.includes(n.id) && !clearedIds.includes(n.id)).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const closeDropdown = () => {
    const seenIds = JSON.parse(localStorage.getItem("seenNotifications") || "[]");
    const currentIds = notificationsRef.current.map((n) => n.id);
    const updatedSeen = Array.from(new Set([...seenIds, ...currentIds])).slice(-500);
    localStorage.setItem("seenNotifications", JSON.stringify(updatedSeen));

    setNotificationsOpen(false);
    setUnreadCount(0);
    setNotifications((prev) => prev.filter((n) => !currentIds.includes(n.id)));
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleProblemCountChange = (event) => {
      setOperationsProblemCount(event.detail?.count || 0);
    };
    window.addEventListener("operationsCenterProblemCountChanged", handleProblemCountChange);
    return () => window.removeEventListener("operationsCenterProblemCountChanged", handleProblemCountChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && notificationsOpenRef.current) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("healthnetTheme", theme);
  }, [theme]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  const handleRefresh = () => {
    fetchNotifications();
    window.dispatchEvent(new CustomEvent("healthnetRefreshData"));
    toast.success("Dashboard data refreshed.");
  };

  const handleNavClick = (page) => {
    setCurrentPage(page);
    localStorage.setItem("adminPage", page);
  };

  const getMenuIcon = (id, isActive) => {
    const color = isActive ? "#10b981" : "rgba(255, 255, 255, 0.7)";
    const strokeWidth = 2;
    
    switch(id) {
      case "home":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case "departments":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="9" y1="22" x2="9" y2="16" />
            <line x1="15" y1="22" x2="15" y2="16" />
            <line x1="9" y1="16" x2="15" y2="16" />
            <path d="M8 6h8M8 10h8" />
          </svg>
        );
      case "doctors":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        );
      case "staff":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "patients":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      case "reports":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        );
      case "operations-center":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case "ai-patient-flow":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8.01" y2="16" />
            <line x1="16" y1="16" x2="16.01" y2="16" />
          </svg>
        );
      case "roster-optimization":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case "resource-optimization":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
      case "profile":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const menuItems = [
    { id: "home", label: "Home" },
    { id: "departments", label: "Departments" },
    { id: "doctors", label: "Doctors" },
    { id: "staff", label: "Staff" },
    { id: "patients", label: "Patients" },
    { id: "reports", label: "Reports" },
    { id: "operations-center", label: "Operations Center" },
    { id: "ai-patient-flow", label: "Patient Flow AI" },
    { id: "roster-optimization", label: "Roster Optimization" },
    { id: "resource-optimization", label: "Resource Optimization" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div className="hn-shell">
      {/* SIDEBAR */}
      <aside className={`hn-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        {sidebarOpen && (
          <>
            <div className="hn-brand">
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800 }}>
                <span className="hn-brand-pulse">
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                    <rect x="9" y="2" width="6" height="20" rx="2" fill="#10B981" />
                    <rect x="2" y="9" width="20" height="6" rx="2" fill="#10B981" />
                    <path d="M2 12H7.5L9.5 8L12.5 16L14.5 10L15.5 12H22" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </span>
                <span className="hn-brand-gradient">HealthNet</span>
              </h2>
              <p style={{ opacity: 0.85, fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>Hospital Admin Portal</p>
              <p className="hn-brand-user" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>👤</span> {user?.username || "Admin"}
              </p>
            </div>

            <nav className="hn-nav">
              {menuItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`hn-nav-btn ${isActive ? "active" : ""}`}
                  >
                    <span className="hn-nav-icon">{getMenuIcon(item.id, isActive)}</span>
                    <span className="hn-nav-label">{item.label}</span>
                    {item.id === "operations-center" && operationsProblemCount > 0 && (
                      <span className="hn-problem-badge">
                        {operationsProblemCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="hn-logout-wrap">
              <button
                onClick={handleLogout}
                className="hn-logout-btn"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          </>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="hn-main">
        {/* TOP BAR */}
        <header className="hn-topbar">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hn-sidebar-toggle"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
          <h1 className="hn-title">
            Hospital Management
          </h1>
          <style>{`
            .hn-notification-wrapper {
              position: relative;
              display: inline-block;
            }
            .hn-bell-btn {
              background: transparent;
              border: none;
              font-size: 1.25rem;
              cursor: pointer;
              padding: 8px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: background-color 0.2s;
              position: relative;
              color: inherit;
            }
            .hn-bell-btn:hover {
              background-color: var(--button-hover-bg, rgba(0, 0, 0, 0.05));
            }
            .hn-bell-badge {
              position: absolute;
              top: 2px;
              right: 2px;
              background-color: #ef4444;
              color: white;
              font-size: 0.65rem;
              font-weight: 700;
              border-radius: 9999px;
              min-width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0 4px;
              border: 2px solid white;
            }
            .hn-notifications-dropdown {
              position: absolute;
              top: 100%;
              right: 0;
              margin-top: 8px;
              width: 320px;
              background-color: var(--card-bg, #ffffff);
              border: 1px solid var(--border-color, #e2e8f0);
              border-radius: 12px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
              z-index: 1000;
              max-height: 400px;
              overflow-y: auto;
              animation: slideDown 0.15s ease-out;
            }
            .hn-notification-header {
              padding: 12px 16px;
              border-bottom: 1px solid var(--border-color, #e2e8f0);
              font-weight: 700;
              color: var(--text-main, #0f172a);
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 0.9rem;
            }
            .hn-notification-item {
              padding: 12px 16px;
              border-bottom: 1px solid var(--border-color, #f1f5f9);
              font-size: 0.8rem;
              color: var(--text-muted, #334155);
              transition: background-color 0.2s;
              text-align: left;
            }
            .hn-notification-item:hover {
              background-color: var(--hover-bg, #f8fafc);
            }
            .hn-notification-item.severity-critical {
              border-left: 4px solid #ef4444;
            }
            .hn-notification-item.severity-warning {
              border-left: 4px solid #f59e0b;
            }
            .hn-notification-item.severity-info {
              border-left: 4px solid #3b82f6;
            }
            .hn-notification-title {
              font-weight: 700;
              color: var(--text-main, #1e293b);
              margin-bottom: 2px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .hn-notification-time {
              font-size: 0.7rem;
              color: var(--text-muted, #94a3b8);
              font-weight: normal;
            }
            .hn-notification-empty {
              padding: 24px 16px;
              text-align: center;
              color: var(--text-muted, #64748b);
              font-size: 0.85rem;
            }
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes bellRing {
              0%, 100% { transform: rotate(0); }
              15% { transform: rotate(20deg); }
              30% { transform: rotate(-18deg); }
              45% { transform: rotate(15deg); }
              60% { transform: rotate(-12deg); }
              75% { transform: rotate(8deg); }
              90% { transform: rotate(-4deg); }
            }
            .hn-bell-btn.has-unread {
              animation: bellRing 1.2s ease-in-out infinite;
              transform-origin: top center;
            }
          `}</style>
          
          <div className="hn-notification-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className={`hn-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
              onClick={() => {
                if (notificationsOpen) {
                  closeDropdown();
                } else {
                  setNotificationsOpen(true);
                }
              }}
              title="Notifications"
              aria-label="View notifications"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ verticalAlign: "middle" }}
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className="hn-bell-badge">{unreadCount}</span>}
            </button>
            {notificationsOpen && (
              <div className="hn-notifications-dropdown">
                <div className="hn-notification-header">
                  <span>Alerts &amp; Notifications</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        const clearedIds = JSON.parse(localStorage.getItem("clearedNotifications") || "[]");
                        const currentIds = notifications.map((n) => n.id);
                        const updatedCleared = Array.from(new Set([...clearedIds, ...currentIds])).slice(-500);
                        localStorage.setItem("clearedNotifications", JSON.stringify(updatedCleared));

                        setNotifications([]);
                        setUnreadCount(0);
                        setNotificationsOpen(false);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#3b82f6",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="hn-notification-empty">
                    🎉 No active alerts or warnings.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`hn-notification-item severity-${notif.severity}`}>
                      <div className="hn-notification-title">
                        <span>{notif.title}</span>
                        <span className="hn-notification-time">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div style={{ marginTop: 2 }}>{notif.message}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="hn-sidebar-toggle"
            onClick={handleRefresh}
            aria-label="Refresh page"
            title="Refresh page"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ verticalAlign: "middle" }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
          <button
            type="button"
            className="hn-sidebar-toggle"
            onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
            aria-label="Toggle theme"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <div className="hn-date-pill">
            {new Date().toLocaleDateString("en-US", { 
              weekday: "short", 
              month: "short", 
              day: "numeric", 
              year: "numeric" 
            })}
          </div>
        </header>

        {/* CONTENT AREA */}
        <section className="hn-content-area">
          {children}
        </section>
      </main>
    </div>
  );
}
