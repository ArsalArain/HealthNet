const express = require("express");
const mongoose = require("mongoose");

const Patient = require("../models/Patient");
const Diagnosis = require("../models/Diagnosis");
const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const Queue = require("../models/Queue");
const Staff = require("../models/Staff");
const DoctorScheduleChangeRequest = require("../models/DoctorScheduleChangeRequest");
const Resource = require("../models/Resource");
const ResourceValidation = require("../models/ResourceValidation");
const Department = require("../models/Department");
const { extractResourcesFromPrescription } = require("../utils/prescriptionMatcher");
const { authenticateStaff, authorizeRoles } = require("../middleware/staffAuth");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const csvPath = path.join(__dirname, "..", "department_resources.csv");

const readCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      console.warn(`[DepartmentResources] CSV file not found at ${filePath}`);
      return resolve([]);
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
};

const writeCsv = (filePath, rows) => {
  const columns = ["Department", "Resource Name", "Category", "Min Quantity", "Max Quantity", "Current Quantity", "Status"];
  const escapeCell = (value) => {
    const raw = value === undefined || value === null ? "" : String(value).trim();
    if (/[,"]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const header = columns.join(",");
  const lines = rows.map((row) => {
    const dept = row.Department || row.department || "";
    const name = row["Resource Name"] || row.resource_name || row.name || "";
    const cat = row.Category || row.category || "";
    const min = row["Min Quantity"] || row.min_quantity || 0;
    const max = row["Max Quantity"] || row.max_quantity || 0;
    const qty = row["Current Quantity"] || row.current_quantity || row.available_quantity || 0;
    const status = row.Status || row.status || "Medium";
    
    return [dept, name, cat, min, max, qty, status].map(escapeCell).join(",");
  });

  fs.writeFileSync(filePath, [header, ...lines].join("\n"), "utf8");
};

const router = express.Router();

router.use(authenticateStaff, authorizeRoles("doctor"));

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

function getWeekRange(anchorDate = new Date()) {
  const start = startOfDay(anchorDate);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function parseMedicines(rawMedicines) {
  if (Array.isArray(rawMedicines)) {
    return rawMedicines.map((item) => String(item || "").trim()).filter(Boolean);
  }
  return String(rawMedicines || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toHourMinuteLabel(hour, minute) {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const period = normalizedHour >= 12 ? "PM" : "AM";
  const hour12 = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
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

function isSlotInPast(dateObj, timeSlot) {
  try {
    const dateYmd = (new Date(dateObj)).toISOString().slice(0, 10);
    const slot = String(timeSlot || "").trim();
    const split = slot.split("-").map((s) => s.trim()).filter(Boolean);
    const startMinute = parseTimeLabelToMinute(split[0]);
    if (!Number.isFinite(startMinute)) return false;
    const hh = Math.floor(startMinute / 60) % 24;
    const mm = startMinute % 60;
    const dateTime = new Date(`${dateYmd}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`);
    const now = new Date();
    return dateTime.getTime() < now.getTime();
  } catch (e) {
    return false;
  }
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

function slotLabelFromAppointment(date, durationMinutes) {
  const start = new Date(date);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return `${toHourMinuteLabel(start.getHours(), start.getMinutes())} - ${toHourMinuteLabel(end.getHours(), end.getMinutes())}`;
}

async function ensureAssignedPatient(patientId, hospitalId, doctorId) {
  const appointment = await Appointment.findOne({
    hospital_id: hospitalId,
    doctor_id: doctorId,
    patient_id: patientId,
  });
  if (!appointment) return null;

  return Patient.findOne({
    _id: patientId,
    hospital_id: hospitalId,
  });
}


async function createPrescription(req, res, next) {
  try {
    const patientId = String(req.body?.patient_id || "").trim();
    const medicines = parseMedicines(req.body?.medicines);
    const instructions = String(req.body?.instructions || "").trim();
    const dosage = String(req.body?.dosage || "").trim();
    const appointmentId = String(req.body?.appointment_id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Invalid patient_id." });
    }
    if (medicines.length === 0) {
      return res.status(400).json({ success: false, message: "medicines is required." });
    }

    const patient = await ensureAssignedPatient(patientId, req.hospitalId, req.authStaff._id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found or not assigned to this doctor." });
    }

    let linkedAppointment = null;
    if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
      linkedAppointment = await Appointment.findOne({
        _id: appointmentId,
        hospital_id: req.hospitalId,
        doctor_id: req.authStaff._id,
        patient_id: patient._id,
      });
    } else {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      linkedAppointment = await Appointment.findOne({
        hospital_id: req.hospitalId,
        doctor_id: req.authStaff._id,
        patient_id: patient._id,
        status: { $in: ["pending", "confirmed"] },
        appointment_at: { $gte: todayStart, $lte: todayEnd },
      });
    }

    const record = await Prescription.create({
      patient_id: patient._id,
      doctor_id: req.authStaff._id,
      hospital_id: req.hospitalId,
      appointment_id: linkedAppointment ? linkedAppointment._id : null,
      medicines,
      dosage,
      instructions,
    });

    if (linkedAppointment) {
      linkedAppointment.status = "completed";
      await linkedAppointment.save();
      // Update queue to served
      try {
        await Queue.updateMany(
          { appointment_id: linkedAppointment._id },
          { status: "served", updated_at: new Date() }
        );
      } catch (err) {
        console.error("[DoctorDashboard] Failed to update Queue on complete:", err);
      }
    }

    // Extract resources, directly deduct quantities in DB and CSV, and log validation
    try {
      if (req.authStaff.department_id) {
        const dbResources = await Resource.find({
          hospital_id: req.hospitalId,
          department_id: req.authStaff.department_id,
        });

        const matchedResources = extractResourcesFromPrescription(medicines, instructions, dbResources);

        if (matchedResources.length > 0) {
          // Fetch department name for CSV matching
          const departmentDoc = await Department.findById(req.authStaff.department_id);
          const deptName = departmentDoc ? departmentDoc.name : "";

          // Load CSV rows
          const csvRows = await readCsv(csvPath);

          // Loop and deduct
          for (const item of matchedResources) {
            const dbRes = await Resource.findById(item.resource_id);
            if (dbRes) {
              const newQty = Math.max(0, (dbRes.available_quantity || 0) - (item.quantity_requested || 1));
              dbRes.available_quantity = newQty;

              // Recalculate status
              let newStatus = "Medium";
              if (newQty <= 0) {
                newStatus = "Out of stock";
              } else if (newQty <= (dbRes.min_quantity || 0)) {
                newStatus = "Low";
              } else if (newQty >= (dbRes.max_quantity || 0) * 0.8) {
                newStatus = "Very High";
              } else if (newQty >= (dbRes.max_quantity || 0) * 0.5) {
                newStatus = "High";
              }
              dbRes.status = newStatus;
              await dbRes.save();

              // Update CSV rows
              const csvRow = csvRows.find(
                (row) =>
                  (row.Department || "").trim().toLowerCase() === deptName.trim().toLowerCase() &&
                  (row["Resource Name"] || "").trim().toLowerCase() === dbRes.name.trim().toLowerCase()
              );

              if (csvRow) {
                csvRow["Current Quantity"] = newQty;
                csvRow["Status"] = newStatus;
              }
            }
          }

          // Save CSV
          writeCsv(csvPath, csvRows);

          // Create approved validation record for audit trail
          await ResourceValidation.create({
            prescription_id: record._id,
            hospital_id: req.hospitalId,
            department_id: req.authStaff.department_id,
            doctor_id: req.authStaff._id,
            patient_id: patient._id,
            resources: matchedResources,
            status: "approved",
          });
        }
      }
    } catch (extractError) {
      console.error("[DoctorDashboard] Failed to extract/deduct resources for prescription:", extractError);
    }

    return res.status(201).json({ success: true, message: "Prescription added.", prescription: record });
  } catch (error) {
    return next(error);
  }
}

// 1) Get doctor profile
router.get("/profile", async (req, res, next) => {
  try {
    const [profile, totalPatients, completedCases, todayAppointments, pendingAppointments] = await Promise.all([
      Staff.findById(req.authStaff._id, { password: 0, __v: 0 })
        .populate("department_id", "name status")
        .populate("hospital_id", "name city"),
      Appointment.distinct("patient_id", {
        hospital_id: req.hospitalId,
        doctor_id: req.authStaff._id,
      }).then((ids) => ids.length),
      Appointment.countDocuments({ hospital_id: req.hospitalId, doctor_id: req.authStaff._id, status: "completed" }),
      Appointment.countDocuments({
        hospital_id: req.hospitalId,
        doctor_id: req.authStaff._id,
        appointment_at: { $gte: startOfDay(), $lte: endOfDay() },
      }),
      Appointment.countDocuments({ hospital_id: req.hospitalId, doctor_id: req.authStaff._id, status: "pending" }),
    ]);

    if (!profile) {
      return res.status(404).json({ success: false, message: "Doctor profile not found." });
    }

    return res.json({
      success: true,
      profile,
      summary: {
        total_patients: totalPatients,
        completed_cases: completedCases,
        today_appointments: todayAppointments,
        pending_appointments: pendingAppointments,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 2) View assigned patients (with search + history support)
router.get("/patients", async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query?.limit, 10) || 20));
    const includeHistory = String(req.query?.include_history || "true").toLowerCase() !== "false";
    const queryText = String(req.query?.q || "").trim();

    const appointments = await Appointment.find({
      hospital_id: req.hospitalId,
      doctor_id: req.authStaff._id,
      status: { $in: ["pending", "confirmed"] },
    }).select("patient_id").lean();
    const appointedPatientIds = [...new Set(appointments.map((a) => String(a.patient_id)))];

    const filter = {
      hospital_id: req.hospitalId,
      _id: { $in: appointedPatientIds },
    };

    if (queryText) {
      const searchRegex = new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { medical_history: searchRegex },
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(filter, { __v: 0 })
        .populate("department_id", "name status")
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Patient.countDocuments(filter),
    ]);

    if (!includeHistory || patients.length === 0) {
      return res.json({ success: true, patients, pagination: { page, limit, total } });
    }

    const patientIds = patients.map((item) => item._id);

    const [diagnoses, prescriptions, recentAppointments] = await Promise.all([
      Diagnosis.find({ hospital_id: req.hospitalId, patient_id: { $in: patientIds } }).sort({ created_at: -1 }).limit(500),
      Prescription.find({ hospital_id: req.hospitalId, patient_id: { $in: patientIds } }).sort({ created_at: -1 }).limit(500),
      Appointment.find({ hospital_id: req.hospitalId, patient_id: { $in: patientIds }, doctor_id: req.authStaff._id })
        .sort({ appointment_at: -1 })
        .limit(500),
    ]);

    const diagnosisByPatient = new Map();
    diagnoses.forEach((item) => {
      const key = String(item.patient_id);
      if (!diagnosisByPatient.has(key)) diagnosisByPatient.set(key, []);
      diagnosisByPatient.get(key).push(item);
    });

    const prescriptionByPatient = new Map();
    prescriptions.forEach((item) => {
      const key = String(item.patient_id);
      if (!prescriptionByPatient.has(key)) prescriptionByPatient.set(key, []);
      prescriptionByPatient.get(key).push(item);
    });

    const appointmentsByPatient = new Map();
    recentAppointments.forEach((item) => {
      const key = String(item.patient_id);
      if (!appointmentsByPatient.has(key)) appointmentsByPatient.set(key, []);
      appointmentsByPatient.get(key).push(item);
    });

    const patientsWithHistory = patients.map((patientDoc) => {
      const key = String(patientDoc._id);
      const patientDiagnoses = diagnosisByPatient.get(key) || [];
      const patientPrescriptions = prescriptionByPatient.get(key) || [];
      const patientAppointments = appointmentsByPatient.get(key) || [];

      return {
        ...patientDoc.toObject(),
        history: {
          diagnoses: patientDiagnoses,
          prescriptions: patientPrescriptions,
          appointments: patientAppointments,
          total_diagnoses: patientDiagnoses.length,
          total_prescriptions: patientPrescriptions.length,
          total_appointments: patientAppointments.length,
        },
      };
    });

    return res.json({
      success: true,
      patients: patientsWithHistory,
      pagination: { page, limit, total },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/patients/:id/history", async (req, res, next) => {
  try {
    const patientId = String(req.params?.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Invalid patient id." });
    }

    const patient = await ensureAssignedPatient(patientId, req.hospitalId, req.authStaff._id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found or not assigned to this doctor." });
    }

    const [diagnoses, prescriptions, appointments] = await Promise.all([
      Diagnosis.find({ hospital_id: req.hospitalId, patient_id: patient._id }).sort({ created_at: -1 }),
      Prescription.find({ hospital_id: req.hospitalId, patient_id: patient._id }).sort({ created_at: -1 }),
      Appointment.find({ hospital_id: req.hospitalId, patient_id: patient._id, doctor_id: req.authStaff._id }).sort({ appointment_at: -1 }),
    ]);

    return res.json({
      success: true,
      patient,
      history: {
        diagnoses,
        prescriptions,
        appointments,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 3) View appointments (today/weekly/status)
router.get("/appointments", async (req, res, next) => {
  try {
    const period = String(req.query?.period || req.query?.filter || "").trim().toLowerCase();
    const status = String(req.query?.status || "").trim().toLowerCase();
    const anchor = req.query?.date ? new Date(req.query.date) : new Date();

    const filter = {
      hospital_id: req.hospitalId,
      doctor_id: req.authStaff._id,
    };

    if (["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      filter.status = status;
    }

    if (period === "today") {
      filter.appointment_at = { $gte: startOfDay(anchor), $lte: endOfDay(anchor) };
    } else if (period === "weekly") {
      const { start, end } = getWeekRange(anchor);
      filter.appointment_at = { $gte: start, $lte: end };
    }

    const appointments = await Appointment.find(filter, { __v: 0 })
      .populate("patient_id", "name email phone status medical_history")
      .sort({ appointment_at: 1 });

    const currentWeek = getWeekRange();
    const [todayCount, weeklyCount] = await Promise.all([
      Appointment.countDocuments({
        hospital_id: req.hospitalId,
        doctor_id: req.authStaff._id,
        appointment_at: { $gte: startOfDay(), $lte: endOfDay() },
      }),
      Appointment.countDocuments({
        hospital_id: req.hospitalId,
        doctor_id: req.authStaff._id,
        appointment_at: { $gte: currentWeek.start, $lte: currentWeek.end },
      }),
    ]);

    return res.json({
      success: true,
      appointments,
      summary: {
        today: todayCount,
        weekly: weeklyCount,
        pending: appointments.filter((item) => item.status === "pending").length,
        completed: appointments.filter((item) => item.status === "completed").length,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// 4) Update appointment status
router.put("/appointments/:id", async (req, res, next) => {
  try {
    const appointmentId = String(req.params?.id || "").trim();
    const nextStatus = String(req.body?.status || "").trim().toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ success: false, message: "Invalid appointment id." });
    }
    if (!["pending", "confirmed", "completed", "cancelled"].includes(nextStatus)) {
      return res.status(400).json({ success: false, message: "status must be pending, confirmed, completed, or cancelled." });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      hospital_id: req.hospitalId,
      doctor_id: req.authStaff._id,
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    appointment.status = nextStatus;
    if (req.body?.notes !== undefined) {
      appointment.notes = String(req.body.notes || "").trim();
    }

    await appointment.save();

    let queueStatus = "";
    if (nextStatus === "completed") queueStatus = "served";
    if (nextStatus === "cancelled") queueStatus = "cancelled";
    if (nextStatus === "pending") queueStatus = "waiting";

    if (queueStatus) {
      await Queue.updateMany(
        {
          hospital_id: req.hospitalId,
          appointment_id: appointment._id,
        },
        {
          $set: {
            status: queueStatus,
          },
        }
      );
    }

    return res.json({ success: true, message: "Appointment status updated.", appointment });
  } catch (error) {
    return next(error);
  }
});

// 5) Add diagnosis
router.post("/diagnosis", async (req, res, next) => {
  try {
    const patientId = String(req.body?.patient_id || "").trim();
    const diagnosisText = String(req.body?.diagnosis || "").trim();
    const notes = String(req.body?.notes || "").trim();

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Invalid patient_id." });
    }
    if (!diagnosisText) {
      return res.status(400).json({ success: false, message: "diagnosis is required." });
    }

    const patient = await ensureAssignedPatient(patientId, req.hospitalId, req.authStaff._id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found or not assigned to this doctor." });
    }

    const record = await Diagnosis.create({
      patient_id: patient._id,
      doctor_id: req.authStaff._id,
      hospital_id: req.hospitalId,
      diagnosis: diagnosisText,
      notes,
    });

    return res.status(201).json({ success: true, message: "Diagnosis added.", diagnosis: record });
  } catch (error) {
    return next(error);
  }
});

router.put("/diagnosis/:id/notes", async (req, res, next) => {
  try {
    const diagnosisId = String(req.params?.id || "").trim();
    const notes = String(req.body?.notes || "").trim();

    if (!mongoose.Types.ObjectId.isValid(diagnosisId)) {
      return res.status(400).json({ success: false, message: "Invalid diagnosis id." });
    }

    const diagnosis = await Diagnosis.findOne({
      _id: diagnosisId,
      hospital_id: req.hospitalId,
      doctor_id: req.authStaff._id,
    });
    if (!diagnosis) {
      return res.status(404).json({ success: false, message: "Diagnosis record not found." });
    }

    diagnosis.notes = notes;
    await diagnosis.save();

    return res.json({ success: true, message: "Treatment notes updated.", diagnosis });
  } catch (error) {
    return next(error);
  }
});

// 6) Add prescription
router.post("/prescription", createPrescription);
router.post("/prescriptions", createPrescription);

// 7) View schedule & availability
router.get("/schedule", async (req, res, next) => {
  try {
    const date = req.query?.date ? new Date(req.query.date) : new Date();
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid date value." });
    }

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const shift = String(req.authStaff.shift || "").toLowerCase() || "morning";
    const availableDays = Array.isArray(req.authStaff.available_days)
      ? req.authStaff.available_days.map((d) => String(d || "").trim().toLowerCase()).filter(Boolean)
      : [];

    const slotMinutes = 30;
    const allSlots = buildSlotLabels(shift, slotMinutes);

    const scheduleRange = getShiftDateRangeForSchedule(date, shift);

    const appointments = await Appointment.find({
      hospital_id: req.hospitalId,
      doctor_id: req.authStaff._id,
      appointment_at: { $gte: scheduleRange.start, $lte: scheduleRange.end },
      status: { $ne: "cancelled" },
    }).sort({ appointment_at: 1 });

    const bookedSlots = appointments.map((item) =>
      slotLabelFromAppointment(item.appointment_at, Number(item.duration_minutes) || slotMinutes)
    );

    const freeSlots = allSlots.filter((slot) => !bookedSlots.includes(slot) && !isSlotInPast(date, slot));
    const isAvailableDay = availableDays.length === 0 || availableDays.includes(dayName);
    const isOnLeave = req.authStaff.status === "leave";
    const isWorkingToday = !isOnLeave && isAvailableDay;

    let unavailableReason = "";
    if (isOnLeave) {
      unavailableReason = "Doctor status is set to leave.";
    } else if (!isAvailableDay) {
      unavailableReason = `Today (${dayName}) is outside assigned available days.`;
    }

    return res.json({
      success: true,
      schedule: {
        date: startOfDay(date),
        day_name: dayName,
        shift,
        shift_label: shiftWindow(shift).label,
        available_days: req.authStaff.available_days || [],
        is_leave: !isWorkingToday,
        is_working_today: isWorkingToday,
        unavailable_reason: unavailableReason,
        status: req.authStaff.status,
        time_slots: allSlots,
        booked_slots: bookedSlots,
        free_slots: isWorkingToday ? freeSlots : [],
      },
    });
  } catch (error) {
    return next(error);
  }
});

async function submitScheduleChangeRequest(req, res, next) {
  try {
    const availableDays = Array.isArray(req.body?.available_days)
      ? req.body.available_days.map((d) => String(d || "").trim()).filter(Boolean)
      : null;
    const status = req.body?.status !== undefined ? String(req.body.status || "").trim().toLowerCase() : null;
    const shift = req.body?.shift !== undefined ? String(req.body.shift || "").trim().toLowerCase() : null;
    const reason = String(req.body?.reason || "").trim();

    if (!availableDays && !status && !shift) {
      return res.status(400).json({ success: false, message: "Provide available_days, status, or shift for the request." });
    }
    if (status && !["active", "leave", "suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be active, leave, or suspended." });
    }
    if (shift && !["morning", "evening", "night", "flex"].includes(shift)) {
      return res.status(400).json({ success: false, message: "Invalid shift value." });
    }

    const doctor = await Staff.findOne({ _id: req.authStaff._id, hospital_id: req.hospitalId });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor account not found." });
    }

    const pendingRequest = await DoctorScheduleChangeRequest.findOne({
      hospital_id: req.hospitalId,
      doctor_id: doctor._id,
      status: "pending",
    });
    if (pendingRequest) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending schedule change request.",
        request_id: String(pendingRequest._id),
      });
    }

    const changeRequest = await DoctorScheduleChangeRequest.create({
      hospital_id: req.hospitalId,
      doctor_id: doctor._id,
      current_shift: doctor.shift || "",
      current_status: doctor.status || "",
      current_available_days: Array.isArray(doctor.available_days) ? doctor.available_days : [],
      requested_shift: shift || doctor.shift || "",
      requested_status: status || doctor.status || "",
      requested_available_days: availableDays || (Array.isArray(doctor.available_days) ? doctor.available_days : []),
      reason,
      status: "pending",
    });

    return res.json({
      success: true,
      message: "Schedule change request submitted for hospital admin approval.",
      request: changeRequest,
    });
  } catch (error) {
    return next(error);
  }
}

// Legacy compatibility: this endpoint previously updated availability directly.
// It now creates a request for admin approval to preserve the no-direct-change rule.
router.put("/schedule/availability", submitScheduleChangeRequest);

router.post("/schedule/change-request", submitScheduleChangeRequest);

router.get("/schedule/change-requests", async (req, res, next) => {
  try {
    const requests = await DoctorScheduleChangeRequest.find({
      hospital_id: req.hospitalId,
      doctor_id: req.authStaff._id,
    })
      .sort({ created_at: -1 })
      .limit(30);

    return res.json({ success: true, requests });
  } catch (error) {
    return next(error);
  }
});

// Optional notifications endpoint
router.get("/notifications", async (req, res, next) => {
  try {
    const todayStart = startOfDay();
    const todayEnd = endOfDay();

    const [newAppointments, pendingAppointments] = await Promise.all([
      Appointment.find({
        hospital_id: req.hospitalId,
        doctor_id: req.authStaff._id,
        created_at: { $gte: todayStart, $lte: todayEnd },
      })
        .populate("patient_id", "name")
        .sort({ created_at: -1 })
        .limit(15),
      Appointment.find({
        hospital_id: req.hospitalId,
        doctor_id: req.authStaff._id,
        appointment_at: { $gte: todayStart, $lte: todayEnd },
        status: "pending",
      })
        .populate("patient_id", "name")
        .sort({ appointment_at: 1 })
        .limit(15),
    ]);

    const notifications = [
      ...newAppointments.map((appt) => ({
        type: "new_appointment",
        appointment_id: appt._id,
        patient_name: appt.patient_id?.name || "Unknown patient",
        message: `New appointment created for ${appt.patient_id?.name || "a patient"}.`,
        created_at: appt.created_at,
      })),
      ...pendingAppointments.map((appt) => ({
        type: "patient_update",
        appointment_id: appt._id,
        patient_name: appt.patient_id?.name || "Unknown patient",
        message: `${appt.patient_id?.name || "Patient"} has a pending appointment today.`,
        created_at: appt.appointment_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20);

    return res.json({
      success: true,
      notifications,
      counts: {
        new_appointments: newAppointments.length,
        pending_today: pendingAppointments.length,
        emergency_alerts: 0,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
