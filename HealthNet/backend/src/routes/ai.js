const express = require("express");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { execFile } = require("child_process");
const mongoose = require("mongoose");

const Department = require("../models/Department");
const Hospital = require("../models/Hospital");
const Resource = require("../models/Resource");
const Staff = require("../models/Staff");
const Appointment = require("../models/Appointment");
const { authenticateJWT, authorizeRoles, restrictToOwnHospital } = require("../middleware/auth");
const { extractHospitalLocation, parseHospitalLocation } = require("../utils/hospitalLocation");
const {
  clamp,
  haversineDistanceKm,
  mapDiseaseToDepartment,
  normalizeToken,
  rankLabelByIndex,
  scoreHospitalRecommendation,
} = require("../utils/hospitalRecommendation");

const router = express.Router();
const execFileAsync = promisify(execFile);

const AI_STORAGE_DIR = path.join(process.cwd(), "storage", "ai");
const AI_MODEL_BUNDLE_NAME = "patient_load_model.joblib";

const CITY_COORDINATE_FALLBACKS = Object.freeze({
  "abbottabad": { lat: 34.1463, lng: 73.2117 },
  "bahawalpur": { lat: 29.3956, lng: 71.6836 },
  "chiniot": { lat: 31.7222, lng: 72.9789 },
  "faisalabad": { lat: 31.4504, lng: 73.135 },
  "gujranwala": { lat: 32.1877, lng: 74.1945 },
  "gujrat": { lat: 32.5731, lng: 74.0789 },
  "hyderabad": { lat: 25.396, lng: 68.3578 },
  "islamabad": { lat: 33.6844, lng: 73.0479 },
  "jhang": { lat: 31.2781, lng: 72.3317 },
  "karachi": { lat: 24.8607, lng: 67.0011 },
  "kasur": { lat: 31.1177, lng: 74.4497 },
  "lahore": { lat: 31.5204, lng: 74.3587 },
  "larkana": { lat: 27.559, lng: 68.212 },
  "multan": { lat: 30.1575, lng: 71.5249 },
  "okara": { lat: 30.81, lng: 73.4516 },
  "peshawar": { lat: 34.0151, lng: 71.5249 },
  "quetta": { lat: 30.1798, lng: 66.975 },
  "rawalpindi": { lat: 33.5651, lng: 73.0169 },
  "sahiwal": { lat: 30.6717, lng: 73.1064 },
  "sargodha": { lat: 32.0836, lng: 72.6711 },
  "sialkot": { lat: 32.4945, lng: 74.5229 },
});

function resolveHospitalLocation(hospital = {}) {
  const exactLocation = extractHospitalLocation(hospital);
  if (exactLocation) {
    return { ...exactLocation, source: "exact" };
  }

  const cityKey = normalizeToken(hospital.city || "");
  const fallback = CITY_COORDINATE_FALLBACKS[cityKey];
  if (fallback) {
    return { ...fallback, source: "city_fallback" };
  }

  return null;
}

function normalizeYmd(inputDate) {
  const d = new Date(String(inputDate || ""));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function jsDateToWeekday(dateObj) {
  return (dateObj.getDay() + 6) % 7;
}

function getDepartmentAiPaths(hospitalId, departmentId) {
  const deptDir = path.join(AI_STORAGE_DIR, String(hospitalId), "departments", String(departmentId));
  return {
    modelBundlePath: path.join(deptDir, AI_MODEL_BUNDLE_NAME),
  };
}

function parseJsonStdout(stdout) {
  const text = String(stdout || "").trim();
  if (!text) return { success: true };
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, message: text };
  }
}

function normalizePatientLocation(payload = {}) {
  return parseHospitalLocation(payload);
}

function startOfDay(inputDate = new Date()) {
  const date = new Date(inputDate);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(inputDate = new Date()) {
  const date = new Date(inputDate);
  date.setHours(23, 59, 59, 999);
  return date;
}

function toHourMinuteLabel(hour, minute) {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const period = normalizedHour >= 12 ? "PM" : "AM";
  const hour12 = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function shiftWindow(shift) {
  switch (String(shift || "").toLowerCase()) {
    case "morning":
      return { startMinute: 8 * 60, endMinute: 14 * 60, label: "Morning" };
    case "evening":
      return { startMinute: 14 * 60, endMinute: 20 * 60, label: "Evening" };
    case "night":
      return { startMinute: 20 * 60, endMinute: 8 * 60, label: "Night" };
    default:
      return { startMinute: 9 * 60, endMinute: 17 * 60, label: "General" };
  }
}

function buildSlotLabels(shift, slotMinutes = 30) {
  const { startMinute, endMinute } = shiftWindow(shift);
  const spanMinutes = endMinute > startMinute
    ? endMinute - startMinute
    : (24 * 60 - startMinute) + endMinute;

  const slots = [];
  for (let offset = 0; offset + slotMinutes <= spanMinutes; offset += slotMinutes) {
    const slotStartTotal = (startMinute + offset) % (24 * 60);
    const slotEndTotal = (slotStartTotal + slotMinutes) % (24 * 60);

    const slotStartHour = Math.floor(slotStartTotal / 60);
    const slotStartMinute = slotStartTotal % 60;
    const slotEndHour = Math.floor(slotEndTotal / 60);
    const slotEndMinute = slotEndTotal % 60;

    slots.push(`${toHourMinuteLabel(slotStartHour, slotStartMinute)} - ${toHourMinuteLabel(slotEndHour, slotEndMinute)}`);
  }

  return slots;
}

function slotLabelFromDate(date, durationMinutes = 30) {
  const start = new Date(date);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return `${toHourMinuteLabel(start.getHours(), start.getMinutes())} - ${toHourMinuteLabel(end.getHours(), end.getMinutes())}`;
}

function dayNameForDate(date) {
  return new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
}

function buildDoctorDepartmentAliases(departmentName) {
  return buildDepartmentAliasSet(departmentName);
}

function matchesDoctorDepartment(doctor, departmentId, departmentName) {
  if (doctor.department_id && String(doctor.department_id) === String(departmentId)) {
    return true;
  }

  const aliases = buildDoctorDepartmentAliases(departmentName);
  const specializationToken = normalizeToken(doctor.specialization || "");
  if (specializationToken && aliases.has(specializationToken)) {
    return true;
  }

  return Array.from(aliases).some((alias) => specializationToken.includes(alias) || alias.includes(specializationToken));
}

function countFutureWorkingDays(doctor, maxDays = 7) {
  const availableDays = Array.isArray(doctor.available_days)
    ? doctor.available_days.map((day) => String(day || "").trim().toLowerCase()).filter(Boolean)
    : [];

  const today = startOfDay();
  let count = 0;

  for (let offset = 0; offset < maxDays; offset += 1) {
    const candidateDate = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
    const dayName = dayNameForDate(candidateDate);
    const isAllowed = availableDays.length === 0 || availableDays.includes(dayName);
    if (doctor.status !== "leave" && doctor.status !== "suspended" && isAllowed) {
      count += 1;
    }
  }

  return count;
}

function getDoctorDutySummary(doctor) {
  const shift = String(doctor.shift || "").toLowerCase() || "morning";
  const window = shiftWindow(shift);
  return {
    shift,
    shift_label: window.label,
    duty_window: `${toHourMinuteLabel(Math.floor(window.startMinute / 60), window.startMinute % 60)} - ${toHourMinuteLabel(Math.floor(window.endMinute / 60), window.endMinute % 60)}`,
  };
}

function sortSlotsByAvailability(slots, limit = 3) {
  return slots.slice(0, limit);
}

function serializeDoctorRecommendation(doctor, details) {
  return {
    doctor_id: String(doctor._id),
    doctor_name: doctor.name,
    department_id: doctor.department_id ? String(doctor.department_id) : null,
    department_name: details.department_name,
    specialization: doctor.specialization || "",
    experience_years: Number(doctor.experience_years || 0),
    max_patients_per_day: doctor.max_patients_per_day ?? null,
    status: doctor.status || "active",
    duty: details.duty,
    next_available_date: details.next_available_date,
    next_available_slots: details.next_available_slots,
    free_slots_today: details.free_slots_today,
    booked_slots_today: details.booked_slots_today,
    total_appointments: details.total_appointments,
    available_days: Array.isArray(doctor.available_days) ? doctor.available_days : [],
    score: details.score,
    note: details.note,
  };
}

function scoreDoctorCandidate({
  experienceYears,
  freeSlotsToday,
  nextAvailableSlotCount,
  futureWorkingDays,
  pendingAppointments,
  maxPatientsPerDay,
  isWorkingToday,
}) {
  const experienceScore = Math.min(30, Math.max(0, Number(experienceYears || 0) * 3));
  const availabilityScore = Math.min(25, (Number(freeSlotsToday || 0) * 2) + (Number(nextAvailableSlotCount || 0) * 1.5));
  const workingTodayBonus = isWorkingToday ? 10 : 0;
  const futureCoverageScore = Math.min(10, Number(futureWorkingDays || 0) * 1.5);
  const loadPenalty = Math.min(15, Math.max(0, Number(pendingAppointments || 0) - Number(maxPatientsPerDay || 0)) * 1.5);

  return Number((experienceScore + availabilityScore + workingTodayBonus + futureCoverageScore - loadPenalty).toFixed(1));
}

function computeHospitalRankingPriority({
  distanceKm,
  distanceSource,
  availableBeds,
  availableDoctors,
  availableEquipment,
  bestDoctorScore,
}) {
  const hasFiniteDistance = Number.isFinite(Number(distanceKm));
  const normalizedDistance = hasFiniteDistance
    ? Math.max(0, 100 - (Math.min(Number(distanceKm), 80) * 2.2))
    : 0;

  const normalizedCapacity = clamp(
    (Number(availableBeds || 0) * 0.35)
    + (Number(availableDoctors || 0) * 8)
    + (Number(availableEquipment || 0) * 0.6),
    0,
    120
  );

  const doctorBoost = clamp(Number(bestDoctorScore || 0) / 6, 0, 8);
  const locationConfidencePenalty = String(distanceSource || "") === "exact" ? 0 : 12;

  return Number(((normalizedDistance * 0.65) + (normalizedCapacity * 0.35) + doctorBoost - locationConfidencePenalty).toFixed(2));
}

function buildNextAvailableDate(doctor, bookedSlotsByDay) {
  const availableDays = Array.isArray(doctor.available_days)
    ? doctor.available_days.map((day) => String(day || "").trim().toLowerCase()).filter(Boolean)
    : [];

  const shift = String(doctor.shift || "").toLowerCase() || "morning";
  const today = startOfDay();

  for (let offset = 0; offset < 14; offset += 1) {
    const candidateDate = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
    const dayName = dayNameForDate(candidateDate);
    const isAllowed = availableDays.length === 0 || availableDays.includes(dayName);
    if (doctor.status === "leave" || doctor.status === "suspended" || !isAllowed) continue;

    const slots = buildSlotLabels(shift, 30);
    const dateKey = candidateDate.toISOString().slice(0, 10);
    const bookedSlots = bookedSlotsByDay.get(dateKey) || [];
    const freeSlots = slots.filter((slot) => !bookedSlots.includes(slot));
    if (freeSlots.length > 0) {
      return {
        date: dateKey,
        free_slots: sortSlotsByAvailability(freeSlots, 3),
        shift_label: shiftWindow(shift).label,
        duty_window: getDoctorDutySummary(doctor).duty_window,
      };
    }
  }

  return null;
}

function buildDepartmentAliasSet(departmentName) {
  const normalized = normalizeToken(departmentName);
  const aliases = new Set([normalized]);

  const ALIAS_MAP = {
    "general medicine": [
      "general", "internal medicine", "medicine", "opd", "general opd", "family medicine",
      "general physician", "physician", "gp", "outdoor", "outpatient", "general practice",
      "mbbs", "general medicine opd", "general surgery opd",
    ],
    "cardiology": [
      "cardiac", "heart", "cvt", "cardio", "cardiovascular", "cardiac care",
      "heart specialist", "cardiac specialist",
    ],
    "neurology": [
      "neuro", "brain", "stroke", "seizure", "nervous system", "neurologist",
      "neurosurgery", "neuro specialist",
    ],
    "orthopedics": [
      "orthopaedics", "ortho", "bone", "fracture", "joint", "musculoskeletal",
      "spine", "sports medicine", "orthopaedic surgery",
    ],
    "emergency": [
      "emergency medicine", "casualty", "trauma", "a e", "accident emergency",
      "er", "emergency room", "emergency dept",
    ],
    "emergency medicine": [
      "emergency", "casualty", "trauma", "a e", "accident emergency",
      "er", "emergency room",
    ],
    "pediatrics": [
      "paediatrics", "pediatric", "child", "children", "neonatal", "baby",
      "child specialist", "paediatric", "kids",
    ],
    "dermatology": [
      "skin", "derma", "skin specialist", "skin disease", "dermatologist",
    ],
    "ent ear nose throat": [
      "ent", "otolaryngology", "ear nose throat", "ear", "nose", "throat",
      "ent specialist", "ear specialist",
    ],
    "pulmonology": [
      "respiratory", "chest", "lung", "pulmonary", "chest specialist",
      "chest medicine", "tb", "respiratory medicine",
    ],
    "gynecology obstetrics": [
      "gynecology", "obstetrics", "obgyn", "women", "maternity", "gynae",
      "gynaecology", "obs", "obs gyn", "women health", "lady doctor",
      "female ward", "gynae opd",
    ],
    "gynecology": [
      "gynecology", "obstetrics", "obgyn", "women", "maternity", "gynae",
      "gynaecology", "obs", "obs gyn", "women health", "lady doctor",
    ],
    "urology": [
      "urinary", "kidney", "bladder", "urologist", "uro", "renal",
    ],
    "oncology": [
      "cancer", "tumor", "chemotherapy", "cancer ward", "cancer specialist",
    ],
    "psychiatry mental health": [
      "psychiatry", "mental health", "psychology", "mental", "psychiatric",
      "counseling", "psychologist", "behavioral",
    ],
    "psychiatry": [
      "mental health", "psychology", "mental", "psychiatric", "counseling",
    ],
    "endocrinology": [
      "diabetes", "thyroid", "hormone", "endocrine", "diabetic clinic",
      "diabetes specialist", "endocrinologist",
    ],
    "gastroenterology": [
      "gastro", "gi", "liver", "gastrointestinal", "digestive", "hepatology",
      "liver specialist", "gastro specialist",
    ],
    "nephrology": [
      "renal", "dialysis", "kidney specialist", "kidney disease",
    ],
    "ophthalmology": [
      "eye", "eyes", "optometry", "eye specialist", "eye ward",
    ],
    "rheumatology": [
      "rheumatoid", "arthritis", "lupus", "rheumatologist",
    ],
    "hematology": [
      "blood", "haematology", "blood specialist", "blood disorder",
    ],
    "dentistry": [
      "dental", "teeth", "tooth", "oral", "dentist", "dental clinic",
    ],
    "allergy immunology": [
      "allergy", "immunology", "immunologist",
    ],
    "infectious disease": [
      "infectious", "infection", "communicable", "tropical medicine",
    ],
  };

  const extraAliases = ALIAS_MAP[normalized];
  if (extraAliases) {
    extraAliases.forEach((alias) => aliases.add(normalizeToken(alias)));
  } else {
    // Try partial key match
    for (const [key, values] of Object.entries(ALIAS_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        values.forEach((alias) => aliases.add(normalizeToken(alias)));
        break;
      }
    }
  }

  return aliases;
}

function sumResourceAvailability(resources, hospitalId, departmentId) {
  const totals = {
    beds: 0,
    doctors: 0,
    equipment: 0,
    totalResources: 0,
    lowStock: 0,
    outOfStock: 0,
    maintenance: 0,
  };

  for (const resource of resources) {
    const resourceHospitalId = String(resource.hospital_id || "");
    const resourceDepartmentId = resource.department_id ? String(resource.department_id) : "shared";
    const isShared = resourceDepartmentId === "shared";
    const matchesDepartment = resourceHospitalId === hospitalId && resourceDepartmentId === departmentId;
    const matchesSharedPool = resourceHospitalId === hospitalId && isShared;

    if (!matchesDepartment && !matchesSharedPool) continue;

    const availableQuantity = Math.max(0, Number(resource.available_quantity || 0));
    const quantity = Math.max(0, Number(resource.quantity || 0));
    const activeQuantity = availableQuantity > 0 ? availableQuantity : quantity;

    totals.totalResources += 1;
    if (resource.status === "low_stock") totals.lowStock += 1;
    if (resource.status === "out_of_stock") totals.outOfStock += 1;
    if (resource.status === "maintenance") totals.maintenance += 1;

    if (String(resource.type || "").toLowerCase() === "bed") {
      totals.beds += activeQuantity;
    } else if (String(resource.type || "").toLowerCase() === "equipment") {
      totals.equipment += activeQuantity;
    }
  }

  return totals;
}

function countDoctorsByDepartment(doctors, hospitalId, departmentId) {
  let total = 0;

  for (const doctor of doctors) {
    if (String(doctor.status || "").toLowerCase() !== "active") continue;
    const doctorHospitalId = String(doctor.hospital_id || "");
    const doctorDepartmentId = doctor.department_id ? String(doctor.department_id) : "shared";
    const matchesDepartment = doctorHospitalId === hospitalId && doctorDepartmentId === departmentId;
    const matchesSharedPool = doctorHospitalId === hospitalId && doctorDepartmentId === "shared";
    if (!matchesDepartment && !matchesSharedPool) continue;
    total += 1;
  }

  return total;
}

function groupAppointmentsByDoctorAndDay(appointments) {
  const byDoctor = new Map();

  for (const appointment of appointments) {
    const doctorId = String(appointment.doctor_id || "");
    const dateKey = new Date(appointment.appointment_at).toISOString().slice(0, 10);
    if (!byDoctor.has(doctorId)) byDoctor.set(doctorId, new Map());
    const byDay = byDoctor.get(doctorId);
    if (!byDay.has(dateKey)) byDay.set(dateKey, []);
    byDay.get(dateKey).push(appointment);
  }

  return byDoctor;
}

function buildBookedSlotMap(appointments, shiftByDoctorId) {
  const bookedSlotsByDoctor = new Map();

  for (const appointment of appointments) {
    const doctorId = String(appointment.doctor_id || "");
    const shift = shiftByDoctorId.get(doctorId) || "morning";
    const dateKey = new Date(appointment.appointment_at).toISOString().slice(0, 10);
    const slotLabel = slotLabelFromDate(appointment.appointment_at, Number(appointment.duration_minutes) || 30);
    if (!bookedSlotsByDoctor.has(doctorId)) bookedSlotsByDoctor.set(doctorId, new Map());
    const byDay = bookedSlotsByDoctor.get(doctorId);
    if (!byDay.has(dateKey)) byDay.set(dateKey, []);
    byDay.get(dateKey).push(slotLabel);
  }

  return bookedSlotsByDoctor;
}

function buildDoctorRecommendation(doctor, department, bookedSlotsByDoctor, appointmentsByDoctor) {
  const shift = String(doctor.shift || "").toLowerCase() || "morning";
  const duty = getDoctorDutySummary(doctor);
  const todayKey = startOfDay().toISOString().slice(0, 10);
  const todayDayName = dayNameForDate(todayKey);
  const availableDays = Array.isArray(doctor.available_days)
    ? doctor.available_days.map((day) => String(day || "").trim().toLowerCase()).filter(Boolean)
    : [];
  const isWorkingToday = doctor.status !== "leave" && doctor.status !== "suspended" && (availableDays.length === 0 || availableDays.includes(todayDayName));
  const slotsToday = buildSlotLabels(shift, 30);
  const bookedToday = bookedSlotsByDoctor.get(String(doctor._id))?.get(todayKey) || [];
  const freeToday = isWorkingToday ? slotsToday.filter((slot) => !bookedToday.includes(slot)) : [];
  const nextAvailable = buildNextAvailableDate(doctor, bookedSlotsByDoctor.get(String(doctor._id)) || new Map());
  const appointmentCount = appointmentsByDoctor.get(String(doctor._id))
    ? Array.from(appointmentsByDoctor.get(String(doctor._id)).values()).reduce((sum, items) => sum + items.length, 0)
    : 0;
  const freeSlotCount = freeToday.length;
  const nextAvailableSlotCount = nextAvailable ? nextAvailable.free_slots.length : 0;
  const futureWorkingDays = countFutureWorkingDays(doctor, 7);
  const maxPatientsPerDay = Number.isFinite(Number(doctor.max_patients_per_day)) ? Number(doctor.max_patients_per_day) : null;
  const score = scoreDoctorCandidate({
    experienceYears: doctor.experience_years,
    freeSlotsToday: freeSlotCount,
    nextAvailableSlotCount,
    futureWorkingDays,
    pendingAppointments: appointmentCount,
    maxPatientsPerDay,
    isWorkingToday,
  });

  return serializeDoctorRecommendation(doctor, {
    department_name: department.name,
    duty,
    next_available_date: nextAvailable ? nextAvailable.date : null,
    next_available_slots: nextAvailable ? nextAvailable.free_slots : [],
    free_slots_today: freeToday,
    booked_slots_today: bookedToday,
    score,
    note: isWorkingToday ? "Doctor is on duty today." : "Doctor is not on duty today.",
    total_appointments: appointmentCount,
  });
}

async function runPythonPrediction(modelBundlePath, hospitalId, departmentName, disease, gender, dateYmd) {
  const pythonCmd = process.env.AI_PYTHON_CMD || "python";
  const scriptPath = path.join(process.cwd(), "src", "ai", "predict_patient_flow.py");

  if (!fs.existsSync(scriptPath)) {
    throw new Error("Prediction script not found");
  }

  const d = new Date(`${dateYmd}T00:00:00.000Z`);
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const weekday = jsDateToWeekday(new Date(`${dateYmd}T00:00:00`));

  try {
    const { stdout, stderr } = await execFileAsync(
      pythonCmd,
      [
        scriptPath,
        modelBundlePath,
        String(hospitalId),
        String(departmentName),
        String(disease || "all"),
        String(gender || "all"),
        String(day),
        String(month),
        String(weekday),
        String(dateYmd),
      ],
      { cwd: process.cwd(), timeout: 120000, maxBuffer: 4 * 1024 * 1024 }
    );

    const parsed = parseJsonStdout(stdout);
    if (parsed?.success === false) {
      throw new Error(parsed.message || "Prediction failed");
    }

    if (stderr && String(stderr).trim()) {
      console.warn("[AI predict stderr]", String(stderr).trim());
    }

    return Number(parsed?.prediction || 0);
  } catch (error) {
    const stderr = String(error?.stderr || "").trim();
    const stdout = String(error?.stdout || "").trim();
    throw new Error(stderr || stdout || error.message || "Prediction command failed");
  }
}

router.post(
  "/predict-patient-load",
  authenticateJWT,
  authorizeRoles("hospital_admin"),
  restrictToOwnHospital,
  async (req, res, next) => {
    try {
      const departmentId = String(req.body?.department_id || "").trim();
      const disease = String(req.body?.disease || "all").trim() || "all";
      const gender = String(req.body?.gender || "all").trim().toLowerCase() || "all";
      const dateYmd = normalizeYmd(req.body?.date);

      if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({ success: false, message: "Valid department_id is required." });
      }
      if (!dateYmd) {
        return res.status(400).json({ success: false, message: "Valid date is required in YYYY-MM-DD format." });
      }

      const department = await Department.findOne({ _id: departmentId, hospital_id: req.hospitalId }, { name: 1 });
      if (!department) {
        return res.status(404).json({ success: false, message: "Department not found for your hospital." });
      }

      const aiPaths = getDepartmentAiPaths(req.hospitalId, departmentId);
      if (!fs.existsSync(aiPaths.modelBundlePath)) {
        return res.status(404).json({
          success: false,
          message: "Model not found for this department. Upload dataset and train first.",
        });
      }

      const expectedPatients = await runPythonPrediction(
        aiPaths.modelBundlePath,
        req.hospitalId,
        department.name,
        disease,
        gender,
        dateYmd
      );

      return res.json({
        success: true,
        expected_patients: Math.max(0, Math.round(expectedPatients)),
        input: {
          hospital_id: String(req.hospitalId),
          department_id: String(department._id),
          department_name: department.name,
          date: dateYmd,
          disease,
          gender,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post("/recommend-hospitals", async (req, res, next) => {
  try {
    const disease = String(req.body?.disease || "").trim();
    const patientLocation = normalizePatientLocation(req.body?.patient_location || {});
    const preferredCityToken = normalizeToken(req.body?.preferred_city || "");
    const limit = Math.min(10, Math.max(1, Number.parseInt(String(req.body?.limit || "3"), 10) || 3));
    const requireExactLocation = req.body?.require_exact_location !== false;
    const requestedMaxDistanceKm = Number(req.body?.max_distance_km);
    const maxDistanceKm = Number.isFinite(requestedMaxDistanceKm)
      ? Math.min(300, Math.max(1, requestedMaxDistanceKm))
      : 35;

    if (!disease) {
      return res.status(400).json({ success: false, message: "disease is required." });
    }
    if (!patientLocation) {
      return res.status(400).json({ success: false, message: "patient_location.lat and patient_location.lng are required." });
    }

    const mappedDisease = mapDiseaseToDepartment(disease);
    const targetDepartmentName = mappedDisease.department_name;
    const departmentAliases = buildDepartmentAliasSet(targetDepartmentName);

    const hospitals = await Hospital.find(
      { status: "approved", is_active: true },
      {
        name: 1,
        city: 1,
        address: 1,
        description: 1,
        status: 1,
        is_active: 1,
        geo_location: 1,
        rating: 1,
        average_rating: 1,
      }
    ).lean();

    if (hospitals.length === 0) {
      return res.json({ success: true, recommendations: [], message: "No approved hospitals available." });
    }

    const hospitalIds = hospitals.map((hospital) => hospital._id);
    const [departments, resources, doctors, appointments] = await Promise.all([
      Department.find({ hospital_id: { $in: hospitalIds }, status: "active" }, { name: 1, hospital_id: 1, status: 1 }).lean(),
      Resource.find({ hospital_id: { $in: hospitalIds } }, { hospital_id: 1, department_id: 1, type: 1, quantity: 1, available_quantity: 1, status: 1 }).lean(),
      Staff.find(
        { hospital_id: { $in: hospitalIds }, role: "doctor", status: { $in: ["active", "leave"] } },
        {
          hospital_id: 1,
          department_id: 1,
          role: 1,
          status: 1,
          name: 1,
          shift: 1,
          available_days: 1,
          max_patients_per_day: 1,
          experience_years: 1,
          specialization: 1,
        }
      ).lean(),
      Appointment.find(
        {
          hospital_id: { $in: hospitalIds },
          status: { $ne: "cancelled" },
          appointment_at: { $gte: startOfDay(), $lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
        },
        { hospital_id: 1, doctor_id: 1, appointment_at: 1, duration_minutes: 1, status: 1 }
      ).lean(),
    ]);

    const departmentsByHospital = new Map();
    for (const department of departments) {
      const hospitalKey = String(department.hospital_id || "");
      if (!departmentsByHospital.has(hospitalKey)) departmentsByHospital.set(hospitalKey, []);
      departmentsByHospital.get(hospitalKey).push(department);
    }

    const scoredHospitals = [];

    for (const hospital of hospitals) {
      const hospitalId = String(hospital._id);
      const hospitalDepartments = departmentsByHospital.get(hospitalId) || [];
      const matchedDepartment = hospitalDepartments.find((department) => {
        const normalizedName = normalizeToken(department.name);
        if (departmentAliases.has(normalizedName)) return true;
        for (const alias of departmentAliases) {
          if (normalizedName.includes(alias) || alias.includes(normalizedName)) return true;
        }
        return false;
      });

      if (!matchedDepartment) continue;

      let selectedDepartment = matchedDepartment;
      let availability = sumResourceAvailability(resources, hospitalId, String(selectedDepartment._id));
      let doctorCount = countDoctorsByDepartment(doctors, hospitalId, String(selectedDepartment._id));
      let departmentMatchedByFallback = false;

      // Try General Medicine / Emergency fallback if no resources in primary department
      if (availability.beds <= 0 || doctorCount <= 0) {
        const fallbackDepartmentName = mappedDisease.is_critical ? "Emergency" : "General Medicine";
        const fallbackAliases = buildDepartmentAliasSet(fallbackDepartmentName);
        const fallbackDepartment = hospitalDepartments.find((department) => {
          const normalizedName = normalizeToken(department.name);
          if (fallbackAliases.has(normalizedName)) return true;
          for (const alias of fallbackAliases) {
            if (normalizedName.includes(alias) || alias.includes(normalizedName)) return true;
          }
          return false;
        });

        if (fallbackDepartment) {
          const fallbackAvailability = sumResourceAvailability(resources, hospitalId, String(fallbackDepartment._id));
          const fallbackDoctorCount = countDoctorsByDepartment(doctors, hospitalId, String(fallbackDepartment._id));

          if (fallbackAvailability.beds > 0 && fallbackDoctorCount > 0) {
            selectedDepartment = fallbackDepartment;
            availability = fallbackAvailability;
            doctorCount = fallbackDoctorCount;
            departmentMatchedByFallback = true;
          }
        }
      }

      // SOFT filter: always include hospitals that have the right department,
      // even if resources/beds aren't set up yet. Score will be low.
      // Only hard-skip if there are ZERO doctors anywhere in the hospital.
      const totalHospitalDoctors = doctors.filter(
        (d) => String(d.hospital_id || "") === hospitalId && String(d.status || "") === "active"
      ).length;
      if (totalHospitalDoctors === 0 && doctorCount === 0) continue;

      const resolvedHospitalLocation = resolveHospitalLocation(hospital);
      const distanceKm = resolvedHospitalLocation
        ? Number(haversineDistanceKm(patientLocation.lat, patientLocation.lng, resolvedHospitalLocation.lat, resolvedHospitalLocation.lng).toFixed(2))
        : null;

      const rating = Number(hospital.rating ?? hospital.average_rating ?? 0) || null;
      const hasEmergencyDepartment = hospitalDepartments.some((department) => {
        const normalizedName = normalizeToken(department.name);
        return normalizedName.includes("emergency") || normalizedName.includes("casualty") || normalizedName.includes("trauma");
      });

      const score = scoreHospitalRecommendation({
        distanceKm,
        availableBeds: availability.beds,
        availableDoctors: doctorCount,
        availableEquipment: availability.equipment,
        isCritical: mappedDisease.is_critical,
        hasEmergencyDepartment,
      }) + (rating ? Math.min(5, Math.max(0, rating - 3)) : 0);

      const hospitalDoctors = doctors.filter((doctor) => String(doctor.hospital_id || "") === hospitalId);
      const hospitalAppointments = appointments.filter((appointment) => String(appointment.hospital_id || "") === hospitalId);
      const appointmentGroups = groupAppointmentsByDoctorAndDay(hospitalAppointments);
      const shiftByDoctorId = new Map(hospitalDoctors.map((doctor) => [String(doctor._id), String(doctor.shift || "") || "morning"]));
      const bookedSlotsByDoctor = buildBookedSlotMap(hospitalAppointments, shiftByDoctorId);

      const candidateDoctors = hospitalDoctors.filter((doctor) => String(doctor.status || "").toLowerCase() === "active")
        .filter((doctor) => matchesDoctorDepartment(doctor, selectedDepartment._id, selectedDepartment.name));

      // Hard filter: only show hospital if doctors for the department are available
      if (candidateDoctors.length === 0) continue;

      const doctorsWithSlots = candidateDoctors.map((doctor) => 
        buildDoctorRecommendation(doctor, selectedDepartment, bookedSlotsByDoctor, appointmentGroups)
      );

      // Hard filter: only show hospital if there is at least one slot available (today or future)
      const doctorsWithAvailableSlots = doctorsWithSlots.filter((docRec) => {
        const slotsToday = Array.isArray(docRec.free_slots_today) ? docRec.free_slots_today.length : 0;
        const slotsNext = Array.isArray(docRec.next_available_slots) ? docRec.next_available_slots.length : 0;
        return slotsToday > 0 || slotsNext > 0;
      });
      if (doctorsWithAvailableSlots.length === 0) continue;

      const bestDoctor = doctorsWithSlots.sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        if ((right.experience_years || 0) !== (left.experience_years || 0)) return (right.experience_years || 0) - (left.experience_years || 0);
        const leftSlots = Array.isArray(left.free_slots_today) ? left.free_slots_today.length : 0;
        const rightSlots = Array.isArray(right.free_slots_today) ? right.free_slots_today.length : 0;
        if (rightSlots !== leftSlots) return rightSlots - leftSlots;
        return String(left.doctor_name || "").localeCompare(String(right.doctor_name || ""));
      })[0] || null;

      const waitingTimeMinutes = Math.max(
        5,
        Math.round(180 - (availability.beds * 6) - (doctorCount * 8) - (availability.equipment * 2) - (distanceKm === null ? 0 : Math.min(distanceKm, 60)))
      );

      const rankingPriority = computeHospitalRankingPriority({
        distanceKm,
        distanceSource: resolvedHospitalLocation?.source || null,
        availableBeds: availability.beds,
        availableDoctors: doctorCount,
        availableEquipment: availability.equipment,
        bestDoctorScore: bestDoctor?.score || 0,
      });

      scoredHospitals.push({
        hospital_id: hospitalId,
        hospital_name: hospital.name,
        city: hospital.city || "",
        address: hospital.address || "",
        department: selectedDepartment.name,
        department_id: String(selectedDepartment._id),
        department_source: departmentMatchedByFallback ? "fallback" : "direct",
        distance_km: distanceKm,
        available_beds: availability.beds,
        available_doctors: doctorCount,
        available_equipment: availability.equipment,
        hospital_rating: rating,
        estimated_waiting_time_minutes: waitingTimeMinutes,
        emergency_priority: Boolean(mappedDisease.is_critical),
        geo_location: resolvedHospitalLocation
          ? { lat: resolvedHospitalLocation.lat, lng: resolvedHospitalLocation.lng }
          : null,
        distance_source: resolvedHospitalLocation?.source || null,
        score,
        ranking_priority: rankingPriority,
        best_doctor: bestDoctor,
        sort_distance: distanceKm === null ? Number.POSITIVE_INFINITY : distanceKm,
        sort_rating: rating === null ? 0 : rating,
      });
    }

    scoredHospitals.sort((left, right) => {
      if ((right.ranking_priority || 0) !== (left.ranking_priority || 0)) {
        return (right.ranking_priority || 0) - (left.ranking_priority || 0);
      }
      if (right.score !== left.score) return right.score - left.score;
      if (left.sort_distance !== right.sort_distance) return left.sort_distance - right.sort_distance;
      if (right.available_beds !== left.available_beds) return right.available_beds - left.available_beds;
      if (right.available_doctors !== left.available_doctors) return right.available_doctors - left.available_doctors;
      return right.sort_rating - left.sort_rating;
    });

    const exactDistanceCandidates = scoredHospitals.filter((hospital) => (
      Number.isFinite(Number(hospital.distance_km))
      && hospital.distance_source === "exact"
      && Number.isFinite(Number(hospital.geo_location?.lat))
      && Number.isFinite(Number(hospital.geo_location?.lng))
    ));
    const finiteDistanceCandidates = scoredHospitals.filter((hospital) => (
      Number.isFinite(Number(hospital.distance_km))
      && Number.isFinite(Number(hospital.geo_location?.lat))
      && Number.isFinite(Number(hospital.geo_location?.lng))
    ));
    // Hospitals registered in app but without GPS coordinates — include in relaxed fallback
    const noCoordCandidates = scoredHospitals.filter((hospital) => !Number.isFinite(Number(hospital.distance_km)));

    const fallbackDistanceCandidates = finiteDistanceCandidates.filter((hospital) => hospital.distance_source !== "exact");
    const candidatePool = requireExactLocation
      ? exactDistanceCandidates
      : (exactDistanceCandidates.length > 0
        ? [...exactDistanceCandidates, ...fallbackDistanceCandidates]
        : finiteDistanceCandidates);

    const nearbyCandidatePool = candidatePool.filter((hospital) => (
      Number.isFinite(Number(hospital.distance_km)) && Number(hospital.distance_km) <= maxDistanceKm
    ));

    // When relaxed mode and nothing else found, include no-coord registered hospitals
    const finalCandidatePool = nearbyCandidatePool.length > 0
      ? nearbyCandidatePool
      : (candidatePool.length > 0
        ? candidatePool
        : (!requireExactLocation ? noCoordCandidates : []));

    const preferredCityCandidates = preferredCityToken
      ? finalCandidatePool.filter((hospital) => normalizeToken(hospital.city || "") === preferredCityToken)
      : [];
    const orderedCandidatePool = preferredCityCandidates.length > 0
      ? [
        ...preferredCityCandidates,
        ...finalCandidatePool.filter((hospital) => normalizeToken(hospital.city || "") !== preferredCityToken),
      ]
      : finalCandidatePool;

    const recommendations = orderedCandidatePool.slice(0, limit).map((hospital, index) => ({
      hospital_name: hospital.hospital_name,
      distance_km: hospital.distance_km,
      geo_location: hospital.geo_location,
      department: hospital.department,
      department_source: hospital.department_source,
      available_beds: hospital.available_beds,
      available_doctors: hospital.available_doctors,
      status: rankLabelByIndex(index),
      hospital_id: hospital.hospital_id,
      city: hospital.city,
      address: hospital.address,
      score: hospital.score,
      distance_source: hospital.distance_source,
      emergency_priority: hospital.emergency_priority,
      estimated_waiting_time_minutes: hospital.estimated_waiting_time_minutes,
      hospital_rating: hospital.hospital_rating,
      ranking_priority: hospital.ranking_priority,
      best_doctor: hospital.best_doctor,
      book_appointment_available: true,
    }));

    return res.json({
      success: true,
      input: {
        disease,
        patient_location: patientLocation,
        preferred_city: preferredCityToken || null,
        mapped_department: targetDepartmentName,
        emergency_priority: Boolean(mappedDisease.is_critical),
        match_source: mappedDisease.match_source,
        max_distance_km: maxDistanceKm,
        require_exact_location: requireExactLocation,
      },
      recommendations,
      total_candidates: scoredHospitals.length,
      total_routable_candidates: candidatePool.length,
      total_nearby_candidates: nearbyCandidatePool.length,
      distance_filter_mode: requireExactLocation
        ? "exact_only"
        : (exactDistanceCandidates.length > 0 ? "exact_preferred_with_fallback" : "fallback_finite_distance"),
      message: recommendations.length > 0
        ? (nearbyCandidatePool.length > 0
          ? "Hospitals found within the configured distance range."
          : `No hospitals were found within ${maxDistanceKm} km. Showing the closest available hospitals instead.`)
        : (requireExactLocation
          ? `No hospitals with exact coordinates and available resources were found for ${targetDepartmentName}. Ask hospital admin to update map coordinates.`
          : `No hospitals with available resources were found for ${targetDepartmentName}.`),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
