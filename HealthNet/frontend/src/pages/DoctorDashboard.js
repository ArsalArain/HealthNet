import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiActivity,
  FiBell,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLogOut,
  FiSearch,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import api from "../services/api";
import { clearAuthSession, getAuthUser } from "../utils/authStorage";
import NotificationBell from "../components/NotificationBell";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TAB_LIST = ["Patients", "Appointments", "Prescription", "Schedule", "Notifications", "Profile"];

function formatDate(value, fallback = "-") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
}

function DoctorDashboard() {
  const navigate = useNavigate();
  const user = getAuthUser();

  const [activeTab, setActiveTab] = useState("Patients");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("healthnetTheme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("healthnetTheme", theme);
  }, [theme]);

  const getMenuIcon = (id, isActive) => {
    const color = isActive ? "#10b981" : "rgba(255, 255, 255, 0.7)";
    const strokeWidth = 2;
    switch (id.toLowerCase()) {
      case "patients":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        );
      case "appointments":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case "prescription":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case "schedule":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case "notifications":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState({
    total_patients: 0,
    today_appointments: 0,
    completed_cases: 0,
    available_slots: 0,
  });

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const [appointments, setAppointments] = useState([]);
  const [appointmentFilter, setAppointmentFilter] = useState({ period: "", status: "" });

  const [schedule, setSchedule] = useState({
    shift: "",
    available_days: [],
    status: "active",
    booked_slots: [],
    free_slots: [],
    time_slots: [],
  });

  const [notifications, setNotifications] = useState([]);
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [scheduleRequestForm, setScheduleRequestForm] = useState({
    shift: "morning",
    status: "active",
    available_days: [],
    reason: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [diagnosisForm, setDiagnosisForm] = useState({ patient_id: "", diagnosis: "", notes: "" });
  const [prescriptionForm, setPrescriptionForm] = useState({ patient_id: "", medicines: "", instructions: "" });
  const [treatmentNoteForm, setTreatmentNoteForm] = useState({ diagnosis_id: "", notes: "" });
  const [appointmentToComplete, setAppointmentToComplete] = useState(null);
  const [availableResources, setAvailableResources] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const hasInitializedRef = useRef(false);

  const selectedPatient = useMemo(
    () => patients.find((patient) => String(patient._id) === String(selectedPatientId)) || null,
    [patients, selectedPatientId]
  );

  const selectedPrescriptionPatient = useMemo(
    () => patients.find((patient) => String(patient._id) === String(prescriptionForm.patient_id)) || null,
    [patients, prescriptionForm.patient_id]
  );

  const loadProfile = async () => {
    const { data } = await api.get("/doctor/profile");
    setProfile(data.profile || null);
    setSummary((prev) => ({ ...prev, ...(data.summary || {}) }));
  };

  const loadPatients = async (queryText = "") => {
    const { data } = await api.get("/doctor/patients", {
      params: {
        q: queryText,
        include_history: true,
        limit: 50,
      },
    });

    const loadedPatients = data.patients || [];
    setPatients(loadedPatients);

    const preferredId = diagnosisForm.patient_id || prescriptionForm.patient_id || selectedPatientId;
    if (preferredId && loadedPatients.some((patient) => String(patient._id) === String(preferredId))) {
      setSelectedPatientId(String(preferredId));
    } else if (loadedPatients.length > 0) {
      const fallbackId = String(loadedPatients[0]._id);
      setSelectedPatientId(fallbackId);
      setDiagnosisForm((prev) => ({ ...prev, patient_id: prev.patient_id || fallbackId }));
      setPrescriptionForm((prev) => ({ ...prev, patient_id: prev.patient_id || fallbackId }));
    }
  };

  const loadAppointments = async (filters = appointmentFilter) => {
    const { data } = await api.get("/doctor/appointments", { params: filters });
    setAppointments(data.appointments || []);
    const summaryPatch = data.summary || {};
    setSummary((prev) => ({
      ...prev,
      today_appointments: summaryPatch.today ?? prev.today_appointments,
      completed_cases: summaryPatch.completed ?? prev.completed_cases,
    }));
  };

  const loadSchedule = async () => {
    const { data } = await api.get("/doctor/schedule");
    const nextSchedule = data.schedule || {};
    setSchedule(nextSchedule);
    setScheduleRequestForm((prev) => ({
      ...prev,
      shift: prev.shift || nextSchedule.shift || "morning",
      status: prev.status || nextSchedule.status || "active",
      available_days: prev.available_days?.length ? prev.available_days : (nextSchedule.available_days || []),
    }));
    setSummary((prev) => ({ ...prev, available_slots: (nextSchedule.free_slots || []).length }));
  };

  const loadScheduleRequests = async () => {
    try {
      const { data } = await api.get("/doctor/schedule/change-requests");
      setScheduleRequests(data.requests || []);
    } catch (error) {
      // Keep dashboard usable even if this endpoint is temporarily unavailable.
      setScheduleRequests([]);
      if (error?.response?.status === 404) {
        return;
      }
      throw error;
    }
  };

  const loadNotifications = async () => {
    const { data } = await api.get("/doctor/notifications");
    setNotifications(data.notifications || []);
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === "new_appointment" || notification.type === "patient_update") {
      setActiveTab("Appointments");
    }
    toast.info(`${notification.message}`);
  };

  const reloadAll = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      loadProfile(),
      loadPatients(patientSearch),
      loadAppointments(),
      loadSchedule(),
      loadScheduleRequests(),
      loadNotifications(),
    ]);

    const failed = results
      .map((result, index) => ({ result, index }))
      .filter((item) => item.result.status === "rejected");

    if (failed.length > 0) {
      const firstError = failed[0]?.result?.reason;
      const message = firstError?.response?.data?.message || firstError?.message || "Some dashboard sections failed to load.";
      toast.warning(`${message} (${failed.length} section${failed.length > 1 ? "s" : ""})`);
    }

    setLoading(false);
  };

  const handleRefresh = async () => {
    try {
      const results = await Promise.allSettled([
        loadProfile(),
        loadPatients(patientSearch),
        loadAppointments(),
        loadSchedule(),
        loadScheduleRequests(),
        loadNotifications(),
      ]);

      const failed = results
        .map((result, index) => ({ result, index }))
        .filter((item) => item.result.status === "rejected");

      if (failed.length > 0) {
        const firstError = failed[0]?.result?.reason;
        const message = firstError?.response?.data?.message || firstError?.message || "Some dashboard sections failed to load.";
        toast.warning(`${message} (${failed.length} section${failed.length > 1 ? "s" : ""})`);
      } else {
        toast.success("Dashboard data refreshed.");
      }
    } catch (error) {
      toast.error("Failed to refresh dashboard data.");
    }
  };

  useEffect(() => {
    if (!user || user.role !== "doctor") {
      navigate("/login", { replace: true });
      return;
    }

    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    reloadAll();
  }, [navigate, user]);

  useEffect(() => {
    if (profile?.hospital_id?._id || profile?.hospital_id) {
      const hospId = profile.hospital_id?._id || profile.hospital_id;
      api.get(`/department-resources?hospital_id=${hospId}`)
        .then(({ data }) => {
          if (data && data.success) {
            const names = [];
            (data.data || []).forEach(dept => {
              (dept.resources || []).forEach(res => {
                if (res.name) names.push(res.name);
              });
            });
            setAvailableResources([...new Set(names)]);
          }
        })
        .catch(err => console.error("Error loading resources for autocomplete:", err));
    }
  }, [profile]);

  const handleMedicinesChange = (event) => {
    const value = event.target.value;
    setPrescriptionForm((prev) => ({ ...prev, medicines: value }));

    const parts = value.split(",");
    const lastToken = parts[parts.length - 1].trim();

    if (lastToken.length >= 1) {
      const matches = availableResources.filter(name =>
        name.toLowerCase().includes(lastToken.toLowerCase()) &&
        name.toLowerCase() !== lastToken.toLowerCase()
      );
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (name) => {
    const parts = prescriptionForm.medicines.split(",");
    parts[parts.length - 1] = " " + name;
    const newValue = parts.join(",").trim();
    setPrescriptionForm((prev) => ({ ...prev, medicines: newValue + ", " }));
    setSuggestions([]);
  };

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      loadNotifications().catch(() => {
        // Silently fail notification refresh to not interrupt user experience
      });
    }, 30000);

    return () => clearInterval(notificationInterval);
  }, []);

  const onSearchPatients = async (event) => {
    event.preventDefault();
    try {
      await loadPatients(patientSearch);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to search patients.");
    }
  };

  const onChangeAppointmentFilter = async (patch) => {
    const nextFilter = { ...appointmentFilter, ...patch };
    setAppointmentFilter(nextFilter);
    try {
      await loadAppointments(nextFilter);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to filter appointments.");
    }
  };

  const onUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      await api.put(`/doctor/appointments/${appointmentId}`, { status });
      toast.success("Appointment status updated.");
      await Promise.all([loadAppointments(), loadSchedule()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update appointment status.");
    }
  };

  const onAddDiagnosis = async (event) => {
    event.preventDefault();
    if (!diagnosisForm.patient_id || !diagnosisForm.diagnosis.trim()) {
      toast.error("Select patient and enter diagnosis.");
      return;
    }

    try {
      await api.post("/doctor/diagnosis", {
        patient_id: diagnosisForm.patient_id,
        diagnosis: diagnosisForm.diagnosis,
        notes: diagnosisForm.notes,
      });
      toast.success("Diagnosis saved.");
      setDiagnosisForm((prev) => ({ ...prev, diagnosis: "", notes: "" }));
      await loadPatients(patientSearch);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add diagnosis.");
    }
  };

  const onAddPrescription = async (event) => {
    event.preventDefault();
    if (!prescriptionForm.patient_id || !prescriptionForm.medicines.trim()) {
      toast.error("Select patient and enter medicines.");
      return;
    }

    const medicines = prescriptionForm.medicines
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const payload = {
        patient_id: prescriptionForm.patient_id,
        medicines,
        instructions: prescriptionForm.instructions,
      };

      if (appointmentToComplete && String(appointmentToComplete.patient_id?._id) === String(prescriptionForm.patient_id)) {
        payload.appointment_id = appointmentToComplete._id;
      }

      await api.post("/doctor/prescription", payload);
      toast.success(payload.appointment_id ? "Prescription saved and appointment completed." : "Prescription saved.");
      setPrescriptionForm({ patient_id: "", medicines: "", instructions: "" });
      setAppointmentToComplete(null);
      await Promise.all([
        loadPatients(patientSearch),
        loadAppointments(),
        loadSchedule(),
        loadProfile()
      ]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add prescription.");
    }
  };

  const onUpdateTreatmentNotes = async (event) => {
    event.preventDefault();
    if (!treatmentNoteForm.diagnosis_id.trim()) {
      toast.error("Enter diagnosis id to update notes.");
      return;
    }

    try {
      await api.put(`/doctor/diagnosis/${treatmentNoteForm.diagnosis_id}/notes`, {
        notes: treatmentNoteForm.notes,
      });
      toast.success("Treatment notes updated.");
      setTreatmentNoteForm({ diagnosis_id: "", notes: "" });
      await loadPatients(patientSearch);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update treatment notes.");
    }
  };

  const onSubmitScheduleRequest = async (event) => {
    event.preventDefault();
    const payload = {
      shift: scheduleRequestForm.shift,
      status: scheduleRequestForm.status,
      available_days: scheduleRequestForm.available_days,
      reason: scheduleRequestForm.reason,
    };

    try {
      await api.post("/doctor/schedule/change-request", payload);
      toast.success("Schedule change request sent to hospital admin.");
      setScheduleRequestForm((prev) => ({ ...prev, reason: "" }));
      await loadScheduleRequests();
    } catch (error) {
      const statusCode = Number(error?.response?.status || 0);
      const rawBody = String(error?.response?.data || "");
      const looksLikeMissingPost = statusCode === 404
        && /cannot\s+post\s+\/api\/doctor\/schedule\/change-request/i.test(rawBody);

      if (looksLikeMissingPost) {
        try {
          await api.put("/doctor/schedule/availability", payload);
          toast.success("Schedule request submitted via compatibility mode.");
          setScheduleRequestForm((prev) => ({ ...prev, reason: "" }));
          await loadScheduleRequests();
          return;
        } catch (fallbackError) {
          const fallbackMessage = fallbackError?.response?.data?.message
            || fallbackError?.message
            || "Unable to submit schedule change request. Please restart backend and try again.";
          toast.error(fallbackMessage);
          return;
        }
      }

      const responseData = error?.response?.data;
      const fallbackText = typeof responseData === "string"
        ? responseData
        : responseData?.message || error?.message || "Unable to submit schedule change request.";
      toast.error(fallbackText);
    }
  };

  const onChangePassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      toast.error("All password fields are required.");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    try {
      setUpdatingPassword(true);
      const { data } = await api.put("/staff-auth/profile", {
        current_password: passwordForm.current_password,
        password: passwordForm.new_password,
      });

      toast.success(data?.message || "Password updated successfully.");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const cards = [
    {
      key: "total_patients",
      title: "Total Patients",
      value: summary.total_patients || 0,
      icon: <FiUsers />,
      tone: "cyan",
    },
    {
      key: "today_appointments",
      title: "Today Appointments",
      value: summary.today_appointments || 0,
      icon: <FiCalendar />,
      tone: "blue",
    },
    {
      key: "available_slots",
      title: "Available Slots",
      value: summary.available_slots || 0,
      icon: <FiClock />,
      tone: "teal",
    },
    {
      key: "completed_cases",
      title: "Completed Cases",
      value: summary.completed_cases || 0,
      icon: <FiCheckCircle />,
      tone: "green",
    },
  ];

  if (!user || user.role !== "doctor") return null;

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
              <p style={{ opacity: 0.85, fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>Doctor Portal</p>
              <p className="hn-brand-user" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>👤</span> {profile?.name || user?.name || "Doctor"}
              </p>
            </div>

            <nav className="hn-nav">
              {TAB_LIST.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`hn-nav-btn ${isActive ? "active" : ""}`}
                  >
                    <span className="hn-nav-icon">{getMenuIcon(tab, isActive)}</span>
                    <span className="hn-nav-label">{tab}</span>
                  </button>
                );
              })}
            </nav>

            <div className="hn-logout-wrap">
              <button
                onClick={() => {
                  clearAuthSession();
                  navigate("/login", { replace: true });
                }}
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
            Doctor Dashboard
          </h1>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <NotificationBell
              notifications={notifications}
              unreadCount={notifications.length}
              onNotificationClick={handleNotificationClick}
            />
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
          </div>
        </header>

        {/* CONTENT AREA */}
        <section className="hn-content-area">
          {/* STATS CARDS GRID */}
          <section className="doctor-card-grid" style={{ marginBottom: "20px" }}>
            {cards.map((card) => (
              <article key={card.key} className={`doctor-stat-card tone-${card.tone}`}>
                <div className="doctor-stat-icon">{card.icon}</div>
                <p>{card.title}</p>
                <h3>{card.value}</h3>
              </article>
            ))}
          </section>

      {loading ? (
        <section className="doctor-panel">
          <p>Loading dashboard...</p>
        </section>
      ) : (
        <>
          {activeTab === "Patients" && (
            <section className="doctor-panel">
              <div className="doctor-panel-head">
                <h2>Patient Management</h2>
                <form onSubmit={onSearchPatients} className="doctor-search-form">
                  <FiSearch />
                  <input
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    placeholder="Search by name, email, phone, history"
                  />
                  <button type="submit">Search</button>
                </form>
              </div>

              <div className="doctor-patient-grid">
                <div className="doctor-list">
                  {patients.map((patient) => (
                    <button
                      key={patient._id}
                      type="button"
                      className={`doctor-list-item ${String(selectedPatientId) === String(patient._id) ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedPatientId(String(patient._id));
                        setDiagnosisForm((prev) => ({ ...prev, patient_id: String(patient._id) }));
                        setPrescriptionForm((prev) => ({ ...prev, patient_id: String(patient._id) }));
                      }}
                    >
                      <strong>{patient.name}</strong>
                      <span>{patient.phone || patient.email || "No contact"}</span>
                    </button>
                  ))}
                  {patients.length === 0 && <p>No assigned patients found.</p>}
                </div>

                <div className="doctor-history-card">
                  <h3>Patient History</h3>
                  {selectedPatient ? (
                    <>
                      <p><strong>Name:</strong> {selectedPatient.name}</p>
                      <p><strong>Medical History:</strong> {selectedPatient.medical_history || "No history recorded"}</p>
                      <p><strong>Prescriptions:</strong> {selectedPatient.history?.total_prescriptions || 0}</p>

                      <div className="doctor-history-section">
                        <h4>Recent Prescriptions</h4>
                        {(selectedPatient.history?.prescriptions || []).slice(0, 3).map((item) => (
                          <article key={item._id} className="doctor-history-item">
                            <strong>{(item.medicines || []).join(", ") || "-"}</strong>
                            <p>{item.instructions || "No instructions"}</p>
                            <small>{formatDate(item.created_at)}</small>
                          </article>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p>Select a patient to view details.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeTab === "Appointments" && (
            <section className="doctor-panel">
              <div className="doctor-panel-head">
                <h2>Appointment Management</h2>
                <div className="doctor-inline-filters">
                  <select
                    value={appointmentFilter.period}
                    onChange={(event) => onChangeAppointmentFilter({ period: event.target.value })}
                  >
                    <option value="today">Today</option>
                    <option value="weekly">Weekly</option>
                    <option value="">All</option>
                  </select>
                  <select
                    value={appointmentFilter.status}
                    onChange={(event) => onChangeAppointmentFilter({ status: event.target.value })}
                  >
                    <option value="">All status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="doctor-table-wrap">
                <table className="doctor-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment._id}>
                        <td>{appointment.patient_id?.name || "Unknown"}</td>
                        <td>{formatDate(appointment.appointment_at)}</td>
                        <td>{appointment.status}</td>
                        <td>{appointment.reason || "-"}</td>
                        <td>
                          <div className="doctor-action-buttons">
                             <button
                               type="button"
                               onClick={() => {
                                 setAppointmentToComplete(appointment);
                                 setPrescriptionForm((prev) => ({
                                   ...prev,
                                   patient_id: appointment.patient_id?._id || "",
                                 }));
                                 setActiveTab("Prescription");
                               }}
                               disabled={appointment.status === "completed"}
                             >
                               Complete
                             </button>
                            <button
                              type="button"
                              onClick={() => onUpdateAppointmentStatus(appointment._id, "pending")}
                              disabled={appointment.status === "pending"}
                            >
                              Pending
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateAppointmentStatus(appointment._id, "cancelled")}
                              disabled={appointment.status === "cancelled"}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {appointments.length === 0 && (
                      <tr>
                        <td colSpan={5}>No appointments for selected filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "Prescription" && (
            <section className="doctor-panel">
              <div className="doctor-panel-head">
                <h2>Prescription Management</h2>
                <p className="panel-subtitle">Generate official prescriptions and auto-deduct required inventory resources.</p>
              </div>

              <div className="prescription-pad-wrapper">
                {appointmentToComplete && (
                  <div style={{
                    background: "rgba(249, 115, 22, 0.1)",
                    border: "1px solid rgb(249, 115, 22)",
                    color: "rgb(249, 115, 22)",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    fontSize: "13px",
                    fontWeight: "bold",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span>Completing appointment for {appointmentToComplete.patient_id?.name || "Patient"} (scheduled for {new Date(appointmentToComplete.appointment_at).toLocaleString()})</span>
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: "inherit",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "16px"
                      }}
                      onClick={() => setAppointmentToComplete(null)}
                    >
                      ✕
                    </button>
                  </div>
                )}
                <form onSubmit={onAddPrescription} className="prescription-pad">
                  {/* Pad Header */}
                  <div className="pad-header">
                    <div className="hospital-branding">
                      <h3 className="hospital-name">{profile?.hospital_id?.name || "HealthNet Hospital"}</h3>
                      <p className="hospital-address">{profile?.hospital_id?.city || "Healthcare Facility"}</p>
                    </div>
                    <div className="doctor-branding">
                      <h4 className="doctor-name">{profile?.name || "Doctor"}</h4>
                      <p className="doctor-specialty">{profile?.specialization || "Medical Officer"}</p>
                      <p className="doctor-dept">Dept: {profile?.department_id?.name || "General Medicine"}</p>
                    </div>
                  </div>

                  <div className="pad-divider"></div>

                  {/* Patient Info Section */}
                  <div className="pad-patient-info">
                    <div className="info-field">
                      <label>Patient:</label>
                      <select
                        value={prescriptionForm.patient_id}
                        onChange={(event) => {
                          const val = event.target.value;
                          setPrescriptionForm((prev) => ({ ...prev, patient_id: val }));
                          if (appointmentToComplete && String(appointmentToComplete.patient_id?._id) !== String(val)) {
                            setAppointmentToComplete(null);
                          }
                        }}
                        className="pad-select"
                        required
                      >
                        <option value="">Select patient...</option>
                        {patients.map((patient) => (
                          <option key={patient._id} value={patient._id}>{patient.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="info-field">
                      <label>Date:</label>
                      <span className="pad-date-val">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    {selectedPrescriptionPatient && (
                      <>
                        <div className="info-field">
                          <label>Phone:</label>
                          <span>{selectedPrescriptionPatient.phone || "N/A"}</span>
                        </div>
                        <div className="info-field">
                          <label>Email:</label>
                          <span>{selectedPrescriptionPatient.email || "N/A"}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pad-divider double"></div>

                  {/* Prescription Body */}
                  <div className="pad-body">
                    <div className="rx-symbol">℞</div>
                    
                    <div className="pad-form-fields">
                      <div className="pad-input-group" style={{ position: "relative" }}>
                        <label className="field-label">Medicines (comma separated)</label>
                        <input
                          value={prescriptionForm.medicines}
                          onChange={handleMedicinesChange}
                          placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg, Ibuprofen"
                          className="pad-input"
                          required
                          autoComplete="off"
                        />
                        {suggestions.length > 0 && (
                          <div style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            backgroundColor: "var(--card-bg, #ffffff)",
                            border: "1px solid var(--border-color, #e2e8f0)",
                            borderRadius: "6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            zIndex: 1000,
                            maxHeight: "200px",
                            overflowY: "auto",
                            marginTop: "4px"
                          }}>
                            {suggestions.map((name, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleSelectSuggestion(name)}
                                style={{
                                  padding: "8px 12px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid var(--border-color, #f1f5f9)",
                                  fontSize: "13px",
                                  transition: "background-color 0.2s",
                                  color: "var(--text-main, #1e293b)"
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = "var(--bg-hover, #f1f5f9)"}
                                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                              >
                                💊 {name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Interactive pill preview of added medicines */}
                      {prescriptionForm.medicines.trim() && (
                        <div className="medicine-pills-preview">
                          {prescriptionForm.medicines.split(',').map((med, idx) => {
                            const trimmed = med.trim();
                            if (!trimmed) return null;
                            return (
                              <span key={idx} className="medicine-pill">
                                💊 {trimmed}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="pad-input-group" style={{ marginTop: '20px' }}>
                        <label className="field-label">Instructions & Dosage Notes</label>
                        <textarea
                          value={prescriptionForm.instructions}
                          onChange={(event) => setPrescriptionForm((prev) => ({ ...prev, instructions: event.target.value }))}
                          placeholder="e.g. 1 tablet after meals, three times daily for 5 days."
                          className="pad-textarea"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pad Sign-off / Stamp Block */}
                  <div className="pad-footer">
                    <div className="prescription-notes-info">
                      <p>⚠️ Saving this prescription will automatically queue the matching medical resources in the inventory for optimization & approval.</p>
                    </div>
                    <div className="doctor-signature-area">
                      <div className="signature-line"></div>
                      <p className="signature-title">Authorized Signature / Stamp</p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pad-action-bar">
                    <button type="submit" className="pad-submit-btn">
                      Issue Prescription & Optimize Resources
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {activeTab === "Schedule" && (
            <section className="doctor-panel doctor-two-col">
              <div>
                <h2>Availability & Duty Shift</h2>
                <div className="doctor-history-card" style={{ marginBottom: 12 }}>
                  <p><strong>Current Shift:</strong> {(schedule.shift || "-").toUpperCase()}</p>
                  <p><strong>Current Status:</strong> {(schedule.status || "-").toUpperCase()}</p>
                  <p><strong>Current Days:</strong> {(schedule.available_days || []).join(", ") || "-"}</p>
                  <p style={{ color: "#b45309", marginBottom: 0 }}>
                    Schedule settings are controlled by Hospital Admin. Submit a request below for approval.
                  </p>
                </div>

                <form onSubmit={onSubmitScheduleRequest} className="doctor-form">
                  <label>
                    Requested Shift
                    <select
                      value={scheduleRequestForm.shift || "morning"}
                      onChange={(event) => setScheduleRequestForm((prev) => ({ ...prev, shift: event.target.value }))}
                    >
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                      <option value="flex">Flex</option>
                    </select>
                  </label>
                  <label>
                    Requested Status
                    <select
                      value={scheduleRequestForm.status || "active"}
                      onChange={(event) => setScheduleRequestForm((prev) => ({ ...prev, status: event.target.value }))}
                    >
                      <option value="active">Active</option>
                      <option value="leave">Leave</option>
                    </select>
                  </label>

                  <fieldset className="doctor-days-grid">
                    <legend>Available Days</legend>
                    {WEEK_DAYS.map((day) => {
                      const selectedDays = scheduleRequestForm.available_days || [];
                      const checked = selectedDays.includes(day);

                      return (
                        <label key={day}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setScheduleRequestForm((prev) => {
                                const current = new Set(prev.available_days || []);
                                if (event.target.checked) current.add(day);
                                else current.delete(day);
                                return { ...prev, available_days: Array.from(current) };
                              });
                            }}
                          />
                          {day}
                        </label>
                      );
                    })}
                  </fieldset>

                  <label>
                    Reason for change request
                    <textarea
                      value={scheduleRequestForm.reason}
                      onChange={(event) => setScheduleRequestForm((prev) => ({ ...prev, reason: event.target.value }))}
                      placeholder="Explain why this shift/status/day change is needed"
                    />
                  </label>

                  <button type="submit">Submit Request to Admin</button>
                </form>

                <div className="doctor-history-section">
                  <h4>My Recent Schedule Requests</h4>
                  {scheduleRequests.slice(0, 5).map((item) => (
                    <article key={item._id} className="doctor-history-item">
                      <strong>Status: {String(item.status || "pending").toUpperCase()}</strong>
                      <p>Shift: {item.requested_shift || "-"}</p>
                      <p>Status: {item.requested_status || "-"}</p>
                      <p>Days: {(item.requested_available_days || []).join(", ") || "-"}</p>
                      <p>Reason: {item.reason || "-"}</p>
                      <small>{formatDate(item.created_at)}</small>
                    </article>
                  ))}
                  {scheduleRequests.length === 0 && <p>No requests submitted yet.</p>}
                </div>
              </div>

              <div>
                <h2>Today Slots</h2>
                <div className="doctor-slot-columns">
                  <article>
                    <h3>Booked</h3>
                    {(schedule.booked_slots || []).slice(0, 15).map((slot) => (
                      <p key={`b-${slot}`}>{slot}</p>
                    ))}
                    {(schedule.booked_slots || []).length === 0 && <p>No booked slots.</p>}
                  </article>
                  <article>
                    <h3>Free</h3>
                    {(schedule.free_slots || []).slice(0, 15).map((slot) => (
                      <p key={`f-${slot}`}>{slot}</p>
                    ))}
                    {(schedule.free_slots || []).length === 0 && (
                      <>
                        <p>No free slots.</p>
                        {schedule.unavailable_reason ? (
                          <p style={{ color: "#b45309" }}>
                            Reason: {schedule.unavailable_reason}
                          </p>
                        ) : null}
                      </>
                    )}
                  </article>
                </div>
              </div>
            </section>
          )}

          {activeTab === "Notifications" && (
            <section className="doctor-panel">
              <div className="doctor-panel-head">
                <h2>
                  <FiBell />
                  Notifications
                </h2>
                <button type="button" onClick={loadNotifications}>Refresh</button>
              </div>

              <div className="doctor-notification-list">
                {notifications.map((notification, index) => (
                  <article key={`${notification.appointment_id || "n"}-${index}`} className="doctor-notification-item">
                    <div className="doctor-notification-icon">
                      <FiActivity />
                    </div>
                    <div>
                      <strong>{notification.type.replaceAll("_", " ")}</strong>
                      <p>{notification.message}</p>
                      <small>{formatDate(notification.created_at)}</small>
                    </div>
                  </article>
                ))}
                {notifications.length === 0 && <p>No notifications right now.</p>}
              </div>
            </section>
          )}

          {activeTab === "Profile" && (
            <section className="doctor-panel doctor-two-col">
              <div>
                <h2>Doctor Profile</h2>
                <div className="doctor-history-card">
                  <p><strong>Name:</strong> {profile?.name || "-"}</p>
                  <p><strong>Email:</strong> {profile?.email || "-"}</p>
                  <p><strong>Phone:</strong> {profile?.phone || "-"}</p>
                  <p><strong>Role:</strong> {String(profile?.role || "doctor").toUpperCase()}</p>
                  <p><strong>Doctor ID:</strong> {profile?.doctor_id || "-"}</p>
                  <p><strong>Specialization:</strong> {profile?.specialization || "-"}</p>
                  <p><strong>Department:</strong> {profile?.department_id?.name || "-"}</p>
                  <p><strong>Hospital:</strong> {profile?.hospital_id?.name || "-"}</p>
                  <p><strong>Shift:</strong> {String(profile?.shift || "-").toUpperCase()}</p>
                  <p><strong>Available Days:</strong> {(profile?.available_days || []).join(", ") || "-"}</p>
                  <p><strong>Status:</strong> {String(profile?.status || "-").toUpperCase()}</p>
                </div>
              </div>

              <div>
                <h2>Change Password</h2>
                <form onSubmit={onChangePassword} className="doctor-form">
                  <label>
                    Current Password
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))}
                      placeholder="Enter current password"
                    />
                  </label>

                  <label>
                    New Password
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
                      placeholder="Enter new password"
                    />
                  </label>

                  <label>
                    Confirm New Password
                    <input
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </label>

                  <button type="submit" disabled={updatingPassword}>
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </section>
          )}
        </>
      )}
        </section>
      </main>
    </div>
  );
}

export default DoctorDashboard;
