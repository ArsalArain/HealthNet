const fs = require("fs");
const path = require("path");

const env = require("../src/config/env");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_SOURCE_DIR = path.join(
  process.env.USERPROFILE || "C:\\Users\\pc",
  "Downloads",
  "FYP",
  "dataset1",
  "Resources",
  "datasets"
);
const DEFAULT_CREDENTIALS_PATH = path.join(ROOT_DIR, "storage", "seed_reports", "bulk_hospitals_credentials.json");
const DEFAULT_REPORT_PATH = path.join(
  ROOT_DIR,
  "storage",
  "seed_reports",
  "bulk_resource_upload_optimization_report.json"
);
const DEFAULT_API_BASE_URL = process.env.HEALTHNET_API_BASE_URL || `http://127.0.0.1:${env.port}/api`;

function ensureDirectorySync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function parseBooleanFlag(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const token = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(token);
}

function parseArgs(argv) {
  const options = {
    sourceDir: DEFAULT_SOURCE_DIR,
    credentialsPath: DEFAULT_CREDENTIALS_PATH,
    reportPath: DEFAULT_REPORT_PATH,
    apiBaseUrl: DEFAULT_API_BASE_URL,
    cycleDatasets: false,
    runRosterOptimization: true,
    includeCoverageInsights: true,
    dryRun: false,
    startHospitalIndex: 0,
    startDatasetIndex: 0,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i] || "").trim();
    if (!arg.startsWith("--")) continue;

    const [rawKey, inlineValue] = arg.split("=", 2);
    const key = rawKey.replace(/^--/, "").trim();
    const nextValue = inlineValue !== undefined ? inlineValue : argv[i + 1];
    const takeNext = inlineValue === undefined;

    const assignString = (field) => {
      if (nextValue === undefined) throw new Error(`Missing value for --${key}`);
      options[field] = String(nextValue).trim();
      if (takeNext) i += 1;
    };

    const assignNumber = (field) => {
      if (nextValue === undefined) throw new Error(`Missing value for --${key}`);
      const parsed = Number(nextValue);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`--${key} must be a non-negative integer.`);
      }
      options[field] = parsed;
      if (takeNext) i += 1;
    };

    switch (key) {
      case "source-dir":
        assignString("sourceDir");
        break;
      case "credentials":
        assignString("credentialsPath");
        break;
      case "report":
        assignString("reportPath");
        break;
      case "api-base-url":
        assignString("apiBaseUrl");
        break;
      case "cycle-datasets":
        options.cycleDatasets = parseBooleanFlag(nextValue, true);
        if (takeNext && nextValue !== undefined && !String(nextValue).startsWith("--")) i += 1;
        break;
      case "run-roster-optimization":
        options.runRosterOptimization = parseBooleanFlag(nextValue, true);
        if (takeNext && nextValue !== undefined && !String(nextValue).startsWith("--")) i += 1;
        break;
      case "coverage-insights":
        options.includeCoverageInsights = parseBooleanFlag(nextValue, true);
        if (takeNext && nextValue !== undefined && !String(nextValue).startsWith("--")) i += 1;
        break;
      case "dry-run":
        options.dryRun = parseBooleanFlag(nextValue, true);
        if (takeNext && nextValue !== undefined && !String(nextValue).startsWith("--")) i += 1;
        break;
      case "start-hospital-index":
        assignNumber("startHospitalIndex");
        break;
      case "start-dataset-index":
        assignNumber("startDatasetIndex");
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.sourceDir = path.resolve(options.sourceDir);
  options.credentialsPath = path.resolve(options.credentialsPath);
  options.reportPath = path.resolve(options.reportPath);
  options.apiBaseUrl = String(options.apiBaseUrl).replace(/\/+$/, "");

  return options;
}

function readCredentials(credentialsPath) {
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Credentials file not found: ${credentialsPath}`);
  }

  const raw = fs.readFileSync(credentialsPath, "utf-8");
  const parsed = JSON.parse(raw);

  const hospitals = Array.isArray(parsed?.hospitals) ? parsed.hospitals : [];
  if (hospitals.length === 0) {
    throw new Error(`No hospitals found in credentials file: ${credentialsPath}`);
  }

  return hospitals;
}

function parseDatasetNumber(fileName) {
  const stem = path.parse(fileName).name;
  const match = stem.match(/(\d+)(?!.*\d)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function listDatasetFiles(sourceDir) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source dataset directory not found: ${sourceDir}`);
  }

  const files = fs.readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.csv$/i.test(name) && /^resource_dataset_/i.test(name))
    .sort((a, b) => {
      const na = parseDatasetNumber(a);
      const nb = parseDatasetNumber(b);
      if (na !== nb) return na - nb;
      return a.localeCompare(b);
    })
    .map((name) => path.join(sourceDir, name));

  if (files.length === 0) {
    throw new Error(`No resource_dataset_*.csv files found in: ${sourceDir}`);
  }

  return files;
}

function assignDatasetsToHospitals(hospitals, datasets, options) {
  const hospitalSlice = hospitals.slice(options.startHospitalIndex);
  const datasetSlice = datasets.slice(options.startDatasetIndex);

  if (hospitalSlice.length === 0) {
    throw new Error("No hospitals selected after start-hospital-index.");
  }
  if (datasetSlice.length === 0) {
    throw new Error("No datasets selected after start-dataset-index.");
  }

  if (!options.cycleDatasets && datasetSlice.length < hospitalSlice.length) {
    throw new Error(
      `Not enough datasets (${datasetSlice.length}) for selected hospitals (${hospitalSlice.length}). ` +
      "Use --cycle-datasets true to reuse files."
    );
  }

  return hospitalSlice.map((hospital, index) => {
    const datasetIndex = options.cycleDatasets
      ? (index % datasetSlice.length)
      : index;
    const datasetPath = datasetSlice[datasetIndex];

    return {
      hospital,
      datasetPath,
      datasetName: path.basename(datasetPath),
      datasetIndex: options.startDatasetIndex + datasetIndex,
      hospitalIndex: options.startHospitalIndex + index,
    };
  });
}

async function apiPostJson(url, payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload || {}),
  });

  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    throw new Error(body?.message || `Request failed (${response.status}) for ${url}`);
  }

  return body;
}

async function apiGet(url, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { method: "GET", headers });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    throw new Error(body?.message || `Request failed (${response.status}) for ${url}`);
  }

  return body;
}

async function apiPostFile(url, filePath, token) {
  const fileBuffer = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append("file", new Blob([fileBuffer], { type: "text/csv" }), path.basename(filePath));

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    throw new Error(body?.message || `File upload failed (${response.status}) for ${url}`);
  }

  return body;
}

async function processHospitalAssignment(assignment, options) {
  const { hospital, datasetPath, datasetName, hospitalIndex, datasetIndex } = assignment;
  const email = String(hospital?.login?.email || "").trim();
  const password = String(hospital?.login?.password || "").trim();

  if (!email || !password) {
    throw new Error("Missing login credentials in bulk_hospitals_credentials.json entry.");
  }

  const base = options.apiBaseUrl;
  const result = {
    hospital_id: String(hospital?.hospital_id || ""),
    hospital_name: String(hospital?.hospital_name || ""),
    hospital_code: String(hospital?.hospital_code || ""),
    hospital_index: hospitalIndex,
    dataset_index: datasetIndex,
    dataset_name: datasetName,
    dataset_path: datasetPath,
    login_email: email,
    login: { success: false },
    upload: { success: false },
    coverage_insights: { success: false, skipped: !options.includeCoverageInsights },
    roster_optimization: {
      success: false,
      skipped: !options.runRosterOptimization,
      proposal_id: null,
      approved: false,
      applied: false,
    },
  };

  if (options.dryRun) {
    result.login.success = true;
    result.upload.success = true;
    result.coverage_insights.success = options.includeCoverageInsights;
    result.roster_optimization.success = options.runRosterOptimization;
    result.roster_optimization.approved = options.runRosterOptimization;
    result.roster_optimization.applied = options.runRosterOptimization;
    return result;
  }

  const loginBody = await apiPostJson(`${base}/auth/hospital/login`, { email, password });
  const token = String(loginBody?.token || "");
  if (!token) {
    throw new Error("Login succeeded but no token was returned.");
  }
  result.login.success = true;

  const uploadBody = await apiPostFile(`${base}/hospital-admin/resources/upload-csv`, datasetPath, token);
  result.upload.success = true;
  result.upload.summary = uploadBody?.summary || null;

  if (options.includeCoverageInsights) {
    const coverageBody = await apiGet(`${base}/hospital-admin/resources/coverage-insights?demand_mode=active`, token);
    const summary = coverageBody?.summary || {};
    result.coverage_insights.success = true;
    result.coverage_insights.summary = {
      total_departments: Number(summary.total_departments || 0),
      total_resources: Number(summary.total_resources || 0),
      total_available_units: Number(summary.total_available_units || 0),
      departments_critical: Number(summary.departments_critical || 0),
      departments_strained: Number(summary.departments_strained || 0),
      departments_missing_resources: Number(summary.departments_missing_resources || 0),
    };
  }

  if (options.runRosterOptimization) {
    const optimizeBody = await apiPostJson(`${base}/hospital-admin/ai/smart-scheduling/optimize`, {}, token);
    const proposalId = String(optimizeBody?.proposal?.id || "");
    if (!proposalId) {
      throw new Error("Optimization endpoint did not return a proposal id.");
    }

    result.roster_optimization.proposal_id = proposalId;

    await apiPostJson(
      `${base}/hospital-admin/ai/smart-scheduling/optimize/${proposalId}/approve`,
      { feedback: "Auto-approved by bulk resource upload script." },
      token
    );
    result.roster_optimization.approved = true;

    await apiPostJson(
      `${base}/hospital-admin/ai/smart-scheduling/optimize/${proposalId}/apply`,
      { note: "Auto-applied after bulk resource upload." },
      token
    );

    result.roster_optimization.success = true;
    result.roster_optimization.applied = true;
  }

  return result;
}

function buildRunSummary(report) {
  const summary = {
    hospitals_targeted: report.assignments.length,
    hospitals_processed: report.results.length,
    hospitals_failed: report.failures.length,
    uploads_succeeded: 0,
    optimization_applied: 0,
    coverage_critical_total: 0,
    coverage_strained_total: 0,
    coverage_missing_resources_total: 0,
  };

  for (const result of report.results) {
    if (result.upload?.success) summary.uploads_succeeded += 1;
    if (result.roster_optimization?.applied) summary.optimization_applied += 1;

    const coverageSummary = result.coverage_insights?.summary;
    if (coverageSummary) {
      summary.coverage_critical_total += Number(coverageSummary.departments_critical || 0);
      summary.coverage_strained_total += Number(coverageSummary.departments_strained || 0);
      summary.coverage_missing_resources_total += Number(coverageSummary.departments_missing_resources || 0);
    }
  }

  return summary;
}

function writeReport(reportPath, report) {
  ensureDirectorySync(path.dirname(reportPath));
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const hospitals = readCredentials(options.credentialsPath);
  const datasets = listDatasetFiles(options.sourceDir);
  const assignments = assignDatasetsToHospitals(hospitals, datasets, options);

  const report = {
    generated_at: new Date().toISOString(),
    options,
    assignments: assignments.map((item) => ({
      hospital_id: String(item?.hospital?.hospital_id || ""),
      hospital_name: String(item?.hospital?.hospital_name || ""),
      hospital_code: String(item?.hospital?.hospital_code || ""),
      hospital_index: item.hospitalIndex,
      dataset_index: item.datasetIndex,
      dataset_name: item.datasetName,
      dataset_path: item.datasetPath,
    })),
    results: [],
    failures: [],
    summary: {},
  };

  console.log(`Source directory: ${options.sourceDir}`);
  console.log(`API base URL: ${options.apiBaseUrl}`);
  console.log(`Hospitals selected: ${assignments.length}`);
  console.log(`Datasets available (post-filter): ${datasets.length}`);

  for (const assignment of assignments) {
    const label = `${assignment.hospital.hospital_code || assignment.hospital.hospital_name} <- ${assignment.datasetName}`;
    try {
      const result = await processHospitalAssignment(assignment, options);
      report.results.push(result);
      console.log(`OK: ${label}`);
    } catch (error) {
      const failure = {
        hospital_id: String(assignment?.hospital?.hospital_id || ""),
        hospital_name: String(assignment?.hospital?.hospital_name || ""),
        hospital_code: String(assignment?.hospital?.hospital_code || ""),
        dataset_name: assignment.datasetName,
        dataset_path: assignment.datasetPath,
        error: String(error?.message || error),
      };
      report.failures.push(failure);
      console.error(`FAIL: ${label} :: ${failure.error}`);
    }
  }

  report.summary = buildRunSummary(report);
  writeReport(options.reportPath, report);

  console.log("---");
  console.log(`Processed: ${report.summary.hospitals_processed}/${report.summary.hospitals_targeted}`);
  console.log(`Failures: ${report.summary.hospitals_failed}`);
  console.log(`Uploads succeeded: ${report.summary.uploads_succeeded}`);
  console.log(`Optimization applied: ${report.summary.optimization_applied}`);
  console.log(`Report: ${options.reportPath}`);

  if (report.failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Bulk resource upload and optimization failed:", error);
  process.exit(1);
});
