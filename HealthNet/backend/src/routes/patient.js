const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const { parse: parseCsv } = require("csv-parse/sync");

const User = require("../models/User");
const Hospital = require("../models/Hospital");
const Department = require("../models/Department");
const Staff = require("../models/Staff");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Resource = require("../models/Resource");
const Prescription = require("../models/Prescription");
const { authenticateJWT, authorizeRoles } = require("../middleware/auth");
const { normalizeEmail, isValidEmail } = require("../utils/validators");
const { getDepartmentForDisease } = require("../diseaseDepartmentMap");

const router = express.Router();
const requirePatient = [authenticateJWT, authorizeRoles("patient")];


const BACKEND_ROOT_DIR = path.resolve(__dirname, "..", "..");
const STORAGE_ROOT_DIR = path.join(BACKEND_ROOT_DIR, "storage");

function ensureDirectorySync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toCsv(rows, columns) {
  const escapeCell = (value) => {
    const raw = value === undefined || value === null ? "" : String(value);
    if (/[,"]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const header = columns.map((c) => escapeCell(c)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCell(row[c])).join(","));
  return [header, ...lines].join("\n");
}

function readCsvRows(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  if (!raw.trim()) return [];
  const rows = parseCsv(raw, { columns: true, skip_empty_lines: true, trim: true });
  return Array.isArray(rows) ? rows : [];
}

function getPatientAccountsDataPaths() {
  const dir = path.join(STORAGE_ROOT_DIR, "patient_records", "system");
  return {
    dir,
    csv: path.join(dir, "patient_accounts.csv"),
    ndjson: path.join(dir, "patient_accounts.ndjson"),
  };
}

function normalizeGender(value) {
  const v = String(value || "").trim().toLowerCase();
  if (["male", "m"].includes(v)) return "male";
  if (["female", "f"].includes(v)) return "female";
  if (["other", "o"].includes(v)) return "other";
  return "";
}

function syncPatientAccountDataFile(user) {
  if (!user || String(user.role || "") !== "patient") return;

  const paths = getPatientAccountsDataPaths();
  ensureDirectorySync(paths.dir);

  const columns = [
    "user_id",
    "username",
    "email",
    "phone",
    "city",
    "address",
    "age",
    "gender",
    "auth_provider",
    "status",
    "is_verified",
    "created_at",
    "updated_at",
  ];

  const record = {
    user_id: String(user._id),
    username: String(user.username || ""),
    email: String(user.email || ""),
    phone: String(user.phone || ""),
    city: String(user.city || ""),
    address: String(user.address || ""),
    age: Number.isFinite(Number(user.age)) ? Number(user.age) : "",
    gender: normalizeGender(user.gender || ""),
    auth_provider: String(user.auth_provider || "local"),
    status: String(user.status || "active"),
    is_verified: user.is_verified ? "true" : "false",
    created_at: user.created_at ? new Date(user.created_at).toISOString() : "",
    updated_at: user.updated_at ? new Date(user.updated_at).toISOString() : "",
  };

  const rows = readCsvRows(paths.csv);
  const idx = rows.findIndex((r) => String(r.user_id || "") === String(record.user_id));
  if (idx >= 0) rows[idx] = { ...rows[idx], ...record };
  else rows.push(record);

  fs.writeFileSync(paths.csv, toCsv(rows, columns), "utf-8");
  fs.writeFileSync(paths.ndjson, rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""), "utf-8");
}

async function syncPatientDocsForUser(user) {
  await Patient.updateMany(
    {
      $or: [
        { email: normalizeEmail(user.email || "") },
        { "source_data.user_id": String(user._id) },
      ],
    },
    {
      $set: {
        name: String(user.username || "").trim(),
        email: normalizeEmail(user.email || ""),
        phone: String(user.phone || "").trim(),
        city: String(user.city || "").trim(),
        address: String(user.address || "").trim(),
        gender: normalizeGender(user.gender || ""),
        source_data: {
          user_id: String(user._id),
          age: Number.isFinite(Number(user.age)) ? Number(user.age) : null,
        },
      },
    }
  );
}

function normalizeDateYmd(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[1]}-${m[2]}-${m[3]}`;
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
  if (split.length < 2) return null;

  const startMinute = parseTimeLabelToMinute(split[0]);
  let endMinute = parseTimeLabelToMinute(split[1]);
  if (!Number.isFinite(startMinute) || !Number.isFinite(endMinute)) return null;

  if (endMinute <= startMinute) {
    endMinute += 24 * 60;
  }

  const durationMinutes = Math.max(10, Math.min(240, endMinute - startMinute));
  const hh = Math.floor(startMinute / 60) % 24;
  const mm = startMinute % 60;

  const parts = String(dateYmd || "").split("-");
  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const appointmentAt = new Date(year, month - 1, day, hh, mm, 0, 0);
  if (Number.isNaN(appointmentAt.getTime())) return null;

  return { appointmentAt, durationMinutes };
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
      return { startMinute: 8 * 60, endMinute: 14 * 60 };
    case "evening":
      return { startMinute: 14 * 60, endMinute: 20 * 60 };
    case "night":
      return { startMinute: 20 * 60, endMinute: 8 * 60 };
    default:
      return { startMinute: 9 * 60, endMinute: 17 * 60 };
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

    const startHour = Math.floor(slotStartTotal / 60);
    const startMin = slotStartTotal % 60;
    const endHour = Math.floor(slotEndTotal / 60);
    const endMin = slotEndTotal % 60;

    slots.push(`${toHourMinuteLabel(startHour, startMin)} - ${toHourMinuteLabel(endHour, endMin)}`);
  }
  return slots;
}

function isSlotInPast(dateYmd, slot) {
  try {
    const parsed = parseTimeSlot(dateYmd, slot);
    if (!parsed || !parsed.appointmentAt) return false;
    const now = new Date();
    return parsed.appointmentAt.getTime() <= now.getTime();
  } catch (e) {
    return false;
  }
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

const ROMAN_URDU_SYMPTOMS = [
  { rx: /\b(bukhar|bukhaar|buxar|tapish)\b/i, en: "fever" },
  { rx: /\b(khansi|khasi|khaansi)\b/i, en: "cough" },
  { rx: /\b(zukam|zukaam|nazla|neezla|naak bund)\b/i, en: "cold" },
  { rx: /\b(sar dard|sir dard|sardard|sirdard)\b/i, en: "headache" },
  { rx: /\b(gala dard|gale mein dard|kharash)\b/i, en: "sore throat" },
  { rx: /\b(pait dard|pet dard|pait ka dard)\b/i, en: "stomach pain" },
  { rx: /\b(ulti|ulty|qay|qai|matli)\b/i, en: "vomiting" },
  { rx: /\b(dast|ishal|loose motion)\b/i, en: "diarrhea" },
  { rx: /\b(sans phoolna|saans phoolna|dam ghutna)\b/i, en: "shortness of breath" },
  { rx: /\b(seena dard|sina dard|seene mein dard|dil dard)\b/i, en: "chest pain" },
  { rx: /\b(kamar dard|pith dard|peeth dard)\b/i, en: "back pain" },
  { rx: /\b(joro(n)? ka dard|ghutne ka dard|haddi dard)\b/i, en: "joint pain" },
  { rx: /\b(ankh dard|aankh mein dard|dhundla dikhai)\b/i, en: "eye pain" },
  { rx: /\b(kan dard|kaan mein dard)\b/i, en: "ear pain" },
  { rx: /\b(peshab mein jalan|bar bar peshab)\b/i, en: "urinary pain" },
  { rx: /\b(khujli|kharish|daane|phunsi)\b/i, en: "skin rash itching" },
  { rx: /\b(kamzori|thakaan|thakan)\b/i, en: "weakness fatigue" },
  { rx: /\b(sujan|sawzish|waram)\b/i, en: "swelling" },
  { rx: /\b(chakkar|chakkir|sar ghoomna)\b/i, en: "dizziness" },
  { rx: /\b(khoon aana|khoon nikalna)\b/i, en: "bleeding" },
  { rx: /\b(sugar|shakar|zyada pyas)\b/i, en: "diabetes" },
  { rx: /\b(dil ki dhadkan|dhadkan tez)\b/i, en: "palpitations" },
  { rx: /\b(hamla|hamal|delivery|wiladat)\b/i, en: "pregnancy" },
  { rx: /\b(daant dard|daant mein dard|dant dard)\b/i, en: "toothache" },
  { rx: /\b(qabz|qabaz|pakhana na aana)\b/i, en: "constipation" },
  { rx: /\b(bp|feshar|fashar|blood pressure)\b/i, en: "blood pressure" },
  { rx: /\b(malaria|dengue|dengee|dengi)\b/i, en: "malaria dengue" },
  { rx: /\b(typhoid|tyfoid|miada bukhar)\b/i, en: "typhoid" },
  { rx: /\b(fikr|ghabrahut|tension|udasi)\b/i, en: "anxiety depression" },
];

function translateRomanUrdu(text) {
  let result = String(text || "");
  for (const { rx, en } of ROMAN_URDU_SYMPTOMS) {
    result = result.replace(rx, en);
  }
  return result;
}

const DISEASE_TO_DEPARTMENT = [
  { keywords: ["heart attack", "chest pain", "angina", "heart failure", "cardiac", "palpitation", "arrhythmia", "blood pressure", "hypertension", "bp"], department: "Cardiology" },
  { keywords: ["stroke", "seizure", "epilepsy", "migraine", "headache", "fits", "paralysis", "parkinson", "dementia", "meningitis", "concussion"], department: "Neurology" },
  { keywords: ["shortness of breath", "breathlessness", "asthma", "copd", "pneumonia", "lung infection", "bronchitis", "tuberculosis", "tb", "emphysema"], department: "Pulmonology" },
  { keywords: ["fracture", "bone", "joint pain", "back pain", "knee pain", "hip pain", "dislocation", "sprain", "arthritis", "spondylosis", "sciatica"], department: "Orthopedics" },
  { keywords: ["pregnancy", "period", "menstrual", "pcos", "ovarian", "vaginal", "uterine", "delivery", "miscarriage", "gynecology", "fibroids"], department: "Gynecology / Obstetrics" },
  { keywords: ["kidney stone", "urinary infection", "uti", "bladder", "prostate", "frequent urination", "painful urination", "blood in urine"], department: "Urology" },
  { keywords: ["stomach pain", "gastric", "ulcer", "liver", "jaundice", "hepatitis", "cirrhosis", "gallstone", "pancreatitis", "diarrhea", "constipation", "ibs", "appendix", "vomiting blood", "acidity"], department: "Gastroenterology" },
  { keywords: ["skin rash", "rash", "acne", "eczema", "psoriasis", "itching", "dermatitis", "hives", "ringworm", "fungal skin", "pimples", "hair loss"], department: "Dermatology" },
  { keywords: ["sore throat", "tonsil", "sinusitis", "ear pain", "ear infection", "nose bleed", "nosebleed", "hearing loss", "hoarse voice", "nasal"], department: "ENT (Ear, Nose, Throat)" },
  { keywords: ["eye pain", "eye infection", "conjunctivitis", "cataract", "glaucoma", "blurred vision", "red eye", "retina", "cornea"], department: "Ophthalmology" },
  { keywords: ["diabetes", "sugar", "thyroid", "hormone imbalance", "adrenal", "obesity", "metabolic", "cushing", "goiter"], department: "Endocrinology" },
  { keywords: ["anxiety", "depression", "stress", "mental", "insomnia", "schizophrenia", "bipolar", "panic", "ptsd", "ocd", "addiction"], department: "Psychiatry / Mental Health" },
  { keywords: ["cancer", "tumor", "leukemia", "lymphoma", "malignant", "chemotherapy"], department: "Oncology" },
  { keywords: ["anemia", "blood disorder", "sickle cell", "hemophilia", "platelet", "thalassemia"], department: "Hematology" },
  { keywords: ["kidney failure", "renal failure", "dialysis", "nephrotic"], department: "Nephrology" },
  { keywords: ["lupus", "rheumatoid", "gout", "fibromyalgia", "vasculitis"], department: "Rheumatology" },
  { keywords: ["malaria", "dengue", "typhoid", "hiv", "sepsis", "hepatitis a", "hepatitis b"], department: "Infectious Disease" },
  { keywords: ["child", "pediatric", "baby", "infant", "newborn", "vaccination"], department: "Pediatrics" },
  { keywords: ["toothache", "dental", "gum pain", "tooth decay", "mouth ulcer"], department: "Dentistry" },
  { keywords: ["allergy", "hay fever", "food allergy", "allergic"], department: "Allergy & Immunology" },
  { keywords: ["fever", "flu", "cold", "cough", "infection", "viral", "weakness", "fatigue", "body ache", "vomiting", "nausea", "dizziness", "swelling", "bleeding"], department: "General Medicine" },
];

function detectDepartmentName(symptom) {
  const translated = translateRomanUrdu(String(symptom || "").trim());
  const text = translated.toLowerCase();
  if (!text) return "General Medicine";

  for (const item of DISEASE_TO_DEPARTMENT) {
    if (item.keywords.some((k) => text.includes(k))) {
      return item.department;
    }
  }
  return "General Medicine";
}

async function resolveDepartmentInHospital(hospitalId, departmentInput) {
  const deptText = String(departmentInput || "").trim();
  if (!deptText) return null;

  // 1. Try by ObjectId
  if (mongoose.Types.ObjectId.isValid(deptText)) {
    const byId = await Department.findOne({ _id: deptText, hospital_id: hospitalId, status: "active" }, { name: 1 });
    if (byId) return byId;
  }

  // 2. Try exact name match (case-insensitive)
  const exactMatch = await Department.findOne(
    { hospital_id: hospitalId, status: "active", name: { $regex: `^${deptText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } },
    { name: 1 }
  );
  if (exactMatch) return exactMatch;

  // 3. Alias-based matching — "General Medicine" should match "General Physician", "OPD", etc.
  const DEPARTMENT_ALIAS_GROUPS = [
    { names: ["general medicine", "general physician", "opd", "gp", "physician", "medicine", "internal medicine", "family medicine", "outdoor", "outpatient", "general"] },
    { names: ["cardiology", "cardiac", "heart", "cardiovascular"] },
    { names: ["neurology", "neuro", "neurosurgery"] },
    { names: ["orthopedics", "orthopaedics", "ortho", "bone"] },
    { names: ["emergency", "emergency medicine", "casualty", "trauma"] },
    { names: ["pediatrics", "paediatrics", "child"] },
    { names: ["dermatology", "skin", "derma"] },
    { names: ["ent", "ent (ear, nose, throat)", "ear nose throat", "otolaryngology"] },
    { names: ["pulmonology", "respiratory", "chest", "lung", "chest medicine"] },
    { names: ["gynecology", "gynecology / obstetrics", "gynecology obstetrics", "obstetrics", "gynae", "gynaecology", "obgyn", "obs & gyn"] },
    { names: ["urology", "urinary"] },
    { names: ["oncology", "cancer"] },
    { names: ["psychiatry", "psychiatry / mental health", "mental health", "psychology"] },
    { names: ["endocrinology", "diabetes", "thyroid"] },
    { names: ["gastroenterology", "gastro", "liver", "hepatology", "digestive"] },
    { names: ["nephrology", "renal", "dialysis", "kidney"] },
    { names: ["ophthalmology", "eye", "optometry"] },
    { names: ["rheumatology", "arthritis"] },
    { names: ["hematology", "haematology", "blood"] },
    { names: ["dentistry", "dental", "teeth", "oral"] },
    { names: ["allergy & immunology", "allergy", "immunology"] },
    { names: ["infectious disease", "infectious", "infection"] },
    { names: ["general surgery", "surgery", "surgical"] },
  ];

  const inputNorm = deptText.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  // Find which alias group the input belongs to
  let matchingAliases = null;
  for (const group of DEPARTMENT_ALIAS_GROUPS) {
    if (group.names.some(alias => {
      const aliasNorm = alias.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      return aliasNorm === inputNorm || inputNorm.includes(aliasNorm) || aliasNorm.includes(inputNorm);
    })) {
      matchingAliases = group.names;
      break;
    }
  }

  if (matchingAliases) {
    // Get all active departments for this hospital and check against aliases
    const hospitalDepts = await Department.find(
      { hospital_id: hospitalId, status: "active" },
      { name: 1 }
    );

    for (const dept of hospitalDepts) {
      const deptNorm = (dept.name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (matchingAliases.some(alias => {
        const aliasNorm = alias.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        return aliasNorm === deptNorm || deptNorm.includes(aliasNorm) || aliasNorm.includes(deptNorm);
      })) {
        return dept;
      }
    }
  }

  return null;
}


async function ensurePatientRecordForHospital(user, hospitalId, departmentId, doctorId, disease) {
  const email = normalizeEmail(user.email || "");

  let patient = await Patient.findOne({
    hospital_id: hospitalId,
    $or: [
      { "source_data.user_id": String(user._id) },
      ...(email ? [{ email }] : []),
    ],
  });

  if (!patient) {
    patient = await Patient.create({
      name: String(user.username || "").trim(),
      email,
      phone: String(user.phone || "").trim(),
      city: String(user.city || "").trim(),
      address: String(user.address || "").trim(),
      gender: normalizeGender(user.gender || ""),
      hospital_id: hospitalId,
      department_id: departmentId || null,
      assigned_doctor_id: doctorId || null,
      source_record_id: `user-${String(user._id)}`,
      source_data: {
        user_id: String(user._id),
        age: Number.isFinite(Number(user.age)) ? Number(user.age) : null,
        disease: String(disease || "").trim(),
      },
      status: "active",
      created_by: user._id,
    });
    return patient;
  }

  const updates = {
    name: String(user.username || "").trim(),
    email,
    phone: String(user.phone || "").trim(),
    city: String(user.city || "").trim(),
    address: String(user.address || "").trim(),
    gender: normalizeGender(user.gender || ""),
  };

  if (departmentId) updates.department_id = departmentId;
  if (doctorId) updates.assigned_doctor_id = doctorId;
  updates.source_data = {
    ...(patient.source_data && typeof patient.source_data === "object" ? patient.source_data : {}),
    user_id: String(user._id),
    age: Number.isFinite(Number(user.age)) ? Number(user.age) : null,
    disease: String(disease || "").trim() || patient?.source_data?.disease || "",
  };

  patient = await Patient.findByIdAndUpdate(patient._id, { $set: updates }, { new: true });
  return patient;
}

router.get("/patient/profile", ...requirePatient, async (req, res, next) => {
  try {
    const profile = await User.findById(req.authUser._id, {
      password: 0,
      failed_login_attempts: 0,
      locked_until: 0,
      __v: 0,
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Patient profile not found." });
    }

    return res.json({ success: true, profile });
  } catch (error) {
    return next(error);
  }
});

router.put("/patient/profile", ...requirePatient, async (req, res, next) => {
  try {
    const user = await User.findById(req.authUser._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Patient account not found." });
    }

    const updates = {};

    if (req.body?.name !== undefined || req.body?.username !== undefined) {
      const name = String(req.body?.name || req.body?.username || "").trim();
      if (name.length < 3) {
        return res.status(400).json({ success: false, message: "Name must be at least 3 characters." });
      }
      updates.username = name;
    }

    if (req.body?.phone !== undefined) {
      updates.phone = String(req.body.phone || "").trim();
    }

    if (req.body?.address !== undefined) {
      updates.address = String(req.body.address || "").trim();
    }

    if (req.body?.city !== undefined) {
      updates.city = String(req.body.city || "").trim();
    }

    if (req.body?.age !== undefined) {
      const age = Number(req.body.age);
      if (!Number.isFinite(age) || age < 0 || age > 120) {
        return res.status(400).json({ success: false, message: "Age must be between 0 and 120." });
      }
      updates.age = Math.round(age);
    }

    if (req.body?.gender !== undefined) {
      updates.gender = normalizeGender(req.body.gender || "");
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No profile fields provided." });
    }

    const updated = await User.findByIdAndUpdate(user._id, { $set: updates }, { new: true });
    await syncPatientDocsForUser(updated);
    syncPatientAccountDataFile(updated);

    return res.json({
      success: true,
      message: "Patient profile updated successfully.",
      profile: {
        id: String(updated._id),
        username: updated.username,
        email: updated.email,
        phone: updated.phone,
        city: updated.city || "",
        address: updated.address || "",
        age: Number.isFinite(Number(updated.age)) ? Number(updated.age) : null,
        gender: normalizeGender(updated.gender || ""),
        role: updated.role,
        auth_provider: updated.auth_provider,
        status: updated.status,
        is_verified: updated.is_verified,
        profile_image: updated.profile_image || "",
        created_at: updated.created_at,
        last_login_at: updated.last_login_at,
        last_seen_at: updated.last_seen_at,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/hospitals", ...requirePatient, async (req, res, next) => {
  try {
    const userCity = String(req.query?.city || "").trim();
    const userLat = Number(req.query?.lat);
    const userLng = Number(req.query?.lng);

    const hospitals = await Hospital.find(
      { status: "approved", is_active: true },
      { name: 1, city: 1, address: 1, email: 1, phone: 1, contact_number: 1, geo_location: 1 }
    ).lean();

    hospitals.sort((a, b) => {
      // 1. Sort by proximity if coordinates are available
      if (Number.isFinite(userLat) && Number.isFinite(userLng)) {
        const getDistance = (h) => {
          const lat = Number(h.geo_location?.lat);
          const lng = Number(h.geo_location?.lng);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            const toRad = (v) => (v * Math.PI) / 180;
            const dLat = toRad(lat - userLat);
            const dLng = toRad(lng - userLng);
            const aVal = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(userLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
            const cVal = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
            return 6371 * cVal; // Distance in km
          }
          return Number.POSITIVE_INFINITY;
        };
        const distA = getDistance(a);
        const distB = getDistance(b);
        if (distA !== distB) return distA - distB;
      }

      // 2. Sort same-city hospitals first if city is available
      if (userCity) {
        const cityA = String(a.city || "").trim().toLowerCase();
        const cityB = String(b.city || "").trim().toLowerCase();
        const targetCity = userCity.toLowerCase();
        const matchA = cityA === targetCity ? 1 : 0;
        const matchB = cityB === targetCity ? 1 : 0;
        if (matchA !== matchB) return matchB - matchA;
      }

      // 3. Default sort alphabetically by name
      return String(a.name || "").localeCompare(String(b.name || ""));
    });

    return res.json({ success: true, hospitals });
  } catch (error) {
    return next(error);
  }
});

router.post("/ai/detect-department", ...requirePatient, async (req, res, next) => {
  try {
    const symptom = String(req.body?.symptom || "").trim();
    const hospitalId = String(req.body?.hospital_id || "").trim();
    if (!symptom) {
      return res.status(400).json({ success: false, message: "symptom is required." });
    }

    const predictedDepartment = detectDepartmentName(symptom);
    const responsePayload = {
      success: true,
      symptom,
      department: predictedDepartment,
      hospital_department_available: null,
      message: "",
      resource_availability: null,
    };

    if (hospitalId) {
      if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        return res.status(400).json({ success: false, message: "Invalid hospital_id." });
      }

      const hospital = await Hospital.findOne({ _id: hospitalId, status: "approved", is_active: true }, { _id: 1, name: 1 });
      if (!hospital) {
        return res.status(404).json({ success: false, message: "Hospital not found or inactive." });
      }

      const department = await resolveDepartmentInHospital(hospitalId, predictedDepartment);
      if (!department) {
        responsePayload.hospital_department_available = false;
        responsePayload.message = "Department not available in this hospital";
        responsePayload.resource_availability = {
          available: false,
          total_resources: 0,
          available_resources: 0,
          department: predictedDepartment,
          resources: [],
        };
        return res.json(responsePayload);
      }

      const resources = await Resource.find(
        {
          hospital_id: hospitalId,
          $or: [{ department_id: department._id }, { department_id: null }],
        },
        { name: 1, type: 1, available_quantity: 1, status: 1 }
      );

      const availableResources = resources.filter((r) => Number(r.available_quantity || 0) > 0 && String(r.status || "") !== "out_of_stock");
      responsePayload.department = department.name;
      responsePayload.hospital_department_available = true;
      responsePayload.message = "Department detected and available in selected hospital.";
      responsePayload.resource_availability = {
        available: availableResources.length > 0,
        total_resources: resources.length,
        available_resources: availableResources.length,
        department: department.name,
        resources: resources.map((r) => ({
          id: String(r._id),
          name: r.name,
          type: r.type,
          available_quantity: Number(r.available_quantity || 0),
          status: r.status,
        })),
      };
    }

    return res.json(responsePayload);
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

router.get("/patient/doctors", ...requirePatient, async (req, res, next) => {
  try {
    const hospitalId = String(req.query?.hospital_id || "").trim();
    const departmentInput = String(req.query?.department || req.query?.department_id || "").trim();
    const dateYmd = normalizeDateYmd(req.query?.date || new Date().toISOString().slice(0, 10));

    if (!hospitalId || !mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ success: false, message: "Valid hospital_id is required." });
    }

    const hospital = await Hospital.findOne({ _id: hospitalId, status: "approved", is_active: true }, { _id: 1, name: 1 });
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found or inactive." });
    }

    let department = null;
    let departmentFallback = false;
    if (departmentInput) {
      department = await resolveDepartmentInHospital(hospitalId, departmentInput);
      if (!department) {
        // Department not found in this hospital — fall back to all doctors (no filter)
        departmentFallback = true;
      }
    }

    const dayStart = new Date(`${dateYmd}T00:00:00`);
    const dayEnd = new Date(`${dateYmd}T23:59:59.999`);
    const dayName = dayStart.toLocaleDateString("en-US", { weekday: "long" });

    const doctorFilter = {
      hospital_id: hospitalId,
      role: "doctor",
      status: "active",
    };
    if (department?._id) doctorFilter.department_id = department._id;

    const doctorProjection = {
      name: 1,
      doctor_id: 1,
      department_id: 1,
      shift: 1,
      available_days: 1,
      max_patients_per_day: 1,
      specialization: 1,
      consultation_fee: 1,
      experience_years: 1,
    };

    let doctors = await Staff.find(doctorFilter, doctorProjection).populate("department_id", "name");

    // If department was set but 0 doctors found in that department,
    // fall back to ALL doctors in the hospital (any GP can check fever, etc.)
    if (doctors.length === 0 && department?._id) {
      const allDoctorsFilter = { hospital_id: hospitalId, role: "doctor", status: "active" };
      doctors = await Staff.find(allDoctorsFilter, doctorProjection).populate("department_id", "name");
      if (doctors.length > 0) {
        departmentFallback = true;
      }
    }


    const doctorIds = doctors.map((d) => d._id);
    const appointments = await Appointment.find(
      {
        hospital_id: hospitalId,
        doctor_id: { $in: doctorIds },
        status: { $in: ["pending", "confirmed"] },
        appointment_at: { $gte: dayStart, $lte: dayEnd },
      },
      { doctor_id: 1, appointment_at: 1, duration_minutes: 1 }
    );

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
      const hasResources = await checkResourceAvailability(hospitalId, deptId);
      deptResourceAvailabilityMap.set(deptId, hasResources);
    }

    const rows = doctors.map((doctor) => {
      const key = String(doctor._id);
      const doctorAppointments = grouped.get(key) || [];
      const slots = buildSlotLabels(doctor.shift || "morning", 30);
      const taken = new Set(
        doctorAppointments.map((appt) => {
          const start = new Date(appt.appointment_at);
          const end = new Date(start.getTime() + Number(appt.duration_minutes || 30) * 60 * 1000);
          return `${toHourMinuteLabel(start.getHours(), start.getMinutes())} - ${toHourMinuteLabel(end.getHours(), end.getMinutes())}`;
        })
      );
      const availableSlots = slots.filter((slot) => !taken.has(slot) && !isSlotInPast(dateYmd, slot));

      const dayAllowed = !Array.isArray(doctor.available_days) || doctor.available_days.length === 0
        ? true
        : doctor.available_days.some((d) => String(d || "").toLowerCase() === dayName.toLowerCase());

      const maxPerDay = Number(doctor.max_patients_per_day || 0);
      const atCapacity = maxPerDay > 0 && doctorAppointments.length >= maxPerDay;

      const doctorDeptId = String(doctor.department_id?._id || doctor.department_id || "");
      const resourcesAvailable = doctorDeptId ? (deptResourceAvailabilityMap.get(doctorDeptId) !== false) : true;

      const available = dayAllowed && !atCapacity && availableSlots.length > 0 && resourcesAvailable;

      return {
        id: String(doctor._id),
        name: doctor.name,
        department: doctor.department_id?.name || "Unassigned",
        shift: doctor.shift || "morning",
        specialization: doctor.specialization || "",
        experience_years: Number(doctor.experience_years || 0),
        consultation_fee: Number(doctor.consultation_fee || 500), // PKR
        date: dateYmd,
        available,
        reason_unavailable: !dayAllowed
          ? `Doctor not available on ${dayName}`
          : (atCapacity ? "Doctor reached daily capacity" : (!resourcesAvailable ? "Department has no available resources (e.g., out of stock of beds/equipment)" : (availableSlots.length === 0 ? "No slots available" : ""))),
        available_slots: available ? availableSlots : [],
      };
    });

    const availableDoctorsOnly = rows.filter((d) => d.available);

    return res.json({
      success: true,
      hospital: { id: String(hospital._id), name: hospital.name },
      department: department ? { id: String(department._id), name: department.name } : null,
      department_fallback: departmentFallback,
      department_fallback_message: departmentFallback
        ? (department
          ? `No doctors are specifically assigned to "${department.name}" yet. Showing all available doctors who can help.`
          : `Department "${departmentInput}" not found in this hospital. Showing all available doctors.`)
        : null,
      date: dateYmd,
      doctors: availableDoctorsOnly,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/patient/appointments", ...requirePatient, async (req, res, next) => {
  try {
    const hospitalId = String(req.body?.hospital_id || "").trim();
    const doctorId = String(req.body?.doctor_id || "").trim();
    const departmentInput = String(req.body?.department || "").trim();
    const dateYmd = normalizeDateYmd(req.body?.date);
    const timeSlot = String(req.body?.time_slot || "").trim();
    const disease = String(req.body?.disease || "").trim();
    // Stripe payment fields (required)
    const paymentIntentId = String(req.body?.payment_intent_id || "").trim();
    const paidFee = Number(req.body?.consultation_fee || 0);

    if (!hospitalId || !mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ success: false, message: "Valid hospital_id is required." });
    }
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: "Valid doctor_id is required." });
    }
    if (!departmentInput) {
      return res.status(400).json({ success: false, message: "department is required." });
    }
    if (!dateYmd || !timeSlot) {
      return res.status(400).json({ success: false, message: "date and time_slot are required." });
    }

    const hospital = await Hospital.findOne({ _id: hospitalId, status: "approved", is_active: true }, { _id: 1, name: 1 });
    if (!hospital) {
      return res.status(404).json({ success: false, message: "Hospital not found or inactive." });
    }

    const department = await resolveDepartmentInHospital(hospitalId, departmentInput);
    if (!department) {
      return res.status(400).json({ success: false, message: "Department not available in this hospital" });
    }

    const hasResources = await checkResourceAvailability(hospitalId, department._id);
    if (!hasResources) {
      return res.status(400).json({
        success: false,
        message: "Selected department has no available resources (e.g., out of stock of beds/equipment)."
      });
    }

    const doctor = await Staff.findOne(
      { _id: doctorId, hospital_id: hospitalId, role: "doctor", status: "active" },
      { _id: 1, name: 1, department_id: 1, shift: 1, available_days: 1, max_patients_per_day: 1, consultation_fee: 1 }
    );
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found in selected hospital." });
    }

    // --- Stripe Payment Verification ---
    if (paymentIntentId) {
      try {
        const env = require("../config/env");
        if (env.stripeSecretKey) {
          const Stripe = require("stripe");
          const stripeClient = Stripe(env.stripeSecretKey);
          const intent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
          if (intent.status !== "succeeded") {
            return res.status(402).json({
              success: false,
              message: `Payment not completed. Stripe status: ${intent.status}. Please complete payment before booking.`,
            });
          }
        }
      } catch (stripeErr) {
        console.error("[Appointments] Stripe verification error:", stripeErr.message);
        return res.status(402).json({ success: false, message: "Payment verification failed. Please try again." });
      }
    } else {
      return res.status(402).json({ success: false, message: "Payment is required to book an appointment. Please complete payment." });
    }

    if (doctor.department_id && String(doctor.department_id) !== String(department._id)) {
      return res.status(400).json({ success: false, message: "Selected doctor does not match selected department." });
    }

    const parsed = parseTimeSlot(dateYmd, timeSlot);
    if (!parsed) {
      return res.status(400).json({ success: false, message: "Invalid time_slot format. Use e.g. 2:00 PM - 2:30 PM" });
    }

    const appointmentAt = parsed.appointmentAt;
    const appointmentEnd = new Date(appointmentAt.getTime() + parsed.durationMinutes * 60 * 1000);
    const dayName = appointmentAt.toLocaleDateString("en-US", { weekday: "long" });

    // Reject bookings in the past
    const now = new Date();
    if (appointmentAt.getTime() <= now.getTime()) {
      return res.status(400).json({ success: false, message: "Cannot book an appointment in the past. Select a future date/time." });
    }

    if (Array.isArray(doctor.available_days) && doctor.available_days.length > 0) {
      const dayAllowed = doctor.available_days.some((d) => String(d || "").toLowerCase() === dayName.toLowerCase());
      if (!dayAllowed) {
        return res.status(400).json({ success: false, message: `Doctor is not available on ${dayName}.` });
      }
    }

    const shiftSlots = new Set(buildSlotLabels(doctor.shift || "morning", 30));
    if (!shiftSlots.has(timeSlot)) {
      return res.status(400).json({ success: false, message: "Selected slot is outside doctor shift." });
    }

    const patientRecord = await ensurePatientRecordForHospital(
      req.authUser,
      hospitalId,
      department._id,
      doctor._id,
      disease
    );

    const overlappingDoctor = await Appointment.findOne({
      hospital_id: hospitalId,
      doctor_id: doctor._id,
      status: { $in: ["pending", "confirmed"] },
      appointment_at: {
        $gte: new Date(appointmentAt.getTime() - (parsed.durationMinutes - 1) * 60 * 1000),
        $lt: appointmentEnd,
      },
    }, { _id: 1 });
    if (overlappingDoctor) {
      return res.status(409).json({ success: false, message: "Selected slot is already booked." });
    }

    const overlappingPatient = await Appointment.findOne({
      hospital_id: hospitalId,
      patient_id: patientRecord._id,
      status: { $in: ["pending", "confirmed"] },
      appointment_at: {
        $gte: new Date(appointmentAt.getTime() - (parsed.durationMinutes - 1) * 60 * 1000),
        $lt: appointmentEnd,
      },
    }, { _id: 1 });
    if (overlappingPatient) {
      return res.status(409).json({ success: false, message: "You already have an appointment in this time range." });
    }

    const dayStart = startOfDay(appointmentAt);
    const dayEnd = endOfDay(appointmentAt);
    const pendingCount = await Appointment.countDocuments({
      hospital_id: hospitalId,
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
      hospital_id: hospitalId,
      patient_id: patientRecord._id,
      doctor_id: doctor._id,
      appointment_at: appointmentAt,
      duration_minutes: parsed.durationMinutes,
      reason: disease,
      notes: "Booked by patient portal",
      status: "pending",
      // Payment fields
      payment_intent_id: paymentIntentId || null,
      payment_status: paymentIntentId ? "paid" : "unpaid",
      consultation_fee: paidFee || Number(doctor.consultation_fee || 500),
      created_by: req.authUser._id,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment request submitted and pending receptionist confirmation.",
      appointment,
      data_updates: {
        patient_record_updated: true,
        appointment_record_created: true,
      },
      booking_flow: {
        hospital: hospital.name,
        department: department.name,
        doctor: doctor.name,
        date: dateYmd,
        time_slot: timeSlot,
        disease,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/patient/appointments", ...requirePatient, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.authUser?.email || "");

    const patientDocs = await Patient.find({
      $or: [
        { "source_data.user_id": String(req.authUser._id) },
        ...(email ? [{ email }] : []),
      ],
    }, { _id: 1 });

    const patientIds = patientDocs.map((p) => p._id);
    if (patientIds.length === 0) {
      return res.json({ success: true, appointments: [] });
    }

    const appointments = await Appointment.find(
      { patient_id: { $in: patientIds } },
      { __v: 0 }
    )
      .populate("doctor_id", "name doctor_id specialization shift department_id")
      .populate("hospital_id", "name city address geo_location")
      .sort({ appointment_at: -1 });

    // Fetch matching prescriptions by appointment_id
    const appIds = appointments.map((a) => a._id);
    const prescriptions = await Prescription.find({ appointment_id: { $in: appIds } }).lean();

    // Map prescriptions to appointments
    const appointmentsWithPrescriptions = appointments.map((appointment) => {
      const p = prescriptions.find((pr) => String(pr.appointment_id) === String(appointment._id));
      const appointmentObj = appointment.toObject();
      if (p) {
        appointmentObj.prescription = p;
      }
      return appointmentObj;
    });

    return res.json({ success: true, appointments: appointmentsWithPrescriptions });
  } catch (error) {
    return next(error);
  }
});

router.post("/patient/appointments/:id/feedback", ...requirePatient, async (req, res, next) => {
  try {
    const appointmentId = String(req.params?.id || "").trim();
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ success: false, message: "Invalid appointment id." });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "rating must be an integer between 1 and 5." });
    }
    if (comment.length > 500) {
      return res.status(400).json({ success: false, message: "comment must be at most 500 characters." });
    }

    const email = normalizeEmail(req.authUser?.email || "");
    const patientDocs = await Patient.find(
      {
        $or: [
          { "source_data.user_id": String(req.authUser._id) },
          ...(email ? [{ email }] : []),
        ],
      },
      { _id: 1 }
    );
    const patientIds = patientDocs.map((p) => p._id);

    if (patientIds.length === 0) {
      return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient_id: { $in: patientIds },
    });
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }
    if (String(appointment.status || "") !== "completed") {
      return res.status(409).json({ success: false, message: "Feedback can only be submitted for completed appointments." });
    }

    appointment.patient_feedback = {
      rating,
      comment,
      submitted_at: new Date(),
    };
    await appointment.save();

    return res.json({
      success: true,
      message: "Feedback submitted successfully.",
      appointment,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Analyze symptoms using LLM + ML model
 * POST /api/patient/ai/analyze-symptoms
 * Body: { symptoms: "user input text" }
 * Returns: { corrected, keywords, predictions, confidences }
 */
router.post("/patient/ai/analyze-symptoms", ...requirePatient, async (req, res, next) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please provide symptoms text.",
      });
    }

    // Import the symptom analyzer
    const { analyzeSymptomsAndPredict } = require("../utils/symptomAnalyzer");

    // Analyze and predict
    const result = await analyzeSymptomsAndPredict(symptoms);

    return res.json(result);
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    return next(error);
  }
});

/**
 * PUBLIC: Analyze symptoms (for testing/UI)
 * POST /api/analyze-symptoms-public
 * Body: { symptoms: "user input text" }
 * Returns: { corrected, keywords, predictions, confidences }
 */
router.post("/analyze-symptoms-public", async (req, res, next) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please provide symptoms text.",
      });
    }

    // Import the symptom analyzer
    const { analyzeSymptomsAndPredict } = require("../utils/symptomAnalyzer");

    // Analyze and predict
    const result = await analyzeSymptomsAndPredict(symptoms);

    return res.json(result);
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    return next(error);
  }
});

/**
 * Proxy POST /api/analyze to Python Flask server
 */
router.post("/analyze", async (req, res, next) => {
  try {
    const flaskPort = process.env.FLASK_PORT || 5002;
    const response = await fetch(`http://127.0.0.1:${flaskPort}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.json(data);
  } catch (error) {
    console.error("Proxy /analyze failed:", error);
    return res.status(500).json({ success: false, error: "Flask backend is unreachable." });
  }
});

/**
 * Proxy GET /api/symptoms to Python Flask server
 */
router.get("/symptoms", async (req, res, next) => {
  try {
    const flaskPort = process.env.FLASK_PORT || 5002;
    const response = await fetch(`http://127.0.0.1:${flaskPort}/api/symptoms`);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    return res.json(data);
  } catch (error) {
    console.error("Proxy /symptoms failed:", error);
    return res.status(500).json({ success: false, error: "Flask backend is unreachable." });
  }
});

// Profile image upload configuration
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.authUser._id;
    const uploadDir = path.join(STORAGE_ROOT_DIR, "profile_images", String(userId));
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    if (!allowedExts.includes(ext)) {
      return cb(new Error("Invalid file type. Allowed: JPG, PNG, GIF, WebP"));
    }
    const timestamp = Date.now();
    cb(null, `avatar_${timestamp}${ext}`);
  },
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Allowed: JPG, PNG, GIF, WebP"));
    }
    cb(null, true);
  },
});

// POST /api/patient/profile/image - Upload profile image
router.post("/patient/profile/image", ...requirePatient, (req, res, next) => {
  profileImageUpload.single("avatar")(req, res, function (err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const userId = req.authUser._id;
    const imageUrl = `/api/patient/profile/image/${userId}/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profile_image: imageUrl },
      { new: true, fields: { password: 0, failed_login_attempts: 0, locked_until: 0, __v: 0 } }
    );

    return res.json({
      success: true,
      message: "Profile image uploaded successfully.",
      profile_image: imageUrl,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/patient/profile/image/:userId/:filename - Serve profile image
router.get("/patient/profile/image/:userId/:filename", async (req, res, next) => {
  try {
    const { userId, filename } = req.params;
    const imagePath = path.join(STORAGE_ROOT_DIR, "profile_images", String(userId), filename);

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ success: false, message: "Image not found." });
    }

    res.sendFile(imagePath);
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/patient/profile/image - Remove profile image
router.delete("/patient/profile/image", ...requirePatient, async (req, res, next) => {
  try {
    const userId = req.authUser._id;
    const user = await User.findById(userId);

    if (!user || !user.profile_image) {
      return res.status(404).json({ success: false, message: "No profile image to delete." });
    }

    const oldImagePath = path.join(BACKEND_ROOT_DIR, user.profile_image);
    if (fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
      } catch (e) {
        // Ignore file deletion errors
      }
    }

    user.profile_image = "";
    await user.save();

    return res.json({ success: true, message: "Profile image removed." });
  } catch (error) {
    return next(error);
  }
});

// GET /api/patient/search - Search hospitals and doctors without symptoms
router.get("/patient/search", ...requirePatient, async (req, res, next) => {
  try {
    const departmentInput = String(req.query?.department || "").trim();
    const doctorNameInput = String(req.query?.doctor_name || "").trim();
    const hospitalNameInput = String(req.query?.hospital_name || "").trim();
    const cityInput = String(req.query?.city || "").trim();
    const userLat = Number(req.query?.lat);
    const userLng = Number(req.query?.lng);

    // 1. Fetch matching hospitals
    const hospitalFilter = { status: "approved", is_active: true };
    if (cityInput) {
      hospitalFilter.city = { $regex: cityInput, $options: "i" };
    }
    if (hospitalNameInput) {
      hospitalFilter.name = { $regex: hospitalNameInput, $options: "i" };
    }

    const hospitals = await Hospital.find(hospitalFilter, {
      name: 1, city: 1, address: 1, email: 1, phone: 1, contact_number: 1, geo_location: 1
    }).lean();

    const hospitalIds = hospitals.map(h => h._id);

    // 2. Fetch matching doctors
    const doctorFilter = {
      hospital_id: { $in: hospitalIds },
      role: "doctor",
      status: "active"
    };

    if (doctorNameInput) {
      doctorFilter.name = { $regex: doctorNameInput, $options: "i" };
    }

    let doctors = await Staff.find(doctorFilter, {
      name: 1,
      doctor_id: 1,
      department_id: 1,
      hospital_id: 1,
      shift: 1,
      available_days: 1,
      max_patients_per_day: 1,
      specialization: 1,
      consultation_fee: 1,
      experience_years: 1,
    }).populate("department_id", "name").populate("hospital_id", "name city address geo_location").lean();

    // 3. Filter by department if input exists
    if (departmentInput) {
      const deptRegex = new RegExp(departmentInput, "i");
      doctors = doctors.filter(doc => 
        (doc.department_id && deptRegex.test(doc.department_id.name)) || 
        (doc.specialization && deptRegex.test(doc.specialization))
      );
    }

    const calculateDistance = (geo) => {
      const lat = Number(geo?.lat);
      const lng = Number(geo?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(userLat) && Number.isFinite(userLng)) {
        const toRad = (v) => (v * Math.PI) / 180;
        const dLat = toRad(lat - userLat);
        const dLng = toRad(lng - userLng);
        const aVal = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(userLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
        const cVal = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
        return 6371 * cVal; // in km
      }
      return null;
    };

    // Format hospitals and compute distance
    const formattedHospitals = hospitals.map(h => ({
      ...h,
      distance_km: calculateDistance(h.geo_location)
    }));

    // Format doctors and compute distance to their hospital
    const formattedDoctors = doctors.map(d => ({
      id: String(d._id),
      name: d.name,
      specialization: d.specialization || "",
      experience_years: Number(d.experience_years || 0),
      consultation_fee: Number(d.consultation_fee || 500),
      shift: d.shift || "morning",
      available_days: d.available_days || [],
      department: d.department_id?.name || "Unassigned",
      hospital: {
        id: String(d.hospital_id?._id),
        name: d.hospital_id?.name || "Unknown Hospital",
        city: d.hospital_id?.city || "",
        address: d.hospital_id?.address || "",
        distance_km: calculateDistance(d.hospital_id?.geo_location)
      }
    }));

    // Sort: proximity first, then name/experience
    formattedHospitals.sort((a, b) => {
      if (a.distance_km !== null && b.distance_km !== null) {
        return a.distance_km - b.distance_km;
      }
      return String(a.name).localeCompare(String(b.name));
    });

    formattedDoctors.sort((a, b) => {
      if (a.hospital.distance_km !== null && b.hospital.distance_km !== null) {
        return a.hospital.distance_km - b.hospital.distance_km;
      }
      return (b.experience_years || 0) - (a.experience_years || 0);
    });

    return res.json({
      success: true,
      hospitals: formattedHospitals,
      doctors: formattedDoctors
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/patient/notify-admin-resource
 * Body: { resource_name: "Anti-emetic Drugs", hospital_id: "...", department_name: "..." }
 */
router.post("/patient/notify-admin-resource", ...requirePatient, async (req, res, next) => {
  try {
    const resourceName = String(req.body?.resource_name || "").trim();
    const hospitalId = String(req.body?.hospital_id || "").trim();
    const departmentName = String(req.body?.department_name || "").trim();

    if (!resourceName || !hospitalId) {
      return res.status(400).json({ success: false, message: "resource_name and hospital_id are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ success: false, message: "Invalid hospital_id." });
    }

    // Resolve department ID if name is provided
    let departmentId = null;
    if (departmentName) {
      const resolvedDept = await resolveDepartmentInHospital(hospitalId, departmentName);
      if (resolvedDept) {
        departmentId = resolvedDept._id;
      }
    }

    // Check if the resource already exists for this hospital
    let resource = await Resource.findOne({
      hospital_id: hospitalId,
      name: { $regex: new RegExp(`^${resourceName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
    });

    if (resource) {
      // If it exists, update it to "out_of_stock" so it triggers alerts for the hospital admin
      if (resource.status !== "out_of_stock" && resource.status !== "low_stock") {
        resource.status = "out_of_stock";
        resource.available_quantity = 0;
      }
      resource.notes = `Patient requested stock check at ${new Date().toISOString()}`;
      await resource.save();
    } else {
      // Determine a basic type
      let type = "equipment";
      const nameLower = resourceName.toLowerCase();
      if (nameLower.includes("drug") || nameLower.includes("medicine") || nameLower.includes("tablet") || nameLower.includes("syrup") || nameLower.includes("injection") || nameLower.includes("vaccine") || nameLower.includes("anti-emetic")) {
        type = "medicine";
      } else if (nameLower.includes("bed") || nameLower.includes("ward")) {
        type = "bed";
      } else if (nameLower.includes("room") || nameLower.includes("theater")) {
        type = "room";
      }

      // Create new resource as out_of_stock
      resource = await Resource.create({
        name: resourceName,
        type,
        hospital_id: hospitalId,
        department_id: departmentId,
        quantity: 0,
        available_quantity: 0,
        status: "out_of_stock",
        notes: `Requested by patient via symptom analysis at ${new Date().toISOString()}`,
        created_by: req.authUser._id,
      });
    }

    return res.json({
      success: true,
      message: `Hospital Admin has been notified about: ${resourceName}`,
      resource
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
