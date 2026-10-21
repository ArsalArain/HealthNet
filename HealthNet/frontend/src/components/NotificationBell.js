import React, { useEffect, useState, useRef } from "react";
import { FiBell, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import "../styles/NotificationBell.css";

const NotificationBell = ({ notifications = [], unreadCount = 0, onNotificationClick = () => {}, onDismiss = () => {}, onClearAll = () => {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayNotifications, setDisplayNotifications] = useState(notifications);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setDisplayNotifications(notifications);
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = (notification) => {
    onNotificationClick(notification);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_appointment":
      case "appointment_update":
        return <FiCheck className="notification-icon success" />;
      case "emergency_alert":
      case "urgent":
        return <FiAlertCircle className="notification-icon danger" />;
      default:
        return <FiBell className="notification-icon info" />;
    }
  };

  const getNotificationBgColor = (type) => {
    switch (type) {
      case "new_appointment":
      case "appointment_update":
        return "notification-item-success";
      case "emergency_alert":
      case "urgent":
        return "notification-item-danger";
      case "patient_update":
        return "notification-item-warning";
      default:
        return "notification-item-info";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <FiBell className="bell-icon" size={24} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {displayNotifications && displayNotifications.length > 0 && (
                <button
                  className="clear-all-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearAll();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0ea5e9",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  Clear All
                </button>
              )}
              <button
                className="close-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {displayNotifications && displayNotifications.length > 0 ? (
              displayNotifications.map((notification, index) => (
                <div
                  key={notification._id || index}
                  className={`notification-item ${getNotificationBgColor(notification.type)}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ position: "relative", paddingRight: "36px" }}
                >
                  <button
                    className="dismiss-notification-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(notification._id || notification.appointment_id);
                    }}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "14px",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
                    title="Dismiss"
                  >
                    <FiX size={14} />
                  </button>
                  <div className="notification-content">
                    <div className="notification-header-row">
                      <div className="notification-icon-wrapper">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-text">
                        <p className="notification-message">
                          {notification.message || "New notification"}
                        </p>
                        {notification.patient_name && (
                          <p className="notification-patient">
                            Patient: <strong>{notification.patient_name}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="notification-time">
                      {formatTime(notification.created_at || new Date())}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <FiBell size={32} />
                <p>No notifications</p>
              </div>
            )}
          </div>

          {displayNotifications && displayNotifications.length > 0 && (
            <div className="notification-footer">
              <small>Showing latest {displayNotifications.length} notifications</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
