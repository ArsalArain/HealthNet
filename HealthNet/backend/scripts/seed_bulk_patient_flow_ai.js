const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const { execFile } = require("child_process");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const { parse: parseCsv } = require("csv-parse/sync");

const connectDatabase = require("../src/db");
const Hospital = require("../src/models/Hospital");
const Department = require("../src/models/Department");

const execFileAsync = promisify(execFile);

const ROOT_DIR = path.resolve(__dirname, "..");
const STORAGE_ROOT = path.join(ROOT_DIR, "storage");
const AI_STORAGE_ROOT = path.join(STORAGE_ROOT, "ai");
const REPORT_PATH = path.join(STORAGE_ROOT, "seed_reports", "bulk_patient_flow_ai_seed_report.json");
const CREDENTIAL_REPORT_PATH = path.join(STORAGE_ROOT, "seed_reports", "bulk_hospitals_credentials.json");
const DEFAULT_SOURCE_DIR = path.join(process.env.USERPROFILE || "C:\\Users\\pc", "Downloads", "FYP", "dataset1", "predict");
const PYTHON_CMD = process.env.AI_PYTHON_CMD || "python";
const TRAIN_SCRIPT_PATH = path.join(ROOT_DIR, "src", "ai", "train_patient_flow.py");

const REQUIRED_COLUMNS = ["hospital_id", "date", "department", "disease", "gender", "patient_count"];

function ensureDirectorySync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function readCsvRows(filePath) {
  const rawText = fs.readFileSync(filePath, "utf-8");
  return parseCsv(rawText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function rowsToCsv(rows) {
  const worksheet = XLSX.utils.json_to_sheet(rows, { cellDates: true });
  return XLSX.utils.sheet_to_csv(worksheet, { FS: "," });
}

function buildSourceFileMap(sourceDir) {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const map = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".csv")) continue;

    const stem = path.parse(entry.name).name;
    map.set(normalizeKey(stem), path.join(sourceDir, entry.name));
  }

  return map;
}

function getTrainingPaths(hospitalId, departmentId) {
  const departmentDir = path.join(AI_STORAGE_ROOT, String(hospitalId), "departments", String(departmentId));
  return {
    departmentDir,
    datasetPath: path.join(departmentDir, "patient_dataset.csv"),
    trainingDatasetPath: path.join(departmentDir, "patient_training_dataset.csv"),
    modelBundlePath: path.join(departmentDir, "patient_load_model.joblib"),
    metadataPath: path.join(departmentDir, "model_metadata.json"),
    trainingHistoryPath: path.join(departmentDir, "training_history.json"),
    predictionCachePath: path.join(departmentDir, "prediction_cache.json"),
  };
}

function getUploadArchivePath(hospitalId, departmentId, originalFileName) {
  const stamp = Date.now();
  const suffix = Math.random().toString(36).slice(2, 8);
  const safeName = String(originalFileName || "dataset.csv")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return path.join(AI_STORAGE_ROOT, String(hospitalId), "uploads", String(departmentId), `${stamp}_${suffix}_${safeName}`);
}

function saveReport(report) {
  ensureDirectorySync(path.dirname(REPORT_PATH));
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");
}

function normalizeTrainingRows(rows, hospitalId, departmentName) {
  return rows.map((row) => ({
    hospital_id: String(hospitalId),
    date: String(row.date || "").trim(),
    department: String(departmentName || row.department || "").trim(),
    disease: String(row.disease || "").trim(),
    gender: String(row.gender || "").trim(),
    patient_count: String(row.patient_count || "").trim(),
  })).filter((row) => row.hospital_id && row.date && row.department && row.disease && row.gender && row.patient_count !== "");
}

function appendTrainingHistory(trainingHistoryPath, entry) {
  let history = [];
  if (fs.existsSync(trainingHistoryPath)) {
    try {
      const raw = fs.readFileSync(trainingHistoryPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) history = parsed;
    } catch {
      history = [];
    }
  }

  history.push(entry);
  fs.writeFileSync(trainingHistoryPath, `${JSON.stringify(history, null, 2)}\n`, "utf-8");
}

function parseJsonOutput(stdout) {
  const text = String(stdout || "").trim();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index];
      if (!line.startsWith("{")) continue;
      try {
        return JSON.parse(line);
      } catch {
        // continue
      }
    }
  }

  return { raw_output: text };
}

async function trainDepartment({ hospital, department, sourceFilePath, sourceFileName, report }) {
  const rawRows = readCsvRows(sourceFilePath);
  const normalizedRows = normalizeTrainingRows(rawRows, hospital._id, department.name);

  if (normalizedRows.length === 0) {
    report.skipped.push({
      hospital_id: String(hospital._id),
      hospital_name: hospital.name,
      department_id: String(department._id),
      department_name: department.name,
      source_file: sourceFileName,
      reason: "no_valid_rows",
    });
    return;
  }

  const aiPaths = getTrainingPaths(hospital._id, department._id);
  if (fs.existsSync(aiPaths.modelBundlePath) && fs.existsSync(aiPaths.metadataPath)) {
    report.skipped.push({
      hospital_id: String(hospital._id),
      hospital_name: hospital.name,
      department_id: String(department._id),
      department_name: department.name,
      source_file: sourceFileName,
      reason: "already_trained",
    });
    return;
  }

  ensureDirectorySync(aiPaths.departmentDir);
  ensureDirectorySync(path.dirname(aiPaths.datasetPath));
  ensureDirectorySync(path.dirname(aiPaths.trainingDatasetPath));

  const datasetCsv = rowsToCsv(normalizedRows);
  fs.writeFileSync(aiPaths.datasetPath, datasetCsv, "utf-8");

  const archivePath = getUploadArchivePath(hospital._id, department._id, sourceFileName);
  ensureDirectorySync(path.dirname(archivePath));
  fs.copyFileSync(aiPaths.datasetPath, archivePath);

  const { stdout, stderr } = await execFileAsync(
    PYTHON_CMD,
    [TRAIN_SCRIPT_PATH, aiPaths.datasetPath, aiPaths.modelBundlePath, aiPaths.metadataPath, String(department._id)],
    { cwd: ROOT_DIR, timeout: 0, maxBuffer: 8 * 1024 * 1024 }
  );

  if (stderr && String(stderr).trim()) {
    console.warn(`[${hospital.name} :: ${department.name}] python stderr: ${String(stderr).trim()}`);
  }

  const metadata = parseJsonOutput(stdout);
  if (!metadata?.success) {
    throw new Error(`Training failed for ${hospital.name} / ${department.name}`);
  }

  appendTrainingHistory(aiPaths.trainingHistoryPath, {
    department_id: String(department._id),
    department_name: department.name,
    rows_trained: Number(metadata.rows_trained || normalizedRows.length),
    source_rows: Number(metadata.source_rows || rawRows.length),
    model_version: String(metadata.model_version || ""),
    metrics: metadata.metrics || null,
    date_min: metadata.date_min || null,
    date_max: metadata.date_max || null,
    trained_at_utc: metadata.trained_at_utc || new Date().toISOString(),
    source_file: sourceFileName,
  });

  if (fs.existsSync(aiPaths.predictionCachePath)) {
    try {
      fs.unlinkSync(aiPaths.predictionCachePath);
    } catch {
      // ignore
    }
  }

  report.completed.push({
    hospital_id: String(hospital._id),
    hospital_name: hospital.name,
    department_id: String(department._id),
    department_name: department.name,
    source_file: sourceFileName,
    rows: normalizedRows.length,
    model_version: String(metadata.model_version || ""),
  });

  console.log(`Trained ${hospital.name} / ${department.name} from ${sourceFileName} (${normalizedRows.length} rows)`);
}

async function loadTargetHospitals() {
  if (fs.existsSync(CREDENTIAL_REPORT_PATH)) {
    try {
      const report = JSON.parse(fs.readFileSync(CREDENTIAL_REPORT_PATH, "utf-8"));
      if (Array.isArray(report.hospitals) && report.hospitals.length > 0) {
        const ids = report.hospitals.map((item) => String(item.hospital_id)).filter(Boolean);
        const hospitals = await Hospital.find({ _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } }).sort({ created_at: 1 });
        if (hospitals.length > 0) {
          return hospitals;
        }
      }
    } catch {
      // Fall back to live query.
    }
  }

  return Hospital.find({}).sort({ created_at: 1 });
}

async function main() {
  const sourceDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SOURCE_DIR;
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }
  if (!fs.existsSync(TRAIN_SCRIPT_PATH)) {
    throw new Error(`Training script not found: ${TRAIN_SCRIPT_PATH}`);
  }

  ensureDirectorySync(path.dirname(REPORT_PATH));
  ensureDirectorySync(AI_STORAGE_ROOT);

  await connectDatabase();

  const sourceFiles = buildSourceFileMap(sourceDir);
  const hospitals = await loadTargetHospitals();

  const departmentsByHospital = await Department.find({ hospital_id: { $in: hospitals.map((hospital) => hospital._id) } }).sort({ created_at: 1 });
  const departmentsByHospitalId = new Map();
  for (const department of departmentsByHospital) {
    const key = String(department.hospital_id);
    if (!departmentsByHospitalId.has(key)) departmentsByHospitalId.set(key, []);
    departmentsByHospitalId.get(key).push(department);
  }

  const report = {
    generated_at: new Date().toISOString(),
    source_dir: sourceDir,
    hospitals_processed: 0,
    departments_trained: 0,
    completed: [],
    skipped: [],
    failed: [],
    missing_source_files: [],
  };
  saveReport(report);

  for (const hospital of hospitals) {
    const departments = departmentsByHospitalId.get(String(hospital._id)) || [];
    let trainedAny = false;

    for (const department of departments) {
      const normalizedDepartmentName = normalizeKey(department.name);
      const sourceFilePath = sourceFiles.get(normalizedDepartmentName);
      if (!sourceFilePath) {
        report.missing_source_files.push({
          hospital_id: String(hospital._id),
          hospital_name: hospital.name,
          department_id: String(department._id),
          department_name: department.name,
          expected_key: normalizedDepartmentName,
        });
        continue;
      }

      try {
        await trainDepartment({
          hospital,
          department,
          sourceFilePath,
          sourceFileName: path.basename(sourceFilePath),
          report,
        });
        report.departments_trained += 1;
        trainedAny = true;
        saveReport(report);
      } catch (error) {
        report.failed.push({
          hospital_id: String(hospital._id),
          hospital_name: hospital.name,
          department_id: String(department._id),
          department_name: department.name,
          source_file: path.basename(sourceFilePath),
          error: error.message,
        });
        console.error(`Failed ${hospital.name} / ${department.name}: ${error.message}`);
        saveReport(report);
      }
    }

    if (trainedAny) {
      report.hospitals_processed += 1;
      saveReport(report);
    }
  }

  saveReport(report);
  console.log(`Hospitals processed: ${report.hospitals_processed}`);
  console.log(`Departments trained: ${report.departments_trained}`);
  console.log(`Skipped departments: ${report.skipped.length}`);
  console.log(`Missing source file matches: ${report.missing_source_files.length}`);
  console.log(`Report written to: ${path.relative(ROOT_DIR, REPORT_PATH).replace(/\\/g, "/")}`);

  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error("Failed to seed AI patient-flow datasets:", error);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(1);
});
