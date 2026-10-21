const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const XLSX = require("xlsx");

const connectDatabase = require("../src/db");
const Hospital = require("../src/models/Hospital");
const Department = require("../src/models/Department");
const Staff = require("../src/models/Staff");
const Patient = require("../src/models/Patient");

const ROOT_DIR = path.resolve(__dirname, "..");
const PATIENT_RECORDS_ROOT = path.join(ROOT_DIR, "storage", "patient_records");
const REPORT_DIR = path.join(ROOT_DIR, "storage", "seed_reports");
const REPORT_PATH = path.join(REPORT_DIR, "patient_record_import_report.json");

function ensureDirectorySync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeGender(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "m" || v === "male") return "male";
  if (v === "f" || v === "female") return "female";
  if (v === "o" || v === "other") return "other";
  return "";
}

function normalizeBloodType(value) {
  const v = String(value || "").trim().toUpperCase();
  return ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(v) ? v : "";
}

function normalizeDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseSourceData(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function toObjectIdOrNull(value) {
  const text = String(value || "").trim();
  return mongoose.Types.ObjectId.isValid(text) ? new mongoose.Types.ObjectId(text) : null;
}

function readWorkbookRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = Array.isArray(workbook?.SheetNames) ? workbook.SheetNames[0] : "";
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false, blankrows: false });
  return Array.isArray(rows) ? rows : [];
}

function listFilesRecursive(dirPath, extension, out = []) {
  if (!fs.existsSync(dirPath)) return out;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      listFilesRecursive(fullPath, extension, out);
      continue;
    }
    if (entry.isFile() && fullPath.toLowerCase().endsWith(extension)) {
      out.push(fullPath);
    }
  }
  return out;
}

function buildFallbackSourceRecordId(row, fileName, rowIndex, hospitalId, departmentId) {
  const candidates = [
    row.source_record_id,
    row.patient_source_id,
    row.patient_id,
    row.record_id,
    row.source_id,
  ];
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) return value;
  }
  return `FILE-${hospitalId}-${departmentId}-${path.parse(fileName).name}-${rowIndex + 1}`;
}

async function importWorkbookFile(filePath, hospitalById, departmentById, staffByDeptKey, report) {
  const match = filePath.match(/[\\/]patient_records[\\/](?<hospitalId>[a-f0-9]{24})[\\/]uploads[\\/](?<departmentId>[a-f0-9]{24})[\\/](?<fileName>[^\\/]+)$/i);
  if (!match?.groups) return;

  const { hospitalId, departmentId, fileName } = match.groups;
  const hospital = hospitalById.get(String(hospitalId));
  const department = departmentById.get(String(departmentId));
  if (!hospital || !department) {
    report.skipped_files.push({ filePath, reason: "missing_hospital_or_department" });
    return;
  }

  const rows = readWorkbookRows(filePath);
  const doctors = staffByDeptKey.get(String(departmentId)) || [];
  if (rows.length === 0) {
    report.skipped_files.push({ filePath, reason: "empty_workbook" });
    return;
  }

  for (let idx = 0; idx < rows.length; idx += 1) {
    const row = rows[idx] || {};
    const sourceRecordId = buildFallbackSourceRecordId(row, fileName, idx, hospitalId, departmentId);
    const assignedDoctorId = toObjectIdOrNull(row.assigned_doctor_id) || (doctors[idx % doctors.length]?._id || null);
    const createdById = toObjectIdOrNull(row.created_by);
    const sourceData = parseSourceData(row.source_data_json) || {
      source_record_id: row.source_record_id || sourceRecordId,
      department: row.department_name || department.name,
      disease: row.disease || "",
      file_name: fileName,
    };

    const payload = {
      name: String(row.name || "").trim(),
      email: String(row.email || "").trim().toLowerCase(),
      phone: String(row.phone || "").trim(),
      city: String(row.city || hospital.city || "").trim(),
      date_of_birth: normalizeDateOrNull(row.date_of_birth),
      gender: normalizeGender(row.gender),
      blood_type: normalizeBloodType(row.blood_type),
      address: String(row.address || "").trim(),
      hospital_id: hospital._id,
      assigned_doctor_id: assignedDoctorId,
      department_id: department._id,
      medical_history: String(row.medical_history || "").trim(),
      source_record_id: sourceRecordId,
      source_data: sourceData,
      status: String(row.status || "active").trim() || "active",
      created_by: createdById,
    };

    if (!payload.name) {
      report.skipped_rows += 1;
      continue;
    }

    await Patient.findOneAndUpdate(
      { hospital_id: hospital._id, department_id: department._id, source_record_id: sourceRecordId },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    report.processed_rows += 1;
  }

  report.files_processed += 1;
  report.file_rows[fileName] = rows.length;
}

async function main() {
  ensureDirectorySync(REPORT_DIR);
  await connectDatabase();

  const hospitals = await Hospital.find({}, { name: 1, city: 1 });
  const departments = await Department.find({}, { name: 1, hospital_id: 1 });
  const doctors = await Staff.find({ role: "doctor" }, { name: 1, department_id: 1, hospital_id: 1 }).sort({ created_at: 1 });

  const hospitalById = new Map(hospitals.map((item) => [String(item._id), item]));
  const departmentById = new Map(departments.map((item) => [String(item._id), item]));
  const staffByDeptKey = new Map();
  for (const doctor of doctors) {
    const key = String(doctor.department_id || "");
    if (!key) continue;
    if (!staffByDeptKey.has(key)) staffByDeptKey.set(key, []);
    staffByDeptKey.get(key).push(doctor);
  }

  const report = {
    generated_at: new Date().toISOString(),
    files_processed: 0,
    processed_rows: 0,
    skipped_rows: 0,
    skipped_files: [],
    file_rows: {},
  };

  const files = listFilesRecursive(PATIENT_RECORDS_ROOT, ".xlsx");
  for (const filePath of files) {
    await importWorkbookFile(filePath, hospitalById, departmentById, staffByDeptKey, report);
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");
  console.log(`Processed files: ${report.files_processed}`);
  console.log(`Processed rows: ${report.processed_rows}`);
  console.log(`Skipped rows: ${report.skipped_rows}`);
  console.log(`Report written to: ${path.relative(ROOT_DIR, REPORT_PATH).replace(/\\/g, "/")}`);

  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error("Failed to import patient record files:", error);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(1);
});