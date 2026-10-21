const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { promisify } = require("util");
const { execFile } = require("child_process");
const { parse: parseCsv } = require("csv-parse/sync");
const XLSX = require("xlsx");

const User = require("../models/User");
const Staff = require("../models/Staff");
const Department = require("../models/Department");
const Hospital = require("../models/Hospital");
const Patient = require("../models/Patient");
const Resource = require("../models/Resource");
const Appointment = require("../models/Appointment");
const AuditLog = require("../models/AuditLog");
const DoctorScheduleChangeRequest = require("../models/DoctorScheduleChangeRequest");
const SmartSchedulePlan = require("../models/SmartSchedulePlan");
const ScheduleOptimizationProposal = require("../models/ScheduleOptimizationProposal");
const { requireHospitalAdmin, restrictToOwnHospital } = require("../middleware/auth");
const { isValidEmail, normalizeEmail, validatePassword } = require("../utils/validators");
const { writeAuditLog } = require("../utils/adminAudit");
const { seedResourcesForDepartment } = require("../utils/resourceSeeder");

const router = express.Router();
const execFileAsync = promisify(execFile);

const BACKEND_ROOT_DIR = path.resolve(__dirname, "..", "..");
const BACKEND_STORAGE_DIR = path.join(BACKEND_ROOT_DIR, "storage");
const CWD_STORAGE_DIR = path.join(process.cwd(), "storage");
const BACKEND_AI_DIR = path.join(BACKEND_STORAGE_DIR, "ai");
const CWD_AI_DIR = path.join(CWD_STORAGE_DIR, "ai");

// Prefer backend-local storage; fallback to cwd storage for legacy runs.
const STORAGE_ROOT_DIR = fs.existsSync(BACKEND_AI_DIR) || !fs.existsSync(CWD_AI_DIR)
  ? BACKEND_STORAGE_DIR
  : CWD_STORAGE_DIR;

const AI_STORAGE_DIR = path.join(STORAGE_ROOT_DIR, "ai");
const AI_MODEL_BUNDLE_NAME = "patient_load_model.joblib";
const AI_METADATA_NAME = "model_metadata.json";
const AI_TRAINING_HISTORY_NAME = "training_history.json";
const AI_PREDICTION_CACHE_NAME = "prediction_cache.json";
const AI_DATASET_NAME = "patient_dataset.csv";
const AI_TRAINING_DATASET_NAME = "patient_training_dataset.csv";
const MAX_AI_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_PATIENT_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_RESOURCE_UPLOAD_BYTES = 8 * 1024 * 1024;
const BACKUP_RETENTION_LIMIT = 5;
const AI_JOB_RETENTION_MS = 24 * 60 * 60 * 1000;
const PREDICTION_CACHE_VERSION = "v2";

const AI_TEMPLATE_REQUIRED_COLUMNS = ["date", "department", "disease", "gender", "patient_count"];
const AI_TEMPLATE_ALLOWED_GENDERS = ["male", "female", "other"];

const AI_TRAINING_JOBS = new Map();

const TRAINING_DATE_KEYS = ["date", "admission_date", "visit_date", "created_at", "encounter_date"];
const TRAINING_DEPARTMENT_KEYS = ["department", "depatrment", "dept", "department_name"];
const TRAINING_DISEASE_KEYS = ["disease", "diagnosis", "condition", "illness", "issue"];
const TRAINING_GENDER_KEYS = ["gender", "sex"];
const TRAINING_COUNT_KEYS = ["patient_count", "count", "patients", "total_patients"];

// Keys are derived via normalizeDepartmentKey() from the master 23-dept list in diseaseDepartmentMap.js
// normalizeDepartmentKey: lowercase, replace /[/\\&]+/ → space, replace non-alnum → underscore, trim underscores
const AI_DISEASE_CATALOG = {
  // "Emergency Medicine" → emergency_medicine
  emergency_medicine: [
    "Road accidents",
    "Heart attack",
    "Stroke",
    "Severe bleeding",
    "Burn injuries",
    "Poisoning",
    "Asthma attack",
    "Fractures",
    "Head injury",
    "Seizures",
  ],
  // "General Physician" → general_physician
  general_physician: [
    "Fever",
    "Cold & flu",
    "Headache",
    "Body pain",
    "Allergy",
    "Cough",
    "Stomach pain",
    "Minor infections",
    "Skin rash",
    "Weakness",
  ],
  // "Cardiology" → cardiology
  cardiology: [
    "Hypertension",
    "Heart attack",
    "Arrhythmia",
    "Heart failure",
    "Coronary artery disease",
    "Angina",
    "Valve disease",
    "Cardiomyopathy",
    "Congenital heart disease",
    "Blood clots",
  ],
  // "Pulmonology" → pulmonology
  pulmonology: [
    "Asthma",
    "COPD",
    "Pneumonia",
    "Tuberculosis",
    "Lung cancer",
    "Pulmonary fibrosis",
    "Bronchitis",
    "Pleural effusion",
    "Sleep apnea",
    "Sarcoidosis",
  ],
  // "Neurology" → neurology
  neurology: [
    "Stroke",
    "Epilepsy",
    "Migraine",
    "Parkinson's disease",
    "Alzheimer's",
    "Brain tumor",
    "Nerve damage",
    "Multiple sclerosis",
    "Head injury",
    "Neuropathy",
  ],
  // "Gastroenterology" → gastroenterology
  gastroenterology: [
    "Gastritis",
    "Peptic ulcer",
    "GERD",
    "Irritable bowel syndrome",
    "Crohn's disease",
    "Ulcerative colitis",
    "Liver disease",
    "Gallstones",
    "Pancreatitis",
    "Colorectal cancer",
  ],
  // "Orthopedics" → orthopedics
  orthopedics: [
    "Fractures",
    "Arthritis",
    "Back pain",
    "Joint pain",
    "Dislocations",
    "Osteoporosis",
    "Sports injury",
    "Spinal problems",
    "Ligament tears",
    "Bone infection",
  ],
  // "Dermatology" → dermatology
  dermatology: [
    "Acne",
    "Eczema",
    "Psoriasis",
    "Fungal infection",
    "Allergy rash",
    "Skin infection",
    "Hair loss",
    "Skin cancer",
    "Vitiligo",
    "Dermatitis",
  ],
  // "ENT (Ear, Nose, Throat)" → ent_ear_nose_throat
  ent_ear_nose_throat: [
    "Ear infection",
    "Hearing loss",
    "Sinusitis",
    "Tonsillitis",
    "Nose bleeding",
    "Throat infection",
    "Allergy",
    "Voice disorders",
    "Ear pain",
    "Nasal blockage",
  ],
  // "Ophthalmology" → ophthalmology
  ophthalmology: [
    "Cataract",
    "Glaucoma",
    "Conjunctivitis",
    "Retinal detachment",
    "Macular degeneration",
    "Diabetic retinopathy",
    "Dry eye syndrome",
    "Myopia",
    "Stye",
    "Uveitis",
  ],
  // "Urology" → urology
  urology: [
    "Kidney stones",
    "UTI",
    "Prostate enlargement",
    "Bladder infection",
    "Kidney failure",
    "Urinary incontinence",
    "Blood in urine",
    "Erectile dysfunction",
    "Cystitis",
    "Tumors",
  ],
  // "Nephrology" → nephrology
  nephrology: [
    "Chronic kidney disease",
    "Acute kidney injury",
    "Nephrotic syndrome",
    "Kidney failure",
    "Polycystic kidney disease",
    "Pyelonephritis",
    "Electrolyte imbalance",
    "Hypertensive nephropathy",
    "Glomerulonephritis",
    "Dialysis management",
  ],
  // "Gynecology / Obstetrics" → gynecology_obstetrics
  gynecology_obstetrics: [
    "Pregnancy",
    "PCOS",
    "Menstrual disorders",
    "Infertility",
    "C-section cases",
    "Miscarriage",
    "Hormonal imbalance",
    "Fibroids",
    "Endometriosis",
    "Vaginal infections",
  ],
  // "Endocrinology" → endocrinology
  endocrinology: [
    "Diabetes",
    "Hypothyroidism",
    "Hyperthyroidism",
    "Cushing's syndrome",
    "Obesity",
    "Hyperlipidemia",
    "Adrenal disorders",
    "Pituitary disorders",
    "Metabolic syndrome",
    "Diabetic ketoacidosis",
  ],
  // "Psychiatry / Mental Health" → psychiatry_mental_health
  psychiatry_mental_health: [
    "Depression",
    "Anxiety disorders",
    "Schizophrenia",
    "Bipolar disorder",
    "PTSD",
    "OCD",
    "ADHD",
    "Eating disorders",
    "Insomnia",
    "Drug abuse",
  ],
  // "Oncology" → oncology
  oncology: [
    "Breast cancer",
    "Lung cancer",
    "Blood cancer",
    "Skin cancer",
    "Prostate cancer",
    "Colon cancer",
    "Brain tumor",
    "Liver cancer",
    "Pancreatic cancer",
    "Leukemia",
  ],
  // "Hematology" → hematology
  hematology: [
    "Anemia",
    "Sickle cell anemia",
    "Thalassemia",
    "Thrombocytopenia",
    "Leukemia",
    "Polycythemia vera",
    "Coagulation disorders",
    "Lymphoma",
    "Blood transfusion reactions",
    "Von Willebrand disease",
  ],
  // "Rheumatology" → rheumatology
  rheumatology: [
    "Rheumatoid arthritis",
    "Systemic lupus erythematosus",
    "Gout",
    "Ankylosing spondylitis",
    "Fibromyalgia",
    "Vasculitis",
    "Sjogren's syndrome",
    "Scleroderma",
    "Psoriatic arthritis",
    "Polymyalgia rheumatica",
  ],
  // "Infectious Disease" → infectious_disease
  infectious_disease: [
    "Malaria",
    "Dengue fever",
    "Typhoid",
    "Tuberculosis",
    "HIV/AIDS",
    "Hepatitis",
    "Sepsis",
    "Lyme disease",
    "Meningitis",
    "COVID-19",
  ],
  // "Dentistry" → dentistry
  dentistry: [
    "Tooth decay",
    "Gum disease",
    "Tooth abscess",
    "Toothache",
    "Oral cancer",
    "Mouth ulcers",
    "Tooth fracture",
    "Dental sensitivity",
    "Temporomandibular disorder",
    "Oral thrush",
  ],
  // "Pediatrics" → pediatrics
  pediatrics: [
    "Fever",
    "Diarrhea",
    "Malnutrition",
    "Asthma",
    "Chickenpox",
    "Measles",
    "Cold & cough",
    "Ear infection",
    "Pneumonia",
    "Growth issues",
  ],
  // "General Surgery" → general_surgery
  general_surgery: [
    "Appendicitis",
    "Hernia",
    "Gallbladder disease",
    "Intestinal obstruction",
    "Colorectal surgery",
    "Thyroid surgery",
    "Breast surgery",
    "Wound care",
    "Peritonitis",
    "Pilonidal cyst",
  ],
  // "Allergy & Immunology" → allergy_immunology
  allergy_immunology: [
    "Seasonal allergies",
    "Food allergies",
    "Drug allergies",
    "Asthma",
    "Anaphylaxis",
    "Eczema",
    "Urticaria",
    "Immunodeficiency",
    "Angioedema",
    "Contact dermatitis",
  ],
};

// Canonical 23-department list — names exactly match diseaseDepartmentMap.js master.
// Single source of truth for both batch/available and batch/create-defaults routes.
const BATCH_DEFAULT_DEPARTMENTS = [
  { name: "Cardiology", description: "Heart and cardiovascular diseases" },
  { name: "Pulmonology", description: "Lung and respiratory diseases" },
  { name: "Neurology", description: "Nervous system diseases" },
  { name: "Gastroenterology", description: "Digestive system diseases" },
  { name: "Orthopedics", description: "Bone and joint diseases" },
  { name: "Dermatology", description: "Skin diseases" },
  { name: "ENT (Ear, Nose, Throat)", description: "Ear, nose, and throat conditions" },
  { name: "Ophthalmology", description: "Eye diseases and vision care" },
  { name: "Urology", description: "Urinary system diseases" },
  { name: "Nephrology", description: "Kidney diseases" },
  { name: "Gynecology / Obstetrics", description: "Women's health and childbirth" },
  { name: "Endocrinology", description: "Hormonal and metabolic diseases" },
  { name: "Psychiatry / Mental Health", description: "Mental health and psychiatric care" },
  { name: "Oncology", description: "Cancer treatment" },
  { name: "Hematology", description: "Blood disorders" },
  { name: "Rheumatology", description: "Autoimmune and joint diseases" },
  { name: "Infectious Disease", description: "Infectious and communicable diseases" },
  { name: "Dentistry", description: "Dental and oral health" },
  { name: "Pediatrics", description: "Child healthcare" },
  { name: "General Surgery", description: "Surgical procedures" },
  { name: "Emergency Medicine", description: "Emergency and trauma care" },
  { name: "General Physician", description: "General medical care and outpatient" },
  { name: "Allergy & Immunology", description: "Allergy and immune system disorders" },
];

const PATIENT_NAME_KEYS = [
  "name",
  "patient_name",
  "full_name",
  "patient",
  "patient_full_name",
  "name_of_patient",
  "patientname",
];
const PATIENT_EMAIL_KEYS = ["email", "patient_email"];
const PATIENT_PHONE_KEYS = ["phone", "mobile", "mobile_number", "contact_number"];
const PATIENT_DOB_KEYS = ["date_of_birth", "dob", "birth_date"];
const PATIENT_GENDER_KEYS = ["gender", "sex"];
const PATIENT_BLOOD_KEYS = ["blood_type", "blood_group", "bloodgroup"];
const PATIENT_ADDRESS_KEYS = ["address", "city", "location"];
const PATIENT_MEDICAL_HISTORY_KEYS = ["medical_history", "history", "diagnosis", "notes"];
const PATIENT_STATUS_KEYS = ["status", "patient_status"];
const PATIENT_SOURCE_ID_KEYS = [
  "source_patient_id",
  "sourcepatientid",
  "patient_source_id",
  "patientsourceid",
  "patient_unique_id",
  "patient_uniqueid",
  "unique_patient_id",
  "unique_id",
  "external_id",
  "source_id",
  "sourceid",
  "record_id",
  "patient_id",
  "patientid",
  "mrn",
  "uhid",
];

function normalizeHeaderKey(rawKey) {
  return String(rawKey || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeLookupToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRecognizedGenderValue(value) {
  const g = String(value || "").trim().toLowerCase();
  return ["male", "female", "other", "m", "f", "o"].includes(g);
}

function hasAnyHeader(foundHeaders, aliases) {
  return aliases.some((alias) => foundHeaders.has(alias));
}

function getAllowedDiseasesByDepartment(departmentName) {
  const deptKey = normalizeDepartmentKey(departmentName);
  return AI_DISEASE_CATALOG[deptKey] || [];
}

function normalizeDiseaseForDepartment(departmentName, rawDisease) {
  const allowed = getAllowedDiseasesByDepartment(departmentName);
  const token = normalizeLookupToken(rawDisease);
  if (!token || allowed.length === 0) return "";

  const byToken = new Map(allowed.map((name) => [normalizeLookupToken(name), name]));
  return byToken.get(token) || "";
}

function ensureDirectorySync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function newJobId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createTrainingJob(payload) {
  const id = newJobId();
  const nowIso = new Date().toISOString();
  const job = {
    id,
    type: "ai_training",
    status: "queued",
    progress: 0,
    message: "Queued",
    created_at: nowIso,
    updated_at: nowIso,
    started_at: null,
    completed_at: null,
    error: null,
    result: null,
    ...payload,
  };
  AI_TRAINING_JOBS.set(id, job);
  return job;
}

function getTrainingJobForHospital(jobId, hospitalId) {
  const job = AI_TRAINING_JOBS.get(String(jobId || ""));
  if (!job) return null;
  if (String(job.hospital_id) !== String(hospitalId)) return null;
  return job;
}

function updateTrainingJob(jobId, patch) {
  const current = AI_TRAINING_JOBS.get(String(jobId || ""));
  if (!current) return null;
  Object.assign(current, patch, { updated_at: new Date().toISOString() });
  return current;
}

function serializeTrainingJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    message: job.message,
    created_at: job.created_at,
    started_at: job.started_at,
    completed_at: job.completed_at,
    updated_at: job.updated_at,
    error: job.error,
    department_id: job.department_id,
    department_name: job.department_name,
    result: job.result,
  };
}

function pruneOldTrainingJobs() {
  const now = Date.now();
  for (const [jobId, job] of AI_TRAINING_JOBS.entries()) {
    const anchor = job.completed_at || job.updated_at || job.created_at;
    const t = new Date(anchor).getTime();
    if (Number.isFinite(t) && now - t > AI_JOB_RETENTION_MS) {
      AI_TRAINING_JOBS.delete(jobId);
    }
  }
}

setInterval(pruneOldTrainingJobs, 60 * 60 * 1000).unref();

function toSafeFileSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .slice(0, 80);
}

function getHospitalAiDir(hospitalId) {
  return path.join(AI_STORAGE_DIR, String(hospitalId));
}

function getDepartmentAiDir(hospitalId, departmentId) {
  return path.join(getHospitalAiDir(hospitalId), "departments", String(departmentId));
}

function getDepartmentAiPaths(hospitalId, departmentId) {
  const deptDir = getDepartmentAiDir(hospitalId, departmentId);
  return {
    dir: deptDir,
    datasetPath: path.join(deptDir, AI_DATASET_NAME),
    trainingDatasetPath: path.join(deptDir, AI_TRAINING_DATASET_NAME),
    modelBundlePath: path.join(deptDir, AI_MODEL_BUNDLE_NAME),
    metadataPath: path.join(deptDir, AI_METADATA_NAME),
    trainingHistoryPath: path.join(deptDir, AI_TRAINING_HISTORY_NAME),
    predictionCachePath: path.join(deptDir, AI_PREDICTION_CACHE_NAME),
  };
}

function getCandidateAiRoots() {
  const roots = [AI_STORAGE_DIR, BACKEND_AI_DIR, CWD_AI_DIR]
    .map((p) => path.resolve(p))
    .filter((p, idx, arr) => arr.indexOf(p) === idx);
  return roots.filter((root) => fs.existsSync(root));
}

function resolveDepartmentAiPaths(hospitalId, departmentId) {
  const primary = getDepartmentAiPaths(hospitalId, departmentId);
  const primaryHasArtifacts =
    fs.existsSync(primary.modelBundlePath) ||
    fs.existsSync(primary.datasetPath) ||
    fs.existsSync(primary.trainingDatasetPath);

  if (primaryHasArtifacts) {
    return primary;
  }

  const deptId = String(departmentId || "").trim();
  if (!deptId) {
    return primary;
  }

  for (const aiRoot of getCandidateAiRoots()) {
    let hospitalFolders = [];
    try {
      hospitalFolders = fs.readdirSync(aiRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch {
      hospitalFolders = [];
    }

    for (const hid of hospitalFolders) {
      const candidate = getDepartmentAiPaths(hid, deptId);
      if (
        fs.existsSync(candidate.modelBundlePath) ||
        fs.existsSync(candidate.datasetPath) ||
        fs.existsSync(candidate.trainingDatasetPath)
      ) {
        return candidate;
      }
    }
  }

  return primary;
}

function getHospitalPatientRecordsDir(hospitalId) {
  return path.join(STORAGE_ROOT_DIR, "patient_records", String(hospitalId));
}

function getHospitalUploadedFilesRootDir(category, hospitalId) {
  const safeCategory = String(category || "").trim();
  if (safeCategory === "ai") {
    return path.join(STORAGE_ROOT_DIR, "ai", String(hospitalId), "uploads");
  }
  if (safeCategory === "resources") {
    return path.join(STORAGE_ROOT_DIR, "resources", String(hospitalId), "uploads");
  }
  return path.join(STORAGE_ROOT_DIR, "patient_records", String(hospitalId), "uploads");
}

function buildArchivedUploadFileName(originalName) {
  const parsed = path.parse(String(originalName || "upload.csv"));
  const safeStem = toSafeFileSegment(parsed.name) || "upload";
  const ext = String(parsed.ext || ".csv").toLowerCase();
  const safeExt = /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : ".csv";
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeStem}${safeExt}`;
}

function archiveUploadedFile({ category, hospitalId, departmentId, sourcePath, originalName }) {
  const rootDir = getHospitalUploadedFilesRootDir(category, hospitalId);
  const departmentSegment = String(departmentId || "").trim() || "unassigned";
  const destinationDir = path.join(rootDir, departmentSegment);
  ensureDirectorySync(destinationDir);

  const fileName = buildArchivedUploadFileName(originalName);
  const destinationPath = path.join(destinationDir, fileName);
  fs.copyFileSync(sourcePath, destinationPath);

  return {
    fileName,
    filePath: destinationPath,
    relativePath: path.join(departmentSegment, fileName).replace(/\\/g, "/"),
  };
}

function resolveArchivedUploadPath(rootDir, relativePath) {
  const safeRelativePath = String(relativePath || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!safeRelativePath) return null;

  const absolutePath = path.resolve(rootDir, safeRelativePath);
  const normalizedRoot = path.resolve(rootDir);
  const relative = path.relative(normalizedRoot, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  return absolutePath;
}

function listArchivedUploadFilesForCategory({ category, hospitalId, departmentNameById = new Map() }) {
  const rootDir = getHospitalUploadedFilesRootDir(category, hospitalId);
  if (!fs.existsSync(rootDir)) return [];

  const files = [];
  let departmentFolders = [];

  try {
    departmentFolders = fs.readdirSync(rootDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }

  for (const departmentId of departmentFolders) {
    const departmentDir = path.join(rootDir, departmentId);
    let entries = [];
    try {
      entries = fs.readdirSync(departmentDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const filePath = path.join(departmentDir, entry.name);
      let stats;
      try {
        stats = fs.statSync(filePath);
      } catch {
        continue;
      }

      const originalName = String(entry.name || "").replace(/^\d+_[a-z0-9]{6}_/i, "");
      files.push({
        category: String(category || ""),
        department_id: departmentId,
        department_name: departmentNameById.get(String(departmentId)) || "Unknown department",
        file_name: entry.name,
        original_name: originalName,
        relative_path: path.join(departmentId, entry.name).replace(/\\/g, "/"),
        size_bytes: stats.size,
        uploaded_at: stats.mtime.toISOString(),
      });
    }
  }

  return files.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
}

function listArchivedResourceFilesForHospital({ hospitalId, departmentNameById = new Map() }) {
  return listArchivedUploadFilesForCategory({
    category: "resources",
    hospitalId,
    departmentNameById,
  });
}

function buildUploadPreview(filePath, originalName = "") {
  const ext = path.extname(String(originalName || filePath || "")).toLowerCase();
  let rows = [];

  if (ext === ".xlsx" || ext === ".xls") {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = Array.isArray(workbook?.SheetNames) ? workbook.SheetNames[0] : "";
    if (!firstSheetName) {
      return { file_type: ext || "unknown", columns: [], preview_rows: [], total_rows: 0 };
    }

    const sheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
      blankrows: false,
    });
  } else {
    const rawCsvText = fs.readFileSync(filePath, "utf-8");
    rows = parseCsv(rawCsvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  const previewRows = rows.slice(0, 20);
  const columns = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  return {
    file_type: ext || "unknown",
    columns,
    preview_rows: previewRows,
    total_rows: rows.length,
  };
}

function parsePatientDatasetRows(filePath, originalName = "") {
  const ext = path.extname(String(originalName || filePath || "")).toLowerCase();
  if (ext === ".xlsx" || ext === ".xls") {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = Array.isArray(workbook?.SheetNames) ? workbook.SheetNames[0] : "";
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
      blankrows: false,
    });
  }

  const rawCsvText = fs.readFileSync(filePath, "utf-8");
  return parseCsv(rawCsvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function backupFileWithRetention(filePath, keep = BACKUP_RETENTION_LIMIT) {
  if (!fs.existsSync(filePath)) return;
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const backupDir = path.join(dir, "backups");
  ensureDirectorySync(backupDir);

  const backupName = `${base}.${Date.now()}.bak`;
  fs.copyFileSync(filePath, path.join(backupDir, backupName));

  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith(`${base}.`) && f.endsWith(".bak"))
    .sort();

  const excess = files.length - keep;
  if (excess > 0) {
    for (let i = 0; i < excess; i += 1) {
      try {
        fs.unlinkSync(path.join(backupDir, files[i]));
      } catch {
        // Ignore backup cleanup errors.
      }
    }
  }
}

function normalizeRowKeys(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row || {})) {
    const cleanedKey = normalizeHeaderKey(key);
    if (!cleanedKey) continue;
    normalized[cleanedKey] = value;
  }
  return normalized;
}

function pickFirstValue(row, keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (!text) continue;
    return text;
  }
  return "";
}

function normalizeGender(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "m" || v === "male") return "male";
  if (v === "f" || v === "female") return "female";
  if (v === "other" || v === "o") return "other";
  return "other";
}

function normalizeBloodType(value) {
  const v = String(value || "").trim().toUpperCase();
  return ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(v) ? v : "";
}

function normalizePatientStatus(value) {
  const v = String(value || "").trim().toLowerCase();
  return ["active", "discharged", "deceased"].includes(v) ? v : "active";
}

function normalizeDateOrNull(value) {
  const d = new Date(String(value || ""));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function safeNumericOrDefault(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function deriveSourceRecordId(normalizedRow, rawRow) {
  const fromMappedKeys = pickFirstValue(normalizedRow, PATIENT_SOURCE_ID_KEYS);
  if (fromMappedKeys) return fromMappedKeys;

  for (const [rawKey, rawValue] of Object.entries(rawRow || {})) {
    const key = normalizeHeaderKey(rawKey);
    if (!key) continue;
    const looksLikeId =
      key.includes("source_patient_id") ||
      key.includes("patient_source_id") ||
      key === "source_id" ||
      key.endsWith("_record_id") ||
      key === "mrn" ||
      key === "uhid";
    if (!looksLikeId) continue;

    const value = String(rawValue ?? "").trim();
    if (value) return value;
  }

  return "";
}

function buildTrainingRowsFromCsv(rows, hospitalId, departmentName) {
  const out = [];
  for (const row of rows) {
    const normalized = normalizeRowKeys(row);
    const dateYmd = normalizeYmd(pickFirstValue(normalized, TRAINING_DATE_KEYS));
    if (!dateYmd) continue;

    const disease = normalizeDiseaseForDepartment(departmentName, pickFirstValue(normalized, TRAINING_DISEASE_KEYS));
    if (!disease) continue;

    let patientCount = safeNumericOrDefault(pickFirstValue(normalized, TRAINING_COUNT_KEYS), Number.NaN);
    if (!Number.isFinite(patientCount) || patientCount < 0) {
      patientCount = 1;
    }

    out.push({
      hospital_id: String(hospitalId),
      date: dateYmd,
      department: String(departmentName),
      disease,
      gender: normalizeGender(pickFirstValue(normalized, TRAINING_GENDER_KEYS) || "other"),
      patient_count: Math.max(0, Math.round(patientCount)),
    });
  }
  return out;
}

function summarizeAiDatasetDryRun(rows, hospitalId, departmentName) {
  const allowedDiseases = getAllowedDiseasesByDepartment(departmentName);
  const report = {
    total_rows: Array.isArray(rows) ? rows.length : 0,
    accepted_rows: 0,
    rejected_rows: 0,
    template: {
      required_columns: AI_TEMPLATE_REQUIRED_COLUMNS,
      found_columns: [],
      missing_columns: [],
      is_valid: false,
    },
    issues: {
      invalid_date_rows: 0,
      invalid_department_rows: 0,
      invalid_disease_rows: 0,
      department_mismatch_rows: 0,
      invalid_gender_rows: 0,
      invalid_count_rows: 0,
      empty_department_rows: 0,
    },
    allowed_diseases: allowedDiseases,
    rejected_samples: [],
    training_rows: [],
    generated_at: new Date().toISOString(),
    hospital_id: String(hospitalId),
    department_name: String(departmentName),
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    report.template.missing_columns = [...AI_TEMPLATE_REQUIRED_COLUMNS];
    return report;
  }

  const firstRow = rows[0] || {};
  const foundColumns = Object.keys(firstRow).map((k) => normalizeHeaderKey(k)).filter(Boolean);
  const foundHeaders = new Set(foundColumns);
  const foundCanonical = {
    date: hasAnyHeader(foundHeaders, TRAINING_DATE_KEYS),
    department: hasAnyHeader(foundHeaders, TRAINING_DEPARTMENT_KEYS),
    disease: hasAnyHeader(foundHeaders, TRAINING_DISEASE_KEYS),
    gender: hasAnyHeader(foundHeaders, TRAINING_GENDER_KEYS),
    patient_count: hasAnyHeader(foundHeaders, TRAINING_COUNT_KEYS),
  };
  report.template.found_columns = Object.keys(foundCanonical).filter((k) => foundCanonical[k]);
  report.template.missing_columns = AI_TEMPLATE_REQUIRED_COLUMNS.filter((c) => !foundCanonical[c]);
  report.template.is_valid = report.template.missing_columns.length === 0;

  for (let idx = 0; idx < rows.length; idx += 1) {
    const rawRow = rows[idx];
    const row = normalizeRowKeys(rawRow);
    const rowIssues = [];

    const dateYmd = normalizeYmd(row.date || "");
    if (!dateYmd) {
      rowIssues.push("invalid_date");
      report.issues.invalid_date_rows += 1;
    }

    const rowDepartment = pickFirstValue(row, TRAINING_DEPARTMENT_KEYS);
    if (!rowDepartment) {
      rowIssues.push("empty_department");
      report.issues.empty_department_rows += 1;
    } else {
      const normalizedRowDept = normalizeDepartmentKey(rowDepartment);
      const normalizedExpectedDept = normalizeDepartmentKey(departmentName);
      if (normalizedExpectedDept && normalizedRowDept && normalizedExpectedDept !== normalizedRowDept) {
        rowIssues.push("department_mismatch");
        report.issues.department_mismatch_rows += 1;
      }
      if (!normalizedRowDept) {
        rowIssues.push("invalid_department");
        report.issues.invalid_department_rows += 1;
      }
    }

    const diseaseRaw = pickFirstValue(row, TRAINING_DISEASE_KEYS);
    const disease = normalizeDiseaseForDepartment(departmentName, diseaseRaw);
    if (!disease) {
      rowIssues.push("invalid_disease");
      report.issues.invalid_disease_rows += 1;
    }

    const rawGender = pickFirstValue(row, TRAINING_GENDER_KEYS);
    if (rawGender && !isRecognizedGenderValue(rawGender)) {
      rowIssues.push("invalid_gender");
      report.issues.invalid_gender_rows += 1;
    }
    const gender = normalizeGender(rawGender || "other");

    const count = Number(row.patient_count);
    if (!Number.isFinite(count) || count < 0) {
      rowIssues.push("invalid_patient_count");
      report.issues.invalid_count_rows += 1;
    }

    if (rowIssues.length > 0 || !report.template.is_valid) {
      report.rejected_rows += 1;
      if (report.rejected_samples.length < 25) {
        report.rejected_samples.push({
          row_number: idx + 2,
          issues: rowIssues.length > 0 ? rowIssues : ["invalid_template_columns"],
          row: rawRow,
        });
      }
      continue;
    }

    report.accepted_rows += 1;
    report.training_rows.push({
      hospital_id: String(hospitalId),
      date: dateYmd,
      department: String(departmentName),
      disease,
      gender,
      patient_count: Math.round(count),
    });
  }

  return report;
}

function detectMappedHeader(rawRow, keys) {
  for (const key of Object.keys(rawRow || {})) {
    const normalized = normalizeHeaderKey(key);
    if (keys.includes(normalized)) return key;
  }
  return "";
}

function buildPatientDatasetDryRun(rows) {
  const totalRows = Array.isArray(rows) ? rows.length : 0;
  const firstRow = totalRows > 0 ? rows[0] : {};

  let accepted = 0;
  let rejected = 0;
  let missingSourceId = 0;
  let missingName = 0;
  let invalidDob = 0;
  let duplicateSourceInFile = 0;
  const sourceSeen = new Set();
  const rejectedSamples = [];

  for (let i = 0; i < totalRows; i += 1) {
    const rawRow = rows[i];
    const row = normalizeRowKeys(rawRow);
    const issues = [];

    const sourceId = deriveSourceRecordId(row, rawRow);
    if (!sourceId) {
      missingSourceId += 1;
    } else {
      if (sourceSeen.has(sourceId)) {
        duplicateSourceInFile += 1;
        issues.push("duplicate_source_id_in_file");
      }
      sourceSeen.add(sourceId);
    }

    const name = pickFirstValue(row, PATIENT_NAME_KEYS);
    if (!name) {
      missingName += 1;
      const email = normalizeEmail(pickFirstValue(row, PATIENT_EMAIL_KEYS));
      const phone = pickFirstValue(row, PATIENT_PHONE_KEYS);
      if (!sourceId && !email && !phone) {
        issues.push("missing_name_and_identifiers");
      }
    }

    const dobValue = pickFirstValue(row, PATIENT_DOB_KEYS);
    if (dobValue && !normalizeDateOrNull(dobValue)) {
      invalidDob += 1;
      issues.push("invalid_date_of_birth");
    }

    if (issues.length > 0) {
      rejected += 1;
      if (rejectedSamples.length < 25) {
        rejectedSamples.push({ row_number: i + 2, issues, row: rawRow });
      }
      continue;
    }

    accepted += 1;
  }

  return {
    total_rows: totalRows,
    accepted_rows: accepted,
    rejected_rows: rejected,
    warning_counts: {
      missing_source_id_rows: missingSourceId,
      missing_name_rows: missingName,
      invalid_date_of_birth_rows: invalidDob,
      duplicate_source_id_rows: duplicateSourceInFile,
    },
    data_dictionary: {
      source_id: detectMappedHeader(firstRow, PATIENT_SOURCE_ID_KEYS),
      name: detectMappedHeader(firstRow, PATIENT_NAME_KEYS),
      email: detectMappedHeader(firstRow, PATIENT_EMAIL_KEYS),
      phone: detectMappedHeader(firstRow, PATIENT_PHONE_KEYS),
      date_of_birth: detectMappedHeader(firstRow, PATIENT_DOB_KEYS),
      gender: detectMappedHeader(firstRow, PATIENT_GENDER_KEYS),
      blood_type: detectMappedHeader(firstRow, PATIENT_BLOOD_KEYS),
      address: detectMappedHeader(firstRow, PATIENT_ADDRESS_KEYS),
      medical_history: detectMappedHeader(firstRow, PATIENT_MEDICAL_HISTORY_KEYS),
      status: detectMappedHeader(firstRow, PATIENT_STATUS_KEYS),
    },
    detected_columns: Object.keys(firstRow || {}),
    rejected_samples: rejectedSamples,
    generated_at: new Date().toISOString(),
  };
}

function getModelMetadataOrNull(metadataPath) {
  if (!fs.existsSync(metadataPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  } catch {
    return null;
  }
}

function appendTrainingHistory(historyPath, entry) {
  try {
    const existing = fs.existsSync(historyPath)
      ? JSON.parse(fs.readFileSync(historyPath, "utf-8"))
      : [];
    const list = Array.isArray(existing) ? existing : [];
    list.push({
      ...entry,
      logged_at: new Date().toISOString(),
    });

    // Keep recent history only.
    const MAX_HISTORY = 50;
    const trimmed = list.slice(-MAX_HISTORY);
    fs.writeFileSync(historyPath, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch {
    // Ignore history write errors to avoid blocking predictions/training.
  }
}

function readPredictionCache(cachePath) {
  try {
    if (!fs.existsSync(cachePath)) return {};
    const parsed = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePredictionCache(cachePath, cache) {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache || {}, null, 2), "utf-8");
  } catch {
    // Ignore cache write errors.
  }
}

function buildPredictionCacheKey({ dateYmd, gender }) {
  return `${PREDICTION_CACHE_VERSION}|all|${String(dateYmd || "")}|${String(gender || "all").toLowerCase()}`;
}

function clearPredictionCache(cachePath) {
  try {
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
    }
  } catch {
    // Ignore cache cleanup errors.
  }
}

function listStoredPredictionEntries(cachePath) {
  const cache = readPredictionCache(cachePath);
  const entries = [];

  for (const [key, value] of Object.entries(cache || {})) {
    const [mode, date, gender] = String(key || "").split("|");
    entries.push({
      key,
      mode: mode || "all",
      date: date || "",
      gender: gender || "all",
      generated_at: value?.generated_at || null,
      model_trained_at: value?.model_trained_at || null,
      payload: value?.payload || null,
    });
  }

  entries.sort((a, b) => {
    const ta = new Date(a.generated_at || 0).getTime();
    const tb = new Date(b.generated_at || 0).getTime();
    return tb - ta;
  });

  return entries;
}

function getModelFreshnessDays(metadata) {
  const trainedAt = metadata?.trained_at_utc ? new Date(metadata.trained_at_utc).getTime() : Number.NaN;
  if (!Number.isFinite(trainedAt)) return null;
  return Math.max(0, Math.floor((Date.now() - trainedAt) / (24 * 60 * 60 * 1000)));
}

async function writeBackgroundAuditLog({ actorUserId, actorEmail, action, hospitalId, metadata }) {
  if (!actorUserId || !hospitalId) return;
  try {
    await AuditLog.create({
      actor_user_id: actorUserId,
      actor_email: String(actorEmail || ""),
      action,
      target_hospital_id: hospitalId,
      metadata: metadata || {},
      ip: "",
    });
  } catch {
    // Ignore background audit logging errors.
  }
}

function toCsv(rows, headers) {
  const quote = (value) => {
    const text = String(value ?? "");
    if (/[,"\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => quote(row[h])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

async function syncPatientRecordsFromCsvRows({ rows, hospitalId, departmentId, actorUserId }) {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let updated_by_source_id = 0;
  let updated_by_email = 0;
  let updated_by_phone_name = 0;

  for (const sourceRow of rows) {
    const row = normalizeRowKeys(sourceRow);
    const sourceRecordId = deriveSourceRecordId(row, sourceRow);
    const email = normalizeEmail(pickFirstValue(row, PATIENT_EMAIL_KEYS));
    const phone = pickFirstValue(row, PATIENT_PHONE_KEYS);
    const rawName = pickFirstValue(row, PATIENT_NAME_KEYS);
    const name = rawName || sourceRecordId || email || phone;

    if (!name) {
      skipped += 1;
      continue;
    }

    let existing = null;
    let matchedBy = "";
    if (sourceRecordId) {
      existing = await Patient.findOne({
        hospital_id: hospitalId,
        department_id: departmentId,
        source_record_id: sourceRecordId,
      });
      if (existing) matchedBy = "source_id";
    }

    if (!existing && email) {
      existing = await Patient.findOne({ hospital_id: hospitalId, department_id: departmentId, email });
      if (existing) matchedBy = "email";
    }

    if (!existing && phone) {
      existing = await Patient.findOne({ hospital_id: hospitalId, department_id: departmentId, phone, name });
      if (existing) matchedBy = "phone_name";
    }

    const payload = {
      name,
      email,
      phone,
      date_of_birth: normalizeDateOrNull(pickFirstValue(row, PATIENT_DOB_KEYS)),
      gender: normalizeGender(pickFirstValue(row, PATIENT_GENDER_KEYS) || ""),
      blood_type: normalizeBloodType(pickFirstValue(row, PATIENT_BLOOD_KEYS)),
      address: pickFirstValue(row, PATIENT_ADDRESS_KEYS),
      medical_history: pickFirstValue(row, PATIENT_MEDICAL_HISTORY_KEYS),
      status: normalizePatientStatus(pickFirstValue(row, PATIENT_STATUS_KEYS)),
      source_record_id: sourceRecordId,
      source_data: sourceRow,
      hospital_id: hospitalId,
      department_id: departmentId,
      created_by: actorUserId || null,
    };

    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      updated += 1;
      if (matchedBy === "source_id") updated_by_source_id += 1;
      else if (matchedBy === "email") updated_by_email += 1;
      else if (matchedBy === "phone_name") updated_by_phone_name += 1;
      continue;
    }

    await Patient.create(payload);
    imported += 1;
  }

  return {
    imported,
    updated,
    skipped,
    total_rows: rows.length,
    dedupe: {
      updated_by_source_id,
      updated_by_email,
      updated_by_phone_name,
    },
  };
}

function getPythonCommand() {
  return process.env.AI_PYTHON_CMD || "python";
}

function parseJsonStdout(stdout) {
  const text = String(stdout || "").trim();
  if (!text) {
    return { success: true };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, message: text };
  }
}

async function runPythonScript(scriptName, args) {
  const pythonCmd = getPythonCommand();
  const scriptPath = path.join(BACKEND_ROOT_DIR, "src", "ai", scriptName);

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Python script not found: ${scriptPath}`);
  }

  try {
    const { stdout, stderr } = await execFileAsync(pythonCmd, [scriptPath, ...args], {
      cwd: BACKEND_ROOT_DIR,
      timeout: 180000,
      maxBuffer: 4 * 1024 * 1024,
    });

    const parsed = parseJsonStdout(stdout);
    if (parsed?.success === false) {
      throw new Error(parsed.message || "Python script returned an error.");
    }

    if (stderr && String(stderr).trim()) {
      console.warn("[AI Python stderr]", String(stderr).trim());
    }

    return parsed;
  } catch (error) {
    const stderr = String(error?.stderr || "").trim();
    const stdout = String(error?.stdout || "").trim();
    const combined = `${stderr}\n${stdout}\n${String(error?.message || "")}`.toLowerCase();

    if (combined.includes("paging file is too small") || combined.includes("dll load failed")) {
      throw new Error(
        "AI prediction runtime is out of memory (Windows paging file). Please restart backend and increase virtual memory/page file size, then try again."
      );
    }

    let parsedMessage = "";
    const parseCandidate = stderr || stdout;
    if (parseCandidate) {
      try {
        const parsed = JSON.parse(parseCandidate);
        parsedMessage = String(parsed?.message || "").trim();
      } catch {
        parsedMessage = "";
      }
    }
    const fallback = parsedMessage || stderr || stdout || error.message || "Python execution failed.";
    throw new Error(fallback);
  }
}

function normalizeYmd(inputDate) {
  const d = new Date(String(inputDate || ""));
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString().slice(0, 10);
}

function jsDateToWeekday(dateObj) {
  return (dateObj.getDay() + 6) % 7;
}

function readDatasetRows(datasetPath) {
  if (!fs.existsSync(datasetPath)) {
    return [];
  }
  const content = fs.readFileSync(datasetPath, "utf-8");
  return parseCsv(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function buildLastSevenDayActual(rows, dateYmd, departmentName, hospitalId, disease = "all", gender = "all") {
  const endDate = new Date(`${dateYmd}T00:00:00.000Z`);
  const hospitalRef = String(hospitalId || "").trim().toLowerCase();
  const deptRef = String(departmentName || "").trim().toLowerCase();
  const diseaseRef = String(disease || "all").trim().toLowerCase();
  const genderRef = String(gender || "all").trim().toLowerCase();
  const bucket = new Map();

  for (const row of rows) {
    const normalized = normalizeRowKeys(row);
    const rowHospital = String(normalized.hospital_id || hospitalId || "").trim().toLowerCase();
    const rowDept = String(pickFirstValue(normalized, TRAINING_DEPARTMENT_KEYS) || departmentName || "").trim().toLowerCase();
    if (hospitalRef && rowHospital && hospitalRef !== rowHospital) continue;
    if (deptRef && rowDept && deptRef !== rowDept) continue;

    const rowDisease = String(pickFirstValue(normalized, TRAINING_DISEASE_KEYS) || "").trim().toLowerCase();
    if (diseaseRef !== "all" && rowDisease !== diseaseRef) continue;

    const rowGender = String(pickFirstValue(normalized, TRAINING_GENDER_KEYS) || "").trim().toLowerCase();
    if (genderRef !== "all" && rowGender !== genderRef) continue;

    const ymd = normalizeYmd(
      pickFirstValue(normalized, TRAINING_DATE_KEYS)
    );
    const rawCount = Number(pickFirstValue(normalized, TRAINING_COUNT_KEYS));
    const count = Number.isFinite(rawCount) ? rawCount : 1;
    if (!ymd || !Number.isFinite(count)) continue;
    bucket.set(ymd, (bucket.get(ymd) || 0) + count);
  }

  const points = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(endDate);
    date.setUTCDate(endDate.getUTCDate() - i);
    const ymd = date.toISOString().slice(0, 10);
    points.push({ date: ymd, actual: Math.round(bucket.get(ymd) || 0) });
  }
  return points;
}

function buildDailyActualSeries(rows, departmentName, hospitalId, disease = "all", gender = "all") {
  const hospitalRef = String(hospitalId || "").trim().toLowerCase();
  const deptRef = String(departmentName || "").trim().toLowerCase();
  const diseaseRef = String(disease || "all").trim().toLowerCase();
  const genderRef = String(gender || "all").trim().toLowerCase();
  const bucket = new Map();

  for (const row of rows || []) {
    const normalized = normalizeRowKeys(row);
    const rowHospital = String(normalized.hospital_id || hospitalId || "").trim().toLowerCase();
    const rowDept = String(pickFirstValue(normalized, TRAINING_DEPARTMENT_KEYS) || departmentName || "").trim().toLowerCase();
    if (hospitalRef && rowHospital && hospitalRef !== rowHospital) continue;
    if (deptRef && rowDept && deptRef !== rowDept) continue;

    const rowDisease = String(pickFirstValue(normalized, TRAINING_DISEASE_KEYS) || "").trim().toLowerCase();
    if (diseaseRef !== "all" && rowDisease !== diseaseRef) continue;

    const rowGender = String(pickFirstValue(normalized, TRAINING_GENDER_KEYS) || "").trim().toLowerCase();
    if (genderRef !== "all" && rowGender !== genderRef) continue;

    const ymd = normalizeYmd(pickFirstValue(normalized, TRAINING_DATE_KEYS));
    const rawCount = Number(pickFirstValue(normalized, TRAINING_COUNT_KEYS));
    const count = Number.isFinite(rawCount) ? rawCount : 1;
    if (!ymd || !Number.isFinite(count)) continue;
    bucket.set(ymd, (bucket.get(ymd) || 0) + count);
  }

  return [...bucket.entries()]
    .map(([date, value]) => ({ date, value: Number(value || 0) }))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function estimateStatisticalForecast(dailySeries, targetDateYmd) {
  const points = Array.isArray(dailySeries) ? dailySeries : [];
  if (!points.length || !targetDateYmd) return null;

  const byDate = new Map(points.map((p) => [String(p.date), Number(p.value || 0)]));
  if (byDate.has(String(targetDateYmd))) {
    return Math.max(0, Math.round(Number(byDate.get(String(targetDateYmd)) || 0)));
  }

  const lastPoint = points[points.length - 1];
  const targetDate = new Date(`${targetDateYmd}T00:00:00.000Z`);
  const lastDate = new Date(`${lastPoint.date}T00:00:00.000Z`);
  if (Number.isNaN(targetDate.getTime()) || Number.isNaN(lastDate.getTime())) return null;

  const horizonDays = Math.max(0, Math.round((targetDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000)));
  const targetDow = jsDateToWeekday(targetDate);

  const recent14 = points.slice(-14).map((p) => Number(p.value || 0));
  const recent7 = points.slice(-7).map((p) => Number(p.value || 0));
  const recentMean = recent7.length ? recent7.reduce((s, v) => s + v, 0) / recent7.length : 0;

  const sameWeekday = points
    .filter((p) => {
      const d = new Date(`${p.date}T00:00:00.000Z`);
      if (Number.isNaN(d.getTime())) return false;
      return jsDateToWeekday(d) === targetDow;
    })
    .slice(-8)
    .map((p) => Number(p.value || 0));
  const sameDowMean = sameWeekday.length
    ? sameWeekday.reduce((s, v) => s + v, 0) / sameWeekday.length
    : recentMean;

  let slope = 0;
  if (recent14.length >= 2) {
    const n = recent14.length;
    const xMean = (n - 1) / 2;
    const yMean = recent14.reduce((s, v) => s + v, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i += 1) {
      const dx = i - xMean;
      num += dx * (recent14[i] - yMean);
      den += dx * dx;
    }
    slope = den > 0 ? num / den : 0;
  }

  const lastValue = Number(recent14.length ? recent14[recent14.length - 1] : 0);
  const trendTarget = lastValue + slope * horizonDays;
  const raw = 0.55 * sameDowMean + 0.30 * recentMean + 0.15 * trendTarget;
  return Math.max(0, Math.round(raw));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function daysBetweenYmd(fromYmd, toYmd) {
  const from = new Date(`${String(fromYmd || "")}T00:00:00.000Z`).getTime();
  const to = new Date(`${String(toYmd || "")}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

function calibratePredictionWithRecentBehavior({ rawExpected, chartData, targetDateYmd }) {
  const rows = Array.isArray(chartData) ? chartData : [];
  if (!Number.isFinite(Number(rawExpected)) || rows.length === 0) {
    return {
      expected: Math.max(0, Math.round(Number(rawExpected || 0))),
      chartPredicted: rows.map((p) => Number(p?.predicted || 0)),
      calibration: { enabled: false },
    };
  }

  const todayYmd = new Date().toISOString().slice(0, 10);
  const observed = rows.filter((p) => String(p?.date || "") <= todayYmd);
  const usable = observed.filter((p) => Number.isFinite(Number(p?.actual)) && Number.isFinite(Number(p?.predicted)));

  if (usable.length < 3) {
    return {
      expected: Math.max(0, Math.round(Number(rawExpected || 0))),
      chartPredicted: rows.map((p) => Number(p?.predicted || 0)),
      calibration: { enabled: false, reason: "insufficient_observed_points" },
    };
  }

  const meanActual = usable.reduce((s, p) => s + Number(p.actual || 0), 0) / usable.length;
  const meanPred = usable.reduce((s, p) => s + Number(p.predicted || 0), 0) / usable.length;
  const bias = usable.reduce((s, p) => s + (Number(p.actual || 0) - Number(p.predicted || 0)), 0) / usable.length;
  const mae = usable.reduce((s, p) => s + Math.abs(Number(p.actual || 0) - Number(p.predicted || 0)), 0) / usable.length;

  const ratioRaw = meanPred > 0 ? meanActual / meanPred : 1;
  const ratio = clamp(ratioRaw, 0.65, 1.6);
  const biasLimited = clamp(bias, -Math.max(3, mae * 1.25), Math.max(3, mae * 1.25));

  let calibratedExpected = Number(rawExpected || 0) * ratio + biasLimited;

  const positiveObserved = usable
    .filter((p) => Number(p.actual || 0) > 0)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  if (positiveObserved.length >= 3) {
    const lastObservedDate = String(positiveObserved[positiveObserved.length - 1].date || "");
    const horizonDays = Math.max(0, daysBetweenYmd(lastObservedDate, targetDateYmd));

    if (horizonDays > 0) {
      const recent = positiveObserved.slice(-3).map((p) => Number(p.actual || 0));
      const trend = recent.length >= 2 ? (recent[recent.length - 1] - recent[0]) / (recent.length - 1) : 0;
      const recentMean = recent.reduce((s, v) => s + v, 0) / recent.length;
      const horizonTarget = Math.max(0, recentMean + trend * horizonDays);
      const blend = clamp(horizonDays / 3, 0, 1) * 0.45;
      calibratedExpected = (1 - blend) * calibratedExpected + blend * horizonTarget;
    }
  }

  const calibratedSeries = rows.map((p) => {
    const raw = Number(p?.predicted || 0);
    const adjusted = raw * ratio + biasLimited;
    return Math.max(0, Math.round(adjusted));
  });

  return {
    expected: Math.max(0, Math.round(calibratedExpected)),
    chartPredicted: calibratedSeries,
    calibration: {
      enabled: true,
      ratio: Number(ratio.toFixed(4)),
      bias: Number(biasLimited.toFixed(4)),
      observed_points: usable.length,
    },
  };
}

async function predictForDateWithBundle(modelBundlePath, hospitalId, departmentName, disease, gender, dateYmd) {
  const d = new Date(`${dateYmd}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date supplied for prediction");
  }

  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const weekday = jsDateToWeekday(new Date(`${dateYmd}T00:00:00`));

  const result = await runPythonScript("predict_patient_flow.py", [
    modelBundlePath,
    String(hospitalId),
    String(departmentName),
    String(disease || "all"),
    String(gender || "all"),
    String(day),
    String(month),
    String(weekday),
    String(dateYmd),
  ]);

  return Number(result?.prediction || 0);
}

async function predictDiseaseBreakdownForDepartment({
  modelBundlePath,
  hospitalId,
  departmentName,
  dateYmd,
  gender,
  targetTotal,
}) {
  const allowedDiseases = getAllowedDiseasesByDepartment(departmentName);
  const breakdown = [];
  for (const diseaseName of allowedDiseases) {
    try {
      const expected = await predictForDateWithBundle(
        modelBundlePath,
        hospitalId,
        departmentName,
        diseaseName,
        gender,
        dateYmd
      );
      breakdown.push({
        disease: diseaseName,
        expected_patients: Number(expected || 0),
      });
    } catch {
      // Skip one disease failure to keep endpoint responsive.
    }
  }

  const rawTotal = breakdown.reduce((sum, item) => sum + Number(item.expected_patients || 0), 0);

  const hasTarget = Number.isFinite(Number(targetTotal));
  const normalizedTarget = hasTarget ? Math.max(0, Math.round(Number(targetTotal))) : null;

  if (hasTarget && normalizedTarget !== null && breakdown.length > 0) {
    if (rawTotal > 0) {
      const scaled = breakdown.map((item) => {
        const raw = Number(item.expected_patients || 0);
        const exact = (raw / rawTotal) * normalizedTarget;
        const base = Math.floor(exact);
        return {
          disease: item.disease,
          expected_patients: base,
          remainder: exact - base,
        };
      });

      let allocated = scaled.reduce((s, item) => s + item.expected_patients, 0);
      let remaining = normalizedTarget - allocated;

      // Largest-remainder method keeps integer counts and exact total.
      scaled.sort((a, b) => b.remainder - a.remainder);
      for (let i = 0; i < scaled.length && remaining > 0; i += 1) {
        scaled[i].expected_patients += 1;
        remaining -= 1;
      }

      breakdown.length = 0;
      for (const item of scaled) {
        breakdown.push({ disease: item.disease, expected_patients: item.expected_patients });
      }
    } else {
      // Fallback when all raw disease predictions are zero.
      const base = Math.floor(normalizedTarget / breakdown.length);
      let remaining = normalizedTarget - base * breakdown.length;
      for (const item of breakdown) {
        item.expected_patients = base + (remaining > 0 ? 1 : 0);
        if (remaining > 0) remaining -= 1;
      }
    }
  }

  breakdown.sort((a, b) => b.expected_patients - a.expected_patients);
  const total = breakdown.reduce((sum, item) => sum + Number(item.expected_patients || 0), 0);

  return {
    diseases: breakdown,
    total_from_breakdown: total,
  };
}

async function predictConsistentDepartmentValue({
  modelBundlePath,
  hospitalId,
  departmentName,
  disease,
  gender,
  dateYmd,
}) {
  const normalizedDisease = String(disease || "all").trim().toLowerCase();
  const allTotal = await predictForDateWithBundle(
    modelBundlePath,
    hospitalId,
    departmentName,
    "all",
    gender,
    dateYmd
  );

  if (normalizedDisease === "all") {
    const breakdown = await predictDiseaseBreakdownForDepartment({
      modelBundlePath,
      hospitalId,
      departmentName,
      dateYmd,
      gender,
      targetTotal: allTotal,
    });
    return {
      expectedPatients: Number(allTotal || 0),
      diseaseBreakdown: breakdown.diseases,
      diseaseBreakdownTotal: breakdown.total_from_breakdown,
    };
  }

  const breakdown = await predictDiseaseBreakdownForDepartment({
    modelBundlePath,
    hospitalId,
    departmentName,
    dateYmd,
    gender,
    targetTotal: allTotal,
  });

  const match = breakdown.diseases.find(
    (item) => String(item?.disease || "").trim().toLowerCase() === normalizedDisease
  );

  return {
    expectedPatients: Number(match?.expected_patients || 0),
    diseaseBreakdown: [],
    diseaseBreakdownTotal: 0,
  };
}

ensureDirectorySync(AI_STORAGE_DIR);

const aiUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        const hospitalDir = path.join(getHospitalAiDir(req.hospitalId), "incoming");
        ensureDirectorySync(hospitalDir);
        cb(null, hospitalDir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (_req, file, cb) => {
      const stamp = Date.now();
      const safeName = toSafeFileSegment(path.parse(file.originalname).name) || "dataset";
      cb(null, `${stamp}_${safeName}.csv`);
    },
  }),
  limits: { fileSize: MAX_AI_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(String(file.originalname || "")).toLowerCase();
    if (ext !== ".csv") {
      cb(new Error("Only CSV files are allowed."));
      return;
    }
    cb(null, true);
  },
});

const patientDatasetUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        const incomingDir = path.join(getHospitalPatientRecordsDir(req.hospitalId), "incoming");
        ensureDirectorySync(incomingDir);
        cb(null, incomingDir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (_req, file, cb) => {
      const stamp = Date.now();
      const safeName = toSafeFileSegment(path.parse(file.originalname).name) || "patient_records";
      const ext = path.extname(String(file.originalname || "")).toLowerCase();
      const normalizedExt = [".csv", ".xlsx", ".xls"].includes(ext) ? ext : ".csv";
      cb(null, `${stamp}_${safeName}${normalizedExt}`);
    },
  }),
  limits: { fileSize: MAX_PATIENT_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(String(file.originalname || "")).toLowerCase();
    if (![".csv", ".xlsx", ".xls"].includes(ext)) {
      cb(new Error("Only CSV, XLSX, or XLS files are allowed."));
      return;
    }
    cb(null, true);
  },
});

const resourceDatasetUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        const incomingDir = path.join(STORAGE_ROOT_DIR, "resources", String(req.hospitalId), "incoming");
        ensureDirectorySync(incomingDir);
        cb(null, incomingDir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (_req, file, cb) => {
      const stamp = Date.now();
      const safeName = toSafeFileSegment(path.parse(file.originalname).name) || "resource_dataset";
      cb(null, `${stamp}_${safeName}.csv`);
    },
  }),
  limits: { fileSize: MAX_RESOURCE_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(String(file.originalname || "")).toLowerCase();
    if (ext !== ".csv") {
      cb(new Error("Only CSV files are allowed."));
      return;
    }
    cb(null, true);
  },
});

async function ensureNotHospitalEmail(email, hospitalId, currentAdminEmail = "") {
  const candidate = normalizeEmail(email || "");
  if (!candidate) return "";

  const [hospital, hospitalAdmins] = await Promise.all([
    Hospital.findById(hospitalId, { email: 1 }),
    User.find({ role: "hospital_admin", hospital_id: hospitalId }, { email: 1 }),
  ]);

  const forbidden = new Set();
  const hospitalEmail = normalizeEmail(hospital?.email || "");
  if (hospitalEmail) forbidden.add(hospitalEmail);

  const adminEmail = normalizeEmail(currentAdminEmail || "");
  if (adminEmail) forbidden.add(adminEmail);

  for (const admin of hospitalAdmins || []) {
    const e = normalizeEmail(admin?.email || "");
    if (e) forbidden.add(e);
  }

  if (forbidden.has(candidate)) {
    return "Hospital email cannot be used by doctors or staff.";
  }
  return "";
}

async function resolveDepartmentForHospital(rawDepartment, hospitalId) {
  const value = String(rawDepartment || "").trim();
  if (!value) return null;

  if (mongoose.Types.ObjectId.isValid(value)) {
    const byId = await Department.findOne({ _id: value, hospital_id: hospitalId });
    return byId || null;
  }

  const byName = await Department.findOne({
    hospital_id: hospitalId,
    name: { $regex: `^${String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
  return byName || null;
}

function serializeDoctor(doctorDoc) {
  const doctor = doctorDoc?.toObject ? doctorDoc.toObject() : doctorDoc;
  const shiftKey = String(doctor.shift || "").trim().toLowerCase();
  const shiftCapacityBySlots = {
    morning: 12,
    evening: 12,
    night: 24,
    flex: 16,
  };
  const shiftCapacity = shiftCapacityBySlots[shiftKey] || 12;
  const rawMaxPatients = doctor.max_patients_per_day === null || doctor.max_patients_per_day === undefined
    ? null
    : Number(doctor.max_patients_per_day);
  const normalizedMaxPatients = rawMaxPatients === null || !Number.isFinite(rawMaxPatients)
    ? null
    : Math.min(Math.max(1, Math.round(rawMaxPatients)), shiftCapacity);

  return {
    id: String(doctor._id),
    doctor_id: doctor.doctor_id || "",
    name: doctor.name,
    email: doctor.email,
    role: doctor.role,
    hospital_id: doctor.hospital_id ? String(doctor.hospital_id) : "",
    phone: doctor.phone,
    specialization: doctor.specialization,
    shift: doctor.shift || "",
    shift_window: getShiftWindow(doctor.shift || ""),
    available_days: Array.isArray(doctor.available_days) ? doctor.available_days : [],
    max_patients_per_day: normalizedMaxPatients,
    experience_years: Number(doctor.experience_years || 0),
    department_id: doctor.department_id?._id ? String(doctor.department_id._id) : (doctor.department_id ? String(doctor.department_id) : null),
    department: doctor.department_id?.name || "",
    status: doctor.status,
    created_at: doctor.created_at,
  };
}

const DEPARTMENT_DOCTOR_CODE_MAP = {
  emergency: "EMED",
  opd: "OPDD",
  cardiology: "CARD",
  pediatrics: "PEDD",
  orthopedics: "ORTHD",
  dermatology: "DERD",
  ent: "ENTD",
  urology: "UROD",
  oncology: "ONCD",
  radiology: "RADD",
  gynecology: "GYND",
  "gynecology_obstetrics": "GYND",
  neurology: "NEUD",
  "general_medicine": "GEND",
};

function normalizeDepartmentKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[/\\&]+/g, " ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getDepartmentDoctorCode(name) {
  const key = normalizeDepartmentKey(name);
  if (DEPARTMENT_DOCTOR_CODE_MAP[key]) {
    return DEPARTMENT_DOCTOR_CODE_MAP[key];
  }

  const compact = String(name || "").replace(/[^A-Za-z]/g, "").toUpperCase();
  const fallback = compact.slice(0, 4) || "DOCD";
  return `${fallback}D`;
}

async function generateNextDoctorId(hospitalId, departmentName) {
  const prefix = getDepartmentDoctorCode(departmentName);
  const doctors = await Staff.find(
    { hospital_id: hospitalId, role: "doctor", doctor_id: { $regex: `^${prefix}` } },
    { doctor_id: 1 }
  );

  let max = 0;
  for (const doctor of doctors) {
    const value = String(doctor.doctor_id || "");
    const match = value.match(/(\d{2,})$/);
    if (!match) continue;
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }

  const next = max + 1;
  return `${prefix}${String(next).padStart(2, "0")}`;
}

function generateDoctorPassword(name = "", doctorId = "") {
  const base = String(name || "Doctor")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 3)
    .toUpperCase() || "DOC";
  const rand = Math.random().toString(36).slice(-4).toUpperCase();
  const suffix = String(doctorId || "D00").slice(-3).toUpperCase();
  return `${base}@${suffix}${rand}`;
}

function getShiftWindow(shift) {
  const key = String(shift || "").trim().toLowerCase();
  if (key === "morning") return "8 AM - 2 PM";
  if (key === "evening") return "2 PM - 8 PM";
  if (key === "night") return "8 PM - 8 AM";
  if (key === "flex") return "Flexible";
  return "";
}

function getAutoDoctorSchedule(departmentName = "", experienceYears = 0) {
  const dept = String(departmentName || "").trim().toLowerCase();

  let shift = "morning";
  if (dept === "emergency") shift = "night";
  if (dept === "pediatrics") shift = "evening";

  const availableDaysByShift = {
    morning: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    evening: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    night: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
    flex: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  };

  const shiftCapacityBySlots = {
    morning: 12,
    evening: 12,
    night: 24,
    flex: 16,
  };
  const maxPatients = shiftCapacityBySlots[shift] || 12;

  return {
    shift,
    available_days: availableDaysByShift[shift] || availableDaysByShift.morning,
    max_patients_per_day: maxPatients,
  };
}

const SMART_WEEKDAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function getShiftSlotCapacity(shift) {
  const shiftKey = String(shift || "").trim().toLowerCase();
  const shiftCapacityBySlots = {
    morning: 12,
    evening: 12,
    night: 24,
    flex: 16,
  };
  return shiftCapacityBySlots[shiftKey] || 12;
}

function normalizeWeekdayName(value) {
  return String(value || "").trim().toLowerCase();
}

function doctorIsAvailableOnWeekday(doctor, weekdayName) {
  const status = String(doctor?.status || "").trim().toLowerCase();
  if (status === "leave" || status === "inactive" || status === "suspended") {
    return false;
  }

  const normalizedTarget = normalizeWeekdayName(weekdayName);
  const availableDays = Array.isArray(doctor?.available_days)
    ? doctor.available_days.map((day) => normalizeWeekdayName(day)).filter(Boolean)
    : [];

  if (availableDays.length === 0) {
    return true;
  }

  return availableDays.includes(normalizedTarget);
}

function getDoctorDailyCapacity(doctor) {
  const shiftCapacity = getShiftSlotCapacity(doctor?.shift || "");
  const raw = Number(doctor?.max_patients_per_day);
  if (!Number.isFinite(raw)) {
    return shiftCapacity;
  }
  return Math.min(Math.max(1, Math.round(raw)), shiftCapacity);
}

function allocateDemandAcrossDoctors(doctorCandidates, plannedDemand) {
  const doctors = Array.isArray(doctorCandidates) ? doctorCandidates : [];
  const demand = Math.max(0, Math.round(Number(plannedDemand || 0)));
  const assignments = doctors.map((doctor) => ({
    doctor_id: String(doctor._id),
    doctor_name: doctor.name,
    shift: doctor.shift || "",
    shift_window: getShiftWindow(doctor.shift || ""),
    capacity: getDoctorDailyCapacity(doctor),
    assigned_patients: 0,
    utilization_pct: 0,
  }));

  if (assignments.length === 0) {
    return {
      assignments,
      assignedTotal: 0,
      unassignedDemand: demand,
    };
  }

  let remaining = demand;
  let slotsLeft = assignments.length;

  for (const assignment of assignments) {
    if (remaining <= 0) break;
    const fairShare = Math.max(1, Math.ceil(remaining / Math.max(1, slotsLeft)));
    const assigned = Math.min(assignment.capacity, fairShare);
    assignment.assigned_patients = assigned;
    remaining -= assigned;
    slotsLeft -= 1;
  }

  if (remaining > 0) {
    for (const assignment of assignments) {
      if (remaining <= 0) break;
      const spare = assignment.capacity - assignment.assigned_patients;
      if (spare <= 0) continue;
      const extra = Math.min(spare, remaining);
      assignment.assigned_patients += extra;
      remaining -= extra;
    }
  }

  for (const assignment of assignments) {
    assignment.utilization_pct = assignment.capacity > 0
      ? Number(((assignment.assigned_patients / assignment.capacity) * 100).toFixed(1))
      : 0;
  }

  const assignedTotal = assignments.reduce((sum, item) => sum + Number(item.assigned_patients || 0), 0);

  return {
    assignments,
    assignedTotal,
    unassignedDemand: Math.max(0, remaining),
  };
}

async function estimateFallbackDepartmentDemand({ hospitalId, departmentDoctors, dateObj }) {
  const doctorIds = (Array.isArray(departmentDoctors) ? departmentDoctors : [])
    .map((doctor) => doctor?._id)
    .filter(Boolean);

  if (doctorIds.length === 0) {
    return 0;
  }

  const targetWeekday = dateObj.getUTCDay();
  const endDate = new Date(Date.UTC(
    dateObj.getUTCFullYear(),
    dateObj.getUTCMonth(),
    dateObj.getUTCDate(),
    23,
    59,
    59,
    999
  ));
  const startDate = new Date(endDate.getTime() - 56 * 24 * 60 * 60 * 1000);

  const aggregate = await Appointment.aggregate([
    {
      $match: {
        hospital_id: new mongoose.Types.ObjectId(String(hospitalId)),
        doctor_id: { $in: doctorIds.map((id) => new mongoose.Types.ObjectId(String(id))) },
        status: { $ne: "cancelled" },
        appointment_at: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $addFields: {
        weekday: { $dayOfWeek: "$appointment_at" },
      },
    },
    {
      $match: {
        weekday: targetWeekday + 1,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$appointment_at" },
          month: { $month: "$appointment_at" },
          day: { $dayOfMonth: "$appointment_at" },
        },
        total: { $sum: 1 },
      },
    },
  ]);

  if (!Array.isArray(aggregate) || aggregate.length === 0) {
    return 0;
  }

  const counts = aggregate.map((row) => Number(row?.total || 0)).filter((value) => Number.isFinite(value));
  if (counts.length === 0) {
    return 0;
  }

  const avg = counts.reduce((sum, value) => sum + value, 0) / counts.length;
  return Math.max(0, Math.round(avg));
}

async function predictDepartmentDemandForDate({
  hospitalId,
  department,
  dateYmd,
  gender,
  departmentDoctors,
}) {
  const aiPaths = resolveDepartmentAiPaths(hospitalId, department._id);
  const result = {
    expected_patients: 0,
    source: "historical_fallback",
    unavailable_reason: "model_not_trained",
  };

  const dateObj = new Date(`${dateYmd}T00:00:00.000Z`);
  if (!fs.existsSync(aiPaths.modelBundlePath)) {
    result.expected_patients = await estimateFallbackDepartmentDemand({
      hospitalId,
      departmentDoctors,
      dateObj,
    });
    return result;
  }

  try {
    // Smart scheduling needs only total demand, so avoid expensive disease-level breakdown.
    const predictionValue = await predictForDateWithBundle(
      aiPaths.modelBundlePath,
      hospitalId,
      department.name,
      "all",
      gender,
      dateYmd
    );
    result.expected_patients = Math.max(0, Math.round(Number(predictionValue || 0)));
    result.source = "model_prediction";
    result.unavailable_reason = "";
    return result;
  } catch (error) {
    result.expected_patients = await estimateFallbackDepartmentDemand({
      hospitalId,
      departmentDoctors,
      dateObj,
    });
    result.unavailable_reason = error?.message || "prediction_failed";
    return result;
  }
}

// All routes require hospital_admin role and hospital_id isolation
const protectedRouteMiddleware = [...requireHospitalAdmin, restrictToOwnHospital];
router.use(protectedRouteMiddleware);

// Debug endpoint to verify authentication and hospital context
router.get("/debug/context", async (req, res) => {
  return res.json({
    success: true,
    authUser: req.authUser ? {
      id: String(req.authUser._id),
      role: req.authUser.role,
      email: req.authUser.email,
    } : null,
    hospitalId: req.hospitalId || null,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// PROFILE
// ---------------------------------------------------------------------------

// GET /api/hospital-admin/profile — Return logged-in admin's details
router.get("/profile", async (req, res, next) => {
  try {
    const admin = await User.findById(req.authUser._id, {
      password: 0,
      __v: 0,
      failed_login_attempts: 0,
      locked_until: 0,
      google_id: 0,
    }).populate("hospital_id", "name city email phone contact_number status is_active");

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    return res.json({
      success: true,
      profile: {
        id: String(admin._id),
        name: admin.username,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
        is_online: admin.is_online,
        last_login_at: admin.last_login_at,
        created_at: admin.created_at,
        hospital: admin.hospital_id,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/hospital-admin/profile — Update name, phone, and/or password
router.put("/profile", async (req, res, next) => {
  try {
    const admin = await User.findById(req.authUser._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    let updated = false;

    if (req.body?.name !== undefined) {
      const name = String(req.body.name || "").trim();
      if (!name) {
        return res.status(400).json({ success: false, message: "Name cannot be empty." });
      }
      admin.username = name;
      updated = true;
    }

    if (req.body?.phone !== undefined) {
      admin.phone = String(req.body.phone || "").trim();
      updated = true;
    }

    if (req.body?.password !== undefined) {
      const passwordError = validatePassword(req.body.password);
      if (passwordError) {
        return res.status(400).json({ success: false, message: passwordError });
      }
      if (!req.body?.current_password) {
        return res.status(400).json({ success: false, message: "current_password is required to change your password." });
      }
      const validCurrent = await bcrypt.compare(String(req.body.current_password), admin.password);
      if (!validCurrent) {
        return res.status(401).json({ success: false, message: "Current password is incorrect." });
      }
      admin.password = await bcrypt.hash(String(req.body.password), 10);
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({ success: false, message: "No fields to update. Provide name, phone, or password." });
    }

    await admin.save();

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_profile_update",
      targetUserId: admin._id,
      targetHospitalId: req.hospitalId,
      metadata: { updated_fields: Object.keys(req.body).filter((k) => k !== "password" && k !== "current_password") },
    });

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      profile: {
        id: String(admin._id),
        name: admin.username,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// STAFF MANAGEMENT
// ---------------------------------------------------------------------------

// POST /api/hospital-admin/doctors — Create doctor and assign department
router.post("/doctors", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const rawEmail = String(req.body?.email || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const specialization = String(req.body?.specialization || "").trim();
    const departmentValue = String(req.body?.department || req.body?.department_id || "").trim();
    const experienceYearsRaw = req.body?.experience_years;
    const shift = String(req.body?.shift || "").trim().toLowerCase();
    const availableDaysRaw = req.body?.available_days;
    const maxPatientsRaw = req.body?.max_patients_per_day;
    const statusRaw = String(req.body?.status || "active").trim().toLowerCase();

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!rawEmail || !isValidEmail(rawEmail)) {
      return res.status(400).json({ success: false, message: "A valid email is required." });
    }

    const email = normalizeEmail(rawEmail);
    const restrictedEmailMessage = await ensureNotHospitalEmail(email, req.hospitalId, req.authUser?.email || "");
    if (restrictedEmailMessage) {
      return res.status(400).json({ success: false, message: restrictedEmailMessage });
    }

    const existing = await Staff.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "A doctor/staff account with this email already exists." });
    }

    let department = null;
    if (departmentValue) {
      department = await resolveDepartmentForHospital(departmentValue, req.hospitalId);
      if (!department) {
        return res.status(404).json({ success: false, message: "Department not found in this hospital." });
      }
    } else {
      return res.status(400).json({ success: false, message: "Department is required." });
    }

    let experienceYears = 0;
    if (experienceYearsRaw !== undefined && String(experienceYearsRaw).trim() !== "") {
      experienceYears = Number(experienceYearsRaw);
      if (!Number.isFinite(experienceYears) || experienceYears < 0) {
        return res.status(400).json({ success: false, message: "experience_years must be a non-negative number." });
      }
    }

    if (shift && !["morning", "evening", "night", "flex"].includes(shift)) {
      return res.status(400).json({ success: false, message: "shift must be one of: morning, evening, night, flex." });
    }

    const availableDays = Array.isArray(availableDaysRaw)
      ? availableDaysRaw.map((d) => String(d || "").trim()).filter(Boolean)
      : String(availableDaysRaw || "")
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean);

    const maxPatientsPerDayRaw = String(maxPatientsRaw ?? "").trim();
    const maxPatientsPerDay = maxPatientsPerDayRaw ? Number(maxPatientsPerDayRaw) : null;
    if (maxPatientsPerDay !== null && (!Number.isFinite(maxPatientsPerDay) || maxPatientsPerDay <= 0)) {
      return res.status(400).json({ success: false, message: "max_patients_per_day must be a positive number." });
    }

    if (!["active", "suspended", "leave"].includes(statusRaw)) {
      return res.status(400).json({ success: false, message: "status must be active, suspended, or leave." });
    }

    const autoSchedule = getAutoDoctorSchedule(department.name, experienceYears);
    const shiftValue = shift || autoSchedule.shift;
    if (!["morning", "evening", "night", "flex"].includes(shiftValue)) {
      return res.status(400).json({ success: false, message: "shift must be one of: morning, evening, night, flex." });
    }
    const normalizedAvailableDays = availableDays.length > 0 ? availableDays : autoSchedule.available_days;
    const rawMaxPatientsPerDay = maxPatientsPerDay === null
      ? autoSchedule.max_patients_per_day
      : Math.round(maxPatientsPerDay);
    const shiftCapacityBySlots = {
      morning: 12,
      evening: 12,
      night: 24,
      flex: 16,
    };
    const shiftCapacity = shiftCapacityBySlots[shiftValue] || 12;
    const normalizedMaxPatientsPerDay = Math.min(rawMaxPatientsPerDay, shiftCapacity);

    const doctorId = await generateNextDoctorId(req.hospitalId, department.name);
    const password = generateDoctorPassword(name, doctorId);
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(500).json({ success: false, message: "Failed to generate secure password." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await Staff.create({
      doctor_id: doctorId,
      name,
      email,
      password: hashedPassword,
      role: "doctor",
      hospital_id: req.hospitalId,
      department_id: department?._id || null,
      phone,
      specialization,
      shift: shiftValue,
      available_days: normalizedAvailableDays,
      max_patients_per_day: normalizedMaxPatientsPerDay,
      experience_years: experienceYears,
      status: statusRaw,
      created_by: req.authUser._id,
    });

    const populated = await Staff.findById(doctor._id, { password: 0, __v: 0 }).populate("department_id", "name status");

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "doctor_create",
      targetHospitalId: req.hospitalId,
      metadata: {
        staff_id: String(doctor._id),
        doctor_id: doctor.doctor_id,
        staff_email: doctor.email,
        staff_role: "doctor",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Doctor account created successfully.",
      generated_password: password,
      doctor: serializeDoctor(populated || doctor),
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/doctors — Get all doctors for current hospital
router.get("/doctors", async (req, res, next) => {
  try {
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const specializationFilter = String(req.query.specialization || "").trim();
    const departmentFilter = String(req.query.department || req.query.department_id || "").trim();

    const filter = { hospital_id: req.hospitalId, role: "doctor" };
    if (statusFilter === "active" || statusFilter === "suspended" || statusFilter === "leave") {
      filter.status = statusFilter;
    }
    if (specializationFilter) {
      filter.specialization = { $regex: specializationFilter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }

    if (departmentFilter) {
      const department = await resolveDepartmentForHospital(departmentFilter, req.hospitalId);
      if (!department) {
        return res.status(404).json({ success: false, message: "Department not found in this hospital." });
      }
      filter.department_id = department._id;
    }

    const doctors = await Staff.find(filter, { password: 0, __v: 0 })
      .populate("department_id", "name status")
      .sort({ created_at: -1 });

    for (const doctor of doctors) {
      let changed = false;
      if (!doctor.hospital_id) {
        doctor.hospital_id = req.hospitalId;
        changed = true;
      }
      if (!doctor.doctor_id) {
        const departmentName = doctor?.department_id?.name || "General";
        doctor.doctor_id = await generateNextDoctorId(req.hospitalId, departmentName);
        changed = true;
      }
      const shiftKey = String(doctor.shift || "").trim().toLowerCase();
      const shiftCapacityBySlots = {
        morning: 12,
        evening: 12,
        night: 24,
        flex: 16,
      };
      const shiftCapacity = shiftCapacityBySlots[shiftKey] || 12;
      if (Number.isFinite(Number(doctor.max_patients_per_day)) && Number(doctor.max_patients_per_day) > shiftCapacity) {
        doctor.max_patients_per_day = shiftCapacity;
        changed = true;
      }
      if (changed) {
        await doctor.save();
      }
    }

    return res.json({ success: true, doctors: doctors.map(serializeDoctor) });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/doctors/:id — Get single doctor
router.get("/doctors/:id", async (req, res, next) => {
  try {
    const doctorId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: "Invalid doctor id." });
    }

    const doctor = await Staff.findOne(
      { _id: doctorId, hospital_id: req.hospitalId, role: "doctor" },
      { password: 0, __v: 0 }
    ).populate("department_id", "name status");

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    return res.json({ success: true, doctor: serializeDoctor(doctor) });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/hospital-admin/doctors/:id — Update doctor details
router.put("/doctors/:id", async (req, res, next) => {
  try {
    const doctorId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: "Invalid doctor id." });
    }

    const doctor = await Staff.findOne({ _id: doctorId, hospital_id: req.hospitalId, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    if (!doctor.hospital_id) {
      doctor.hospital_id = req.hospitalId;
    }

    if (req.body?.name !== undefined) {
      const name = String(req.body.name || "").trim();
      if (!name) {
        return res.status(400).json({ success: false, message: "Name cannot be empty." });
      }
      doctor.name = name;
    }

    if (req.body?.email !== undefined) {
      const rawEmail = String(req.body.email || "").trim();
      if (!rawEmail || !isValidEmail(rawEmail)) {
        return res.status(400).json({ success: false, message: "A valid email is required." });
      }
      const email = normalizeEmail(rawEmail);
      const restrictedEmailMessage = await ensureNotHospitalEmail(email, req.hospitalId, req.authUser?.email || "");
      if (restrictedEmailMessage) {
        return res.status(400).json({ success: false, message: restrictedEmailMessage });
      }
      const emailExists = await Staff.findOne({ email, _id: { $ne: doctor._id } });
      if (emailExists) {
        return res.status(409).json({ success: false, message: "A doctor/staff account with this email already exists." });
      }
      doctor.email = email;
    }

    let scheduleDepartmentName = "";
    if (req.body?.department !== undefined || req.body?.department_id !== undefined) {
      const departmentValue = String(req.body?.department || req.body?.department_id || "").trim();
      if (!departmentValue) {
        doctor.department_id = null;
      } else {
        const department = await resolveDepartmentForHospital(departmentValue, req.hospitalId);
        if (!department) {
          return res.status(404).json({ success: false, message: "Department not found in this hospital." });
        }
        doctor.department_id = department._id;
        scheduleDepartmentName = department.name;
      }
    }

    if (req.body?.specialization !== undefined) {
      doctor.specialization = String(req.body.specialization || "").trim();
    }
    if (req.body?.phone !== undefined) {
      doctor.phone = String(req.body.phone || "").trim();
    }
    if (req.body?.shift !== undefined) {
      const shift = String(req.body.shift || "").trim().toLowerCase();
      if (shift && !["morning", "evening", "night", "flex"].includes(shift)) {
        return res.status(400).json({ success: false, message: "shift must be one of: morning, evening, night, flex." });
      }
      doctor.shift = shift || "";
    }
    if (req.body?.available_days !== undefined) {
      const availableDaysRaw = req.body.available_days;
      const availableDays = Array.isArray(availableDaysRaw)
        ? availableDaysRaw.map((d) => String(d || "").trim()).filter(Boolean)
        : String(availableDaysRaw || "")
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean);
      doctor.available_days = availableDays;
    }
    if (req.body?.max_patients_per_day !== undefined) {
      const raw = String(req.body.max_patients_per_day ?? "").trim();
      const maxPatientsPerDay = raw ? Number(raw) : null;
      if (maxPatientsPerDay !== null && (!Number.isFinite(maxPatientsPerDay) || maxPatientsPerDay <= 0)) {
        return res.status(400).json({ success: false, message: "max_patients_per_day must be a positive number." });
      }
      doctor.max_patients_per_day = maxPatientsPerDay === null ? null : Math.round(maxPatientsPerDay);
    }
    if (req.body?.experience_years !== undefined) {
      const years = Number(req.body.experience_years);
      if (!Number.isFinite(years) || years < 0) {
        return res.status(400).json({ success: false, message: "experience_years must be a non-negative number." });
      }
      doctor.experience_years = years;
    }
    if (req.body?.status !== undefined) {
      const status = String(req.body.status || "").trim().toLowerCase();
      if (status !== "active" && status !== "suspended" && status !== "leave") {
        return res.status(400).json({ success: false, message: "Status must be 'active', 'suspended', or 'leave'." });
      }
      doctor.status = status;
    }

    if (!scheduleDepartmentName && doctor.department_id) {
      const departmentDoc = await Department.findById(doctor.department_id, { name: 1 });
      scheduleDepartmentName = departmentDoc?.name || "";
    }

    if (!doctor.doctor_id) {
      doctor.doctor_id = await generateNextDoctorId(req.hospitalId, scheduleDepartmentName || "General");
    }

    const autoSchedule = getAutoDoctorSchedule(scheduleDepartmentName, doctor.experience_years || 0);
    if (!doctor.shift) {
      doctor.shift = autoSchedule.shift;
    }
    if (!Array.isArray(doctor.available_days) || doctor.available_days.length === 0) {
      doctor.available_days = autoSchedule.available_days;
    }
    if (doctor.max_patients_per_day === null || doctor.max_patients_per_day === undefined) {
      doctor.max_patients_per_day = autoSchedule.max_patients_per_day;
    }
    const shiftCapacityBySlots = {
      morning: 12,
      evening: 12,
      night: 24,
      flex: 16,
    };
    const effectiveShiftKey = String(doctor.shift || autoSchedule.shift || "morning").trim().toLowerCase();
    const shiftCapacity = shiftCapacityBySlots[effectiveShiftKey] || 12;
    if (Number.isFinite(Number(doctor.max_patients_per_day)) && Number(doctor.max_patients_per_day) > shiftCapacity) {
      doctor.max_patients_per_day = shiftCapacity;
    }

    await doctor.save();
    const populated = await Staff.findById(doctor._id, { password: 0, __v: 0 }).populate("department_id", "name status");

    return res.json({ success: true, message: "Doctor updated successfully.", doctor: serializeDoctor(populated || doctor) });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/doctors-next-id?department_id=...
router.get("/doctors-next-id", async (req, res, next) => {
  try {
    const departmentValue = String(req.query?.department_id || req.query?.department || "").trim();
    if (!departmentValue) {
      return res.status(400).json({ success: false, message: "department_id is required." });
    }

    const department = await resolveDepartmentForHospital(departmentValue, req.hospitalId);
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found in this hospital." });
    }

    const doctorId = await generateNextDoctorId(req.hospitalId, department.name);
    return res.json({ success: true, doctor_id: doctorId, hospital_id: String(req.hospitalId), department: department.name });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/hospital-admin/doctors/:id — Remove doctor account
router.delete("/doctors/:id", async (req, res, next) => {
  try {
    const doctorId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: "Invalid doctor id." });
    }

    const doctor = await Staff.findOne({ _id: doctorId, hospital_id: req.hospitalId, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    await Patient.updateMany(
      { hospital_id: req.hospitalId, assigned_doctor_id: doctor._id },
      { $set: { assigned_doctor_id: null } }
    );

    await Staff.deleteOne({ _id: doctor._id });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "doctor_delete",
      targetHospitalId: req.hospitalId,
      metadata: { doctor_id: doctorId, doctor_email: doctor.email },
    });

    return res.json({ success: true, message: "Doctor account removed successfully." });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/doctor-schedule-requests — List doctor schedule change requests
router.get("/doctor-schedule-requests", async (req, res, next) => {
  try {
    const status = String(req.query?.status || "").trim().toLowerCase();
    const filter = { hospital_id: req.hospitalId };
    if (["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const requests = await DoctorScheduleChangeRequest.find(filter)
      .populate("doctor_id", "name email doctor_id shift status available_days")
      .populate("reviewed_by", "username email")
      .sort({ created_at: -1 })
      .limit(100);

    return res.json({ success: true, requests });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/hospital-admin/doctor-schedule-requests/:id — Approve or reject request
router.put("/doctor-schedule-requests/:id", async (req, res, next) => {
  try {
    const requestId = String(req.params?.id || "").trim();
    const action = String(req.body?.action || "").trim().toLowerCase();
    const reviewNote = String(req.body?.review_note || "").trim();

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid request id." });
    }
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be approve or reject." });
    }

    const request = await DoctorScheduleChangeRequest.findOne({ _id: requestId, hospital_id: req.hospitalId });
    if (!request) {
      return res.status(404).json({ success: false, message: "Schedule change request not found." });
    }
    if (request.status !== "pending") {
      return res.status(409).json({ success: false, message: "This request has already been reviewed." });
    }

    const doctor = await Staff.findOne({ _id: request.doctor_id, hospital_id: req.hospitalId, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found for this request." });
    }

    if (action === "approve") {
      doctor.shift = request.requested_shift || doctor.shift;
      doctor.status = request.requested_status || doctor.status;
      doctor.available_days = Array.isArray(request.requested_available_days)
        ? request.requested_available_days
        : doctor.available_days;

      // Keep doctor daily capacity aligned with approved shift slot capacity.
      const approvedShift = String(doctor.shift || "").trim().toLowerCase();
      const shiftCapacityBySlots = {
        morning: 12,
        evening: 12,
        night: 24,
        flex: 16,
      };
      doctor.max_patients_per_day = shiftCapacityBySlots[approvedShift] || 12;

      await doctor.save();
      request.status = "approved";
    } else {
      request.status = "rejected";
    }

    request.reviewed_by = req.authUser._id;
    request.reviewed_at = new Date();
    request.review_note = reviewNote;
    await request.save();

    return res.json({
      success: true,
      message: action === "approve" ? "Schedule request approved." : "Schedule request rejected.",
      request,
      doctor: serializeDoctor(doctor),
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/hospital-admin/staff — Create a staff member (doctor/nurse/staff/receptionist)
router.post("/staff", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const rawEmail = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    const role = String(req.body?.role || "").trim().toLowerCase();
    const phone = String(req.body?.phone || "").trim();
    const specialization = String(req.body?.specialization || "").trim();
    const departmentId = String(req.body?.department_id || "").trim();

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!rawEmail || !isValidEmail(rawEmail)) {
      return res.status(400).json({ success: false, message: "A valid email is required." });
    }
    const allowedRoles = ["doctor", "nurse", "staff", "receptionist"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${allowedRoles.join(", ")}.`,
      });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const email = normalizeEmail(rawEmail);
    const restrictedEmailMessage = await ensureNotHospitalEmail(email, req.hospitalId, req.authUser?.email || "");
    if (restrictedEmailMessage) {
      return res.status(400).json({ success: false, message: restrictedEmailMessage });
    }

    const existing = await Staff.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "A staff member with this email already exists." });
    }

    if (departmentId) {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({ success: false, message: "Invalid department_id." });
      }
      const dept = await Department.findOne({ _id: departmentId, hospital_id: req.hospitalId });
      if (!dept) {
        return res.status(404).json({ success: false, message: "Department not found in this hospital." });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await Staff.create({
      name,
      email,
      password: hashedPassword,
      role,
      hospital_id: req.hospitalId,
      department_id: departmentId || null,
      phone,
      specialization,
      status: "active",
      created_by: req.authUser._id,
    });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "staff_create",
      targetHospitalId: req.hospitalId,
      metadata: {
        staff_id: String(staff._id),
        staff_email: email,
        staff_role: role,
      },
    });

    return res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
      staff: {
        id: String(staff._id),
        name: staff.name,
        email: staff.email,
        role: staff.role,
        phone: staff.phone,
        specialization: staff.specialization,
        department_id: staff.department_id ? String(staff.department_id) : null,
        status: staff.status,
        created_at: staff.created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/staff — List all staff in this hospital
router.get("/staff", async (req, res, next) => {
  try {
    const roleFilter = String(req.query.role || "").trim().toLowerCase();
    const statusFilter = String(req.query.status || "").trim().toLowerCase();

    const filter = { hospital_id: req.hospitalId };
    const allowedRoles = ["doctor", "nurse", "staff", "receptionist"];
    if (roleFilter && allowedRoles.includes(roleFilter)) {
      filter.role = roleFilter;
    }
    if (statusFilter === "active" || statusFilter === "suspended") {
      filter.status = statusFilter;
    }

    const staff = await Staff.find(filter, { password: 0, __v: 0 })
      .populate("department_id", "name status")
      .sort({ created_at: -1 });

    return res.json({ success: true, staff });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/staff/:id — Get one staff member
router.get("/staff/:id", async (req, res, next) => {
  try {
    const staffId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ success: false, message: "Invalid staff id." });
    }

    const member = await Staff.findOne({ _id: staffId, hospital_id: req.hospitalId }, { password: 0, __v: 0 }).populate(
      "department_id",
      "name status"
    );

    if (!member) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }

    return res.json({ success: true, staff: member });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/hospital-admin/staff/:id — Update staff member info
router.patch("/staff/:id", async (req, res, next) => {
  try {
    const staffId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ success: false, message: "Invalid staff id." });
    }

    const member = await Staff.findOne({ _id: staffId, hospital_id: req.hospitalId });
    if (!member) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }

    const allowedUpdates = ["name", "phone", "specialization", "department_id"];
    for (const key of allowedUpdates) {
      if (req.body?.[key] !== undefined) {
        if (key === "department_id") {
          const deptId = String(req.body.department_id || "").trim();
          if (deptId) {
            if (!mongoose.Types.ObjectId.isValid(deptId)) {
              return res.status(400).json({ success: false, message: "Invalid department_id." });
            }
            const dept = await Department.findOne({ _id: deptId, hospital_id: req.hospitalId });
            if (!dept) {
              return res.status(404).json({ success: false, message: "Department not found in this hospital." });
            }
            member.department_id = deptId;
          } else {
            member.department_id = null;
          }
        } else {
          member[key] = String(req.body[key] || "").trim();
        }
      }
    }

    await member.save();

    return res.json({ success: true, message: "Staff member updated.", staff: { ...member.toObject(), password: undefined } });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/hospital-admin/staff/:id/status — Suspend or activate a staff member
router.patch("/staff/:id/status", async (req, res, next) => {
  try {
    const staffId = String(req.params.id || "").trim();
    const newStatus = String(req.body?.status || "").trim().toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ success: false, message: "Invalid staff id." });
    }
    if (newStatus !== "active" && newStatus !== "suspended") {
      return res.status(400).json({ success: false, message: "Status must be 'active' or 'suspended'." });
    }

    const member = await Staff.findOne({ _id: staffId, hospital_id: req.hospitalId });
    if (!member) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }

    member.status = newStatus;
    await member.save();

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: `staff_${newStatus}`,
      targetHospitalId: req.hospitalId,
      metadata: { staff_id: staffId, staff_email: member.email, staff_role: member.role },
    });

    return res.json({
      success: true,
      message: `Staff member ${newStatus === "active" ? "activated" : "suspended"} successfully.`,
      staff: { id: String(member._id), status: member.status },
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/hospital-admin/staff/:id — Remove a staff member
router.delete("/staff/:id", async (req, res, next) => {
  try {
    const staffId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ success: false, message: "Invalid staff id." });
    }

    const member = await Staff.findOne({ _id: staffId, hospital_id: req.hospitalId });
    if (!member) {
      return res.status(404).json({ success: false, message: "Staff member not found." });
    }

    // Unlink as head doctor from any departments
    await Department.updateMany({ head_doctor_id: staffId, hospital_id: req.hospitalId }, { $set: { head_doctor_id: null } });

    await Staff.deleteOne({ _id: staffId });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "staff_delete",
      targetHospitalId: req.hospitalId,
      metadata: { staff_id: staffId, staff_email: member.email, staff_role: member.role },
    });

    return res.json({ success: true, message: "Staff member removed." });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// DEPARTMENT MANAGEMENT
// ---------------------------------------------------------------------------

// POST /api/hospital-admin/departments — Create a department
router.post("/departments", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const description = String(req.body?.description || "").trim();
    const headDoctorId = String(req.body?.head_doctor_id || "").trim();

    if (!name) {
      return res.status(400).json({ success: false, message: "Department name is required." });
    }

    const existing = await Department.findOne({
      hospital_id: req.hospitalId,
      name: { $regex: `^${name}$`, $options: "i" },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "A department with this name already exists in your hospital." });
    }

    if (headDoctorId) {
      if (!mongoose.Types.ObjectId.isValid(headDoctorId)) {
        return res.status(400).json({ success: false, message: "Invalid head_doctor_id." });
      }
      const doctor = await Staff.findOne({ _id: headDoctorId, hospital_id: req.hospitalId, role: "doctor" });
      if (!doctor) {
        return res.status(404).json({ success: false, message: "Head doctor not found in this hospital." });
      }
    }

    const department = await Department.create({
      name,
      hospital_id: req.hospitalId,
      description,
      head_doctor_id: headDoctorId || null,
      status: "active",
      created_by: req.authUser._id,
    });

    // Auto-seed default resources for this department with random quantities
    await seedResourcesForDepartment(req.hospitalId, department._id, name);

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "department_create",
      targetHospitalId: req.hospitalId,
      metadata: { department_id: String(department._id), department_name: name },
    });

    return res.status(201).json({
      success: true,
      message: "Department created successfully.",
      department,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/departments/batch/available — Get list of available default departments
router.get("/departments/batch/available", async (req, res, next) => {
  try {
    // Validate authentication and hospital ID
    if (!req.authUser) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }
    if (!req.hospitalId) {
      return res.status(403).json({ success: false, message: "No hospital ID found in session." });
    }

    // Use the module-level BATCH_DEFAULT_DEPARTMENTS (23 depts, aligned with master diseaseDepartmentMap.js)
    const DEFAULT_DEPARTMENTS = BATCH_DEFAULT_DEPARTMENTS;

    // Query existing departments using lean for better performance
    const existingDepts = await Department.find({ hospital_id: req.hospitalId })
      .select("name")
      .lean();
    
    const existingNames = new Set((existingDepts || []).map((d) => String(d.name || "").toLowerCase()));

    // Build available departments list
    const availableDepts = DEFAULT_DEPARTMENTS.map((dept) => ({
      name: dept.name,
      description: dept.description,
      exists: existingNames.has(String(dept.name || "").toLowerCase()),
    }));

    return res.json({
      success: true,
      available_departments: availableDepts,
      existing_count: existingDepts?.length || 0,
    });
  } catch (error) {
    console.error("[Get Available Departments Error]", {
      error: error.message,
      hospitalId: req.hospitalId,
      authUser: req.authUser?._id,
    });
    return next(error);
  }
});

// POST /api/hospital-admin/departments/batch/create-defaults — Create selected departments from the default 13
router.post("/departments/batch/create-defaults", async (req, res, next) => {
  try {
    // Use the module-level BATCH_DEFAULT_DEPARTMENTS (23 depts, aligned with master diseaseDepartmentMap.js)
    const DEFAULT_DEPARTMENTS = BATCH_DEFAULT_DEPARTMENTS;

    // Get existing departments first
    const existingDepts = await Department.find({ hospital_id: req.hospitalId }).select("name");
    const existingNames = new Set(existingDepts.map((d) => d.name.toLowerCase()));

    // If no departments specified in request body, return the list of available departments
    const requestedDepts = (req.body?.departments || []).filter((d) => d && String(d).trim());
    
    if (!Array.isArray(requestedDepts) || requestedDepts.length === 0) {
      // Return list of available departments
      const availableDepts = DEFAULT_DEPARTMENTS.map((dept) => ({
        name: dept.name,
        description: dept.description,
        exists: existingNames.has(dept.name.toLowerCase()),
      }));

      return res.json({
        success: true,
        message: "Available departments list",
        available_departments: availableDepts,
        existing_count: existingDepts.length,
      });
    }

    // Validate requested department names
    const validNames = new Set(DEFAULT_DEPARTMENTS.map((d) => d.name.toLowerCase()));
    const invalidDepts = requestedDepts.filter((name) => !validNames.has(String(name || "").toLowerCase()));
    
    if (invalidDepts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid department names: ${invalidDepts.join(", ")}. Use names from the available 23 departments.`,
      });
    }

    // Filter to create only requested departments that don't already exist
    const toCreate = DEFAULT_DEPARTMENTS.filter((dept) => {
      const requested = requestedDepts.some((name) => String(name || "").toLowerCase() === dept.name.toLowerCase());
      const exists = existingNames.has(dept.name.toLowerCase());
      return requested && !exists;
    });

    if (toCreate.length === 0) {
      const alreadyExistCount = requestedDepts.filter((name) => existingNames.has(String(name || "").toLowerCase())).length;
      return res.status(409).json({
        success: false,
        message: `All requested departments already exist in your hospital (${alreadyExistCount}/${requestedDepts.length}).`,
        already_exist_count: alreadyExistCount,
        requested_count: requestedDepts.length,
      });
    }

    // Create the departments
    const createdDepts = await Department.insertMany(
      toCreate.map((dept) => ({
        name: dept.name,
        hospital_id: req.hospitalId,
        description: dept.description,
        status: "active",
        created_by: req.authUser._id,
      }))
    );

    // Auto-seed default resources for each created department
    for (const d of createdDepts) {
      await seedResourcesForDepartment(req.hospitalId, d._id, d.name);
    }

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "departments_batch_create",
      targetHospitalId: req.hospitalId,
      metadata: {
        created_count: createdDepts.length,
        requested_count: requestedDepts.length,
        departments: createdDepts.map((d) => ({ id: String(d._id), name: d.name })),
      },
    });

    return res.status(201).json({
      success: true,
      message: `${createdDepts.length} departments created successfully.`,
      created_count: createdDepts.length,
      requested_count: requestedDepts.length,
      existing_count: existingDepts.length,
      departments: createdDepts,
    });
  } catch (error) {
    console.error("[Department Batch Create Error]", error);
    return next(error);
  }
});

// GET /api/hospital-admin/departments — List all departments in this hospital
router.get("/departments", async (req, res, next) => {
  try {
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const filter = { hospital_id: req.hospitalId };

    const [departments, doctors] = await Promise.all([
      Department.find(filter, { __v: 0 })
        .populate("head_doctor_id", "name email specialization")
        .sort({ created_at: -1 }),
      Staff.find({ hospital_id: req.hospitalId, role: "doctor", status: "active" }, { department_id: 1 })
    ]);

    const doctorCounts = {};
    doctors.forEach((doc) => {
      if (doc.department_id) {
        const did = String(doc.department_id);
        doctorCounts[did] = (doctorCounts[did] || 0) + 1;
      }
    });

    let populatedDepartments = departments.map((d) => {
      const doc = d.toObject ? d.toObject() : d;
      const count = doctorCounts[String(doc._id)] || 0;
      doc.status = count > 0 ? "active" : "inactive";
      return doc;
    });

    if (statusFilter === "active" || statusFilter === "inactive") {
      populatedDepartments = populatedDepartments.filter(
        (d) => d.status === statusFilter
      );
    }

    return res.json({ success: true, departments: populatedDepartments });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/departments/:id — Get one department
router.get("/departments/:id", async (req, res, next) => {
  try {
    const deptId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(deptId)) {
      return res.status(400).json({ success: false, message: "Invalid department id." });
    }

    const [department, doctorCount] = await Promise.all([
      Department.findOne({ _id: deptId, hospital_id: req.hospitalId }, { __v: 0 }).populate(
        "head_doctor_id",
        "name email specialization"
      ),
      Staff.countDocuments({ hospital_id: req.hospitalId, role: "doctor", status: "active", department_id: deptId })
    ]);

    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    const doc = department.toObject ? department.toObject() : department;
    doc.status = doctorCount > 0 ? "active" : "inactive";

    return res.json({ success: true, department: doc });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/hospital-admin/departments/:id — Update a department
router.patch("/departments/:id", async (req, res, next) => {
  try {
    const deptId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(deptId)) {
      return res.status(400).json({ success: false, message: "Invalid department id." });
    }

    const department = await Department.findOne({ _id: deptId, hospital_id: req.hospitalId });
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    if (req.body?.name !== undefined) {
      const newName = String(req.body.name || "").trim();
      if (!newName) {
        return res.status(400).json({ success: false, message: "Department name cannot be empty." });
      }
      const conflict = await Department.findOne({
        _id: { $ne: deptId },
        hospital_id: req.hospitalId,
        name: { $regex: `^${newName}$`, $options: "i" },
      });
      if (conflict) {
        return res.status(409).json({ success: false, message: "Another department with this name already exists." });
      }
      department.name = newName;
    }

    if (req.body?.description !== undefined) {
      department.description = String(req.body.description || "").trim();
    }

    if (req.body?.status !== undefined) {
      const s = String(req.body.status || "").trim().toLowerCase();
      if (s !== "active" && s !== "inactive") {
        return res.status(400).json({ success: false, message: "Status must be 'active' or 'inactive'." });
      }
      department.status = s;
    }

    if (req.body?.head_doctor_id !== undefined) {
      const headId = String(req.body.head_doctor_id || "").trim();
      if (headId) {
        if (!mongoose.Types.ObjectId.isValid(headId)) {
          return res.status(400).json({ success: false, message: "Invalid head_doctor_id." });
        }
        const doctor = await Staff.findOne({ _id: headId, hospital_id: req.hospitalId, role: "doctor" });
        if (!doctor) {
          return res.status(404).json({ success: false, message: "Head doctor not found in this hospital." });
        }
        department.head_doctor_id = headId;
      } else {
        department.head_doctor_id = null;
      }
    }

    await department.save();

    return res.json({ success: true, message: "Department updated.", department });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/hospital-admin/departments/:id — Delete a department
router.delete("/departments/:id", async (req, res, next) => {
  try {
    const deptId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(deptId)) {
      return res.status(400).json({ success: false, message: "Invalid department id." });
    }

    const department = await Department.findOne({ _id: deptId, hospital_id: req.hospitalId });
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    // Unlink staff from this department before deletion
    await Staff.updateMany({ department_id: deptId, hospital_id: req.hospitalId }, { $set: { department_id: null } });

    await Department.deleteOne({ _id: deptId });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "department_delete",
      targetHospitalId: req.hospitalId,
      metadata: { department_id: deptId, department_name: department.name },
    });

    return res.json({ success: true, message: "Department deleted." });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// PATIENTS
// ---------------------------------------------------------------------------

// POST /api/hospital-admin/patients — Admit / register a patient
router.post("/patients", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Patient name is required." });
    }

    const doctorId = String(req.body?.assigned_doctor_id || "").trim();
    if (doctorId) {
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ success: false, message: "Invalid assigned_doctor_id." });
      }
      const doctor = await Staff.findOne({ _id: doctorId, hospital_id: req.hospitalId, role: "doctor" });
      if (!doctor) {
        return res.status(404).json({ success: false, message: "Assigned doctor not found in this hospital." });
      }
    }

    const deptId = String(req.body?.department_id || "").trim();
    if (deptId) {
      if (!mongoose.Types.ObjectId.isValid(deptId)) {
        return res.status(400).json({ success: false, message: "Invalid department_id." });
      }
      const dept = await Department.findOne({ _id: deptId, hospital_id: req.hospitalId });
      if (!dept) {
        return res.status(404).json({ success: false, message: "Department not found in this hospital." });
      }
    }

    const VALID_GENDERS = ["male", "female", "other", ""];
    const VALID_BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""];

    const gender = String(req.body?.gender || "").trim().toLowerCase();
    if (gender && !VALID_GENDERS.includes(gender)) {
      return res.status(400).json({ success: false, message: "gender must be male, female, or other." });
    }
    const bloodType = String(req.body?.blood_type || "").trim().toUpperCase();
    if (bloodType && !VALID_BLOOD_TYPES.includes(bloodType)) {
      return res.status(400).json({ success: false, message: "Invalid blood_type." });
    }

    const patient = await Patient.create({
      name,
      email: normalizeEmail(req.body?.email || ""),
      phone: String(req.body?.phone || "").trim(),
      date_of_birth: req.body?.date_of_birth || null,
      gender: gender || "",
      blood_type: bloodType || "",
      address: String(req.body?.address || "").trim(),
      hospital_id: req.hospitalId,
      assigned_doctor_id: doctorId || null,
      department_id: deptId || null,
      medical_history: String(req.body?.medical_history || "").trim(),
      status: "active",
      created_by: req.authUser._id,
    });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "patient_admit",
      targetHospitalId: req.hospitalId,
      metadata: { patient_id: String(patient._id), patient_name: name },
    });

    return res.status(201).json({ success: true, message: "Patient admitted successfully.", patient });
  } catch (error) {
    return next(error);
  }
});

// POST /api/hospital-admin/patients/upload-dataset — Upload patient-record dataset (all columns preserved in source_data)
router.post("/patients/dry-run-upload-dataset", patientDatasetUpload.single("file"), async (req, res, next) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ success: false, message: "CSV/XLSX file is required (form-data field name: file)." });
    }

    const parsedRows = parsePatientDatasetRows(req.file.path, req.file.originalname);

    if (!Array.isArray(parsedRows) || parsedRows.length === 0) {
      return res.status(400).json({ success: false, message: "Uploaded file has no data rows." });
    }

    const report = buildPatientDatasetDryRun(parsedRows);
    return res.json({
      success: true,
      message: "Dry run completed. No records were saved.",
      report,
    });
  } catch (error) {
    return next(error);
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // Ignore cleanup errors.
      }
    }
  }
});

router.post("/patients/upload-dataset", patientDatasetUpload.single("file"), async (req, res, next) => {
  try {
    const departmentId = String(req.body?.department_id || "").trim();
    if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: "Valid department_id is required." });
    }
    if (!req.file?.path) {
      return res.status(400).json({ success: false, message: "CSV/XLSX file is required (form-data field name: file)." });
    }

    const department = await Department.findOne({ _id: departmentId, hospital_id: req.hospitalId }, { name: 1 });
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found for your hospital." });
    }

    const parsedRows = parsePatientDatasetRows(req.file.path, req.file.originalname);

    if (!Array.isArray(parsedRows) || parsedRows.length === 0) {
      return res.status(400).json({ success: false, message: "Uploaded file has no data rows." });
    }

    const importSummary = await syncPatientRecordsFromCsvRows({
      rows: parsedRows,
      hospitalId: req.hospitalId,
      departmentId,
      actorUserId: req.authUser?._id || null,
    });

    archiveUploadedFile({
      category: "patient_records",
      hospitalId: req.hospitalId,
      departmentId,
      sourcePath: req.file.path,
      originalName: req.file.originalname,
    });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_patient_dataset_upload",
      targetHospitalId: req.hospitalId,
      metadata: {
        department_id: departmentId,
        department_name: department.name,
        uploaded_file_name: req.file.originalname,
        ...importSummary,
      },
    });

    return res.json({
      success: true,
      message: `Patient dataset processed for ${department.name}.`,
      department: { id: String(department._id), name: department.name },
      import_summary: importSummary,
    });
  } catch (error) {
    return next(error);
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // Ignore cleanup errors.
      }
    }
  }
});

// GET /api/hospital-admin/patients — List patients (filterable)
router.get("/patients", async (req, res, next) => {
  try {
    const filter = { hospital_id: req.hospitalId };
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const doctorFilter = String(req.query.doctor_id || "").trim();
    const deptFilter = String(req.query.department_id || "").trim();
    const search = String(req.query.search || "").trim();
    const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = Math.min(200, Math.max(5, Number.parseInt(String(req.query.page_size || "25"), 10) || 25));
    const sortBy = String(req.query.sort_by || "created_at").trim();
    const sortOrder = String(req.query.sort_order || "desc").trim().toLowerCase() === "asc" ? 1 : -1;
    const allowedSortFields = new Set(["created_at", "name", "status", "email", "source_record_id"]);
    const sortField = allowedSortFields.has(sortBy) ? sortBy : "created_at";

    if (["active", "discharged", "deceased"].includes(statusFilter)) filter.status = statusFilter;
    if (doctorFilter && mongoose.Types.ObjectId.isValid(doctorFilter)) filter.assigned_doctor_id = doctorFilter;
    if (deptFilter && mongoose.Types.ObjectId.isValid(deptFilter)) filter.department_id = deptFilter;

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
        { source_record_id: { $regex: escaped, $options: "i" } },
      ];
    }

    const total = await Patient.countDocuments(filter);

    const patients = await Patient.find(filter, { __v: 0 })
      .populate("assigned_doctor_id", "name email specialization")
      .populate("department_id", "name status")
      .sort({ [sortField]: sortOrder, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return res.json({
      success: true,
      patients,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      sorting: {
        sort_by: sortField,
        sort_order: sortOrder === 1 ? "asc" : "desc",
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/audit-logs — Recent role-based action logs for this hospital
router.get("/audit-logs", async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(5, Number.parseInt(String(req.query.limit || "20"), 10) || 20));
    const actionFilter = String(req.query.action || "").trim();

    const filter = { target_hospital_id: req.hospitalId };
    if (actionFilter) {
      filter.action = { $regex: actionFilter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }

    const logs = await AuditLog.find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .populate("actor_user_id", "username email role");

    return res.json({ success: true, logs });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/patients/:id — Get one patient record
router.get("/patients/:id", async (req, res, next) => {
  try {
    const patientId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Invalid patient id." });
    }
    const patient = await Patient.findOne({ _id: patientId, hospital_id: req.hospitalId }, { __v: 0 })
      .populate("assigned_doctor_id", "name email specialization phone")
      .populate("department_id", "name status")
      .populate("created_by", "username email role");

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }
    return res.json({ success: true, patient });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/hospital-admin/patients/:id — Update patient record
router.patch("/patients/:id", async (req, res, next) => {
  try {
    const patientId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Invalid patient id." });
    }
    const patient = await Patient.findOne({ _id: patientId, hospital_id: req.hospitalId });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    const textFields = ["name", "phone", "address", "medical_history"];
    for (const f of textFields) {
      if (req.body?.[f] !== undefined) patient[f] = String(req.body[f] || "").trim();
    }
    if (req.body?.email !== undefined) patient.email = normalizeEmail(req.body.email || "");
    if (req.body?.date_of_birth !== undefined) patient.date_of_birth = req.body.date_of_birth || null;

    if (req.body?.gender !== undefined) {
      const g = String(req.body.gender || "").trim().toLowerCase();
      if (g && !["male", "female", "other"].includes(g)) {
        return res.status(400).json({ success: false, message: "gender must be male, female, or other." });
      }
      patient.gender = g;
    }
    if (req.body?.blood_type !== undefined) {
      const bt = String(req.body.blood_type || "").trim().toUpperCase();
      if (bt && !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(bt)) {
        return res.status(400).json({ success: false, message: "Invalid blood_type." });
      }
      patient.blood_type = bt;
    }
    if (req.body?.status !== undefined) {
      const s = String(req.body.status || "").trim().toLowerCase();
      if (!["active", "discharged", "deceased"].includes(s)) {
        return res.status(400).json({ success: false, message: "status must be active, discharged, or deceased." });
      }
      patient.status = s;
    }
    if (req.body?.assigned_doctor_id !== undefined) {
      const did = String(req.body.assigned_doctor_id || "").trim();
      if (did) {
        if (!mongoose.Types.ObjectId.isValid(did)) {
          return res.status(400).json({ success: false, message: "Invalid assigned_doctor_id." });
        }
        const doc = await Staff.findOne({ _id: did, hospital_id: req.hospitalId, role: "doctor" });
        if (!doc) return res.status(404).json({ success: false, message: "Doctor not found in this hospital." });
        patient.assigned_doctor_id = did;
      } else {
        patient.assigned_doctor_id = null;
      }
    }
    if (req.body?.department_id !== undefined) {
      const did = String(req.body.department_id || "").trim();
      if (did) {
        if (!mongoose.Types.ObjectId.isValid(did)) {
          return res.status(400).json({ success: false, message: "Invalid department_id." });
        }
        const dept = await Department.findOne({ _id: did, hospital_id: req.hospitalId });
        if (!dept) return res.status(404).json({ success: false, message: "Department not found in this hospital." });
        patient.department_id = did;
      } else {
        patient.department_id = null;
      }
    }

    await patient.save();
    return res.json({ success: true, message: "Patient record updated.", patient });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/hospital-admin/patients/:id — Discharge (soft) or permanently delete a patient record
router.delete("/patients/:id", async (req, res, next) => {
  try {
    const patientId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Invalid patient id." });
    }
    const patient = await Patient.findOne({ _id: patientId, hospital_id: req.hospitalId });
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found." });
    }

    // ?action=discharge marks as discharged; ?action=delete removes permanently
    const action = String(req.query.action || "discharge").trim().toLowerCase();
    if (action === "delete") {
      await Patient.deleteOne({ _id: patientId });
      await writeAuditLog({
        req, actorUser: req.authUser, action: "patient_delete",
        targetHospitalId: req.hospitalId,
        metadata: { patient_id: patientId, patient_name: patient.name },
      });
      return res.json({ success: true, message: "Patient record permanently deleted." });
    }

    patient.status = "discharged";
    await patient.save();
    await writeAuditLog({
      req, actorUser: req.authUser, action: "patient_discharge",
      targetHospitalId: req.hospitalId,
      metadata: { patient_id: patientId, patient_name: patient.name },
    });
    return res.json({ success: true, message: "Patient discharged.", patient });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/hospital-admin/patients/:id/assign-doctor — Assign / reassign a doctor
router.patch("/patients/:id/assign-doctor", async (req, res, next) => {
  try {
    const patientId = String(req.params.id || "").trim();
    const doctorId = String(req.body?.doctor_id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, message: "Invalid patient id." });
    }
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: "A valid doctor_id is required." });
    }

    const [patient, doctor] = await Promise.all([
      Patient.findOne({ _id: patientId, hospital_id: req.hospitalId }),
      Staff.findOne({ _id: doctorId, hospital_id: req.hospitalId, role: "doctor" }),
    ]);

    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found in this hospital." });

    patient.assigned_doctor_id = doctorId;
    await patient.save();

    return res.json({
      success: true,
      message: `Patient assigned to Dr. ${doctor.name}.`,
      patient: { id: String(patient._id), name: patient.name, assigned_doctor: { id: String(doctor._id), name: doctor.name } },
    });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// RESOURCES
// ---------------------------------------------------------------------------

function deriveResourceStatus(total, available) {
  const normalizedTotal = Math.max(0, Number(total || 0));
  const normalizedAvailable = Math.max(0, Number(available || 0));
  if (normalizedTotal <= 0 || normalizedAvailable <= 0) return "out_of_stock";
  const ratio = normalizedAvailable / normalizedTotal;
  if (ratio <= 0.2) return "low_stock";
  return "available";
}

function normalizeResourceStatus(rawStatus, total, available) {
  const token = String(rawStatus || "").trim().toLowerCase();
  if (token === "maintenance") return "maintenance";
  if (token === "out of stock" || token === "out_of_stock") return "out_of_stock";
  if (token === "low stock" || token === "low_stock" || token === "critical") return "low_stock";
  if (token === "moderate" || token === "available") return "available";
  return deriveResourceStatus(total, available);
}

function inferResourceType(resourceName) {
  const token = String(resourceName || "").trim().toLowerCase();
  if (token.includes("bed")) return "bed";
  if (token.includes("room")) return "room";
  if (token.includes("medicine") || token.includes("drug")) return "medicine";
  return "equipment";
}

// POST /api/hospital-admin/resources/upload-csv
// Imports a CSV snapshot into hospital shared resources (department_id = null).
// Expected columns: hospital_id,date,resource_type,total,available,used,status
router.post("/resources/upload-csv", resourceDatasetUpload.single("file"), async (req, res, next) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ success: false, message: "CSV file is required (form-data field: file)." });
    }

    const rawCsv = fs.readFileSync(req.file.path, "utf-8");
    const rows = parseCsv(rawCsv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "Uploaded CSV has no data rows." });
    }

    // Build department name → department_id mapping for this hospital
    const departments = await Department.find({ hospital_id: req.hospitalId }).lean();
    const deptMap = {};
    departments.forEach(dept => {
      deptMap[dept.name.toLowerCase()] = dept._id;
    });

    const latestByResourceDept = new Map();
    for (const row of rows) {
      const resourceName = String(row.resource_type || row.resource || row.name || "").trim();
      const deptName = String(row.department || "Hospital Shared Pool").trim();
      if (!resourceName) continue;

      const dateYmd = normalizeYmd(row.date || "") || "0000-00-00";
      const key = `${deptName}|${resourceName}`;
      const current = latestByResourceDept.get(key.toLowerCase());
      if (!current || String(dateYmd) > String(current.dateYmd)) {
        latestByResourceDept.set(key.toLowerCase(), {
          resourceName,
          deptName,
          dateYmd,
          total: Number(row.total),
          available: Number(row.available),
          status: row.status,
        });
      }
    }

    const items = Array.from(latestByResourceDept.values());
    if (items.length === 0) {
      return res.status(400).json({ success: false, message: "No valid resource_type rows found in CSV." });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      const total = Number.isFinite(item.total) ? Math.max(0, Math.round(item.total)) : 0;
      let available = Number.isFinite(item.available) ? Math.max(0, Math.round(item.available)) : 0;
      if (available > total) available = total;

      if (total <= 0) {
        skippedCount += 1;
        continue;
      }

      // Look up department_id from department name
      const deptId = deptMap[item.deptName.toLowerCase()] || null;

      const status = normalizeResourceStatus(item.status, total, available);
      const existing = await Resource.findOne({
        hospital_id: req.hospitalId,
        department_id: deptId,
        name: { $regex: `^${String(item.resourceName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      });

      if (existing) {
        existing.type = inferResourceType(item.resourceName);
        existing.quantity = total;
        existing.available_quantity = available;
        existing.status = status;
        existing.unit = existing.unit || "units";
        existing.notes = `Imported from CSV snapshot (${item.dateYmd}).`;
        await existing.save();
        updatedCount += 1;
      } else {
        await Resource.create({
          name: item.resourceName,
          type: inferResourceType(item.resourceName),
          hospital_id: req.hospitalId,
          department_id: deptId,
          quantity: total,
          available_quantity: available,
          status,
          unit: "units",
          notes: `Imported from CSV snapshot (${item.dateYmd}).`,
          created_by: req.authUser._id,
        });
        createdCount += 1;
      }
    }

    archiveUploadedFile({
      category: "resources",
      hospitalId: req.hospitalId,
      departmentId: null,
      sourcePath: req.file.path,
      originalName: req.file.originalname,
    });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "resource_csv_uploaded",
      targetHospitalId: req.hospitalId,
      metadata: {
        file_name: req.file.originalname,
        total_rows: rows.length,
        unique_resources: items.length,
        created_count: createdCount,
        updated_count: updatedCount,
        skipped_count: skippedCount,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Resource CSV imported successfully.",
      summary: {
        total_rows: rows.length,
        unique_resources: items.length,
        created_count: createdCount,
        updated_count: updatedCount,
        skipped_count: skippedCount,
      },
    });
  } catch (error) {
    return next(error);
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // Ignore cleanup errors.
      }
    }
  }
});

// GET /api/hospital-admin/resources/uploads
router.get("/resources/uploads", async (req, res, next) => {
  try {
    const departments = await Department.find({ hospital_id: req.hospitalId }, { name: 1 }).sort({ name: 1 });
    const departmentNameById = new Map(departments.map((department) => [String(department._id), department.name]));
    const files = listArchivedResourceFilesForHospital({
      hospitalId: req.hospitalId,
      departmentNameById,
    });
    return res.json({ success: true, files });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/resources/uploads/download
router.get("/resources/uploads/download", async (req, res, next) => {
  try {
    const fileKey = String(req.query.file_key || "").trim();
    if (!fileKey) {
      return res.status(400).json({ success: false, message: "file_key is required." });
    }

    const rootDir = getHospitalUploadedFilesRootDir("resources", req.hospitalId);
    const filePath = resolveArchivedUploadPath(rootDir, fileKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Uploaded file not found." });
    }

    return res.download(filePath, path.basename(filePath));
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/hospital-admin/resources/uploads
router.delete("/resources/uploads", async (req, res, next) => {
  try {
    const fileKey = String(req.query.file_key || req.body?.file_key || "").trim();
    if (!fileKey) {
      return res.status(400).json({ success: false, message: "file_key is required." });
    }

    const rootDir = getHospitalUploadedFilesRootDir("resources", req.hospitalId);
    const filePath = resolveArchivedUploadPath(rootDir, fileKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Uploaded file not found." });
    }

    fs.unlinkSync(filePath);

    try {
      const parentDir = path.dirname(filePath);
      const entries = fs.existsSync(parentDir) ? fs.readdirSync(parentDir) : [];
      if (entries.length === 0) {
        fs.rmdirSync(parentDir);
      }
    } catch {
      // ignore cleanup errors
    }

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "resource_csv_deleted",
      targetHospitalId: req.hospitalId,
      metadata: { file_key: fileKey },
    });

    return res.json({ success: true, message: "Resource upload deleted." });
  } catch (error) {
    return next(error);
  }
});

// POST /api/hospital-admin/resources — Add a resource (bed/equipment/medicine/room/other)
router.post("/resources", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const type = String(req.body?.type || "").trim().toLowerCase();
    const quantity = Number(req.body?.quantity ?? 0);
    const availableQty = Number(req.body?.available_quantity ?? quantity);

    if (!name) return res.status(400).json({ success: false, message: "Resource name is required." });
    const allowedTypes = ["bed", "equipment", "medicine", "room", "other"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `type must be one of: ${allowedTypes.join(", ")}.` });
    }
    if (quantity < 0 || availableQty < 0) {
      return res.status(400).json({ success: false, message: "quantity and available_quantity must be non-negative." });
    }
    if (availableQty > quantity) {
      return res.status(400).json({ success: false, message: "available_quantity cannot exceed total quantity." });
    }

    const deptId = String(req.body?.department_id || "").trim();
    if (deptId) {
      if (!mongoose.Types.ObjectId.isValid(deptId)) {
        return res.status(400).json({ success: false, message: "Invalid department_id." });
      }
      const dept = await Department.findOne({ _id: deptId, hospital_id: req.hospitalId });
      if (!dept) return res.status(404).json({ success: false, message: "Department not found in this hospital." });
    }

    // Auto-derive status from quantities
    let status = deriveResourceStatus(quantity, availableQty);

    const resource = await Resource.create({
      name,
      type,
      hospital_id: req.hospitalId,
      department_id: deptId || null,
      quantity,
      available_quantity: availableQty,
      unit: String(req.body?.unit || "").trim(),
      notes: String(req.body?.notes || "").trim(),
      status,
      created_by: req.authUser._id,
    });

    await writeAuditLog({
      req, actorUser: req.authUser, action: "resource_create",
      targetHospitalId: req.hospitalId,
      metadata: { resource_id: String(resource._id), resource_name: name, type },
    });

    return res.status(201).json({ success: true, message: "Resource added successfully.", resource });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/resources — List resources (filterable by type/status/department)
router.get("/resources", async (req, res, next) => {
  try {
    const filter = { hospital_id: req.hospitalId };
    const typeFilter = String(req.query.type || "").trim().toLowerCase();
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const deptFilter = String(req.query.department_id || "").trim();

    const allowedTypes = ["bed", "equipment", "medicine", "room", "other"];
    const allowedStatuses = ["available", "low_stock", "out_of_stock", "maintenance"];
    if (allowedTypes.includes(typeFilter)) filter.type = typeFilter;
    if (allowedStatuses.includes(statusFilter)) filter.status = statusFilter;
    if (deptFilter && mongoose.Types.ObjectId.isValid(deptFilter)) filter.department_id = deptFilter;

    const resources = await Resource.find(filter, { __v: 0 })
      .populate("department_id", "name status")
      .sort({ created_at: -1 });

    return res.json({ success: true, resources });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/resources/coverage-insights — Patient-linked resource pressure by department
router.get("/resources/coverage-insights", async (req, res, next) => {
  try {
    const demandModeInput = String(req.query?.demand_mode || "predicted").trim().toLowerCase();
    const demandMode = ["predicted", "active"].includes(demandModeInput) ? demandModeInput : "predicted";
    const demandDate = normalizeYmd(req.query?.date || new Date().toISOString().slice(0, 10));
    const gender = String(req.query?.gender || "all").trim().toLowerCase() || "all";

    if (!demandDate) {
      return res.status(400).json({ success: false, message: "Valid date is required in YYYY-MM-DD format." });
    }

    const [departments, patientAgg, resourceAgg] = await Promise.all([
      Department.find({ hospital_id: req.hospitalId }, { _id: 1, name: 1, status: 1 }).lean(),
      Patient.aggregate([
        { $match: { hospital_id: req.hospitalId } },
        {
          $group: {
            _id: "$department_id",
            total_patients: { $sum: 1 },
            active_patients: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0],
              },
            },
            inactive_patients: {
              $sum: {
                $cond: [{ $ne: ["$status", "active"] }, 1, 0],
              },
            },
          },
        },
      ]),
      Resource.aggregate([
        { $match: { hospital_id: req.hospitalId } },
        {
          $group: {
            _id: "$department_id",
            total_resources: { $sum: 1 },
            total_units: { $sum: { $ifNull: ["$quantity", 0] } },
            available_units: { $sum: { $ifNull: ["$available_quantity", 0] } },
            low_stock: {
              $sum: {
                $cond: [{ $eq: ["$status", "low_stock"] }, 1, 0],
              },
            },
            out_of_stock: {
              $sum: {
                $cond: [{ $eq: ["$status", "out_of_stock"] }, 1, 0],
              },
            },
            maintenance: {
              $sum: {
                $cond: [{ $eq: ["$status", "maintenance"] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    let doctorsByDepartment = new Map();
    if (demandMode === "predicted") {
      const doctors = await Staff.find(
        { hospital_id: req.hospitalId, role: "doctor" },
        { _id: 1, department_id: 1 }
      ).lean();

      doctorsByDepartment = doctors.reduce((map, doctor) => {
        const key = doctor?.department_id ? String(doctor.department_id) : "hospital";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(doctor);
        return map;
      }, new Map());
    }

    const patientMap = new Map();
    for (const row of patientAgg) {
      const key = row?._id ? String(row._id) : "hospital";
      patientMap.set(key, row);
    }

    const resourceMap = new Map();
    for (const row of resourceAgg) {
      const key = row?._id ? String(row._id) : "hospital";
      resourceMap.set(key, row);
    }

    const predictedDemandMap = new Map();
    const predictionMetaMap = new Map();

    if (demandMode === "predicted") {
      for (const dept of departments) {
        const key = String(dept._id);
        const departmentDoctors = doctorsByDepartment.get(key) || [];
        const prediction = await predictDepartmentDemandForDate({
          hospitalId: req.hospitalId,
          department: { _id: dept._id, name: dept.name },
          dateYmd: demandDate,
          gender,
          departmentDoctors,
        });

        const expectedPatients = Math.max(0, Number(prediction?.expected_patients || 0));
        predictedDemandMap.set(key, expectedPatients);
        predictionMetaMap.set(key, {
          source: prediction?.source || "historical_fallback",
          unavailable_reason: prediction?.unavailable_reason || "",
        });
      }
    }

    const rows = [];
    for (const dept of departments) {
      const key = String(dept._id);
      const p = patientMap.get(key) || { total_patients: 0, active_patients: 0, inactive_patients: 0 };
      const r = resourceMap.get(key) || {
        total_resources: 0,
        total_units: 0,
        available_units: 0,
        low_stock: 0,
        out_of_stock: 0,
        maintenance: 0,
      };

      const predictedPatients = demandMode === "predicted"
        ? Math.max(0, Number(predictedDemandMap.get(key) || 0))
        : null;
      const demandPatients = demandMode === "predicted"
        ? predictedPatients
        : Math.max(0, Number(p.active_patients || 0));

      const availableUnitsPerDemandPatient = demandPatients > 0 ? r.available_units / demandPatients : null;
      const usedUnits = Math.max(0, Number(r.total_units || 0) - Number(r.available_units || 0));

      const predictionMeta = predictionMetaMap.get(key) || { source: "active_patients", unavailable_reason: "" };

      let coverage_state = "stable";
      if (demandPatients === 0) coverage_state = "no_patient_load";
      else if (r.total_resources === 0) coverage_state = "no_resources";
      else if ((availableUnitsPerDemandPatient || 0) < 0.5) coverage_state = "critical";
      else if ((availableUnitsPerDemandPatient || 0) < 1) coverage_state = "strained";

      rows.push({
        department_id: key,
        department_name: dept.name,
        department_status: dept.status || "",
        total_resources: r.total_resources,
        low_stock: r.low_stock,
        out_of_stock: r.out_of_stock,
        maintenance: r.maintenance,
        total_units: r.total_units,
        available_units: r.available_units,
        used_units: usedUnits,
        total_patients: p.total_patients,
        active_patients: p.active_patients,
        inactive_patients: p.inactive_patients,
        predicted_patients: predictedPatients,
        demand_patients: demandPatients,
        demand_source: demandMode === "predicted" ? predictionMeta.source : "active_patients",
        unavailable_reason: demandMode === "predicted" ? predictionMeta.unavailable_reason : "",
        available_units_per_demand_patient: availableUnitsPerDemandPatient,
        coverage_state,
      });
    }

    const hospitalResources = resourceMap.get("hospital") || {
      total_resources: 0,
      total_units: 0,
      available_units: 0,
      low_stock: 0,
      out_of_stock: 0,
      maintenance: 0,
    };
    const unassignedPatients = patientMap.get("hospital") || { total_patients: 0, active_patients: 0, inactive_patients: 0 };

    rows.push({
      department_id: "hospital",
      department_name: "Hospital Shared Pool",
      department_status: "active",
      total_resources: hospitalResources.total_resources,
      low_stock: hospitalResources.low_stock,
      out_of_stock: hospitalResources.out_of_stock,
      maintenance: hospitalResources.maintenance,
      total_units: hospitalResources.total_units,
      available_units: hospitalResources.available_units,
      used_units: Math.max(0, Number(hospitalResources.total_units || 0) - Number(hospitalResources.available_units || 0)),
      total_patients: unassignedPatients.total_patients,
      active_patients: unassignedPatients.active_patients,
      inactive_patients: unassignedPatients.inactive_patients,
      predicted_patients: null,
      demand_patients: demandMode === "predicted"
        ? Math.max(0, Number(unassignedPatients.active_patients || 0))
        : Math.max(0, Number(unassignedPatients.active_patients || 0)),
      demand_source: "active_patients_unassigned",
      unavailable_reason: "",
      available_units_per_demand_patient:
        Number(unassignedPatients.active_patients || 0) > 0
          ? hospitalResources.available_units / Number(unassignedPatients.active_patients || 0)
          : null,
      coverage_state:
        Number(unassignedPatients.active_patients || 0) === 0
          ? "no_patient_load"
          : (hospitalResources.total_resources === 0 ? "no_resources" : "stable"),
    });

    const summary = rows.reduce(
      (acc, row) => {
        acc.total_departments += 1;
        acc.total_resources += Number(row.total_resources || 0);
        acc.total_units += Number(row.total_units || 0);
        acc.total_available_units += Number(row.available_units || 0);
        acc.active_patients += Number(row.active_patients || 0);
        acc.demand_patients += Number(row.demand_patients || 0);
        if (Number(row.predicted_patients || 0) > 0) acc.predicted_departments += 1;
        if (row.coverage_state === "critical") acc.critical_departments += 1;
        if (row.coverage_state === "strained") acc.departments_strained += 1;
        if (row.coverage_state === "no_resources" && Number(row.demand_patients || 0) > 0) {
          acc.departments_missing_resources += 1;
        }
        return acc;
      },
      {
        total_departments: 0,
        total_resources: 0,
        total_units: 0,
        total_available_units: 0,
        active_patients: 0,
        demand_patients: 0,
        predicted_departments: 0,
        critical_departments: 0,
        departments_strained: 0,
        departments_missing_resources: 0,
      }
    );

    // Backward-compatible aliases for older frontend builds.
    summary.departments_critical = summary.critical_departments;

    return res.json({
      success: true,
      input: {
        demand_mode: demandMode,
        date: demandDate,
        gender,
      },
      coverage: rows,
      rows,
      summary,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/resources/:id — Get one resource
router.get("/resources/:id", async (req, res, next) => {
  try {
    const rid = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(rid)) {
      return res.status(400).json({ success: false, message: "Invalid resource id." });
    }
    const resource = await Resource.findOne({ _id: rid, hospital_id: req.hospitalId }, { __v: 0 })
      .populate("department_id", "name status");
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found." });
    return res.json({ success: true, resource });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/hospital-admin/resources/:id — Update a resource
router.patch("/resources/:id", async (req, res, next) => {
  try {
    const rid = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(rid)) {
      return res.status(400).json({ success: false, message: "Invalid resource id." });
    }
    const resource = await Resource.findOne({ _id: rid, hospital_id: req.hospitalId });
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found." });

    if (req.body?.name !== undefined) resource.name = String(req.body.name || "").trim();
    if (req.body?.notes !== undefined) resource.notes = String(req.body.notes || "").trim();
    if (req.body?.unit !== undefined) resource.unit = String(req.body.unit || "").trim();

    if (req.body?.type !== undefined) {
      const t = String(req.body.type || "").trim().toLowerCase();
      if (!["bed", "equipment", "medicine", "room", "other"].includes(t)) {
        return res.status(400).json({ success: false, message: "Invalid type." });
      }
      resource.type = t;
    }

    // Recalculate quantities together to maintain consistency
    const newQty = req.body?.quantity !== undefined ? Number(req.body.quantity) : resource.quantity;
    const newAvail = req.body?.available_quantity !== undefined ? Number(req.body.available_quantity) : resource.available_quantity;
    if (newQty < 0 || newAvail < 0) {
      return res.status(400).json({ success: false, message: "Quantities must be non-negative." });
    }
    if (newAvail > newQty) {
      return res.status(400).json({ success: false, message: "available_quantity cannot exceed total quantity." });
    }
    resource.quantity = newQty;
    resource.available_quantity = newAvail;

    if (req.body?.status !== undefined) {
      const s = String(req.body.status || "").trim().toLowerCase();
      if (!["available", "low_stock", "out_of_stock", "maintenance"].includes(s)) {
        return res.status(400).json({ success: false, message: "Invalid status." });
      }
      resource.status = s;
    } else {
      // Auto-derive if quantities were updated
      if (req.body?.quantity !== undefined || req.body?.available_quantity !== undefined) {
        resource.status = deriveResourceStatus(newQty, newAvail);
      }
    }

    if (req.body?.department_id !== undefined) {
      const did = String(req.body.department_id || "").trim();
      if (did) {
        if (!mongoose.Types.ObjectId.isValid(did)) {
          return res.status(400).json({ success: false, message: "Invalid department_id." });
        }
        const dept = await Department.findOne({ _id: did, hospital_id: req.hospitalId });
        if (!dept) return res.status(404).json({ success: false, message: "Department not found in this hospital." });
        resource.department_id = did;
      } else {
        resource.department_id = null;
      }
    }

    await resource.save();
    return res.json({ success: true, message: "Resource updated.", resource });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/hospital-admin/resources/:id — Remove a resource
router.delete("/resources/:id", async (req, res, next) => {
  try {
    const rid = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(rid)) {
      return res.status(400).json({ success: false, message: "Invalid resource id." });
    }
    const resource = await Resource.findOne({ _id: rid, hospital_id: req.hospitalId });
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found." });

    await Resource.deleteOne({ _id: rid });
    await writeAuditLog({
      req, actorUser: req.authUser, action: "resource_delete",
      targetHospitalId: req.hospitalId,
      metadata: { resource_id: rid, resource_name: resource.name, type: resource.type },
    });
    return res.json({ success: true, message: "Resource deleted." });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// ANALYTICS
// ---------------------------------------------------------------------------

async function getHospitalAnalytics(req, res, next) {
  try {
    const hospitalId = req.hospitalId;

    const [staffCounts, deptCounts, hospital, patientCounts, resourceCounts, missingSourceIdCount, duplicateSourceIds] = await Promise.allSettled([
      Staff.aggregate([
        { $match: { hospital_id: new mongoose.Types.ObjectId(String(hospitalId)) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            suspended: { $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] } },
            doctors: { $sum: { $cond: [{ $eq: ["$role", "doctor"] }, 1, 0] } },
            nurses: { $sum: { $cond: [{ $eq: ["$role", "nurse"] }, 1, 0] } },
            receptionists: { $sum: { $cond: [{ $eq: ["$role", "receptionist"] }, 1, 0] } },
            other_staff: { $sum: { $cond: [{ $eq: ["$role", "staff"] }, 1, 0] } },
          },
        },
      ]),
      Department.aggregate([
        { $match: { hospital_id: new mongoose.Types.ObjectId(String(hospitalId)) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
          },
        },
      ]),
      Hospital.findById(hospitalId, { name: 1, city: 1, status: 1, is_active: 1 }),
      Patient.aggregate([
        { $match: { hospital_id: new mongoose.Types.ObjectId(String(hospitalId)) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            discharged: { $sum: { $cond: [{ $eq: ["$status", "discharged"] }, 1, 0] } },
            deceased: { $sum: { $cond: [{ $eq: ["$status", "deceased"] }, 1, 0] } },
          },
        },
      ]),
      Resource.aggregate([
        { $match: { hospital_id: new mongoose.Types.ObjectId(String(hospitalId)) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            available: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } },
            low_stock: { $sum: { $cond: [{ $eq: ["$status", "low_stock"] }, 1, 0] } },
            out_of_stock: { $sum: { $cond: [{ $eq: ["$status", "out_of_stock"] }, 1, 0] } },
            maintenance: { $sum: { $cond: [{ $eq: ["$status", "maintenance"] }, 1, 0] } },
          },
        },
      ]),
      Patient.countDocuments({ hospital_id: hospitalId, source_data: { $exists: true, $ne: null }, source_record_id: "" }),
      Patient.aggregate([
        { $match: { hospital_id: new mongoose.Types.ObjectId(String(hospitalId)), source_record_id: { $ne: "" } } },
        { $group: { _id: "$source_record_id", count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $count: "total" },
      ]),
    ]);

    const staffData = staffCounts.status === "fulfilled" && staffCounts.value.length > 0
      ? staffCounts.value[0]
      : { total: 0, active: 0, suspended: 0, doctors: 0, nurses: 0, receptionists: 0, other_staff: 0 };

    const deptData = deptCounts.status === "fulfilled" && deptCounts.value.length > 0
      ? deptCounts.value[0]
      : { total: 0, active: 0, inactive: 0 };

    const hospitalInfo = hospital.status === "fulfilled" ? hospital.value : null;

    const patientData = patientCounts.status === "fulfilled" && patientCounts.value.length > 0
      ? patientCounts.value[0]
      : { total: 0, active: 0, discharged: 0, deceased: 0 };

    const resourceData = resourceCounts.status === "fulfilled" && resourceCounts.value.length > 0
      ? resourceCounts.value[0]
      : { total: 0, available: 0, low_stock: 0, out_of_stock: 0, maintenance: 0 };

    // AI-style alerts based on resource stock levels
    const aiAlerts = [];
    if (resourceData.out_of_stock > 0) {
      aiAlerts.push({ level: "critical", message: `${resourceData.out_of_stock} resource(s) are out of stock.` });
    }
    if (resourceData.low_stock > 0) {
      aiAlerts.push({ level: "warning", message: `${resourceData.low_stock} resource(s) are running low.` });
    }
    if (patientData.active > staffData.doctors * 10) {
      aiAlerts.push({ level: "warning", message: "High patient-to-doctor ratio detected. Consider adding more doctors." });
    }
    const missingSource = missingSourceIdCount.status === "fulfilled" ? Number(missingSourceIdCount.value || 0) : 0;
    const duplicateSourceCount =
      duplicateSourceIds.status === "fulfilled" && Array.isArray(duplicateSourceIds.value) && duplicateSourceIds.value[0]
        ? Number(duplicateSourceIds.value[0].total || 0)
        : 0;
    if (missingSource > 0) {
      aiAlerts.push({ level: "warning", message: `${missingSource} imported patient record(s) are missing source IDs.` });
    }
    if (duplicateSourceCount > 0) {
      aiAlerts.push({ level: "warning", message: `${duplicateSourceCount} duplicate source ID group(s) detected in patient records.` });
    }

    return res.json({
      success: true,
      hospital: hospitalInfo
        ? { id: String(hospitalInfo._id), name: hospitalInfo.name, city: hospitalInfo.city, status: hospitalInfo.status }
        : null,
      staff: {
        total: staffData.total,
        active: staffData.active,
        suspended: staffData.suspended,
        by_role: {
          doctors: staffData.doctors,
          nurses: staffData.nurses,
          receptionists: staffData.receptionists,
          staff: staffData.other_staff,
        },
      },
      departments: {
        total: deptData.total,
        active: deptData.active,
        inactive: deptData.inactive,
      },
      patients: {
        total: patientData.total,
        active: patientData.active,
        discharged: patientData.discharged,
        deceased: patientData.deceased,
      },
      resources: {
        total: resourceData.total,
        available: resourceData.available,
        low_stock: resourceData.low_stock,
        out_of_stock: resourceData.out_of_stock,
        maintenance: resourceData.maintenance,
      },
      ai_alerts: aiAlerts,
    });
  } catch (error) {
    return next(error);
  }
}

// GET /api/hospital-admin/analytics — Hospital-scoped analytics
router.get("/analytics", getHospitalAnalytics);

// GET /api/hospital-admin/hospital-analytics — Alias for analytics endpoint
router.get("/hospital-analytics", getHospitalAnalytics);

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------

// GET /api/hospital-admin/dashboard — Real-time hospital admin dashboard
router.get("/dashboard", async (req, res, next) => {
  try {
    const hospitalId = req.hospitalId;
    const hospitalOid = new mongoose.Types.ObjectId(String(hospitalId));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      patientsToday,
      patientsPerDept,
      doctorList,
      staffSummary,
      resourceUsage,
      admissionsHistory,
      activePatientCount,
      hospitalInfo,
    ] = await Promise.allSettled([
      // 1. Count admissions today
      Patient.countDocuments({ hospital_id: hospitalId, created_at: { $gte: todayStart, $lt: tomorrowStart } }),

      // 2. Active patients grouped by department
      Patient.aggregate([
        { $match: { hospital_id: hospitalOid, status: "active" } },
        { $group: { _id: "$department_id", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "department",
          },
        },
        { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            department_id: "$_id",
            department_name: { $ifNull: ["$department.name", "Unassigned"] },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 3. Active doctors with their live active-patient count
      Staff.aggregate([
        { $match: { hospital_id: hospitalOid, role: "doctor", status: "active" } },
        {
          $lookup: {
            from: "patients",
            let: { doctorId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$assigned_doctor_id", "$$doctorId"] },
                      { $eq: ["$status", "active"] },
                    ],
                  },
                },
              },
              { $count: "total" },
            ],
            as: "patientCount",
          },
        },
        {
          $addFields: {
            active_patients: { $ifNull: [{ $arrayElemAt: ["$patientCount.total", 0] }, 0] },
          },
        },
        { $project: { password: 0, __v: 0, patientCount: 0 } },
        { $sort: { active_patients: -1 } },
      ]),

      // 4. Staff summary by role
      Staff.aggregate([
        { $match: { hospital_id: hospitalOid } },
        {
          $group: {
            _id: "$role",
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            suspended: { $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 5. Resource usage aggregated by type
      Resource.aggregate([
        { $match: { hospital_id: hospitalOid } },
        {
          $group: {
            _id: "$type",
            total_quantity: { $sum: "$quantity" },
            available_quantity: { $sum: "$available_quantity" },
            total_items: { $sum: 1 },
            out_of_stock: { $sum: { $cond: [{ $eq: ["$status", "out_of_stock"] }, 1, 0] } },
            low_stock: { $sum: { $cond: [{ $eq: ["$status", "low_stock"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 6. Last 30 days daily admissions (AI prediction input)
      Patient.aggregate([
        { $match: { hospital_id: hospitalOid, created_at: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$created_at" },
              month: { $month: "$created_at" },
              day: { $dayOfMonth: "$created_at" },
              dayOfWeek: { $dayOfWeek: "$created_at" }, // 1=Sun … 7=Sat
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),

      // 7. Total currently active patients
      Patient.countDocuments({ hospital_id: hospitalId, status: "active" }),

      // 8. Hospital info
      Hospital.findById(hospitalId, { name: 1, email: 1, city: 1, status: 1, is_active: 1, contact_number: 1 }),
    ]);

    // ----- AI Prediction: day-of-week historical average (30-day window) -----
    const admissionsData = admissionsHistory.status === "fulfilled" ? admissionsHistory.value : [];

    // Bucket admission counts by MongoDB dayOfWeek (1=Sun … 7=Sat)
    const dowBuckets = {};
    for (const entry of admissionsData) {
      const d = entry._id.dayOfWeek;
      if (!dowBuckets[d]) dowBuckets[d] = [];
      dowBuckets[d].push(entry.count);
    }

    const globalAvg =
      admissionsData.length > 0
        ? admissionsData.reduce((s, e) => s + e.count, 0) / admissionsData.length
        : 0;

    function predictForDow(dow) {
      const bucket = dowBuckets[dow];
      return bucket && bucket.length > 0
        ? Math.round(bucket.reduce((a, b) => a + b, 0) / bucket.length)
        : Math.round(globalAvg);
    }

    const todayDow = new Date().getDay() + 1; // JS getDay() 0=Sun → MongoDB 1=Sun
    const todayAdmitted = patientsToday.status === "fulfilled" ? patientsToday.value : 0;
    const todayPredicted = predictForDow(todayDow);
    const remainingPredicted = Math.max(0, todayPredicted - todayAdmitted);

    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekForecast = [];
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(todayStart.getTime() + i * 24 * 60 * 60 * 1000);
      weekForecast.push({
        date: futureDate.toISOString().split("T")[0],
        day: DAY_NAMES[futureDate.getDay()],
        predicted_admissions: predictForDow(futureDate.getDay() + 1),
      });
    }

    // ----- Format staff summary -----
    const staffByRole = {};
    if (staffSummary.status === "fulfilled") {
      for (const s of staffSummary.value) {
        staffByRole[s._id] = { total: s.total, active: s.active, suspended: s.suspended };
      }
    }

    // ----- Format resource usage -----
    const resourceByType = {};
    if (resourceUsage.status === "fulfilled") {
      for (const r of resourceUsage.value) {
        const used = r.total_quantity - r.available_quantity;
        resourceByType[r._id] = {
          total_quantity: r.total_quantity,
          available_quantity: r.available_quantity,
          used_quantity: used,
          utilization_pct: r.total_quantity > 0 ? Math.round((used / r.total_quantity) * 100) : 0,
          total_items: r.total_items,
          out_of_stock: r.out_of_stock,
          low_stock: r.low_stock,
        };
      }
    }

    const totalActiveStaff = Object.values(staffByRole).reduce((s, r) => s + r.active, 0);

    return res.json({
      success: true,
      hospital:
        hospitalInfo.status === "fulfilled" && hospitalInfo.value
          ? {
              id: String(hospitalInfo.value._id),
              name: hospitalInfo.value.name,
              email: hospitalInfo.value.email,
              city: hospitalInfo.value.city,
              status: hospitalInfo.value.status,
              contact_number: hospitalInfo.value.contact_number,
            }
          : null,
      summary: {
        patients_today: todayAdmitted,
        active_patients_total: activePatientCount.status === "fulfilled" ? activePatientCount.value : 0,
        total_doctors: staffByRole["doctor"]?.active ?? 0,
        total_nurses: staffByRole["nurse"]?.active ?? 0,
        total_staff: totalActiveStaff,
      },
      patients_per_department: patientsPerDept.status === "fulfilled" ? patientsPerDept.value : [],
      doctors: doctorList.status === "fulfilled" ? doctorList.value : [],
      staff_by_role: staffByRole,
      resource_usage: resourceByType,
      ai_prediction: {
        today: {
          admitted_so_far: todayAdmitted,
          predicted_total: todayPredicted,
          predicted_remaining: remainingPredicted,
          confidence: admissionsData.length >= 14 ? "high" : admissionsData.length >= 7 ? "medium" : "low",
        },
        next_7_days: weekForecast,
        model: "day-of-week historical average (30-day window)",
      },
    });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// AI: PATIENT FLOW PREDICTION
// ---------------------------------------------------------------------------

async function processAiTrainingDatasetFile({
  hospitalId,
  departmentId,
  departmentName,
  datasetPath,
  trainingDatasetPath,
  modelBundlePath,
  metadataPath,
  trainingHistoryPath,
  predictionCachePath,
}) {
  const rawCsvText = fs.readFileSync(datasetPath, "utf-8");
  const parsedRows = parseCsv(rawCsvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (!Array.isArray(parsedRows) || parsedRows.length === 0) {
    throw new Error("CSV file has no data rows.");
  }

  const dryRunReport = summarizeAiDatasetDryRun(parsedRows, hospitalId, departmentName);
  if (!dryRunReport.template.is_valid) {
    throw new Error(`Invalid AI dataset template. Missing columns: ${dryRunReport.template.missing_columns.join(", ")}`);
  }

  if (dryRunReport.accepted_rows === 0) {
    throw new Error("No valid training rows found after validation.");
  }

  backupFileWithRetention(trainingDatasetPath);
  backupFileWithRetention(modelBundlePath);
  backupFileWithRetention(metadataPath);

  fs.writeFileSync(
    trainingDatasetPath,
    toCsv(dryRunReport.training_rows, ["hospital_id", "date", "department", "disease", "gender", "patient_count"]),
    "utf-8"
  );

  const trainResult = await runPythonScript("train_patient_flow.py", [
    trainingDatasetPath,
    modelBundlePath,
    metadataPath,
    departmentId,
  ]);

  const metadata = getModelMetadataOrNull(metadataPath);
  appendTrainingHistory(trainingHistoryPath, {
    department_id: String(departmentId),
    department_name: String(departmentName),
    rows_trained: Number(trainResult?.rows_trained || metadata?.rows_trained || 0),
    source_rows: Number(metadata?.source_rows || 0),
    model_version: String(metadata?.model_version || ""),
    metrics: metadata?.metrics || trainResult?.metrics || null,
    date_min: metadata?.date_min || null,
    date_max: metadata?.date_max || null,
  });
  clearPredictionCache(predictionCachePath);

  let recentHistory = [];
  try {
    const raw = fs.existsSync(trainingHistoryPath) ? fs.readFileSync(trainingHistoryPath, "utf-8") : "[]";
    const parsed = JSON.parse(raw);
    recentHistory = Array.isArray(parsed) ? parsed.slice(-5).reverse() : [];
  } catch {
    recentHistory = [];
  }

  return {
    trainResult,
    validation_report: {
      total_rows: dryRunReport.total_rows,
      accepted_rows: dryRunReport.accepted_rows,
      rejected_rows: dryRunReport.rejected_rows,
      template: dryRunReport.template,
      issues: dryRunReport.issues,
      rejected_samples: dryRunReport.rejected_samples,
      generated_at: dryRunReport.generated_at,
    },
    metadata,
    training_history_recent: recentHistory,
  };
}

async function runAiTrainingBackgroundJob(jobId) {
  const job = AI_TRAINING_JOBS.get(jobId);
  if (!job) return;

  try {
    updateTrainingJob(jobId, {
      status: "running",
      progress: 10,
      message: "Validating dataset",
      started_at: new Date().toISOString(),
    });

    const result = await processAiTrainingDatasetFile({
      hospitalId: job.hospital_id,
      departmentId: job.department_id,
      departmentName: job.department_name,
      datasetPath: job.dataset_path,
      trainingDatasetPath: job.training_dataset_path,
      modelBundlePath: job.model_bundle_path,
      metadataPath: job.metadata_path,
      trainingHistoryPath: job.training_history_path,
      predictionCachePath: job.prediction_cache_path,
    });

    updateTrainingJob(jobId, {
      status: "completed",
      progress: 100,
      message: "Training completed",
      completed_at: new Date().toISOString(),
      result,
    });

    await writeBackgroundAuditLog({
      actorUserId: job.actor_user_id,
      actorEmail: job.actor_email,
      action: "hospital_admin_ai_training_job_completed",
      hospitalId: job.hospital_id,
      metadata: {
        job_id: jobId,
        department_id: job.department_id,
        department_name: job.department_name,
        rows_trained: Number(result?.trainResult?.rows_trained || 0),
      },
    });
  } catch (error) {
    updateTrainingJob(jobId, {
      status: "failed",
      progress: 100,
      message: "Training failed",
      completed_at: new Date().toISOString(),
      error: error.message || "Training failed",
    });

    await writeBackgroundAuditLog({
      actorUserId: job.actor_user_id,
      actorEmail: job.actor_email,
      action: "hospital_admin_ai_training_job_failed",
      hospitalId: job.hospital_id,
      metadata: {
        job_id: jobId,
        department_id: job.department_id,
        department_name: job.department_name,
        error: error.message || "Training failed",
      },
    });
  }
}

// POST /api/hospital-admin/ai/upload-department-dataset
// Access policy is inherited from router middleware: JWT + hospital_admin role + own hospital restriction.
router.post("/ai/upload-department-dataset", aiUpload.single("file"), async (req, res, next) => {
  try {
    const departmentId = String(req.body?.department_id || "").trim();
    if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: "Valid department_id is required." });
    }

    if (!req.file?.path) {
      return res.status(400).json({ success: false, message: "CSV file is required (form-data field name: file)." });
    }

    const department = await Department.findOne({ _id: departmentId, hospital_id: req.hospitalId }, { name: 1, status: 1 });
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found for your hospital." });
    }

    const aiPaths = resolveDepartmentAiPaths(req.hospitalId, departmentId);
    ensureDirectorySync(aiPaths.dir);

    fs.copyFileSync(req.file.path, aiPaths.datasetPath);

    archiveUploadedFile({
      category: "ai",
      hospitalId: req.hospitalId,
      departmentId,
      sourcePath: req.file.path,
      originalName: req.file.originalname,
    });

    const { trainResult, validation_report: validationReport } = await processAiTrainingDatasetFile({
      hospitalId: req.hospitalId,
      departmentId,
      departmentName: department.name,
      datasetPath: aiPaths.datasetPath,
      trainingDatasetPath: aiPaths.trainingDatasetPath,
      modelBundlePath: aiPaths.modelBundlePath,
      metadataPath: aiPaths.metadataPath,
      trainingHistoryPath: aiPaths.trainingHistoryPath,
      predictionCachePath: aiPaths.predictionCachePath,
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_ai_dataset_upload_train",
      targetHospitalId: req.hospitalId,
      metadata: {
        department_id: departmentId,
        department_name: department.name,
        dataset_file: AI_DATASET_NAME,
        training_dataset_file: AI_TRAINING_DATASET_NAME,
        model_file: AI_MODEL_BUNDLE_NAME,
        rows_trained: Number(trainResult?.rows_trained || 0),
      },
    });

    return res.json({
      success: true,
      message: `Dataset uploaded and model trained for ${department.name}.`,
      department: {
        id: String(department._id),
        name: department.name,
      },
      training: trainResult,
      validation_report: validationReport,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // Ignore cleanup errors.
      }
    }
    return next(error);
  }
});

// POST /api/hospital-admin/ai/dry-run-department-dataset
router.post("/ai/dry-run-department-dataset", aiUpload.single("file"), async (req, res, next) => {
  try {
    const departmentId = String(req.body?.department_id || "").trim();
    if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: "Valid department_id is required." });
    }
    if (!req.file?.path) {
      return res.status(400).json({ success: false, message: "CSV file is required (form-data field name: file)." });
    }

    const department = await Department.findOne({ _id: departmentId, hospital_id: req.hospitalId }, { name: 1 });
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found for your hospital." });
    }

    const rawCsvText = fs.readFileSync(req.file.path, "utf-8");
    const parsedRows = parseCsv(rawCsvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const report = summarizeAiDatasetDryRun(parsedRows, req.hospitalId, department.name);

    return res.json({
      success: true,
      message: "Dry run completed. No model was trained.",
      report: {
        total_rows: report.total_rows,
        accepted_rows: report.accepted_rows,
        rejected_rows: report.rejected_rows,
        template: report.template,
        issues: report.issues,
        rejected_samples: report.rejected_samples,
        generated_at: report.generated_at,
      },
      data_dictionary: {
        date: detectMappedHeader(parsedRows?.[0] || {}, TRAINING_DATE_KEYS),
        department: detectMappedHeader(parsedRows?.[0] || {}, TRAINING_DEPARTMENT_KEYS),
        disease: detectMappedHeader(parsedRows?.[0] || {}, TRAINING_DISEASE_KEYS),
        gender: detectMappedHeader(parsedRows?.[0] || {}, TRAINING_GENDER_KEYS),
        patient_count: detectMappedHeader(parsedRows?.[0] || {}, TRAINING_COUNT_KEYS),
      },
    });
  } catch (error) {
    return next(error);
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // Ignore cleanup errors.
      }
    }
  }
});

// POST /api/hospital-admin/ai/upload-department-dataset-async
router.post("/ai/upload-department-dataset-async", aiUpload.single("file"), async (req, res, next) => {
  try {
    const departmentId = String(req.body?.department_id || "").trim();
    if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: "Valid department_id is required." });
    }
    if (!req.file?.path) {
      return res.status(400).json({ success: false, message: "CSV file is required (form-data field name: file)." });
    }

    const department = await Department.findOne({ _id: departmentId, hospital_id: req.hospitalId }, { name: 1 });
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found for your hospital." });
    }

    const aiPaths = resolveDepartmentAiPaths(req.hospitalId, departmentId);
    ensureDirectorySync(aiPaths.dir);
    backupFileWithRetention(aiPaths.datasetPath);
    fs.copyFileSync(req.file.path, aiPaths.datasetPath);

    archiveUploadedFile({
      category: "ai",
      hospitalId: req.hospitalId,
      departmentId,
      sourcePath: req.file.path,
      originalName: req.file.originalname,
    });

    const job = createTrainingJob({
      hospital_id: String(req.hospitalId),
      department_id: String(department._id),
      department_name: department.name,
      dataset_path: aiPaths.datasetPath,
      training_dataset_path: aiPaths.trainingDatasetPath,
      model_bundle_path: aiPaths.modelBundlePath,
      metadata_path: aiPaths.metadataPath,
      training_history_path: aiPaths.trainingHistoryPath,
      prediction_cache_path: aiPaths.predictionCachePath,
      actor_user_id: req.authUser?._id || null,
      actor_email: req.authUser?.email || "",
      progress: 5,
      message: "Dataset received",
    });

    setImmediate(() => {
      runAiTrainingBackgroundJob(job.id);
    });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_ai_training_job_created",
      targetHospitalId: req.hospitalId,
      metadata: {
        job_id: job.id,
        department_id: String(department._id),
        department_name: department.name,
      },
    });

    return res.status(202).json({
      success: true,
      message: "Training job queued successfully.",
      job: serializeTrainingJob(job),
    });
  } catch (error) {
    return next(error);
  } finally {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // Ignore cleanup errors.
      }
    }
  }
});

// GET /api/hospital-admin/ai/training-jobs/:job_id
router.get("/ai/training-jobs/:job_id", async (req, res) => {
  const jobId = String(req.params.job_id || "").trim();
  const job = getTrainingJobForHospital(jobId, req.hospitalId);
  if (!job) {
    return res.status(404).json({ success: false, message: "Training job not found." });
  }
  return res.json({ success: true, job: serializeTrainingJob(job) });
});

// GET /api/hospital-admin/uploads
router.get("/uploads", async (req, res, next) => {
  try {
    const scope = String(req.query.scope || "all").trim().toLowerCase();
    if (!["all", "patient_records", "ai"].includes(scope)) {
      return res.status(400).json({ success: false, message: "Invalid scope." });
    }
    const departments = await Department.find({ hospital_id: req.hospitalId }, { name: 1 }).sort({ name: 1 });
    const departmentNameById = new Map(departments.map((department) => [String(department._id), department.name]));

    const files = [];
    if (scope === "all" || scope === "patient_records") {
      files.push(...listArchivedUploadFilesForCategory({
        category: "patient_records",
        hospitalId: req.hospitalId,
        departmentNameById,
      }));
    }
    if (scope === "all" || scope === "ai") {
      files.push(...listArchivedUploadFilesForCategory({
        category: "ai",
        hospitalId: req.hospitalId,
        departmentNameById,
      }));
    }

    files.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());

    return res.json({ success: true, files });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/uploads/download
router.get("/uploads/download", async (req, res, next) => {
  try {
    const category = String(req.query.category || "").trim().toLowerCase();
    if (!["patient_records", "ai"].includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category." });
    }
    const fileKey = String(req.query.file_key || "").trim();
    if (!fileKey) {
      return res.status(400).json({ success: false, message: "file_key is required." });
    }

    const rootDir = getHospitalUploadedFilesRootDir(category, req.hospitalId);
    const filePath = resolveArchivedUploadPath(rootDir, fileKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Uploaded file not found." });
    }

    return res.download(filePath, path.basename(filePath));
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/uploads/preview
router.get("/uploads/preview", async (req, res, next) => {
  try {
    const category = String(req.query.category || "").trim().toLowerCase();
    if (!["patient_records", "ai"].includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category." });
    }

    const fileKey = String(req.query.file_key || "").trim();
    if (!fileKey) {
      return res.status(400).json({ success: false, message: "file_key is required." });
    }

    const rootDir = getHospitalUploadedFilesRootDir(category, req.hospitalId);
    const filePath = resolveArchivedUploadPath(rootDir, fileKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Uploaded file not found." });
    }

    const departments = await Department.find({ hospital_id: req.hospitalId }, { name: 1 }).sort({ name: 1 });
    const departmentNameById = new Map(departments.map((department) => [String(department._id), department.name]));
    const stats = fs.statSync(filePath);
    const relativePath = String(fileKey).replace(/\\/g, "/");
    const departmentId = relativePath.split("/")[0] || "";
    const originalName = path.basename(filePath).replace(/^\d+_[a-z0-9]{6}_/i, "");
    let preview;

    try {
      preview = buildUploadPreview(filePath, originalName);
    } catch (previewError) {
      preview = {
        file_type: path.extname(originalName || filePath || "").toLowerCase() || "unknown",
        columns: [],
        preview_rows: [],
        total_rows: 0,
        warning: "Preview rendering failed for this file. Download it to inspect the full contents.",
      };
      console.warn("Preview rendering failed for archived upload", previewError);
    }

    return res.json({
      success: true,
      file: {
        category,
        department_id: departmentId,
        department_name: departmentNameById.get(String(departmentId)) || "Unknown department",
        file_name: path.basename(filePath),
        original_name: originalName,
        relative_path: relativePath,
        size_bytes: stats.size,
        uploaded_at: stats.mtime.toISOString(),
      },
      preview,
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/hospital-admin/uploads
router.delete("/uploads", async (req, res, next) => {
  try {
    const category = String(req.query.category || req.body?.category || "").trim().toLowerCase();
    if (!["patient_records", "ai"].includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category." });
    }
    const fileKey = String(req.query.file_key || req.body?.file_key || "").trim();
    if (!fileKey) {
      return res.status(400).json({ success: false, message: "file_key is required." });
    }

    const rootDir = getHospitalUploadedFilesRootDir(category, req.hospitalId);
    const filePath = resolveArchivedUploadPath(rootDir, fileKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Uploaded file not found." });
    }

    fs.unlinkSync(filePath);

    try {
      const parentDir = path.dirname(filePath);
      const entries = fs.existsSync(parentDir) ? fs.readdirSync(parentDir) : [];
      if (entries.length === 0) {
        fs.rmdirSync(parentDir);
      }
    } catch {
      // Ignore cleanup errors.
    }

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_uploaded_file_deleted",
      targetHospitalId: req.hospitalId,
      metadata: {
        category,
        file_key: fileKey,
        file_name: path.basename(filePath),
      },
    });

    return res.json({ success: true, message: "Uploaded file deleted successfully." });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/resources/uploads/preview
router.get("/resources/uploads/preview", async (req, res, next) => {
  try {
    const fileKey = String(req.query.file_key || "").trim();
    if (!fileKey) {
      return res.status(400).json({ success: false, message: "file_key is required." });
    }

    const rootDir = getHospitalUploadedFilesRootDir("resources", req.hospitalId);
    const filePath = resolveArchivedUploadPath(rootDir, fileKey);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Uploaded file not found." });
    }

    const departments = await Department.find({ hospital_id: req.hospitalId }, { name: 1 }).sort({ name: 1 });
    const departmentNameById = new Map(departments.map((department) => [String(department._id), department.name]));
    const stats = fs.statSync(filePath);
    const relativePath = String(fileKey).replace(/\\/g, "/");
    const departmentId = relativePath.split("/")[0] || "";
    const originalName = path.basename(filePath).replace(/^\d+_[a-z0-9]{6}_/i, "");
    let preview;

    try {
      preview = buildUploadPreview(filePath, originalName);
    } catch (previewError) {
      preview = {
        file_type: path.extname(originalName || filePath || "").toLowerCase() || "unknown",
        columns: [],
        preview_rows: [],
        total_rows: 0,
        warning: "Preview rendering failed for this file. Download it to inspect the full contents.",
      };
      console.warn("Preview rendering failed for archived resource upload", previewError);
    }

    return res.json({
      success: true,
      file: {
        category: "resources",
        department_id: departmentId,
        department_name: departmentNameById.get(String(departmentId)) || "Unknown department",
        file_name: path.basename(filePath),
        original_name: originalName,
        relative_path: relativePath,
        size_bytes: stats.size,
        uploaded_at: stats.mtime.toISOString(),
      },
      preview,
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/hospital-admin/ai/retrain-all-departments
router.post("/ai/retrain-all-departments", async (req, res, next) => {
  try {
    const departments = await Department.find({ hospital_id: req.hospitalId }, { name: 1 }).sort({ name: 1 });
    const jobs = [];

    for (const department of departments) {
      const aiPaths = resolveDepartmentAiPaths(req.hospitalId, department._id);
      if (!fs.existsSync(aiPaths.datasetPath)) continue;

      const job = createTrainingJob({
        hospital_id: String(req.hospitalId),
        department_id: String(department._id),
        department_name: department.name,
        dataset_path: aiPaths.datasetPath,
        training_dataset_path: aiPaths.trainingDatasetPath,
        model_bundle_path: aiPaths.modelBundlePath,
        metadata_path: aiPaths.metadataPath,
        training_history_path: aiPaths.trainingHistoryPath,
        prediction_cache_path: aiPaths.predictionCachePath,
        actor_user_id: req.authUser?._id || null,
        actor_email: req.authUser?.email || "",
        progress: 5,
        message: "Queued by retrain-all",
      });

      jobs.push(serializeTrainingJob(job));
      setImmediate(() => {
        runAiTrainingBackgroundJob(job.id);
      });
    }

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_ai_retrain_all_triggered",
      targetHospitalId: req.hospitalId,
      metadata: { jobs_count: jobs.length },
    });

    return res.status(202).json({
      success: true,
      message: `${jobs.length} training job(s) queued.`,
      jobs,
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/hospital-admin/ai/retrain-department
router.post("/ai/retrain-department", async (req, res, next) => {
  try {
    const departmentRef = String(
      req.body?.department_id
      || req.query?.department_id
      || req.body?.department_name
      || req.query?.department_name
      || req.body?.department
      || req.query?.department
      || ""
    ).trim();
    if (!departmentRef) {
      return res.status(400).json({ success: false, message: "department_id or department_name is required." });
    }

    const department = await resolveDepartmentForHospital(departmentRef, req.hospitalId);
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found for your hospital." });
    }

    const resolvedDepartmentId = String(department._id);
    const aiPaths = resolveDepartmentAiPaths(req.hospitalId, resolvedDepartmentId);
    if (!fs.existsSync(aiPaths.datasetPath)) {
      return res.status(404).json({ success: false, message: "No uploaded AI dataset found for this department." });
    }

    const job = createTrainingJob({
      hospital_id: String(req.hospitalId),
      department_id: resolvedDepartmentId,
      department_name: department.name,
      dataset_path: aiPaths.datasetPath,
      training_dataset_path: aiPaths.trainingDatasetPath,
      model_bundle_path: aiPaths.modelBundlePath,
      metadata_path: aiPaths.metadataPath,
      training_history_path: aiPaths.trainingHistoryPath,
      prediction_cache_path: aiPaths.predictionCachePath,
      actor_user_id: req.authUser?._id || null,
      actor_email: req.authUser?.email || "",
      progress: 5,
      message: "Queued by retrain-department",
    });

    setImmediate(() => {
      runAiTrainingBackgroundJob(job.id);
    });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_ai_retrain_department_triggered",
      targetHospitalId: req.hospitalId,
      metadata: {
        job_id: job.id,
        department_id: resolvedDepartmentId,
        department_name: department.name,
      },
    });

    return res.status(202).json({
      success: true,
      message: `Retrain job queued for ${department.name}.`,
      job: serializeTrainingJob(job),
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/hospital-admin/ai/predict-patient-load
router.post("/ai/predict-patient-load", async (req, res, next) => {
  try {
    const departmentId = String(req.body?.department_id || "").trim();
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

    const allowedDiseases = getAllowedDiseasesByDepartment(department.name);
    if (allowedDiseases.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No disease catalog configured for department ${department.name}.`,
      });
    }

    const disease = "all";

    const aiPaths = resolveDepartmentAiPaths(req.hospitalId, departmentId);
    if (!fs.existsSync(aiPaths.modelBundlePath)) {
      return res.status(404).json({
        success: false,
        message: "Model not found for this department. Please upload dataset and train first.",
      });
    }

    const metadata = getModelMetadataOrNull(aiPaths.metadataPath);
    const cacheKey = buildPredictionCacheKey({ dateYmd, gender });
    const cache = readPredictionCache(aiPaths.predictionCachePath);
    const cachedEntry = cache?.[cacheKey];
    if (cachedEntry && String(cachedEntry.model_trained_at || "") === String(metadata?.trained_at_utc || "")) {
      return res.json({
        ...cachedEntry.payload,
        cached: true,
      });
    }

    const consistentPrediction = await predictConsistentDepartmentValue({
      modelBundlePath: aiPaths.modelBundlePath,
      hospitalId: req.hospitalId,
      departmentName: department.name,
      disease,
      gender,
      dateYmd,
    });
    const expectedPatientsRaw = Number(consistentPrediction.expectedPatients || 0);
    const effectiveRmse = Number(metadata?.metrics?.validation_rmse ?? metadata?.metrics?.rmse);
    const confidenceHalfWidth = Number.isFinite(effectiveRmse) ? Math.max(1, Math.round(effectiveRmse * 1.28)) : null;

    const rows = readDatasetRows(aiPaths.datasetPath);
    const actualSeries = buildLastSevenDayActual(rows, dateYmd, department.name, req.hospitalId, disease, gender);
    const chartData = await Promise.all(
      actualSeries.map(async (point) => {
        const pointPrediction = await predictForDateWithBundle(
          aiPaths.modelBundlePath,
          req.hospitalId,
          department.name,
          disease,
          gender,
          point.date
        );
        return {
          date: point.date,
          actual: point.actual,
          predicted: Number(pointPrediction || 0),
        };
      })
    );

    const calibration = calibratePredictionWithRecentBehavior({
      rawExpected: expectedPatientsRaw,
      chartData,
      targetDateYmd: dateYmd,
    });
    const expectedPatients = Number(calibration.expected || 0);
    const calibratedChartData = chartData.map((point, idx) => ({
      ...point,
      predicted: Number(calibration.chartPredicted?.[idx] ?? point.predicted ?? 0),
    }));

    const metrics = metadata?.metrics
      ? {
          ...metadata.metrics,
          mae: metadata.metrics.validation_mae ?? metadata.metrics.mae,
          rmse: metadata.metrics.validation_rmse ?? metadata.metrics.rmse,
          r2: metadata.metrics.validation_r2 ?? metadata.metrics.r2,
          evaluation_split: metadata.metrics.validation_rows ? "time_split_validation" : "train_fit",
        }
      : null;

    const validationR2 = Number(metrics?.r2);
    const useStatisticalFallback = Number.isFinite(validationR2) && validationR2 < 0.45;
    if (useStatisticalFallback) {
      const dailySeries = buildDailyActualSeries(rows, department.name, req.hospitalId, disease, gender);
      const statExpected = estimateStatisticalForecast(dailySeries, dateYmd);
      if (Number.isFinite(statExpected)) {
        const blended = Math.round(0.2 * expectedPatients + 0.8 * Number(statExpected || 0));
        const clamped = Math.max(0, blended);
        calibration.expected = clamped;

        const adjustedChart = [];
        for (const point of calibratedChartData) {
          const statPoint = estimateStatisticalForecast(dailySeries, point.date);
          const blendPoint = Number.isFinite(statPoint)
            ? Math.round(0.25 * Number(point.predicted || 0) + 0.75 * Number(statPoint || 0))
            : Number(point.predicted || 0);
          adjustedChart.push({ ...point, predicted: Math.max(0, blendPoint) });
        }
        calibratedChartData.length = 0;
        calibratedChartData.push(...adjustedChart);
      }
    }

    let diseaseBreakdown = [];
    let diseaseBreakdownTotal = 0;
    if (String(disease || "").toLowerCase() === "all") {
      diseaseBreakdown = consistentPrediction.diseaseBreakdown || [];
      diseaseBreakdownTotal = Number(consistentPrediction.diseaseBreakdownTotal || 0);
    }

    const payload = {
      success: true,
      expected_patients: expectedPatients,
      input: {
        hospital_id: String(req.hospitalId),
        department_id: String(department._id),
        department_name: department.name,
        date: dateYmd,
        disease: "all",
        gender,
      },
      confidence_range: confidenceHalfWidth
        ? {
            lower: Math.max(0, expectedPatients - confidenceHalfWidth),
            upper: expectedPatients + confidenceHalfWidth,
            method: "approx_80pct_from_training_rmse",
          }
        : null,
      model_freshness_days: getModelFreshnessDays(metadata),
      model_metrics: metrics,
      chart_data: calibratedChartData,
      disease_breakdown: diseaseBreakdown,
      disease_breakdown_total: diseaseBreakdownTotal,
      calibration,
      forecast_strategy: useStatisticalFallback ? "hybrid_statistical_priority" : "hybrid_ml_priority",
    };

    cache[cacheKey] = {
      model_trained_at: String(metadata?.trained_at_utc || ""),
      generated_at: new Date().toISOString(),
      payload,
    };
    writePredictionCache(aiPaths.predictionCachePath, cache);

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/ai/predictions-by-department?date=YYYY-MM-DD&gender=all&disease=all
router.get("/ai/predictions-by-department", async (req, res, next) => {
  try {
    const dateYmd = normalizeYmd(req.query?.date || new Date().toISOString().slice(0, 10));
    const gender = String(req.query?.gender || "all").trim().toLowerCase() || "all";
    const diseaseInput = "all";
    const departmentIdFilter = String(req.query?.department_id || "").trim();

    if (!dateYmd) {
      return res.status(400).json({ success: false, message: "Valid date is required in YYYY-MM-DD format." });
    }

    const deptQuery = { hospital_id: req.hospitalId };
    if (departmentIdFilter) {
      if (!mongoose.Types.ObjectId.isValid(departmentIdFilter)) {
        return res.status(400).json({ success: false, message: "Invalid department_id filter." });
      }
      deptQuery._id = departmentIdFilter;
    }

    const departments = await Department.find(deptQuery, { name: 1, status: 1 }).sort({ name: 1 });
    const doctors = await Staff.find(
      {
        hospital_id: req.hospitalId,
        role: "doctor",
        status: { $ne: "inactive" },
      },
      { _id: 1, department_id: 1 }
    );
    const doctorsByDepartment = new Map();
    for (const doctor of doctors) {
      const deptId = doctor?.department_id ? String(doctor.department_id) : "";
      if (!deptId) continue;
      if (!doctorsByDepartment.has(deptId)) doctorsByDepartment.set(deptId, []);
      doctorsByDepartment.get(deptId).push(doctor);
    }
    const predictions = [];
    const unavailable = [];

    for (const department of departments) {
      try {
        const disease = "all";
        const aiPaths = resolveDepartmentAiPaths(req.hospitalId, department._id);
        const forecast = await predictDepartmentDemandForDate({
          hospitalId: req.hospitalId,
          department,
          dateYmd,
          gender,
          departmentDoctors: doctorsByDepartment.get(String(department._id)) || [],
        });
        const value = Number(forecast?.expected_patients || 0);
        let diseaseBreakdown = [];
        if (String(diseaseInput || "").trim().toLowerCase() === "all" && String(forecast?.source || "") === "model_prediction") {
          const aiPaths = resolveDepartmentAiPaths(req.hospitalId, department._id);
          const consistentPrediction = await predictConsistentDepartmentValue({
            modelBundlePath: aiPaths.modelBundlePath,
            hospitalId: req.hospitalId,
            departmentName: department.name,
            disease,
            gender,
            dateYmd,
          });
          diseaseBreakdown = consistentPrediction.diseaseBreakdown || [];
        }
        if (forecast?.unavailable_reason) {
          unavailable.push({
            department_id: String(department._id),
            department_name: department.name,
            reason: forecast.unavailable_reason,
          });
        }
        predictions.push({
          department_id: String(department._id),
          department_name: department.name,
          expected_patients: value,
          prediction_source: String(forecast?.source || "historical_fallback"),
          model_freshness_days: getModelFreshnessDays(getModelMetadataOrNull(aiPaths.metadataPath)),
          disease_breakdown: diseaseBreakdown,
        });
      } catch (predictionError) {
        unavailable.push({
          department_id: String(department._id),
          department_name: department.name,
          reason: predictionError.message,
        });
      }
    }

    predictions.sort((a, b) => b.expected_patients - a.expected_patients);

    return res.json({
      success: true,
      input: {
        date: dateYmd,
        disease: String(diseaseInput || "all"),
        gender,
      },
      predictions,
      unavailable,
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/hospital-admin/ai/smart-scheduling/generate
router.post("/ai/smart-scheduling/generate", async (req, res, next) => {
  try {
    const startDateInput = req.body?.start_date || new Date().toISOString().slice(0, 10);
    const startDateYmd = normalizeYmd(startDateInput);
    const horizonDays = Math.min(31, Math.max(1, Number.parseInt(String(req.body?.horizon_days || "7"), 10) || 7));
    const safetyBufferPct = Math.min(100, Math.max(0, Number(req.body?.safety_buffer_pct ?? 10) || 0));
    const departmentIdFilter = String(req.body?.department_id || "").trim();
    const gender = String(req.body?.gender || "all").trim().toLowerCase() || "all";

    if (!startDateYmd) {
      return res.status(400).json({ success: false, message: "Valid start_date is required in YYYY-MM-DD format." });
    }

    const departmentQuery = { hospital_id: req.hospitalId };
    if (departmentIdFilter) {
      if (!mongoose.Types.ObjectId.isValid(departmentIdFilter)) {
        return res.status(400).json({ success: false, message: "Invalid department_id filter." });
      }
      departmentQuery._id = departmentIdFilter;
    }

    const departments = await Department.find(departmentQuery, { name: 1 }).sort({ name: 1 });
    if (departments.length === 0) {
      return res.status(404).json({ success: false, message: "No departments found for smart scheduling." });
    }

    const doctorList = await Staff.find(
      { hospital_id: req.hospitalId, role: "doctor", status: { $ne: "inactive" } },
      {
        _id: 1,
        name: 1,
        department_id: 1,
        shift: 1,
        available_days: 1,
        status: 1,
        max_patients_per_day: 1,
      }
    ).lean();

    const doctorsByDepartment = new Map();
    for (const doctor of doctorList) {
      const key = String(doctor.department_id || "");
      if (!key) continue;
      if (!doctorsByDepartment.has(key)) doctorsByDepartment.set(key, []);
      doctorsByDepartment.get(key).push(doctor);
    }

    const startDateObj = new Date(`${startDateYmd}T00:00:00.000Z`);
    const alerts = [];
    const departmentsPlan = [];
    let totalPredicted = 0;
    let totalPlanned = 0;
    let totalCapacity = 0;
    let uncoveredDays = 0;
    let overloadedDays = 0;
    let fallbackPredictionDays = 0;

    for (const department of departments) {
      const departmentDoctors = doctorsByDepartment.get(String(department._id)) || [];
      const dayPlans = [];
      let departmentPredicted = 0;
      let departmentPlanned = 0;
      let departmentCapacity = 0;

      for (let offset = 0; offset < horizonDays; offset += 1) {
        const dayObj = new Date(startDateObj.getTime() + offset * 24 * 60 * 60 * 1000);
        const dayYmd = dayObj.toISOString().slice(0, 10);
        const weekdayName = SMART_WEEKDAY_NAMES[dayObj.getUTCDay()];

        const prediction = await predictDepartmentDemandForDate({
          hospitalId: req.hospitalId,
          department,
          dateYmd: dayYmd,
          gender,
          departmentDoctors,
        });

        const predictedPatients = Math.max(0, Math.round(Number(prediction.expected_patients || 0)));
        const plannedDemand = Math.max(0, Math.round(predictedPatients * (1 + safetyBufferPct / 100)));
        const availableDoctors = departmentDoctors.filter((doctor) => doctorIsAvailableOnWeekday(doctor, weekdayName));
        const dailyCapacity = availableDoctors.reduce((sum, doctor) => sum + getDoctorDailyCapacity(doctor), 0);
        const allocation = allocateDemandAcrossDoctors(availableDoctors, plannedDemand);
        const shortage = Math.max(0, plannedDemand - allocation.assignedTotal);

        const dayPlan = {
          date: dayYmd,
          weekday: weekdayName,
          predicted_patients: predictedPatients,
          planned_patients: plannedDemand,
          safety_buffer_pct: safetyBufferPct,
          available_doctors_count: availableDoctors.length,
          total_capacity: dailyCapacity,
          assigned_patients: allocation.assignedTotal,
          shortage,
          prediction_source: prediction.source,
          prediction_note: prediction.unavailable_reason || "",
          assignments: allocation.assignments,
          coverage_status: availableDoctors.length > 0 ? "covered" : "uncovered",
        };
        dayPlans.push(dayPlan);

        if (prediction.source !== "model_prediction") {
          fallbackPredictionDays += 1;
        }

        if (availableDoctors.length === 0) {
          uncoveredDays += 1;
          alerts.push({
            severity: "critical",
            kind: "no_coverage",
            department_id: String(department._id),
            department_name: department.name,
            date: dayYmd,
            message: `${department.name} has no doctor coverage on ${dayYmd}.`,
            recommended_action: "Approve schedule change requests or assign backup doctors for this day.",
          });
        }

        if (shortage > 0) {
          overloadedDays += 1;
          alerts.push({
            severity: shortage >= 5 ? "high" : "medium",
            kind: "overload_risk",
            department_id: String(department._id),
            department_name: department.name,
            date: dayYmd,
            message: `${department.name} is short by ${shortage} patient slots on ${dayYmd}.`,
            recommended_action: "Increase doctor availability or reduce appointment load through redistribution.",
          });
        }

        if (allocation.assignments.some((item) => Number(item.utilization_pct || 0) >= 95)) {
          alerts.push({
            severity: "medium",
            kind: "high_utilization",
            department_id: String(department._id),
            department_name: department.name,
            date: dayYmd,
            message: `${department.name} has doctors projected at near-full utilization on ${dayYmd}.`,
            recommended_action: "Consider temporary backup coverage to reduce burnout risk.",
          });
        }

        departmentPredicted += predictedPatients;
        departmentPlanned += plannedDemand;
        departmentCapacity += dailyCapacity;
      }

      departmentsPlan.push({
        department_id: String(department._id),
        department_name: department.name,
        doctor_count: departmentDoctors.length,
        summary: {
          predicted_patients: departmentPredicted,
          planned_patients: departmentPlanned,
          total_capacity: departmentCapacity,
          utilization_pct: departmentCapacity > 0
            ? Number(((departmentPlanned / departmentCapacity) * 100).toFixed(1))
            : 0,
        },
        days: dayPlans,
      });

      totalPredicted += departmentPredicted;
      totalPlanned += departmentPlanned;
      totalCapacity += departmentCapacity;
    }

    const endDateObj = new Date(startDateObj.getTime() + (horizonDays - 1) * 24 * 60 * 60 * 1000);
    const planSummary = {
      predicted_patients_total: totalPredicted,
      planned_patients_total: totalPlanned,
      total_capacity: totalCapacity,
      utilization_pct: totalCapacity > 0 ? Number(((totalPlanned / totalCapacity) * 100).toFixed(1)) : 0,
      uncovered_days: uncoveredDays,
      overloaded_days: overloadedDays,
      fallback_prediction_days: fallbackPredictionDays,
      alert_count: alerts.length,
    };

    const createdPlan = await SmartSchedulePlan.create({
      hospital_id: req.hospitalId,
      generated_by: req.authUser?._id || null,
      start_date: startDateYmd,
      end_date: endDateObj.toISOString().slice(0, 10),
      horizon_days: horizonDays,
      safety_buffer_pct: safetyBufferPct,
      department_filter: departmentIdFilter && mongoose.Types.ObjectId.isValid(departmentIdFilter)
        ? new mongoose.Types.ObjectId(departmentIdFilter)
        : null,
      summary: planSummary,
      alerts,
      departments_plan: departmentsPlan,
    });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_ai_smart_schedule_generated",
      targetHospitalId: req.hospitalId,
      metadata: {
        plan_id: String(createdPlan._id),
        start_date: startDateYmd,
        horizon_days: horizonDays,
        alerts_count: alerts.length,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Smart scheduling plan generated successfully.",
      plan: {
        id: String(createdPlan._id),
        generated_at: createdPlan.created_at,
        start_date: createdPlan.start_date,
        end_date: createdPlan.end_date,
        horizon_days: createdPlan.horizon_days,
        safety_buffer_pct: createdPlan.safety_buffer_pct,
        summary: planSummary,
        alerts,
        departments_plan: departmentsPlan,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/ai/smart-scheduling/plans?limit=5
router.get("/ai/smart-scheduling/plans", async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, Number.parseInt(String(req.query?.limit || "5"), 10) || 5));
    const plans = await SmartSchedulePlan.find(
      { hospital_id: req.hospitalId },
      {
        _id: 1,
        start_date: 1,
        end_date: 1,
        horizon_days: 1,
        safety_buffer_pct: 1,
        summary: 1,
        alerts: 1,
        created_at: 1,
      }
    )
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      plans: plans.map((plan) => ({
        id: String(plan._id),
        start_date: plan.start_date,
        end_date: plan.end_date,
        horizon_days: plan.horizon_days,
        safety_buffer_pct: plan.safety_buffer_pct,
        summary: plan.summary || {},
        alert_count: Array.isArray(plan.alerts) ? plan.alerts.length : 0,
        created_at: plan.created_at,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/ai/model-status
router.get("/ai/model-status", async (req, res, next) => {
  try {
    const departments = await Department.find({ hospital_id: req.hospitalId }, { name: 1 }).sort({ name: 1 });
    const models = departments.map((department) => {
      const aiPaths = resolveDepartmentAiPaths(req.hospitalId, department._id);
      const metadata = getModelMetadataOrNull(aiPaths.metadataPath);
      const effectiveMetrics = metadata?.metrics
        ? {
            ...metadata.metrics,
            mae: metadata.metrics.validation_mae ?? metadata.metrics.mae,
            rmse: metadata.metrics.validation_rmse ?? metadata.metrics.rmse,
            r2: metadata.metrics.validation_r2 ?? metadata.metrics.r2,
            evaluation_split: metadata.metrics.validation_rows ? "time_split_validation" : "train_fit",
          }
        : null;
      let recentTraining = [];
      try {
        if (fs.existsSync(aiPaths.trainingHistoryPath)) {
          const parsed = JSON.parse(fs.readFileSync(aiPaths.trainingHistoryPath, "utf-8"));
          recentTraining = Array.isArray(parsed) ? parsed.slice(-3).reverse() : [];
        }
      } catch {
        recentTraining = [];
      }
      return {
        department_id: String(department._id),
        department_name: department.name,
        has_dataset: fs.existsSync(aiPaths.datasetPath),
        has_training_dataset: fs.existsSync(aiPaths.trainingDatasetPath),
        has_model: fs.existsSync(aiPaths.modelBundlePath),
        model_freshness_days: getModelFreshnessDays(metadata),
        model_metrics: effectiveMetrics,
        metadata,
        recent_training: recentTraining,
      };
    });

    return res.json({
      success: true,
      models,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/ai/disease-catalog
router.get("/ai/disease-catalog", async (req, res, next) => {
  try {
    const departments = await Department.find({ hospital_id: req.hospitalId }, { name: 1 }).sort({ name: 1 });
    const byDepartment = departments.map((department) => ({
      department_id: String(department._id),
      department_name: department.name,
      diseases: getAllowedDiseasesByDepartment(department.name),
    }));

    return res.json({
      success: true,
      by_department: byDepartment,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/ai/stored-predictions?department_id=...&limit=10
router.get("/ai/stored-predictions", async (req, res, next) => {
  try {
    const departmentId = String(req.query?.department_id || "").trim();
    const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query?.limit || "10"), 10) || 10));

    if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ success: false, message: "Valid department_id is required." });
    }

    const department = await Department.findOne({ _id: departmentId, hospital_id: req.hospitalId }, { name: 1 });
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found for your hospital." });
    }

    const aiPaths = getDepartmentAiPaths(req.hospitalId, departmentId);
    const entries = listStoredPredictionEntries(aiPaths.predictionCachePath).slice(0, limit);

    return res.json({
      success: true,
      department: {
        id: String(department._id),
        name: department.name,
      },
      total_entries: entries.length,
      entries,
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/hospital-admin/ai/smart-scheduling/optimize
// Analyzes current doctor availability and creates a pending optimization proposal.
router.post("/ai/smart-scheduling/optimize", async (req, res, next) => {
  try {
    const departmentIdFilter = String(req.body?.department_id || "").trim();

    const departmentQuery = { hospital_id: req.hospitalId };
    if (departmentIdFilter) {
      if (!mongoose.Types.ObjectId.isValid(departmentIdFilter)) {
        return res.status(400).json({ success: false, message: "Invalid department_id filter." });
      }
      departmentQuery._id = departmentIdFilter;
    }

    const departments = await Department.find(departmentQuery, { name: 1 }).sort({ name: 1 });
    if (departments.length === 0) {
      return res.status(404).json({ success: false, message: "No departments found for optimization." });
    }

    const doctorList = await Staff.find(
      { hospital_id: req.hospitalId, role: "doctor", status: { $ne: "inactive" } },
      {
        _id: 1,
        name: 1,
        department_id: 1,
        shift: 1,
        available_days: 1,
        status: 1,
        max_patients_per_day: 1,
        specialization: 1,
      }
    ).lean();

    const doctorsByDepartment = new Map();
    for (const doctor of doctorList) {
      const key = String(doctor.department_id || "");
      if (!key) continue;
      if (!doctorsByDepartment.has(key)) doctorsByDepartment.set(key, []);
      doctorsByDepartment.get(key).push(doctor);
    }

    const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const coverageAnalysis = [];
    const recommendations = [];
    let totalGaps = 0;

    // Advanced scheduling algorithm: Each doctor gets 6 days + 1 holiday, 3+ doctors per day
    const generateOptimalRoster = (departmentDoctors, departmentName, departmentId) => {
      if (departmentDoctors.length < 3) {
        return { roster: null, error: `Insufficient doctors (${departmentDoctors.length}). Need minimum 3.` };
      }

      const numDoctors = departmentDoctors.length;
      const numDays = 7;
      const minDocsPerDay = 3;

      // Calculate if solution is feasible: total doctor-days >= days * minDocsPerDay
      const totalDoctorDays = numDoctors * 6; // Each works 6 days
      const requiredDoctorDays = numDays * minDocsPerDay; // 3 per day

      if (totalDoctorDays < requiredDoctorDays) {
        return { 
          roster: null, 
          error: `Cannot guarantee 3+ doctors per day. Have ${numDoctors} doctors (${totalDoctorDays} total days), need ${requiredDoctorDays}.` 
        };
      }

      // Distribute holidays round-robin to ensure different employees have different days off
      const rosterMap = new Map(); // doctorId -> Set of days to work
      
      for (let i = 0; i < numDoctors; i++) {
        const doctor = departmentDoctors[i];
        const holidayIndex = i % numDays; // Distribute: doc0->day0, doc1->day1, etc.
        const workDays = new Set();
        
        for (let d = 0; d < numDays; d++) {
          if (d !== holidayIndex) {
            workDays.add(WEEKDAYS[d]);
          }
        }
        
        rosterMap.set(String(doctor._id), {
          doctor: doctor,
          holiday: WEEKDAYS[holidayIndex],
          workDays: Array.from(workDays),
        });
      }

      // Verify coverage: check each day has 3+ doctors
      const dayCoverage = new Map();
      for (const day of WEEKDAYS) {
        dayCoverage.set(day, []);
      }

      for (const entry of rosterMap.values()) {
        for (const day of entry.workDays) {
          dayCoverage.get(day).push(entry.doctor.name);
        }
      }

      // Validate 3+ doctors per day
      let allValidated = true;
      for (const [day, doctors] of dayCoverage) {
        if (doctors.length < minDocsPerDay) {
          allValidated = false;
          break;
        }
      }

      return {
        roster: rosterMap,
        coverage: dayCoverage,
        isValid: allValidated,
      };
    };

    for (const department of departments) {
      const departmentDoctors = doctorsByDepartment.get(String(department._id)) || [];
      
      const scheduleResult = generateOptimalRoster(departmentDoctors, department.name, department._id);

      if (scheduleResult.error) {
        // Cannot generate valid schedule
        recommendations.push({
          type: "insufficient_doctors",
          department_id: String(department._id),
          department_name: department.name,
          action: scheduleResult.error,
          priority: "critical",
        });
        totalGaps += 1;

        coverageAnalysis.push({
          department_id: String(department._id),
          department_name: department.name,
          total_doctors: departmentDoctors.length,
          status: "insufficient_staff",
          message: scheduleResult.error,
        });
        continue;
      }

      // Generate roster data for display
      const rosterData = [];
      for (const [doctorId, entry] of scheduleResult.roster) {
        const shiftValue = entry.doctor.shift || "flex";
        rosterData.push({
          doctor_id: doctorId,
          doctor_name: entry.doctor.name,
          holiday: entry.holiday,
          work_days: entry.workDays,
          shift: shiftValue,
          shift_window: getShiftWindow(shiftValue),
        });
      }

      // Add to coverage analysis
      coverageAnalysis.push({
        department_id: String(department._id),
        department_name: department.name,
        total_doctors: departmentDoctors.length,
        status: "optimal_schedule",
        schedule: {
          minimum_doctors_per_day: 3,
          roster: rosterData,
        },
        weekday_coverage: Array.from(scheduleResult.coverage.entries()).map(([day, doctors]) => ({
          weekday: day,
          doctor_count: doctors.length,
          doctors: doctors,
          status: doctors.length >= 3 ? "full_coverage" : "gap",
        })),
      });

      // Generate recommendations to change doctor availability to match optimal roster
      for (const [doctorId, entry] of scheduleResult.roster) {
        const doctor = departmentDoctors.find((d) => String(d._id) === doctorId);
        if (!doctor) continue;

        const currentDaysRaw = Array.isArray(doctor.available_days) ? doctor.available_days : [];
        const currentDays = currentDaysRaw.map((d) => String(d || "").trim().toLowerCase()).filter(Boolean);

        // Only recommend if different from current
        if (JSON.stringify(currentDays.sort()) !== JSON.stringify(entry.workDays.sort())) {
          recommendations.push({
            type: "update_roster",
            department_id: String(department._id),
            department_name: department.name,
            doctor_id: doctorId,
            doctor_name: entry.doctor.name,
            current_days: currentDays,
            proposed_days: entry.workDays,
            holiday: entry.holiday,
            action: `Update ${entry.doctor.name}'s schedule: Work ${entry.workDays.join(", ")} (off ${entry.holiday})`,
            priority: "high",
          });
        }
      }
    }

    // Sort recommendations by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority || "low"] - priorityOrder[b.priority || "low"];
    });

    // Build proposal changes from recommendations
    const changesMap = new Map();
    for (const rec of recommendations) {
      if (rec.type === "update_roster") {
        const doctorId = String(rec.doctor_id || "");
        if (!doctorId) continue;

        changesMap.set(doctorId, {
          doctor_id: doctorId,
          doctor_name: rec.doctor_name,
          department_id: String(rec.department_id || ""),
          department_name: rec.department_name,
          current_days: rec.current_days,
          proposed_days: rec.proposed_days,
          holiday: rec.holiday,
          action: rec.action,
        });
      }
    }

    const proposalChanges = [];
    let appointmentsToReview = 0;

    for (const entry of changesMap.values()) {
      const doctor = doctorList.find((item) => String(item._id) === String(entry.doctor_id));
      if (!doctor) continue;

      const currentDaysRaw = Array.isArray(doctor.available_days) ? doctor.available_days : [];

      const appointments = await Appointment.find(
        {
          hospital_id: req.hospitalId,
          doctor_id: doctor._id,
          status: { $ne: "cancelled" },
        },
        { _id: 1 }
      ).lean();

      appointmentsToReview += appointments.length;
      proposalChanges.push({
        doctor_id: doctor._id,
        doctor_name: doctor.name,
        department_id: doctor.department_id,
        department_name: entry.department_name,
        change_type: "optimal_roster_assignment",
        from_state: {
          available_days: currentDaysRaw,
          shift: doctor.shift || "",
        },
        to_state: {
          available_days: entry.proposed_days,
          shift: doctor.shift || "",
          personal_holiday: entry.holiday,
        },
        affected_appointments: appointments.length,
        appointment_ids: appointments.map((row) => row._id),
        description: entry.action,
      });
    }

    // Count critical gaps (departments with insufficient doctors)
    const criticalGaps = recommendations.filter((r) => r.type === "insufficient_doctors").length;
    const affectedDoctorIds = new Set(proposalChanges.map((item) => String(item.doctor_id)));
    const coverageImprovementPct = 100; // Full coverage achieved with optimal roster

    const proposal = await ScheduleOptimizationProposal.create({
      hospital_id: req.hospitalId,
      created_by: req.authUser?._id || null,
      status: "pending",
      title: `Optimization ${new Date().toISOString().slice(0, 10)}`,
      description: "Auto-generated schedule optimization proposal.",
      optimization_type: "weekly_coverage",
      department_filter: departmentIdFilter && mongoose.Types.ObjectId.isValid(departmentIdFilter)
        ? new mongoose.Types.ObjectId(departmentIdFilter)
        : null,
      summary: {
        total_gaps_to_close: criticalGaps,
        scheduling_model: "6_days_1_holiday_per_doctor",
        minimum_doctors_per_day: 3,
        doctors_affected: affectedDoctorIds.size,
        coverage_improvement_pct: coverageImprovementPct,
        appointments_to_review: appointmentsToReview,
      },
      changes: proposalChanges,
    });

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_schedule_optimization_created",
      targetHospitalId: req.hospitalId,
      metadata: {
        proposal_id: String(proposal._id),
        total_gaps: criticalGaps,
        doctors_affected: affectedDoctorIds.size,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Optimization proposal generated and saved for approval.",
      proposal: {
        id: String(proposal._id),
        status: proposal.status,
        summary: proposal.summary,
        changes_count: proposalChanges.length,
        created_at: proposal.created_at,
      },
      analysis: {
        total_departments: departments.length,
        total_coverage_gaps: criticalGaps,
        optimize_window: "full_week_coverage",
        departments: coverageAnalysis,
      },
      recommendations,
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/ai/smart-scheduling/optimize/proposals
router.get("/ai/smart-scheduling/optimize/proposals", async (req, res, next) => {
  try {
    const status = String(req.query?.status || "").trim().toLowerCase();
    const query = { hospital_id: req.hospitalId };
    if (["pending", "approved", "applied", "rejected"].includes(status)) {
      query.status = status;
    }

    const proposals = await ScheduleOptimizationProposal.find(query)
      .sort({ created_at: -1 })
      .limit(30)
      .lean();

    return res.json({
      success: true,
      proposals: proposals.map((item) => ({
        id: String(item._id),
        title: item.title,
        status: item.status,
        summary: item.summary || {},
        changes_count: Array.isArray(item.changes) ? item.changes.length : 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/ai/smart-scheduling/optimize/proposals/:proposalId
router.get("/ai/smart-scheduling/optimize/proposals/:proposalId", async (req, res, next) => {
  try {
    const proposalId = String(req.params?.proposalId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(proposalId)) {
      return res.status(400).json({ success: false, message: "Invalid proposal ID." });
    }

    const proposal = await ScheduleOptimizationProposal.findOne({
      _id: proposalId,
      hospital_id: req.hospitalId,
    }).lean();

    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }

    return res.json({ success: true, proposal });
  } catch (error) {
    return next(error);
  }
});

// POST /api/hospital-admin/ai/smart-scheduling/optimize/:proposalId/approve
router.post("/ai/smart-scheduling/optimize/:proposalId/approve", async (req, res, next) => {
  try {
    const proposalId = String(req.params?.proposalId || "").trim();
    const feedback = String(req.body?.feedback || "").trim();
    if (!mongoose.Types.ObjectId.isValid(proposalId)) {
      return res.status(400).json({ success: false, message: "Invalid proposal ID." });
    }

    const proposal = await ScheduleOptimizationProposal.findOne({
      _id: proposalId,
      hospital_id: req.hospitalId,
    });
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }
    if (proposal.status !== "pending") {
      return res.status(400).json({ success: false, message: `Only pending proposals can be approved. Current status: ${proposal.status}` });
    }

    proposal.status = "approved";
    proposal.approved_by = req.authUser?._id || null;
    proposal.approval_feedback = feedback;
    await proposal.save();

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_schedule_optimization_approved",
      targetHospitalId: req.hospitalId,
      metadata: { proposal_id: String(proposal._id) },
    });

    return res.json({
      success: true,
      message: "Proposal approved. You can now apply the optimization.",
      proposal: {
        id: String(proposal._id),
        status: proposal.status,
        updated_at: proposal.updated_at,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/hospital-admin/ai/smart-scheduling/optimize/:proposalId/reject
router.post("/ai/smart-scheduling/optimize/:proposalId/reject", async (req, res, next) => {
  try {
    const proposalId = String(req.params?.proposalId || "").trim();
    const reason = String(req.body?.reason || "").trim();
    if (!mongoose.Types.ObjectId.isValid(proposalId)) {
      return res.status(400).json({ success: false, message: "Invalid proposal ID." });
    }

    const proposal = await ScheduleOptimizationProposal.findOne({
      _id: proposalId,
      hospital_id: req.hospitalId,
    });
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }
    if (proposal.status !== "pending") {
      return res.status(400).json({ success: false, message: `Only pending proposals can be rejected. Current status: ${proposal.status}` });
    }

    proposal.status = "rejected";
    proposal.rejection_reason = reason;
    proposal.rejected_at = new Date();
    await proposal.save();

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_schedule_optimization_rejected",
      targetHospitalId: req.hospitalId,
      metadata: { proposal_id: String(proposal._id), reason },
    });

    return res.json({
      success: true,
      message: "Proposal rejected.",
      proposal: {
        id: String(proposal._id),
        status: proposal.status,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/hospital-admin/ai/smart-scheduling/optimize/:proposalId/apply
router.post("/ai/smart-scheduling/optimize/:proposalId/apply", async (req, res, next) => {
  try {
    const proposalId = String(req.params?.proposalId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(proposalId)) {
      return res.status(400).json({ success: false, message: "Invalid proposal ID." });
    }

    const proposal = await ScheduleOptimizationProposal.findOne({
      _id: proposalId,
      hospital_id: req.hospitalId,
    });
    if (!proposal) {
      return res.status(404).json({ success: false, message: "Proposal not found." });
    }
    if (proposal.status !== "approved") {
      return res.status(400).json({ success: false, message: `Proposal must be approved before apply. Current status: ${proposal.status}` });
    }

    const titleCaseDay = (day) => {
      const value = String(day || "").trim().toLowerCase();
      if (!value) return "";
      return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
    };

    const appliedChanges = [];
    const appointmentReview = [];

    for (const change of proposal.changes || []) {
      const doctor = await Staff.findOne({ _id: change.doctor_id, hospital_id: req.hospitalId, role: "doctor" });
      if (!doctor) continue;

      const existingDays = Array.isArray(doctor.available_days) ? doctor.available_days : [];
      const targetDays = Array.isArray(change?.to_state?.available_days) ? change.to_state.available_days : existingDays;
      const normalized = Array.from(new Set(targetDays.map((day) => titleCaseDay(day)).filter(Boolean)));

      doctor.available_days = normalized;
      if (change?.to_state?.shift && ["morning", "evening", "night", "flex"].includes(String(change.to_state.shift).toLowerCase())) {
        doctor.shift = String(change.to_state.shift).toLowerCase();
      }
      await doctor.save();

      const appointmentIds = Array.isArray(change.appointment_ids) ? change.appointment_ids : [];
      if (appointmentIds.length > 0) {
        appointmentReview.push({
          doctor_id: String(doctor._id),
          doctor_name: doctor.name,
          appointments_count: appointmentIds.length,
          note: "Appointments preserved. Review if any timing conflicts are expected after schedule changes.",
        });
      }

      appliedChanges.push({
        doctor_id: String(doctor._id),
        doctor_name: doctor.name,
        new_available_days: doctor.available_days,
        shift: doctor.shift,
      });
    }

    proposal.status = "applied";
    proposal.applied_at = new Date();
    await proposal.save();

    await writeAuditLog({
      req,
      actorUser: req.authUser,
      action: "hospital_admin_schedule_optimization_applied",
      targetHospitalId: req.hospitalId,
      metadata: {
        proposal_id: String(proposal._id),
        changes_applied: appliedChanges.length,
      },
    });

    return res.json({
      success: true,
      message: "Optimization applied. Doctor availability and shifts updated.",
      result: {
        proposal_id: String(proposal._id),
        applied_changes: appliedChanges,
        appointments_review: appointmentReview,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/stats
router.get("/stats", async (req, res, next) => {
  try {
    const hospitalId = req.hospitalId;
    const [doctors, staff, depts, patients, appts] = await Promise.all([
      Staff.countDocuments({ hospital_id: hospitalId, role: "doctor" }),
      Staff.countDocuments({ hospital_id: hospitalId }),
      Department.countDocuments({ hospital_id: hospitalId }),
      Patient.countDocuments({ hospital_id: hospitalId }),
      Appointment.countDocuments({ hospital_id: hospitalId })
    ]);
    return res.json({
      success: true,
      stats: {
        doctors,
        staff,
        departments: depts,
        patients,
      }
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/hospital-admin/notifications — List notifications/alerts for hospital admin
router.get("/notifications", async (req, res, next) => {
  try {
    const notifications = [];

    const [allResources, pendingRequests, departments, doctors] = await Promise.all([
      Resource.find({
        hospital_id: req.hospitalId,
      }).populate("department_id", "name"),
      DoctorScheduleChangeRequest.find({
        hospital_id: req.hospitalId,
        status: "pending",
      }).populate("doctor_id", "name"),
      Department.find({ hospital_id: req.hospitalId }, { name: 1 }),
      Staff.find({ hospital_id: req.hospitalId, role: "doctor", status: "active" }, { department_id: 1 }),
    ]);

    // Add resource notifications
    allResources.forEach((r) => {
      const avail = Number(r.available_quantity || 0);
      const min = Number(r.min_quantity || 0);
      const statusLower = String(r.status || "").toLowerCase().trim();

      const isOutOfStock = avail <= 0 || statusLower === "out_of_stock" || statusLower === "out of stock";
      const isLowStock = avail <= min || statusLower === "low_stock" || statusLower === "low";

      if (isOutOfStock || isLowStock) {
        const deptName = r.department_id?.name ? ` in ${r.department_id.name}` : "";
        const severity = isOutOfStock ? "critical" : "warning";
        const statusText = isOutOfStock ? "out of stock" : "low stock";
        const totalQty = r.max_quantity || r.quantity || 0;

        notifications.push({
          id: `resource_${r._id}_${new Date(r.updated_at || r.created_at || Date.now()).getTime()}`,
          type: "resource",
          title: isOutOfStock ? "Out of Stock Alert" : "Low Stock Alert",
          message: `${r.name} is ${statusText} (${avail}/${totalQty} available)${deptName}.`,
          severity: severity,
          created_at: r.updated_at || r.created_at || new Date(),
        });
      }
    });

    // Add schedule request notifications
    pendingRequests.forEach((item) => {
      notifications.push({
        id: `schedule_${item._id}`,
        type: "schedule",
        title: "Schedule Request",
        message: `Dr. ${item.doctor_id?.name || "Unknown"} requested a shift change to ${item.requested_shift}.`,
        severity: "info",
        created_at: item.created_at || new Date(),
      });
    });

    // Add inactive department notifications (no active doctors)
    const doctorCounts = {};
    doctors.forEach((doc) => {
      if (doc.department_id) {
        const did = String(doc.department_id);
        doctorCounts[did] = (doctorCounts[did] || 0) + 1;
      }
    });

    departments.forEach((dept) => {
      const count = doctorCounts[String(dept._id)] || 0;
      if (count === 0) {
        notifications.push({
          id: `dept_inactive_${dept._id}`,
          type: "department",
          title: "Inactive Department",
          message: `Department "${dept.name}" has no active doctors assigned and is inactive.`,
          severity: "warning",
          created_at: dept.updated_at || dept.created_at || new Date(),
        });
      }
    });

    // Sort by created_at descending
    notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({ success: true, notifications });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
