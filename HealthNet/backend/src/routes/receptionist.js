const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { parse: parseCsv } = require("csv-parse/sync");

const Patient = require("../models/Patient");
const Staff = require("../models/Staff");
const Hospital = require("../models/Hospital");
const Department = require("../models/Department");
const Appointment = require("../models/Appointment");
const Queue = require("../models/Queue");
const Diagnosis = require("../models/Diagnosis");
const Prescription = require("../models/Prescription");
const Resource = require("../models/Resource");
const { authenticateStaff, authorizeRoles } = require("../middleware/staffAuth");

const router = express.Router();

router.use(authenticateStaff, authorizeRoles("receptionist"));

const BACKEND_ROOT_DIR = path.resolve(__dirname, "..", "..");
const BACKEND_STORAGE_DIR = path.join(BACKEND_ROOT_DIR, "storage");
const CWD_STORAGE_DIR = path.join(process.cwd(), "storage");
const BACKEND_AI_DIR = path.join(BACKEND_STORAGE_DIR, "ai");
const CWD_AI_DIR = path.join(CWD_STORAGE_DIR, "ai");
const STORAGE_ROOT_DIR = fs.existsSync(BACKEND_AI_DIR) || !fs.existsSync(CWD_AI_DIR)
  ? BACKEND_STORAGE_DIR
  : CWD_STORAGE_DIR;

function ensureDirectorySync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toCsv(rows, columns) {
  const escapeCell = (value) => {
    const raw = value === undefined || value === null ? "" : String(value);
    if (/[,"\n\r]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const header = columns.map((c) => escapeCell(c)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCell(row[c])).join(","));
  return [header, ...lines].join("\n");
}

function normalizeGender(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "m" || v === "male") return "male";
  if (v === "f" || v === "female") return "female";
  if (v === "other" || v === "o") return "other";
  return "other";
}

function normalizeDateYmd(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return "";
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function normalizePatientStatus(value) {
  const v = String(value || "").trim().toLowerCase();
  return ["active", "discharged", "deceased"].includes(v) ? v : "active";
}

function normalizeBloodType(value) {
  const v = String(value || "").trim().toUpperCase();
  return ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(v) ? v : "";
}

function parseTimeLabelToMinute(label) {
  const text = String(label || "").trim();

  let m = text.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return hh * 60 + mm;
    return null;
  }

  m = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (m) {
    let hh = Number(m[1]);
    const mm = Number(m[2] || "0");
    const ap = String(m[3]).toUpperCase();
    if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
    if (ap === "AM") {
      if (hh === 12) hh = 0;
    } else if (hh !== 12) {
      hh += 12;
    }
    return hh * 60 + mm;
  }

  return null;
}

function parseTimeSlot(dateYmd, timeSlot) {
  const slot = String(timeSlot || "").trim();
  if (!slot) return null;

  const split = slot.split("-").map((s) => s.trim()).filter(Boolean);
  let startMinute = null;
  let endMinute = null;

  if (split.length >= 2) {
    startMinute = parseTimeLabelToMinute(split[0]);
    endMinute = parseTimeLabelToMinute(split[1]);
  } else {
    startMinute = parseTimeLabelToMinute(split[0]);
  }

  if (!Number.isFinite(startMinute)) return null;

  let durationMinutes = 30;
  if (Number.isFinite(endMinute)) {
    if (endMinute <= startMinute) {
      endMinute += 24 * 60;
    }
    durationMinutes = Math.max(10, Math.min(240, endMinute - startMinute));
  }

  const hh = Math.floor(startMinute / 60) % 24;
  const mm = startMinute % 60;
  
  // Create date in local timezone by parsing the date string and time
  // The date string is in format YYYY-MM-DD (local date)
  const parts = String(dateYmd || "").split("-");
  if (parts.length !== 3) return null;
  
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  
  // Create date object in local timezone
  const dateTime = new Date(year, month - 1, day, hh, mm, 0, 0);
  if (Number.isNaN(dateTime.getTime())) return null;

  return { appointmentAt: dateTime, durationMinutes };
}

function getHospitalPatientRecordsDir(hospitalId) {
  return path.join(STORAGE_ROOT_DIR, "patient_records", String(hospitalId));
}

function getDepartmentPatientRecordsPath(hospitalId, departmentId) {
  return path.join(
    getHospitalPatientRecordsDir(hospitalId),
    "departments",
    String(departmentId || "unassigned"),
    "receptionist_patient_records.csv"
  );
}

function getDepartmentPatientRecordsNdjsonPath(hospitalId, departmentId) {
  return path.join(
    getHospitalPatientRecordsDir(hospitalId),
    "departments",
    String(departmentId || "unassigned"),
    "receptionist_patient_records.ndjson"
  );
}

function getDepartmentAiTrainingDatasetPath(hospitalId, departmentId) {
  return path.join(
    STORAGE_ROOT_DIR,
    "ai",
    String(hospitalId),
    "departments",
    String(departmentId),
    "patient_training_dataset.csv"
  );
}

function readCsvRows(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  const rows = parseCsv(raw, { columns: true, skip_empty_lines: true, trim: true });
  return Array.isArray(rows) ? rows : [];
}

function appendPatientRecordFile({ hospitalId, departmentId, departmentName, patient, disease }) {
  const dir = path.dirname(getDepartmentPatientRecordsPath(hospitalId, departmentId || "unassigned"));
  ensureDirectorySync(dir);

  const row = {
    patient_id: String(patient._id),
    source_record_id: String(patient.source_record_id || ""),
    name: String(patient.name || ""),
    email: String(patient.email || ""),
    phone: String(patient.phone || ""),
    city: String(patient.city || ""),
    date_of_birth: patient.date_of_birth ? new Date(patient.date_of_birth).toISOString() : "",
    gender: String(patient.gender || ""),
    blood_type: String(patient.blood_type || ""),
    address: String(patient.address || ""),
    hospital_id: String(hospitalId || ""),
    department_id: patient.department_id ? String(patient.department_id) : "",
    assigned_doctor_id: patient.assigned_doctor_id ? String(patient.assigned_doctor_id) : "",
    department_name: String(departmentName || ""),
    disease: String(disease || "general_consultation"),
    medical_history: String(patient.medical_history || ""),
    status: String(patient.status || "active"),
    created_by: patient.created_by ? String(patient.created_by) : "",
    created_at: patient.created_at ? new Date(patient.created_at).toISOString() : new Date().toISOString(),
    updated_at: patient.updated_at ? new Date(patient.updated_at).toISOString() : new Date().toISOString(),
    source_data_json: JSON.stringify(patient.source_data && typeof patient.source_data === "object" ? patient.source_data : {}),
  };

  const csvPath = getDepartmentPatientRecordsPath(hospitalId, departmentId || "unassigned");
  const columns = Object.keys(row);

  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, toCsv([row], columns), "utf-8");
  } else {
    const line = toCsv([row], columns).split("\n")[1] || "";
    fs.appendFileSync(csvPath, `\n${line}`, "utf-8");
  }

  const ndjsonPath = getDepartmentPatientRecordsNdjsonPath(hospitalId, departmentId || "unassigned");
  fs.appendFileSync(ndjsonPath, `${JSON.stringify(row)}\n`, "utf-8");
}

function syncPredictionTrainingDataset({ hospitalId, departmentId, departmentName, disease, gender, dateYmd }) {
  if (!departmentId || !departmentName || !dateYmd) return;

  const datasetPath = getDepartmentAiTrainingDatasetPath(hospitalId, departmentId);
  ensureDirectorySync(path.dirname(datasetPath));

  const rows = readCsvRows(datasetPath);
  const normalizedDisease = String(disease || "general_consultation").trim() || "general_consultation";
  const normalizedGender = normalizeGender(gender);

  const match = rows.find((r) => (
    String(r.hospital_id || "") === String(hospitalId)
    && String(r.date || "") === dateYmd
    && String(r.department || "") === String(departmentName)
    && String(r.disease || "") === normalizedDisease
    && normalizeGender(r.gender) === normalizedGender
  ));

  if (match) {
    const current = Number(match.patient_count || 0);
    match.patient_count = Number.isFinite(current) ? current + 1 : 1;
  } else {
    rows.push({
      hospital_id: String(hospitalId),
      date: dateYmd,
      department: String(departmentName),
      disease: normalizedDisease,
      gender: normalizedGender,
      patient_count: 1,
    });
  }

  rows.sort((a, b) => {
    const d1 = String(a.date || "");
    const d2 = String(b.date || "");
    if (d1 !== d2) return d1.localeCompare(d2);
    const depCmp = String(a.department || "").localeCompare(String(b.department || ""));
    if (depCmp !== 0) return depCmp;
    return String(a.disease || "").localeCompare(String(b.disease || ""));
  });

  const columns = ["hospital_id", "date", "department", "disease", "gender", "patient_count"];
  fs.writeFileSync(datasetPath, toCsv(rows, columns), "utf-8");
}

function startOfDay(inputDate = new Date()) {
  const d = new Date(inputDate);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(inputDate = new Date()) {
  const d = new Date(inputDate);
  d.setHours(23, 59, 59, 999);
  return d;
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

function isSlotInPast(dateYmd, slot) {
  try {
    const parsed = parseTimeSlot(dateYmd, slot);
    if (!parsed || !parsed.appointmentAt) return false;
    const now = new Date();
    // Add 30-minute buffer: slot must start at least 30 minutes in the future
    const bufferTime = new Date(now.getTime() + 30 * 60 * 1000);
    return parsed.appointmentAt.getTime() <= bufferTime.getTime();
  } catch (e) {
    return false;
  }
}

// 1) Patient Management
// POST /api/receptionist/patients
router.post("/patients", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "name is required." });
    }

    const departmentId = String(req.body?.department_id || "").trim();
    const doctorId = String(req.body?.assigned_doctor_id || req.body?.doctor_id || "").trim();
    const sourceRecordId = String(req.body?.source_record_id || "").trim();
    const disease = String(req.body?.disease || req.body?.source_data?.disease || "general_consultation").trim();

    let department = null;
    if (departmentId) {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({ success: false, message: "Invalid department_id." });
      }
      department = await Department.findOne({ _id: departmentId, hospital_id: req.hospitalId }, { name: 1 });
      if (!department) {
        return res.status(404).json({ success: false, message: "Department not found for this hospital." });
      }
    }

    let doctor = null;
    if (doctorId) {
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ success: false, message: "Invalid assigned_doctor_id." });
      }
      doctor = await Staff.findOne({ _id: doctorId, hospital_id: req.hospitalId, role: "doctor" }, { _id: 1, department_id: 1, name: 1 });
      if (!doctor) {
        return res.status(404).json({ success: false, message: "Doctor not found for this hospital." });
      }
      if (!department && doctor.department_id) {
        department = await Department.findOne({ _id: doctor.department_id, hospital_id: req.hospitalId }, { name: 1 });
      }
    }

    const patient = await Patient.create({
      name,
      email: String(req.body?.email || "").trim().toLowerCase(),
      phone: String(req.body?.phone || req.body?.contact || "").trim(),
      date_of_birth: req.body?.date_of_birth ? new Date(String(req.body.date_of_birth)) : null,
      gender: normalizeGender(req.body?.gender || "other"),
      blood_type: normalizeBloodType(req.body?.blood_type),
      address: String(req.body?.address || "").trim(),
      hospital_id: req.hospitalId,
      assigned_doctor_id: doctor?._id || null,
      department_id: department?._id || null,
      medical_history: String(req.body?.medical_history || "").trim(),
      source_record_id: sourceRecordId,
      source_data: {
        ...(req.body?.source_data && typeof req.body.source_data === "object" ? req.body.source_data : {}),
        disease,
      },
      status: normalizePatientStatus(req.body?.status || "active"),
      created_by: null,
    });

    appendPatientRecordFile({
      hospitalId: req.hospitalId,
      departmentId: department?._id || null,
      departmentName: department?.name || "",
      patient,
      disease,
    });

    if (department?._id) {
      const createdDate = patient.created_at ? new Date(patient.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      syncPredictionTrainingDataset({
        hospitalId: req.hospitalId,
        departmentId: department._id,
        departmentName: department.name,
        disease,
        gender: patient.gender,
        dateYmd: createdDate,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully.",
      patient,
      file_sync: {
        patient_records: true,
        prediction_training: Boolean(department?._id),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/receptionist/patients
router.get("/patients", async (req, res, next) => {
  try {
    const q = String(req.query?.q || req.query?.search || "").trim();
    const departmentId = String(req.query?.department_id || "").trim();
    const page = Math.max(1, Number.parseInt(String(req.query?.page || "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query?.limit || "25"), 10) || 25));

    const filter = { hospital_id: req.hospitalId };

    if (departmentId) {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({ success: false, message: "Invalid department_id filter." });
      }
      filter.department_id = departmentId;
    }

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
        { source_record_id: { $regex: escaped, $options: "i" } },
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(filter, { __v: 0 })
        .populate("department_id", "name")
        .populate("assigned_doctor_id", "name doctor_id status")
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Patient.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      patients,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/receptionist/patients/:id
router.put("/patients/:id", async (req, res, next) => {
  try {
    const patientId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Invalid patient id." });
    }

    const patient = await Patient.findOne({ _id: patientId, hospital_id: req.hospitalId });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    const updates = {};

    if (req.body?.name !== undefined) updates.name = String(req.body.name || "").trim();
    if (req.body?.email !== undefined) updates.email = String(req.body.email || "").trim().toLowerCase();
    if (req.body?.phone !== undefined || req.body?.contact !== undefined) {
      updates.phone = String(req.body.phone || req.body.contact || "").trim();
    }
    if (req.body?.date_of_birth !== undefined) {
      updates.date_of_birth = req.body.date_of_birth ? new Date(String(req.body.date_of_birth)) : null;
    }
    if (req.body?.gender !== undefined) updates.gender = normalizeGender(req.body.gender);
    if (req.body?.blood_type !== undefined) updates.blood_type = normalizeBloodType(req.body.blood_type);
    if (req.body?.address !== undefined) updates.address = String(req.body.address || "").trim();
    if (req.body?.medical_history !== undefined) updates.medical_history = String(req.body.medical_history || "").trim();
    if (req.body?.status !== undefined) updates.status = normalizePatientStatus(req.body.status);
    if (req.body?.source_record_id !== undefined) updates.source_record_id = String(req.body.source_record_id || "").trim();

    if (req.body?.department_id !== undefined) {
      const deptId = String(req.body.department_id || "").trim();
      if (deptId) {
        if (!mongoose.Types.ObjectId.isValid(deptId)) {
          return res.status(400).json({ success: false, message: "Invalid department_id." });
        }
        const department = await Department.findOne({ _id: deptId, hospital_id: req.hospitalId }, { _id: 1 });
        if (!department) {
          return res.status(404).json({ success: false, message: "Department not found for this hospital." });
        }
        updates.department_id = department._id;
      } else {
        updates.department_id = null;
      }
    }

    if (req.body?.assigned_doctor_id !== undefined || req.body?.doctor_id !== undefined) {
      const doctorId = String(req.body.assigned_doctor_id || req.body.doctor_id || "").trim();
      if (doctorId) {
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
          return res.status(400).json({ success: false, message: "Invalid assigned_doctor_id." });
        }
        const doctor = await Staff.findOne({ _id: doctorId, hospital_id: req.hospitalId, role: "doctor" }, { _id: 1 });
        if (!doctor) {
          return res.status(404).json({ success: false, message: "Doctor not found for this hospital." });
        }
        updates.assigned_doctor_id = doctor._id;
      } else {
        updates.assigned_doctor_id = null;
      }
    }

    if (req.body?.source_data !== undefined) {
      updates.source_data = {
        ...(patient.source_data && typeof patient.source_data === "object" ? patient.source_data : {}),
        ...(req.body.source_data && typeof req.body.source_data === "object" ? req.body.source_data : {}),
      };
    }

    const updatedPatient = await Patient.findOneAndUpdate(
      { _id: patientId, hospital_id: req.hospitalId },
      { $set: updates },
      { new: true }
    )
      .populate("department_id", "name")
      .populate("assigned_doctor_id", "name doctor_id status");

    return res.json({ success: true, message: "Patient updated successfully.", patient: updatedPatient });
  } catch (error) {
    return next(error);
  }
});

// Optional read-only patient history endpoint for receptionist
router.get("/patients/:id/history", async (req, res, next) => {
  try {
    const patientId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Invalid patient id." });
    }

    const patient = await Patient.findOne({ _id: patientId, hospital_id: req.hospitalId }, { __v: 0 })
      .populate("department_id", "name")
      .populate("assigned_doctor_id", "name doctor_id");

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    const [appointments, diagnoses, prescriptions] = await Promise.all([
      Appointment.find({ hospital_id: req.hospitalId, patient_id: patient._id }, { __v: 0 })
        .populate("doctor_id", "name doctor_id department_id")
        .sort({ appointment_at: -1 })
        .limit(100),
      Diagnosis.find({ hospital_id: req.hospitalId, patient_id: patient._id }, { __v: 0 })
        .populate("doctor_id", "name doctor_id")
        .sort({ created_at: -1 })
        .limit(100),
      Prescription.find({ hospital_id: req.hospitalId, patient_id: patient._id }, { __v: 0 })
        .populate("doctor_id", "name doctor_id")
        .sort({ created_at: -1 })
        .limit(100),
    ]);

    return res.json({
      success: true,
      patient,
      history: {
        appointments,
        diagnoses,
        prescriptions,
      },
    });
  } catch (error) {
    return next(error);
  }
});

async function getNextTokenNumber(hospitalId, doctorId, dateObj) {
  const dayStart = startOfDay(dateObj);
  const dayEnd = endOfDay(dateObj);

  const latest = await Queue.findOne(
    {
      hospital_id: hospitalId,
      doctor_id: doctorId,
      queue_date: { $gte: dayStart, $lte: dayEnd },
    },
    { token_number: 1 }
  ).sort({ token_number: -1 });

  return Number(latest?.token_number || 0) + 1;
}

function getShiftDateRangeForSchedule(date, shift) {
  const anchorDay = startOfDay(date);
  const { startMinute, endMinute } = shiftWindow(shift);

  const start = new Date(anchorDay);
  start.setMinutes(startMinute, 0, 0);

  const end = new Date(anchorDay);
  end.setMinutes(endMinute, 0, 0);
  if (endMinute <= startMinute) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

// Helper data for receptionist screens
// GET /api/receptionist/departments
router.get("/departments", async (req, res, next) => {
  try {
    const [departments, doctors] = await Promise.all([
      Department.find({ hospital_id: req.hospitalId }, { __v: 0 }).sort({ name: 1 }),
      Staff.find({ hospital_id: req.hospitalId, role: "doctor", status: "active" }, { department_id: 1 })
    ]);

    const doctorCounts = {};
    doctors.forEach((doc) => {
      if (doc.department_id) {
        const did = String(doc.department_id);
        doctorCounts[did] = (doctorCounts[did] || 0) + 1;
      }
    });

    const activeDepartments = departments.map((d) => {
      const doc = d.toObject ? d.toObject() : d;
      const count = doctorCounts[String(doc._id)] || 0;
      doc.status = count > 0 ? "active" : "inactive";
      return doc;
    }).filter((d) => d.status === "active");

    return res.json({ success: true, departments: activeDepartments });
  } catch (error) {
    return next(error);
  }
});

// GET /api/receptionist/doctors
router.get("/doctors", async (req, res, next) => {
  try {
    const departmentId = String(req.query?.department_id || "").trim();
    const statusFilter = String(req.query?.status || "active").trim().toLowerCase();

    const filter = {
      hospital_id: req.hospitalId,
      role: "doctor",
    };

    if (statusFilter && ["active", "leave", "suspended"].includes(statusFilter)) {
      filter.status = statusFilter;
    }

    if (departmentId) {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({ success: false, message: "Invalid department_id filter." });
      }
      filter.department_id = departmentId;
    }

    const doctors = await Staff.find(filter, {
      _id: 1,
      name: 1,
      doctor_id: 1,
      department_id: 1,
      status: 1,
      shift: 1,
      available_days: 1,
      max_patients_per_day: 1,
    })
      .populate("department_id", "name")
      .sort({ name: 1 });

    return res.json({ success: true, doctors });
  } catch (error) {
    return next(error);
  }
});

// 2) Appointment Booking
// POST /api/receptionist/appointments
router.post("/appointments", async (req, res, next) => {
  try {
    const patientId = String(req.body?.patient_id || "").trim();
    const doctorId = String(req.body?.doctor_id || "").trim();
    const dateYmd = normalizeDateYmd(req.body?.date);
    const timeSlot = String(req.body?.time_slot || "").trim();

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Valid patient_id is required." });
    }
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: "Valid doctor_id is required." });
    }
    if (!dateYmd) {
      return res.status(400).json({ success: false, message: "Valid date (YYYY-MM-DD) is required." });
    }
    if (!timeSlot) {
      return res.status(400).json({ success: false, message: "time_slot is required." });
    }

    const parsedSlot = parseTimeSlot(dateYmd, timeSlot);
    if (!parsedSlot) {
      return res.status(400).json({ success: false, message: "Invalid time_slot format. Use HH:mm or HH:mm - HH:mm." });
    }

    const [patient, doctor] = await Promise.all([
      Patient.findOne({ _id: patientId, hospital_id: req.hospitalId }, { _id: 1, department_id: 1, name: 1, status: 1 }),
      Staff.findOne({ _id: doctorId, hospital_id: req.hospitalId, role: "doctor" }, { _id: 1, name: 1, status: 1, shift: 1, available_days: 1, department_id: 1, max_patients_per_day: 1 }),
    ]);

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found for this hospital." });
    }
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found for this hospital." });
    }
    if (doctor.status === "leave" || doctor.status === "suspended") {
      return res.status(400).json({ success: false, message: `Doctor is not available (${doctor.status}).` });
    }

    const appointmentAt = parsedSlot.appointmentAt;
    const now = new Date();
    
    // Check if appointment is in the past
    // Add 5-minute buffer to prevent bookings too close to current time
    const minBookingTime = new Date(now.getTime() + 5 * 60 * 1000);
    if (appointmentAt.getTime() < minBookingTime.getTime()) {
      // More specific error message
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const appointmentDate = startOfDay(appointmentAt);
      
      if (appointmentDate.getTime() === todayStart.getTime()) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot book appointment for today. Please select a future date." 
        });
      } else if (appointmentAt.getTime() < now.getTime()) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot create appointment in the past. Selected date/time has already passed." 
        });
      }
    }
    
    const appointmentEnd = new Date(appointmentAt.getTime() + parsedSlot.durationMinutes * 60 * 1000);

    const dayName = appointmentAt.toLocaleDateString("en-US", { weekday: "long" });
    if (Array.isArray(doctor.available_days) && doctor.available_days.length > 0) {
      const dayAllowed = doctor.available_days.some((d) => String(d || "").toLowerCase() === dayName.toLowerCase());
      if (!dayAllowed) {
        return res.status(400).json({ success: false, message: `Doctor is not available on ${dayName}.` });
      }
    }

    if (patient.department_id && doctor.department_id && String(patient.department_id) !== String(doctor.department_id)) {
      return res.status(400).json({ success: false, message: "Selected doctor does not match patient department." });
    }

    if (doctor.department_id) {
      const hasResources = await checkResourceAvailability(req.hospitalId, doctor.department_id);
      if (!hasResources) {
        return res.status(400).json({
          success: false,
          message: "Selected department has no available resources (e.g., out of stock of beds/equipment)."
        });
      }
    }

    const overlapping = await Appointment.findOne({
      hospital_id: req.hospitalId,
      doctor_id: doctor._id,
      status: { $in: ["pending", "confirmed"] },
      appointment_at: { $gte: new Date(appointmentAt.getTime() - (parsedSlot.durationMinutes - 1) * 60 * 1000), $lt: appointmentEnd },
    }, { _id: 1, appointment_at: 1 });

    if (overlapping) {
      return res.status(409).json({ success: false, message: "Selected doctor already has an appointment in this slot." });
    }

    const dayStart = startOfDay(appointmentAt);
    const dayEnd = endOfDay(appointmentAt);
    const pendingCount = await Appointment.countDocuments({
      hospital_id: req.hospitalId,
      doctor_id: doctor._id,
      status: { $in: ["pending", "confirmed"] },
      appointment_at: { $gte: dayStart, $lte: dayEnd },
    });

    if (Number.isFinite(Number(doctor.max_patients_per_day)) && Number(doctor.max_patients_per_day) > 0) {
      if (pendingCount >= Number(doctor.max_patients_per_day)) {
        return res.status(409).json({ success: false, message: "Doctor has reached max patient capacity for selected day." });
      }
    }

    const appointment = await Appointment.create({
      hospital_id: req.hospitalId,
      patient_id: patient._id,
      doctor_id: doctor._id,
      appointment_at: appointmentAt,
      duration_minutes: parsedSlot.durationMinutes,
      reason: String(req.body?.reason || "").trim(),
      notes: String(req.body?.notes || "").trim(),
      status: "confirmed",
      created_by: null,
    });

    const nextToken = await getNextTokenNumber(req.hospitalId, doctor._id, appointmentAt);
    const queueItem = await Queue.create({
      hospital_id: req.hospitalId,
      queue_date: dayStart,
      token_number: nextToken,
      patient_id: patient._id,
      doctor_id: doctor._id,
      appointment_id: appointment._id,
      status: "waiting",
      created_by: req.authStaff?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment confirmed and token generated.",
      appointment,
      queue: {
        token_number: queueItem.token_number,
        status: queueItem.status,
        queue_date: queueItem.queue_date,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 3) View Appointments
// GET /api/receptionist/appointments
router.get("/appointments", async (req, res, next) => {
  try {
    const dateYmd = normalizeDateYmd(req.query?.date);
    const doctorId = String(req.query?.doctor || req.query?.doctor_id || "").trim();
    const status = String(req.query?.status || "").trim().toLowerCase();
    const notificationWindowDays = Math.min(30, Math.max(1, Number.parseInt(String(req.query?.notification_window_days || "7"), 10) || 7));

    const filter = { hospital_id: req.hospitalId };

    if (dateYmd) {
      const s = new Date(`${dateYmd}T00:00:00`);
      const e = new Date(`${dateYmd}T23:59:59.999`);
      filter.appointment_at = { $gte: s, $lte: e };
    }

    if (doctorId) {
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ success: false, message: "Invalid doctor filter." });
      }
      filter.doctor_id = doctorId;
    }

    if (status) {
      if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status filter." });
      }
      filter.status = status;
    }

    const appointments = await Appointment.find(filter, { __v: 0 })
      .populate("patient_id", "name phone email status")
      .populate("doctor_id", "name doctor_id status shift available_days department_id")
      .sort({ appointment_at: 1 });

    // Hide past pending appointments from the main appointments list unless a specific date was requested.
    // Keep them available in notifications so receptionists can follow up (call/email) if needed.
    const now = new Date();
    let visibleAppointments = appointments;
    if (String(status || "").toLowerCase() === "pending" && !dateYmd) {
      visibleAppointments = appointments.filter((a) => {
        try {
          return new Date(a.appointment_at).getTime() >= now.getTime();
        } catch (e) {
          return true;
        }
      });
    }

    // Attach is_past flag for UI clarity
    const appointmentsWithFlags = visibleAppointments.map((a) => {
      const obj = (a && a.toObject) ? a.toObject() : a;
      obj.is_past = (new Date(obj.appointment_at).getTime() < now.getTime());
      return obj;
    });

    const notificationStart = new Date();
    notificationStart.setHours(0, 0, 0, 0);
    notificationStart.setDate(notificationStart.getDate() - notificationWindowDays);
    const notificationEnd = new Date();
    notificationEnd.setHours(23, 59, 59, 999);
    notificationEnd.setDate(notificationEnd.getDate() + notificationWindowDays);

    const pendingNotificationAppointments = await Appointment.find(
      {
        hospital_id: req.hospitalId,
        status: "pending",
        appointment_at: { $gte: notificationStart, $lte: notificationEnd },
      },
      { __v: 0 }
    )
      .populate("patient_id", "name phone email status")
      .populate("doctor_id", "name doctor_id status shift available_days department_id")
      .sort({ appointment_at: 1 });

    const notifications = [];
    const seenNotificationIds = new Set();

    for (const appt of pendingNotificationAppointments) {
      const doctor = appt.doctor_id;
      const doctorUnavailable = doctor && (doctor.status === "leave" || doctor.status === "suspended");
      const dayName = appt.appointment_at
        ? new Date(appt.appointment_at).toLocaleDateString("en-US", { weekday: "long" })
        : "";
      const dayAllowed = !doctor || !Array.isArray(doctor.available_days) || doctor.available_days.length === 0
        ? true
        : doctor.available_days.some((d) => String(d || "").toLowerCase() === dayName.toLowerCase());

      notifications.push({
        _id: String(appt._id),
        appointment_id: String(appt._id),
        patient_name: appt.patient_id?.name || "Patient",
        doctor_name: doctor?.name || "Doctor",
        message: `Appointment request for Dr. ${doctor?.name || "Doctor"} is pending confirmation.`,
        reason: doctorUnavailable
          ? `Doctor is ${doctor.status}`
          : (!dayAllowed
            ? `Doctor unavailable on ${dayName}`
            : `Pending appointment request for ${new Date(appt.appointment_at).toLocaleString()}`),
        action_required: doctorUnavailable || !dayAllowed ? "reschedule" : "approve",
        appointment_status: appt.status,
        type: "new_appointment",
        created_at: appt.createdAt || appt.appointment_at || new Date(),
      });
      seenNotificationIds.add(String(appt._id));
    }

    for (const appt of appointments) {
      if (seenNotificationIds.has(String(appt._id))) continue;
      const doctor = appt.doctor_id;
      const doctorUnavailable = doctor && (doctor.status === "leave" || doctor.status === "suspended");
      const dayName = appt.appointment_at
        ? new Date(appt.appointment_at).toLocaleDateString("en-US", { weekday: "long" })
        : "";
      const dayAllowed = !doctor || !Array.isArray(doctor.available_days) || doctor.available_days.length === 0
        ? true
        : doctor.available_days.some((d) => String(d || "").toLowerCase() === dayName.toLowerCase());

      if (appt.status === "pending" && (doctorUnavailable || !dayAllowed) && new Date(appt.appointment_at) >= now) {
        notifications.push({
          _id: String(appt._id),
          appointment_id: String(appt._id),
          patient_name: appt.patient_id?.name || "Patient",
          doctor_name: doctor?.name || "Doctor",
          message: `Appointment request for Dr. ${doctor?.name || "Doctor"} is pending confirmation.`,
          reason: doctorUnavailable
            ? `Doctor is ${doctor.status}`
            : `Doctor unavailable on ${dayName}`,
          action_required: "reschedule",
          appointment_status: appt.status,
          type: "new_appointment",
          created_at: appt.createdAt || appt.appointment_at || new Date(),
        });
      }
    }

    // Fetch recently completed appointments (last 24 hours) to notify receptionist
    try {
      const completedNotificationAppointments = await Appointment.find({
        hospital_id: req.hospitalId,
        status: "completed",
        updated_at: { $gte: notificationStart, $lte: notificationEnd }
      })
        .populate("patient_id", "name phone email")
        .populate("doctor_id", "name specialization")
        .sort({ updated_at: -1 });

      for (const appt of completedNotificationAppointments) {
        notifications.push({
          _id: `completed_${appt._id}_${appt.updated_at.getTime()}`,
          appointment_id: String(appt._id),
          patient_name: appt.patient_id?.name || "Patient",
          doctor_name: appt.doctor_id?.name || "Doctor",
          message: `Patient ${appt.patient_id?.name || "Patient"} is done. Prescription issued by Dr. ${appt.doctor_id?.name || "Doctor"}.`,
          reason: "Treatment completed",
          action_required: "followup_billing",
          appointment_status: appt.status,
          type: "completed_appointment",
          created_at: appt.updated_at || new Date(),
        });
      }
    } catch (err) {
      console.error("[Receptionist] Failed to fetch completed appointments notifications:", err);
    }

    const [viewingHospital, pendingCountForHospital] = await Promise.all([
      Hospital.findById(req.hospitalId, { name: 1, city: 1 }),
      Appointment.countDocuments({ hospital_id: req.hospitalId, status: "pending" }),
    ]);

    return res.json({
      success: true,
      appointments: appointmentsWithFlags,
      notifications,
      scope: {
        hospital_id: String(req.hospitalId || ""),
        hospital_name: viewingHospital?.name || "",
        hospital_city: viewingHospital?.city || "",
        pending_count_total: Number(pendingCountForHospital || 0),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 4) Update Appointment (reschedule/cancel)
// PUT /api/receptionist/appointments/:id
router.put("/appointments/:id", async (req, res, next) => {
  try {
    const appointmentId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ success: false, message: "Invalid appointment id." });
    }

    const action = String(req.body?.action || "").trim().toLowerCase();
    const appointment = await Appointment.findOne({ _id: appointmentId, hospital_id: req.hospitalId });
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    if (action === "cancel" || String(req.body?.status || "").toLowerCase() === "cancelled") {
      appointment.status = "cancelled";
      await appointment.save();

      await Queue.updateMany(
        { hospital_id: req.hospitalId, appointment_id: appointment._id },
        { $set: { status: "cancelled" } }
      );

      return res.json({ success: true, message: "Appointment cancelled.", appointment });
    }

    if (action === "approve" || action === "confirm" || String(req.body?.status || "").toLowerCase() === "confirmed") {
      if (["cancelled", "completed"].includes(String(appointment.status || "").toLowerCase())) {
        return res.status(409).json({ success: false, message: "Only pending appointments can be confirmed." });
      }

      const doctor = await Staff.findOne(
        { _id: appointment.doctor_id, hospital_id: req.hospitalId, role: "doctor" },
        { _id: 1, status: 1, available_days: 1, max_patients_per_day: 1 }
      );
      if (!doctor) {
        return res.status(404).json({ success: false, message: "Doctor not found for this hospital." });
      }
      if (doctor.status === "leave" || doctor.status === "suspended") {
        return res.status(400).json({ success: false, message: `Doctor is not available (${doctor.status}).` });
      }

      const appointmentAt = new Date(appointment.appointment_at);
      const appointmentEnd = new Date(appointmentAt.getTime() + Number(appointment.duration_minutes || 30) * 60 * 1000);
      const dayName = appointmentAt.toLocaleDateString("en-US", { weekday: "long" });
      if (Array.isArray(doctor.available_days) && doctor.available_days.length > 0) {
        const dayAllowed = doctor.available_days.some((d) => String(d || "").toLowerCase() === dayName.toLowerCase());
        if (!dayAllowed) {
          return res.status(400).json({ success: false, message: `Doctor is not available on ${dayName}.` });
        }
      }

      const overlapping = await Appointment.findOne({
        _id: { $ne: appointment._id },
        hospital_id: req.hospitalId,
        doctor_id: appointment.doctor_id,
        status: { $in: ["pending", "confirmed"] },
        appointment_at: {
          $gte: new Date(appointmentAt.getTime() - (Number(appointment.duration_minutes || 30) - 1) * 60 * 1000),
          $lt: appointmentEnd,
        },
      }, { _id: 1 });
      if (overlapping) {
        return res.status(409).json({ success: false, message: "Appointment slot conflicts with another booking." });
      }

      const dayStart = startOfDay(appointmentAt);
      const dayEnd = endOfDay(appointmentAt);
      const bookedCount = await Appointment.countDocuments({
        _id: { $ne: appointment._id },
        hospital_id: req.hospitalId,
        doctor_id: appointment.doctor_id,
        status: { $in: ["pending", "confirmed"] },
        appointment_at: { $gte: dayStart, $lte: dayEnd },
      });

      if (Number.isFinite(Number(doctor.max_patients_per_day)) && Number(doctor.max_patients_per_day) > 0) {
        if (bookedCount >= Number(doctor.max_patients_per_day)) {
          return res.status(409).json({ success: false, message: "Doctor has reached max patient capacity for selected day." });
        }
      }

      appointment.status = "confirmed";
      await appointment.save();

      let queueItem = await Queue.findOne({ hospital_id: req.hospitalId, appointment_id: appointment._id });
      if (!queueItem) {
        const nextToken = await getNextTokenNumber(req.hospitalId, appointment.doctor_id, appointmentAt);
        queueItem = await Queue.create({
          hospital_id: req.hospitalId,
          queue_date: dayStart,
          token_number: nextToken,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          appointment_id: appointment._id,
          status: "waiting",
          created_by: req.authStaff?._id || null,
        });
      }

      return res.json({
        success: true,
        message: "Appointment confirmed.",
        appointment,
        queue: {
          token_number: queueItem.token_number,
          status: queueItem.status,
        },
      });
    }

    if (action === "reschedule") {
      const dateYmd = normalizeDateYmd(req.body?.date);
      const timeSlot = String(req.body?.time_slot || "").trim();
      const doctorId = String(req.body?.doctor_id || appointment.doctor_id || "").trim();

      if (!dateYmd || !timeSlot) {
        return res.status(400).json({ success: false, message: "date and time_slot are required for reschedule." });
      }
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ success: false, message: "Invalid doctor_id for reschedule." });
      }

      const parsedSlot = parseTimeSlot(dateYmd, timeSlot);
      if (!parsedSlot) {
        return res.status(400).json({ success: false, message: "Invalid time_slot format." });
      }

      // Validate appointment is not in the past
      const newAppointmentAt = parsedSlot.appointmentAt;
      const now = new Date();
      const minBookingTime = new Date(now.getTime() + 5 * 60 * 1000);
      
      if (newAppointmentAt.getTime() < minBookingTime.getTime()) {
        const todayStart = startOfDay(now);
        const selectedDate = startOfDay(newAppointmentAt);
        
        if (selectedDate.getTime() === todayStart.getTime()) {
          return res.status(400).json({ 
            success: false, 
            message: "Cannot reschedule to today. Please select a future date." 
          });
        } else if (newAppointmentAt.getTime() < now.getTime()) {
          return res.status(400).json({ 
            success: false, 
            message: "Cannot reschedule to a past date/time. Selected date/time has already passed." 
          });
        }
      }

      const doctor = await Staff.findOne({ _id: doctorId, hospital_id: req.hospitalId, role: "doctor" }, { _id: 1, status: 1, available_days: 1 });
      if (!doctor) {
        return res.status(404).json({ success: false, message: "Doctor not found for this hospital." });
      }
      if (doctor.status === "leave" || doctor.status === "suspended") {
        return res.status(400).json({ success: false, message: `Doctor is not available (${doctor.status}). Choose another doctor.` });
      }

      const dayName = parsedSlot.appointmentAt.toLocaleDateString("en-US", { weekday: "long" });
      if (Array.isArray(doctor.available_days) && doctor.available_days.length > 0) {
        const dayAllowed = doctor.available_days.some((d) => String(d || "").toLowerCase() === dayName.toLowerCase());
        if (!dayAllowed) {
          return res.status(400).json({ success: false, message: `Doctor is not available on ${dayName}.` });
        }
      }

      appointment.doctor_id = doctor._id;
      appointment.appointment_at = parsedSlot.appointmentAt;
      appointment.duration_minutes = parsedSlot.durationMinutes;
      appointment.status = "pending";
      if (req.body?.reason !== undefined) appointment.reason = String(req.body.reason || "").trim();
      if (req.body?.notes !== undefined) appointment.notes = String(req.body.notes || "").trim();
      await appointment.save();

      await Queue.deleteMany({ hospital_id: req.hospitalId, appointment_id: appointment._id });
      const nextToken = await getNextTokenNumber(req.hospitalId, doctor._id, appointment.appointment_at);
      const queueItem = await Queue.create({
        hospital_id: req.hospitalId,
        queue_date: startOfDay(appointment.appointment_at),
        token_number: nextToken,
        patient_id: appointment.patient_id,
        doctor_id: doctor._id,
        appointment_id: appointment._id,
        status: "waiting",
        created_by: req.authStaff?._id || null,
      });

      return res.json({
        success: true,
        message: "Appointment rescheduled successfully.",
        appointment,
        queue: {
          token_number: queueItem.token_number,
          status: queueItem.status,
        },
      });
    }

    return res.status(400).json({ success: false, message: "Unsupported update action. Use action=approve, action=reschedule, or action=cancel." });
  } catch (error) {
    return next(error);
  }
});

// 5) Token / Queue System
// GET /api/receptionist/queue
router.get("/queue", async (req, res, next) => {
  try {
    const dateYmd = normalizeDateYmd(req.query?.date || new Date().toISOString().slice(0, 10));
    const doctorId = String(req.query?.doctor_id || "").trim();

    const dayStart = new Date(`${dateYmd}T00:00:00`);
    const dayEnd = new Date(`${dateYmd}T23:59:59.999`);

    const filter = {
      hospital_id: req.hospitalId,
      queue_date: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ["waiting", "in_progress"] },
    };

    if (doctorId) {
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ success: false, message: "Invalid doctor_id filter." });
      }
      filter.doctor_id = doctorId;
    }

    // Reconcile stale queue items with appointment status before returning queue board.
    const staleQueueRows = await Queue.find(filter, { _id: 1, appointment_id: 1, status: 1 });
    const staleAppointmentIds = staleQueueRows
      .map((row) => row.appointment_id)
      .filter((id) => Boolean(id));

    if (staleAppointmentIds.length > 0) {
      const linkedAppointments = await Appointment.find(
        { _id: { $in: staleAppointmentIds }, hospital_id: req.hospitalId },
        { _id: 1, status: 1 }
      );

      const appointmentStatusById = new Map(
        linkedAppointments.map((appt) => [String(appt._id), String(appt.status || "").toLowerCase()])
      );

      const queueIdsToServe = [];
      const queueIdsToCancel = [];

      staleQueueRows.forEach((row) => {
        const appointmentId = row.appointment_id ? String(row.appointment_id) : "";
        const apptStatus = appointmentStatusById.get(appointmentId);
        if (apptStatus === "completed") queueIdsToServe.push(row._id);
        if (apptStatus === "cancelled") queueIdsToCancel.push(row._id);
      });

      if (queueIdsToServe.length > 0) {
        await Queue.updateMany({ _id: { $in: queueIdsToServe } }, { $set: { status: "served" } });
      }
      if (queueIdsToCancel.length > 0) {
        await Queue.updateMany({ _id: { $in: queueIdsToCancel } }, { $set: { status: "cancelled" } });
      }
    }

    const queueRows = await Queue.find(filter, { __v: 0 })
      .populate("patient_id", "name phone")
      .populate("doctor_id", "name doctor_id department_id")
      .sort({ token_number: 1, created_at: 1 });

    const waiting = queueRows.filter((q) => q.status === "waiting");

    return res.json({
      success: true,
      queue_date: dateYmd,
      summary: {
        total: queueRows.length,
        waiting: waiting.length,
        in_progress: queueRows.filter((q) => q.status === "in_progress").length,
      },
      waiting_patients: queueRows.map((q) => ({
        queue_id: String(q._id),
        token_number: q.token_number,
        status: q.status,
        patient: q.patient_id,
        doctor: q.doctor_id,
        appointment_id: q.appointment_id ? String(q.appointment_id) : null,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/receptionist/queue/:id
// Receptionist is allowed to cancel queue items only.
router.put("/queue/:id", async (req, res, next) => {
  try {
    const queueId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(queueId)) {
      return res.status(400).json({ success: false, message: "Invalid queue id." });
    }

    const nextStatus = String(req.body?.status || "").trim().toLowerCase();
    if (nextStatus !== "cancelled") {
      return res.status(403).json({
        success: false,
        message: "Receptionist can only cancel queue items. Start/serve actions are handled by doctor workflow.",
      });
    }

    const queueRow = await Queue.findOne({ _id: queueId, hospital_id: req.hospitalId });
    if (!queueRow) {
      return res.status(404).json({ success: false, message: "Queue item not found." });
    }

    queueRow.status = nextStatus;
    await queueRow.save();

    if (queueRow.appointment_id && ["cancelled", "served"].includes(nextStatus)) {
      const appointmentStatus = nextStatus === "cancelled" ? "cancelled" : "completed";
      await Appointment.updateOne(
        { _id: queueRow.appointment_id, hospital_id: req.hospitalId },
        { $set: { status: appointmentStatus } }
      );
    }

    return res.json({
      success: true,
      message: "Queue status updated.",
      queue: queueRow,
    });
  } catch (error) {
    return next(error);
  }
});

async function checkResourceAvailability(hospitalId, departmentId) {
  if (!departmentId) return true;
  try {
    const resources = await Resource.find({ hospital_id: hospitalId, department_id: departmentId });
    if (resources.length === 0) return true; // No resources mapped to this department, so none are depleted
    
    // Check if the total available quantity of all resources in this department is 0
    const totalAvailable = resources.reduce((sum, r) => sum + (r.available_quantity || 0), 0);
    if (totalAvailable <= 0) {
      return false;
    }
    
    // Check if any critical "bed" resource exists and is depleted
    const beds = resources.find(r => (r.name || "").toLowerCase().includes("bed"));
    if (beds && (beds.available_quantity || 0) <= 0) {
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("[ResourceAvailability] Error checking resource availability:", err);
    return true; // Fallback to true in case of database errors
  }
}

// 6) Doctor Availability
// GET /api/receptionist/doctors/availability
router.get("/doctors/availability", async (req, res, next) => {
  try {
    const dateYmd = normalizeDateYmd(req.query?.date || new Date().toISOString().slice(0, 10));
    const departmentId = String(req.query?.department_id || "").trim();

    const dayStart = new Date(`${dateYmd}T00:00:00`);
    const dayEnd = new Date(`${dateYmd}T23:59:59.999`);
    const dayName = dayStart.toLocaleDateString("en-US", { weekday: "long" });

    const doctorFilter = {
      hospital_id: req.hospitalId,
      role: "doctor",
      status: "active",
    };

    if (departmentId) {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({ success: false, message: "Invalid department_id filter." });
      }
      doctorFilter.department_id = departmentId;
    }

    const doctors = await Staff.find(doctorFilter, {
      name: 1,
      doctor_id: 1,
      department_id: 1,
      shift: 1,
      available_days: 1,
      max_patients_per_day: 1,
      status: 1,
    }).populate("department_id", "name");

    const doctorIds = doctors.map((d) => d._id);
    const appointments = await Appointment.find(
      {
        hospital_id: req.hospitalId,
        doctor_id: { $in: doctorIds },
        status: { $in: ["pending", "confirmed"] },
        appointment_at: { $gte: dayStart, $lte: dayEnd },
      },
      { doctor_id: 1, appointment_at: 1, duration_minutes: 1 }
    ).sort({ appointment_at: 1 });

    const grouped = new Map();
    for (const appt of appointments) {
      const key = String(appt.doctor_id);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(appt);
    }

    // Pre-calculate resource availability for unique departments of these doctors
    const deptIds = [...new Set(doctors.map(d => String(d.department_id?._id || d.department_id || "")).filter(Boolean))];
    const deptResourceAvailabilityMap = new Map();
    for (const deptId of deptIds) {
      const hasResources = await checkResourceAvailability(req.hospitalId, deptId);
      deptResourceAvailabilityMap.set(deptId, hasResources);
    }

    const availability = doctors.map((doctor) => {
      const doctorKey = String(doctor._id);
      const doctorAppointments = grouped.get(doctorKey) || [];
      const slots = buildSlotLabels(doctor.shift || "morning", 30);
      const taken = new Set(
        doctorAppointments.map((appt) => {
          const start = new Date(appt.appointment_at);
          const end = new Date(start.getTime() + Number(appt.duration_minutes || 30) * 60 * 1000);
          return `${toHourMinuteLabel(start.getHours(), start.getMinutes())} - ${toHourMinuteLabel(end.getHours(), end.getMinutes())}`;
        })
      );
      const freeSlots = slots.filter((s) => !taken.has(s) && !isSlotInPast(dateYmd, s));

      const dayAllowed = !Array.isArray(doctor.available_days) || doctor.available_days.length === 0
        ? true
        : doctor.available_days.some((d) => String(d || "").toLowerCase() === dayName.toLowerCase());

      const maxPerDay = Number(doctor.max_patients_per_day || 0);
      const atCapacity = maxPerDay > 0 && doctorAppointments.length >= maxPerDay;

      const doctorDeptId = String(doctor.department_id?._id || doctor.department_id || "");
      const resourcesAvailable = doctorDeptId ? (deptResourceAvailabilityMap.get(doctorDeptId) !== false) : true;

      const available = dayAllowed && !atCapacity && freeSlots.length > 0 && resourcesAvailable;

      return {
        doctor_id: String(doctor._id),
        doctor_code: doctor.doctor_id || null,
        doctor_name: doctor.name,
        department: doctor.department_id?.name || "Unassigned",
        shift: doctor.shift || "morning",
        date: dateYmd,
        available,
        reason_unavailable: !dayAllowed
          ? `Doctor not available on ${dayName}`
          : (atCapacity ? "Doctor reached daily capacity" : (!resourcesAvailable ? "Department has no available resources (e.g., out of stock of beds/equipment)" : (freeSlots.length === 0 ? "No slots available" : ""))),
        booked_count: doctorAppointments.length,
        max_patients_per_day: maxPerDay || null,
        available_slots: available ? freeSlots : [],
      };
    });

    const availableDoctorsOnly = availability.filter((d) => d.available);

    return res.json({
      success: true,
      date: dateYmd,
      doctors: availableDoctorsOnly,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
