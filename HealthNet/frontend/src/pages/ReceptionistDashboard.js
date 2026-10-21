import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { clearAuthSession, getAuthUser } from "../utils/authStorage";
import receptionistService from "../services/receptionistService";
import { Button, Card, CardBody, CardHeader, FormField, Modal, Table } from "../components/ui";
import NotificationBell from "../components/NotificationBell";

const TABS = [
  { id: "patients", label: "Patients" },
  { id: "booking", label: "Book Appointment" },
  { id: "appointments", label: "Appointments" },
  { id: "queue", label: "Queue" },
  { id: "availability", label: "Doctor Availability" },
];

const INITIAL_PATIENT_FORM = {
  name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  gender: "other",
  blood_type: "",
  address: "",
  medical_history: "",
  status: "active",
  source_record_id: "",
  disease: "general_consultation",
  department_id: "",
  assigned_doctor_id: "",
};

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function getMinBookingDate() {
  const today = new Date();
  today.setDate(today.getDate() + 1); // Appointments must be tomorrow or later
  return today.toISOString().slice(0, 10);
}

function parseSlotMinutes(label) {
  const text = String(label || "").trim();
  if (!text) return null;

  let match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return hours * 60 + minutes;
    }
    return null;
  }

  match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2] || "0");
    const meridiem = String(match[3]).toUpperCase();
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (meridiem === "AM") {
      if (hours === 12) hours = 0;
    } else if (hours !== 12) {
      hours += 12;
    }
    return hours * 60 + minutes;
  }

  return null;
}

function getSlotStartMinutes(slot) {
  const raw = String(slot || "").trim();
  if (!raw) return null;
  const startPart = raw.split("-")[0]?.trim() || "";
  return parseSlotMinutes(startPart);
}

function filterSlotsWithCurrentTime(slots, selectedDate) {
  if (!selectedDate) return [];
  const selected = new Date(selectedDate);
  if (Number.isNaN(selected.getTime())) return [];

  const now = new Date();
  const todayYmdValue = todayYmd();
  const selectedYmd = selected.toISOString().slice(0, 10);

  if (selectedYmd < todayYmdValue) return [];
  if (selectedYmd > todayYmdValue) return Array.isArray(slots) ? slots : [];

  const minimumMinutes = now.getHours() * 60 + now.getMinutes() + 30;
  return (Array.isArray(slots) ? slots : []).filter((slot) => {
    const startMinutes = getSlotStartMinutes(slot);
    return Number.isFinite(startMinutes) && startMinutes >= minimumMinutes;
  });
}

function isDateInPast(dateString) {
  if (!dateString) return false;
  const selectedDate = new Date(dateString);
  selectedDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate < today;
}

function isToday(dateString) {
  if (!dateString) return false;
  const selectedDate = new Date(dateString);
  const today = new Date();
  return selectedDate.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function getEntityDepartmentId(entity) {
  return String(entity?.department_id?._id || entity?.department_id || "").trim();
}

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const user = getAuthUser();
  const bootstrapStartedRef = useRef(false);

  const [activeTab, setActiveTab] = useState("patients");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("healthnetTheme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("healthnetTheme", theme);
  }, [theme]);

  const getMenuIcon = (id, isActive) => {
    const color = isActive ? "#10b981" : "rgba(255, 255, 255, 0.7)";
    const strokeWidth = 2;
    switch (id) {
      case "patients":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        );
      case "booking":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="12" y1="14" x2="12" y2="20" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        );
      case "appointments":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case "queue":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "availability":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        );
      default:
        return null;
    }
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientPagination, setPatientPagination] = useState({ page: 1, total_pages: 1, total: 0 });

  const [patientSearch, setPatientSearch] = useState("");
  const [patientPage, setPatientPage] = useState(1);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [editingPatientId, setEditingPatientId] = useState("");
  const [patientForm, setPatientForm] = useState(INITIAL_PATIENT_FORM);
  const [savingPatient, setSavingPatient] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [appointmentNotifications, setAppointmentNotifications] = useState([]);
  // Key used to persist dismissed notification IDs across page refreshes
  const DISMISSED_KEY = `dismissed_notifs_${user?._id || 'receptionist'}`;
  const [appointmentScope, setAppointmentScope] = useState(null);
  const [appointmentFilters, setAppointmentFilters] = useState({
    date: "",
    doctor: "",
    status: "pending",
  });

  const [bookingForm, setBookingForm] = useState({
    patient_id: "",
    department_id: "",
    doctor_id: "",
    date: todayYmd(),
    time_slot: "",
    reason: "",
    notes: "",
  });
  const [bookingAvailability, setBookingAvailability] = useState([]);
  const [bookingSlots, setBookingSlots] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingPatientQuery, setBookingPatientQuery] = useState("");
  const [bookingPatientOptions, setBookingPatientOptions] = useState([]);
  const [bookingPatientsLoading, setBookingPatientsLoading] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [queueDate, setQueueDate] = useState(todayYmd());
  const [queueRows, setQueueRows] = useState([]);
  const [queueSummary, setQueueSummary] = useState({ total: 0, waiting: 0, in_progress: 0 });

  const [availabilityDate, setAvailabilityDate] = useState(todayYmd());
  const [availabilityDepartmentId, setAvailabilityDepartmentId] = useState("");
  const [availabilityRows, setAvailabilityRows] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);

  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [selectedDoctorSlots, setSelectedDoctorSlots] = useState([]);
  const [selectedDoctorName, setSelectedDoctorName] = useState("");

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [patientHistory, setPatientHistory] = useState(null);

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: todayYmd(),
    doctor_id: "",
    time_slot: "",
  });
  const [rescheduleAvailability, setRescheduleAvailability] = useState([]);

  const selectedPatient = useMemo(
    () => patients.find((p) => String(p._id) === String(selectedPatientId)) || null,
    [patients, selectedPatientId]
  );

  const selectedBookingDoctor = useMemo(
    () => bookingAvailability.find((d) => String(d.doctor_id) === String(bookingForm.doctor_id)) || null,
    [bookingAvailability, bookingForm.doctor_id]
  );

  const bookingPatients = useMemo(() => {
    if (!bookingForm.department_id) return patients;
    return patients.filter((p) => getEntityDepartmentId(p) === String(bookingForm.department_id));
  }, [patients, bookingForm.department_id]);

  useEffect(() => {
    if (!user || user.role !== "receptionist") {
      navigate("/login", { replace: true });
      return;
    }

    // React StrictMode can run effects twice in development; guard to prevent duplicate bootstrap/toasts.
    if (bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;

    void bootstrap();
  }, [navigate, user]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      loadAppointments(appointmentFilters).catch(() => {
        // Silently fail notification refresh to not interrupt user experience
      });
    }, 30000);

    return () => clearInterval(notificationInterval);
  }, [appointmentFilters]);

  useEffect(() => {
    if (!bookingForm.date) return;
    void loadBookingAvailability(bookingForm.date, bookingForm.department_id);
  }, [bookingForm.date, bookingForm.department_id]);

  useEffect(() => {
    const nextDoctor = bookingAvailability.find((d) => String(d.doctor_id) === String(bookingForm.doctor_id));
    const nextSlots = filterSlotsWithCurrentTime(nextDoctor?.available_slots || [], bookingForm.date);
    setBookingSlots(nextDoctor?.available_slots || []);
    if (bookingForm.time_slot && !nextSlots.includes(bookingForm.time_slot)) {
      setBookingForm((prev) => ({ ...prev, time_slot: "" }));
    }
  }, [bookingAvailability, bookingForm.date, bookingForm.doctor_id, bookingForm.time_slot]);

  useEffect(() => {
    if (!rescheduleModalOpen || !rescheduleForm.date) return;
    void loadRescheduleAvailability(rescheduleForm.date);
  }, [rescheduleModalOpen, rescheduleForm.date]);

  useEffect(() => {
    if (activeTab !== "appointments") return;

    let cancelled = false;
    const refreshAppointments = async () => {
      try {
        await loadAppointments(appointmentFilters);
      } catch {
        if (!cancelled) {
          // Errors are handled inside loadAppointments; keep the poll alive.
        }
      }
    };

    void refreshAppointments();
    const timer = setInterval(() => {
      void refreshAppointments();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeTab, appointmentFilters]);

  const bootstrap = async () => {
    setLoading(true);
    try {
      const [deptRes, docRes] = await Promise.all([
        receptionistService.getDepartments(),
        receptionistService.getDoctors({ status: "active" }),
      ]);

      const deptList = deptRes?.data?.departments || [];
      const docList = docRes?.data?.doctors || [];

      setDepartments(deptList);
      setDoctors(docList);

      const firstDeptId = String(deptList?.[0]?._id || "");
      setPatientForm((prev) => ({ ...prev, department_id: firstDeptId }));
      // Keep booking department open initially so receptionist can search/select any patient first.
      setBookingForm((prev) => ({ ...prev, department_id: "" }));
      setAvailabilityDepartmentId(firstDeptId);

      const initialLoads = await Promise.allSettled([
        loadPatients(1, patientSearch),
        loadAppointments(appointmentFilters),
        loadQueue(queueDate),
        loadDoctorAvailability(availabilityDate, firstDeptId),
        loadBookingAvailability(todayYmd(), firstDeptId),
      ]);

      const failedInitialLoad = initialLoads.find((r) => r.status === "rejected");
      if (failedInitialLoad) {
        const error = failedInitialLoad.reason;
        if (error?.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }
        toast.error(error?.response?.data?.message || "Some receptionist data could not be loaded.");
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        clearAuthSession();
        navigate("/login", { replace: true });
        return;
      }
      toast.error(error?.response?.data?.message || "Failed to initialize receptionist dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    try {
      const refreshResults = await Promise.allSettled([
        loadPatients(patientPage, patientSearch),
        loadAppointments(appointmentFilters),
        loadQueue(queueDate),
        loadDoctorAvailability(availabilityDate, availabilityDepartmentId),
        loadBookingAvailability(bookingForm.date, bookingForm.department_id),
      ]);
      const failedRefresh = refreshResults.find((r) => r.status === "rejected");
      if (failedRefresh) {
        const error = failedRefresh.reason;
        if (error?.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }
        toast.error(error?.response?.data?.message || "Some sections failed to refresh.");
      } else {
        toast.success("Receptionist dashboard refreshed.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const loadPatients = async (page = 1, searchText = "") => {
    const { data } = await receptionistService.getPatients({ page, limit: 25, q: searchText || undefined });
    const rows = data?.patients || [];
    setPatients(rows);
    setPatientPagination(data?.pagination || { page: 1, total_pages: 1, total: rows.length });
    setPatientPage(Number(data?.pagination?.page || page));

    if (!selectedPatientId && rows.length > 0) {
      setSelectedPatientId(String(rows[0]._id));
    }
  };

  const loadAppointments = async (filters = appointmentFilters) => {
    const params = {
      date: filters.date || undefined,
      doctor: filters.doctor || undefined,
      status: filters.status || undefined,
    };
    const { data } = await receptionistService.getAppointments(params);
    setAppointments(data?.appointments || []);
    // Read dismissed IDs DIRECTLY from localStorage every time — avoids React stale closure bug
    let dismissed = new Set();
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      if (stored) dismissed = new Set(JSON.parse(stored));
    } catch {}
    const allNotifs = data?.notifications || [];
    // Use _id if present, fall back to appointment_id — backend may send either
    setAppointmentNotifications(
      allNotifs.filter(n => {
        const id = String(n._id || n.appointment_id || "");
        return id && !dismissed.has(id);
      })
    );
    setAppointmentScope(data?.scope || null);
  };


  const loadQueue = async (date = queueDate) => {
    setQueueLoading(true);
    try {
      const { data } = await receptionistService.getQueue({ date });
      setQueueRows(data?.waiting_patients || []);
      setQueueSummary(data?.summary || { total: 0, waiting: 0, in_progress: 0 });
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || "Failed to load queue.");
      }
    } finally {
      setQueueLoading(false);
    }
  };

  const loadDoctorAvailability = async (date = availabilityDate, departmentId = availabilityDepartmentId) => {
    setAvailabilityLoading(true);
    try {
      const { data } = await receptionistService.getDoctorAvailability({
        date,
        department_id: departmentId || undefined,
      });
      setAvailabilityRows(data?.doctors || []);
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || "Failed to load doctor availability.");
      }
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const loadBookingAvailability = async (date, departmentId) => {
    if (!date) return;
    setBookingLoading(true);
    try {
      const { data } = await receptionistService.getDoctorAvailability({
        date,
        department_id: departmentId || undefined,
      });
      const rows = (data?.doctors || []).filter((d) => d.available);
      setBookingAvailability(rows);
      if (bookingForm.doctor_id && !rows.some((d) => String(d.doctor_id) === String(bookingForm.doctor_id))) {
        setBookingForm((prev) => ({ ...prev, doctor_id: "", time_slot: "" }));
      }
    } catch (error) {
      setBookingAvailability([]);
      setBookingSlots([]);
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || "Unable to load doctor availability.");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const hydrateLocalOptions = () => {
      const q = String(bookingPatientQuery || "").trim().toLowerCase();
      if (!q) {
        setBookingPatientOptions([]);
        return;
      }
      const local = bookingPatients.filter((p) => {
        return [p.name, p.email, p.phone, p.source_record_id]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      });
      setBookingPatientOptions(local.slice(0, 100));
    };

    const run = async () => {
      const q = String(bookingPatientQuery || "").trim();
      if (!q) {
        setBookingPatientOptions([]);
        return;
      }

      setBookingPatientsLoading(true);
      try {
        const { data } = await receptionistService.getPatients({
          page: 1,
          limit: 50,
          q,
          department_id: bookingForm.department_id || undefined,
        });
        if (cancelled) return;
        setBookingPatientOptions(data?.patients || []);
      } catch {
        if (cancelled) return;
        hydrateLocalOptions();
      } finally {
        if (!cancelled) setBookingPatientsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void run();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bookingPatientQuery, bookingForm.department_id, bookingPatients]);

  const loadRescheduleAvailability = async (date) => {
    if (!date) return;
    try {
      const { data } = await receptionistService.getDoctorAvailability({ date });
      const rows = (data?.doctors || []).filter((d) => d.available);
      setRescheduleAvailability(rows);

      if (rescheduleForm.doctor_id && !rows.some((d) => String(d.doctor_id) === String(rescheduleForm.doctor_id))) {
        setRescheduleForm((prev) => ({ ...prev, doctor_id: "", time_slot: "" }));
      }
    } catch (error) {
      setRescheduleAvailability([]);
      if (error?.response?.status !== 401) {
        toast.error(error?.response?.data?.message || "Unable to load reschedule availability.");
      }
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === "appointment_update" || notification.type === "appointment_reminder") {
      setActiveTab("appointments");
    }
    toast.info(`${notification.message}`);
  };

  const handleDismissNotification = (notifId) => {
    if (!notifId) return;
    const id = String(notifId);
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      const current = stored ? new Set(JSON.parse(stored)) : new Set();
      current.add(id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current]));
    } catch {}
    // Remove by both _id and appointment_id in case either matches
    setAppointmentNotifications(prev =>
      prev.filter(n => String(n._id || n.appointment_id || "") !== id)
    );
  };

  const handleClearAllNotifications = () => {
    // Mark ALL currently visible notifications as dismissed
    try {
      const stored = localStorage.getItem(DISMISSED_KEY);
      const current = stored ? new Set(JSON.parse(stored)) : new Set();
      // Use _id or appointment_id as fallback
      appointmentNotifications.forEach(n => {
        const id = String(n._id || n.appointment_id || "");
        if (id) current.add(id);
      });
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current]));
    } catch {}
    setAppointmentNotifications([]);
  };


  const handlePatientSubmit = async (event) => {
    event.preventDefault();
    if (!patientForm.name.trim()) {
      toast.error("Patient name is required.");
      return;
    }

    setSavingPatient(true);
    try {
      const payload = {
        ...patientForm,
        email: String(patientForm.email || "").trim().toLowerCase(),
        phone: String(patientForm.phone || "").trim(),
        source_record_id: String(patientForm.source_record_id || "").trim(),
      };

      if (editingPatientId) {
        await receptionistService.updatePatient(editingPatientId, payload);
        toast.success("Patient updated.");
      } else {
        const { data } = await receptionistService.createPatient(payload);
        toast.success(data?.message || "Patient registered.");
      }

      setPatientForm((prev) => ({
        ...INITIAL_PATIENT_FORM,
        department_id: prev.department_id || departments?.[0]?._id || "",
      }));
      setEditingPatientId("");
      await loadPatients(1, patientSearch);
      await loadDoctorAvailability(availabilityDate, availabilityDepartmentId);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save patient.");
    } finally {
      setSavingPatient(false);
    }
  };

  const handleEditPatient = (patient) => {
    setEditingPatientId(String(patient._id));
    setPatientForm({
      name: String(patient.name || ""),
      email: String(patient.email || ""),
      phone: String(patient.phone || ""),
      date_of_birth: patient.date_of_birth ? String(patient.date_of_birth).slice(0, 10) : "",
      gender: String(patient.gender || "other"),
      blood_type: String(patient.blood_type || ""),
      address: String(patient.address || ""),
      medical_history: String(patient.medical_history || ""),
      status: String(patient.status || "active"),
      source_record_id: String(patient.source_record_id || ""),
      disease: String(patient?.source_data?.disease || "general_consultation"),
      department_id: String(patient?.department_id?._id || ""),
      assigned_doctor_id: String(patient?.assigned_doctor_id?._id || ""),
    });
    setActiveTab("patients");
  };

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    if (!bookingForm.patient_id || !bookingForm.doctor_id || !bookingForm.date || !bookingForm.time_slot) {
      toast.error("Please fill patient, doctor, date, and time slot.");
      return;
    }

    // Validate date is not in the past
    if (isDateInPast(bookingForm.date)) {
      toast.error("Cannot book appointment for a past date. Please select today or future date.");
      return;
    }

    if (!bookingSlotsForNow.includes(bookingForm.time_slot)) {
      toast.error("Selected time slot is no longer available. Please choose a future slot that starts at least 30 minutes from now.");
      return;
    }

    const bookingPatient = patients.find((p) => String(p._id) === String(bookingForm.patient_id));
    const selectedDoctor = doctors.find((d) => String(d._id) === String(bookingForm.doctor_id));
    const patientDepartmentId = getEntityDepartmentId(bookingPatient);
    const doctorDepartmentId = getEntityDepartmentId(selectedDoctor);
    if (patientDepartmentId && doctorDepartmentId && patientDepartmentId !== doctorDepartmentId) {
      toast.error("Selected doctor does not match patient department. Please select matching doctor/department.");
      return;
    }

    try {
      const { data } = await receptionistService.createAppointment({
        patient_id: bookingForm.patient_id,
        doctor_id: bookingForm.doctor_id,
        date: bookingForm.date,
        time_slot: bookingForm.time_slot,
        reason: bookingForm.reason,
        notes: bookingForm.notes,
      });
      toast.success(data?.message || "Appointment booked.");

      setBookingForm((prev) => ({ ...prev, time_slot: "", reason: "", notes: "" }));
      await Promise.all([
        loadAppointments(appointmentFilters),
        loadQueue(queueDate),
        loadBookingAvailability(bookingForm.date, bookingForm.department_id),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to book appointment.");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const { data } = await receptionistService.updateAppointment(appointmentId, { action: "cancel" });
      toast.success(data?.message || "Appointment cancelled.");
      await Promise.all([
        loadAppointments(appointmentFilters),
        loadQueue(queueDate),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not cancel appointment.");
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    try {
      const { data } = await receptionistService.updateAppointment(appointmentId, { action: "approve" });
      toast.success(data?.message || "Appointment confirmed.");
      await Promise.all([
        loadAppointments(appointmentFilters),
        loadQueue(queueDate),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not confirm appointment.");
    }
  };

  const openRescheduleModal = (appointment) => {
    setRescheduleTarget(appointment);
    setRescheduleForm({
      date: formatDate(appointment.appointment_at).split("/").length === 3
        ? new Date(appointment.appointment_at).toISOString().slice(0, 10)
        : todayYmd(),
      doctor_id: String(appointment?.doctor_id?._id || ""),
      time_slot: "",
    });
    setRescheduleModalOpen(true);
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget) return;
    if (!rescheduleForm.date || !rescheduleForm.doctor_id || !rescheduleForm.time_slot) {
      toast.error("Select date, doctor and new time slot.");
      return;
    }

    // Validate new date is not in the past
    if (isDateInPast(rescheduleForm.date)) {
      toast.error("Cannot reschedule to a past date. Please select today or future date.");
      return;
    }

    if (!rescheduleSlots.includes(rescheduleForm.time_slot)) {
      toast.error("Selected reschedule slot is no longer available. Please choose a future slot that starts at least 30 minutes from now.");
      return;
    }

    try {
      const { data } = await receptionistService.updateAppointment(String(rescheduleTarget._id), {
        action: "reschedule",
        date: rescheduleForm.date,
        doctor_id: rescheduleForm.doctor_id,
        time_slot: rescheduleForm.time_slot,
      });
      toast.success(data?.message || "Appointment rescheduled.");
      setRescheduleModalOpen(false);
      setRescheduleTarget(null);
      await Promise.all([
        loadAppointments(appointmentFilters),
        loadQueue(queueDate),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reschedule appointment.");
    }
  };

  const handleQueueStatus = async (queueId, status) => {
    try {
      const { data } = await receptionistService.updateQueue(queueId, { status });
      toast.success(data?.message || "Queue updated.");
      await Promise.all([
        loadQueue(queueDate),
        loadAppointments(appointmentFilters),
      ]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Queue update failed.");
    }
  };

  const openHistory = async (patientId) => {
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const { data } = await receptionistService.getPatientHistory(patientId);
      setPatientHistory(data || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load patient history.");
      setPatientHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const patientColumns = [
    { key: "name", label: "Name", render: (row) => <strong>{row.name}</strong> },
    { key: "department", label: "Department", render: (row) => row.department_id?.name || "Unassigned" },
    { key: "email", label: "Email", render: (row) => row.email || "-" },
    { key: "phone", label: "Phone", render: (row) => row.phone || "-" },
    {
      key: "status",
      label: "Status",
      render: (row) => <span style={{ fontWeight: 700 }}>{row.status || "active"}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="sm" variant="soft" onClick={() => handleEditPatient(row)}>Edit</Button>
          <Button size="sm" variant="outline" onClick={() => openHistory(row._id)}>History</Button>
        </div>
      ),
    },
  ];

  const appointmentColumns = [
    {
      key: "patient",
      label: "Patient",
      render: (row) => row.patient_id?.name || "-",
    },
    {
      key: "doctor",
      label: "Doctor",
      render: (row) => row.doctor_id?.name || "-",
    },
    {
      key: "appointment_at",
      label: "Date/Time",
      render: (row) => formatDateTime(row.appointment_at),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => String(row.status || "pending").toUpperCase(),
    },
    {
      key: "feedback",
      label: "Patient Feedback",
      render: (row) => {
        const feedback = row?.patient_feedback || null;
        if (!feedback?.rating) return "-";
        const ratingText = `${Number(feedback.rating)}/5`;
        if (!feedback?.comment) return ratingText;
        return (
          <div style={{ display: "grid", gap: 2 }}>
            <strong>{ratingText}</strong>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{feedback.comment}</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {row.status === "pending" ? (
            <Button size="sm" variant="primary" onClick={() => handleApproveAppointment(row._id)}>Confirm</Button>
          ) : null}
          {row.status !== "cancelled" ? (
            <Button size="sm" variant="danger" onClick={() => handleCancelAppointment(row._id)}>Cancel</Button>
          ) : null}
          {row.status === "pending" ? (
            <Button size="sm" variant="soft" onClick={() => openRescheduleModal(row)}>Reschedule</Button>
          ) : null}
        </div>
      ),
    },
  ];

  const queueColumns = [
    { key: "token", label: "Token", render: (r) => <strong>#{r.token_number}</strong> },
    { key: "patient", label: "Patient", render: (r) => r.patient?.name || "-" },
    { key: "doctor", label: "Doctor", render: (r) => r.doctor?.name || "-" },
    { key: "status", label: "Status", render: (r) => String(r.status || "waiting").toUpperCase() },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Button size="sm" variant="danger" onClick={() => handleQueueStatus(r.queue_id, "cancelled")}>Cancel</Button>
        </div>
      ),
    },
  ];

  const availabilityColumns = [
    { key: "doctor_name", label: "Doctor" },
    { key: "department", label: "Department" },
    { key: "shift", label: "Shift", render: (r) => String(r.shift || "-").toUpperCase() },
    { key: "booked_count", label: "Booked" },
    {
      key: "status",
      label: "Availability",
      render: (r) => {
        if (r.available) {
          const slotCount = (r.available_slots || []).length;
          return (
            <button
              type="button"
              onClick={() => {
                setSelectedDoctorSlots(r.available_slots || []);
                setSelectedDoctorName(r.doctor_name);
                setSlotModalOpen(true);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#10b981",
                cursor: "pointer",
                padding: 0,
                font: "inherit",
                textDecoration: "underline",
                textAlign: "left",
                fontWeight: "700"
              }}
            >
              Available ({slotCount} slots)
            </button>
          );
        } else {
          return `Unavailable (${r.reason_unavailable || "N/A"})`;
        }
      }
    },
  ];

  const rescheduleSelectedDoctor = useMemo(
    () => rescheduleAvailability.find((d) => String(d.doctor_id) === String(rescheduleForm.doctor_id)) || null,
    [rescheduleAvailability, rescheduleForm.doctor_id]
  );

  const bookingSlotsForNow = useMemo(
    () => filterSlotsWithCurrentTime(bookingSlots, bookingForm.date),
    [bookingSlots, bookingForm.date]
  );

  const rescheduleSlots = useMemo(
    () => filterSlotsWithCurrentTime(rescheduleSelectedDoctor?.available_slots || [], rescheduleForm.date),
    [rescheduleSelectedDoctor, rescheduleForm.date]
  );

  if (loading) {
    return (
      <div className="doctor-dashboard-shell">
        <div className="doctor-panel">
          <h2>Loading receptionist module...</h2>
        </div>
      </div>
    );
  }

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
              <p style={{ opacity: 0.85, fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>Receptionist Portal</p>
              <p className="hn-brand-user" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>👤</span> {user?.name || user?.username || "Receptionist"}
              </p>
            </div>

            <nav className="hn-nav">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`hn-nav-btn ${isActive ? "active" : ""}`}
                  >
                    <span className="hn-nav-icon">{getMenuIcon(tab.id, isActive)}</span>
                    <span className="hn-nav-label">{tab.label}</span>
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
            Receptionist Dashboard
          </h1>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <NotificationBell
              notifications={appointmentNotifications}
              unreadCount={appointmentNotifications.length}
              onNotificationClick={handleNotificationClick}
              onDismiss={handleDismissNotification}
              onClearAll={handleClearAllNotifications}
            />
             <button
              type="button"
              className="hn-sidebar-toggle"
              onClick={refreshAll}
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
            <Button variant="soft" size="sm" onClick={refreshAll} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
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

      {activeTab === "patients" && (
        <div className="doctor-panel" style={{ display: "grid", gap: 14 }}>
          <Card>
            <CardHeader>{editingPatientId ? "Update Patient" : "Register New Patient"}</CardHeader>
            <CardBody>
              <form onSubmit={handlePatientSubmit} style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, alignItems: "start" }}>
                  <FormField label="Name"><input value={patientForm.name} onChange={(e) => setPatientForm((p) => ({ ...p, name: e.target.value }))} /></FormField>
                  <FormField label="Email"><input type="email" value={patientForm.email} onChange={(e) => setPatientForm((p) => ({ ...p, email: e.target.value }))} /></FormField>
                  <FormField label="Phone / Contact"><input value={patientForm.phone} onChange={(e) => setPatientForm((p) => ({ ...p, phone: e.target.value }))} /></FormField>
                  <FormField label="Date of birth"><input type="date" value={patientForm.date_of_birth} onChange={(e) => setPatientForm((p) => ({ ...p, date_of_birth: e.target.value }))} /></FormField>
                  <FormField label="Gender">
                    <select value={patientForm.gender} onChange={(e) => setPatientForm((p) => ({ ...p, gender: e.target.value }))}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </FormField>
                  <FormField label="Blood type">
                    <select value={patientForm.blood_type} onChange={(e) => setPatientForm((p) => ({ ...p, blood_type: e.target.value }))}>
                      <option value="">Unknown</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                  </FormField>
                  <FormField label="Department">
                    <select value={patientForm.department_id} onChange={(e) => setPatientForm((p) => ({ ...p, department_id: e.target.value }))}>
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={String(d._id)} value={String(d._id)}>{d.name}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Assigned doctor">
                    <select value={patientForm.assigned_doctor_id} onChange={(e) => setPatientForm((p) => ({ ...p, assigned_doctor_id: e.target.value }))}>
                      <option value="">Unassigned</option>
                      {doctors
                        .filter((d) => !patientForm.department_id || String(d?.department_id?._id || d?.department_id || "") === String(patientForm.department_id))
                        .map((d) => (
                          <option key={String(d._id)} value={String(d._id)}>{d.name} ({d.doctor_id || "-"})</option>
                        ))}
                    </select>
                  </FormField>
                  <FormField label="Disease"><input value={patientForm.disease} onChange={(e) => setPatientForm((p) => ({ ...p, disease: e.target.value }))} /></FormField>
                  <FormField label="Source record ID"><input value={patientForm.source_record_id} onChange={(e) => setPatientForm((p) => ({ ...p, source_record_id: e.target.value }))} /></FormField>
                  <FormField label="Status">
                    <select value={patientForm.status} onChange={(e) => setPatientForm((p) => ({ ...p, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="discharged">Discharged</option>
                      <option value="deceased">Deceased</option>
                    </select>
                  </FormField>
                </div>

                <FormField label="Address"><textarea rows={2} value={patientForm.address} onChange={(e) => setPatientForm((p) => ({ ...p, address: e.target.value }))} /></FormField>
                <FormField label="Medical history"><textarea rows={2} value={patientForm.medical_history} onChange={(e) => setPatientForm((p) => ({ ...p, medical_history: e.target.value }))} /></FormField>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button type="submit" variant="primary" disabled={savingPatient}>{savingPatient ? "Saving..." : editingPatientId ? "Update Patient" : "Register Patient"}</Button>
                  {editingPatientId ? (
                    <Button type="button" variant="outline" onClick={() => {
                      setEditingPatientId("");
                      setPatientForm({ ...INITIAL_PATIENT_FORM, department_id: patientForm.department_id || "" });
                    }}>Cancel Edit</Button>
                  ) : null}
                </div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Search Patients</CardHeader>
            <CardBody>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await loadPatients(1, patientSearch);
                }}
                style={{ display: "flex", gap: 8, marginBottom: 10 }}
              >
                <input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search by name / email / phone / source id"
                  style={{ flex: 1 }}
                />
                <Button type="submit" variant="soft">Search</Button>
              </form>
              <Table columns={patientColumns} rows={patients} keyField="_id" emptyText="No patients found." />
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Button
                  variant="outline"
                  onClick={() => loadPatients(Math.max(1, patientPage - 1), patientSearch)}
                  disabled={patientPage <= 1}
                >
                  Previous
                </Button>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Page {patientPagination.page || 1} of {patientPagination.total_pages || 1} | Total {patientPagination.total || 0}
                </span>
                <Button
                  variant="outline"
                  onClick={() => loadPatients(Math.min((patientPagination.total_pages || 1), patientPage + 1), patientSearch)}
                  disabled={patientPage >= (patientPagination.total_pages || 1)}
                >
                  Next
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === "booking" && (
        <div className="doctor-panel" style={{ display: "grid", gap: 14 }}>
          <Card>
            <CardHeader>Book Appointment</CardHeader>
            <CardBody>
              <form onSubmit={handleBookAppointment} style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, alignItems: "start" }}>
                  <FormField label="Patient">
                    <div style={{ position: "relative" }}>
                      <input
                        placeholder="Search patient by name, phone, email..."
                        value={bookingPatientQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBookingPatientQuery(val);
                          setShowPatientDropdown(true);
                          if (!val) {
                            setBookingForm((prev) => ({
                              ...prev,
                              patient_id: "",
                              time_slot: "",
                            }));
                          }
                        }}
                        onFocus={() => setShowPatientDropdown(true)}
                        onBlur={() => {
                          // Allow onMouseDown to trigger on options before hiding
                          setTimeout(() => setShowPatientDropdown(false), 200);
                        }}
                      />
                      {showPatientDropdown && bookingPatientOptions.length > 0 && (
                        <div style={{
                          position: "absolute",
                          background: "var(--card-bg, #ffffff)",
                          border: "1px solid var(--border-color, #cbd5e1)",
                          borderRadius: "8px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                          zIndex: 1000,
                          left: 0,
                          right: 0,
                          maxHeight: "200px",
                          overflowY: "auto",
                          marginTop: "4px"
                        }}>
                          {bookingPatientOptions.map((p) => (
                            <div
                              key={String(p._id)}
                              style={{
                                padding: "10px 14px",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--border-color, #f1f5f9)",
                                fontSize: "13px",
                                color: "var(--text-main, #334155)",
                                transition: "background-color 0.2s"
                              }}
                              onMouseDown={() => {
                                setBookingPatientQuery(`${p.name} (${p.phone || "no-phone"})`);
                                const patientDepartmentId = getEntityDepartmentId(p);
                                setBookingForm((prev) => ({
                                  ...prev,
                                  patient_id: String(p._id),
                                  department_id: patientDepartmentId || prev.department_id,
                                  doctor_id: "",
                                  time_slot: "",
                                }));
                                setShowPatientDropdown(false);
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = "var(--hover-bg, #f1f5f9)"}
                              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                            >
                              {p.name} ({p.phone || "no-phone"})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {bookingForm.patient_id && (
                      <div style={{ marginTop: 6, fontSize: 12, color: "#10b981", fontWeight: 700 }}>
                        ✓ Patient Selected
                      </div>
                    )}
                    <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <small style={{ color: "var(--text-muted)" }}>
                        {bookingPatientsLoading ? "Searching..." : `${bookingPatientOptions.length} matching patients`}
                      </small>
                      <Button type="button" size="sm" variant="soft" onClick={() => setActiveTab("patients")}>Add New Patient</Button>
                    </div>
                  </FormField>

                  <FormField label="Department">
                    <select
                      value={bookingForm.department_id}
                      onChange={(e) => {
                        const nextDepartmentId = e.target.value;
                        setBookingForm((prev) => {
                          const currentPatient = patients.find((p) => String(p._id) === String(prev.patient_id));
                          const patientDepartmentId = getEntityDepartmentId(currentPatient);
                          const keepPatient = !patientDepartmentId || !nextDepartmentId || patientDepartmentId === nextDepartmentId;
                          return {
                            ...prev,
                            department_id: nextDepartmentId,
                            patient_id: keepPatient ? prev.patient_id : "",
                            doctor_id: "",
                            time_slot: "",
                          };
                        });
                      }}
                    >
                      <option value="">All Departments</option>
                      {departments.map((d) => (
                        <option key={String(d._id)} value={String(d._id)}>{d.name}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Date">
                    <input
                      type="date"
                      min={getMinBookingDate()}
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm((p) => ({ ...p, date: e.target.value, doctor_id: "", time_slot: "" }))}
                    />
                    <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                      Appointments must be booked for tomorrow or later
                    </small>
                  </FormField>

                  <FormField label="Doctor">
                    <select
                      value={bookingForm.doctor_id}
                      onChange={(e) => setBookingForm((p) => ({ ...p, doctor_id: e.target.value, time_slot: "" }))}
                    >
                      <option value="">Select doctor</option>
                      {bookingAvailability.map((d) => (
                        <option key={String(d.doctor_id)} value={String(d.doctor_id)}>
                          {d.doctor_name} ({d.department})
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Time slot">
                    <select
                      value={bookingForm.time_slot}
                      onChange={(e) => setBookingForm((p) => ({ ...p, time_slot: e.target.value }))}
                    >
                      <option value="">Select slot</option>
                      {bookingSlotsForNow.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                      Only slots starting at least 30 minutes from now are shown
                    </small>
                  </FormField>
                </div>

                <FormField label="Reason"><input value={bookingForm.reason} onChange={(e) => setBookingForm((p) => ({ ...p, reason: e.target.value }))} /></FormField>
                <FormField label="Notes"><textarea rows={2} value={bookingForm.notes} onChange={(e) => setBookingForm((p) => ({ ...p, notes: e.target.value }))} /></FormField>

                <div style={{ display: "flex", gap: 8 }}>
                  <Button type="submit" variant="primary">Book Appointment</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => loadBookingAvailability(bookingForm.date, bookingForm.department_id)}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? "Loading..." : "Refresh Slots"}
                  </Button>
                </div>
              </form>

              {selectedBookingDoctor ? (
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
                  Doctor: {selectedBookingDoctor.doctor_name} | Booked: {selectedBookingDoctor.booked_count}
                  {selectedBookingDoctor.max_patients_per_day ? ` / ${selectedBookingDoctor.max_patients_per_day}` : ""}
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="doctor-panel" style={{ display: "grid", gap: 14 }}>
          <Card>
            <CardHeader>Pending Requests & Alerts</CardHeader>
            <CardBody>
              {appointmentNotifications.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No pending requests or alerts right now.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {appointmentNotifications.map((n) => {
                    const isCompleted = n.type === "completed_appointment";
                    return (
                      <div key={n._id || n.appointment_id} className={`hnu-message ${isCompleted ? "success" : "error"}`} style={{ marginBottom: 0 }}>
                        {isCompleted
                          ? `${n.message} (Action: ${n.action_required})`
                          : `${n.patient_name} with Dr. ${n.doctor_name}: ${n.reason}. Action: ${n.action_required}`
                        }
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>View / Update Appointments</CardHeader>
            <CardBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, alignItems: "start", marginBottom: 10 }}>
                <FormField label="Date">
                  <input
                    type="date"
                    value={appointmentFilters.date}
                    onChange={(e) => setAppointmentFilters((p) => ({ ...p, date: e.target.value }))}
                  />
                </FormField>
                <FormField label="Doctor">
                  <select
                    value={appointmentFilters.doctor}
                    onChange={(e) => setAppointmentFilters((p) => ({ ...p, doctor: e.target.value }))}
                  >
                    <option value="">All doctors</option>
                    {doctors.map((d) => (
                      <option key={String(d._id)} value={String(d._id)}>{d.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Status">
                  <select
                    value={appointmentFilters.status}
                    onChange={(e) => setAppointmentFilters((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </FormField>
              </div>

              <Button type="button" variant="soft" onClick={() => loadAppointments(appointmentFilters)}>
                Apply Filters
              </Button>

              <Button
                type="button"
                variant="outline"
                style={{ marginLeft: 8 }}
                onClick={() => {
                  const next = { date: "", doctor: "", status: "pending" };
                  setAppointmentFilters(next);
                  void loadAppointments(next);
                }}
              >
                Show Pending Requests
              </Button>

              {appointmentScope ? (
                <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 13 }}>
                  Viewing {appointmentScope.hospital_name || "hospital"}
                  {appointmentScope.hospital_city ? ` (${appointmentScope.hospital_city})` : ""}
                  {appointmentScope.hospital_id ? ` [${appointmentScope.hospital_id}]` : ""}
                  {` | Total pending in this hospital: ${Number(appointmentScope.pending_count_total || 0)}`}
                </div>
              ) : null}

              <div style={{ marginTop: 10 }}>
                <Table
                  columns={appointmentColumns}
                  rows={appointments}
                  keyField="_id"
                  emptyText="No pending appointments found for this hospital."
                />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === "queue" && (
        <div className="doctor-panel" style={{ display: "grid", gap: 14 }}>
          <Card>
            <CardHeader>Token / Queue Board</CardHeader>
            <CardBody>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <FormField label="Queue date" className="hnu-field-inline">
                  <input type="date" value={queueDate} onChange={(e) => setQueueDate(e.target.value)} />
                </FormField>
                <Button variant="soft" onClick={() => loadQueue(queueDate)} disabled={queueLoading}>
                  {queueLoading ? "Loading..." : "Load Queue"}
                </Button>
              </div>

              <div style={{ marginBottom: 10, fontSize: 13, color: "var(--text-muted)" }}>
                Total: {queueSummary.total} | Waiting: {queueSummary.waiting} | In Progress: {queueSummary.in_progress}
              </div>

              <Table columns={queueColumns} rows={queueRows} keyField="queue_id" emptyText="No waiting patients in queue." />
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === "availability" && (
        <div className="doctor-panel" style={{ display: "grid", gap: 14 }}>
          <Card>
            <CardHeader>Doctor Availability</CardHeader>
            <CardBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, alignItems: "start", marginBottom: 10 }}>
                <FormField label="Date">
                  <input type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} />
                </FormField>
                <FormField label="Department">
                  <select value={availabilityDepartmentId} onChange={(e) => setAvailabilityDepartmentId(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={String(d._id)} value={String(d._id)}>{d.name}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <Button variant="soft" onClick={() => loadDoctorAvailability(availabilityDate, availabilityDepartmentId)} disabled={availabilityLoading}>
                {availabilityLoading ? "Loading..." : "Check Availability"}
              </Button>

              <div style={{ marginTop: 10 }}>
                <Table columns={availabilityColumns} rows={availabilityRows} keyField="doctor_id" emptyText="No doctor availability data." />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Modal
        open={historyModalOpen}
        title="Patient History (Read-only)"
        onClose={() => {
          setHistoryModalOpen(false);
          setPatientHistory(null);
        }}
        size="lg"
      >
        {historyLoading ? (
          <div>Loading history...</div>
        ) : !patientHistory?.success ? (
          <div>No history found.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <Card>
              <CardHeader>Patient Info</CardHeader>
              <CardBody>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
                  <div><strong>Name:</strong> {patientHistory?.patient?.name || "-"}</div>
                  <div><strong>Email:</strong> {patientHistory?.patient?.email || "-"}</div>
                  <div><strong>Phone:</strong> {patientHistory?.patient?.phone || "-"}</div>
                  <div><strong>Status:</strong> {patientHistory?.patient?.status || "-"}</div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>Appointments</CardHeader>
              <CardBody>
                <Table
                  keyField="_id"
                  columns={[
                    { key: "doctor", label: "Doctor", render: (r) => r?.doctor_id?.name || "-" },
                    { key: "date", label: "Date", render: (r) => formatDateTime(r.appointment_at) },
                    { key: "status", label: "Status", render: (r) => r.status || "-" },
                    {
                      key: "feedback",
                      label: "Feedback",
                      render: (r) => {
                        const feedback = r?.patient_feedback || null;
                        if (!feedback?.rating) return "-";
                        const ratingText = `${Number(feedback.rating)}/5`;
                        return feedback.comment ? `${ratingText} - ${feedback.comment}` : ratingText;
                      },
                    },
                  ]}
                  rows={patientHistory?.history?.appointments || []}
                  emptyText="No appointments"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>Diagnoses</CardHeader>
              <CardBody>
                <Table
                  keyField="_id"
                  columns={[
                    { key: "doctor", label: "Doctor", render: (r) => r?.doctor_id?.name || "-" },
                    { key: "diagnosis", label: "Diagnosis", render: (r) => r.diagnosis || "-" },
                    { key: "date", label: "Date", render: (r) => formatDateTime(r.created_at) },
                  ]}
                  rows={patientHistory?.history?.diagnoses || []}
                  emptyText="No diagnoses"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>Prescriptions</CardHeader>
              <CardBody>
                <Table
                  keyField="_id"
                  columns={[
                    { key: "doctor", label: "Doctor", render: (r) => r?.doctor_id?.name || "-" },
                    { key: "medicines", label: "Medicines", render: (r) => Array.isArray(r.medicines) ? r.medicines.join(", ") : "-" },
                    { key: "date", label: "Date", render: (r) => formatDateTime(r.created_at) },
                  ]}
                  rows={patientHistory?.history?.prescriptions || []}
                  emptyText="No prescriptions"
                />
              </CardBody>
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        open={rescheduleModalOpen}
        title="Reschedule Appointment"
        onClose={() => {
          setRescheduleModalOpen(false);
          setRescheduleTarget(null);
        }}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setRescheduleModalOpen(false); setRescheduleTarget(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleReschedule}>Confirm Reschedule</Button>
          </>
        }
      >
        {rescheduleTarget ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Patient: <strong>{rescheduleTarget?.patient_id?.name || "-"}</strong> | Current: <strong>{formatDateTime(rescheduleTarget?.appointment_at)}</strong>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8, alignItems: "start" }}>
              <FormField label="New date">
                <input
                  type="date"
                  min={getMinBookingDate()}
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm((p) => ({ ...p, date: e.target.value, doctor_id: "", time_slot: "" }))}
                />
                <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Must be tomorrow or later
                </small>
              </FormField>

              <FormField label="Doctor">
                <select
                  value={rescheduleForm.doctor_id}
                  onChange={(e) => setRescheduleForm((p) => ({ ...p, doctor_id: e.target.value, time_slot: "" }))}
                >
                  <option value="">Select doctor</option>
                  {rescheduleAvailability.map((d) => (
                    <option key={String(d.doctor_id)} value={String(d.doctor_id)}>{d.doctor_name} ({d.department})</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Time slot">
                <select
                  value={rescheduleForm.time_slot}
                  onChange={(e) => setRescheduleForm((p) => ({ ...p, time_slot: e.target.value }))}
                >
                  <option value="">Select slot</option>
                  {rescheduleSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Only slots starting at least 30 minutes from now are shown
                </small>
              </FormField>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={slotModalOpen}
        title={`Available Slots - ${selectedDoctorName}`}
        onClose={() => {
          setSlotModalOpen(false);
          setSelectedDoctorSlots([]);
          setSelectedDoctorName("");
        }}
        size="md"
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, padding: "10px 0" }}>
          {selectedDoctorSlots.map((slot, index) => (
            <div
              key={`${slot}-${index}`}
              style={{
                padding: "10px",
                border: "1px solid var(--surface-border, #cbd5e1)",
                borderRadius: "8px",
                textAlign: "center",
                background: "var(--surface-soft, #f8fafc)",
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--text-main, #0f172a)",
                transition: "all 0.2s"
              }}
            >
              {slot}
            </div>
          ))}
          {selectedDoctorSlots.length === 0 && (
            <div style={{ gridColumn: "1 / -1", color: "var(--text-muted)", textAlign: "center", padding: "10px" }}>
              No available slots left for this day.
            </div>
          )}
        </div>
      </Modal>
        </section>
      </main>
    </div>
  );
}
