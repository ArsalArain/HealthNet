const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const XLSX = require("xlsx");

const connectDatabase = require("../src/db");
const Hospital = require("../src/models/Hospital");
const User = require("../src/models/User");
const Department = require("../src/models/Department");
const Staff = require("../src/models/Staff");
const SmartSchedulePlan = require("../src/models/SmartSchedulePlan");
const ScheduleOptimizationProposal = require("../src/models/ScheduleOptimizationProposal");

const ROOT_DIR = path.resolve(__dirname, "..");
const STORAGE_ROOT = path.join(ROOT_DIR, "storage");
const PATIENT_RECORDS_ROOT = path.join(STORAGE_ROOT, "patient_records");
const REPORT_DIR = path.join(STORAGE_ROOT, "seed_reports");
const REPORT_JSON = path.join(REPORT_DIR, "bulk_hospitals_credentials.json");
const REPORT_MD = path.join(REPORT_DIR, "bulk_hospitals_credentials.md");

const CITY_FIXTURES = [
  {
    city: "Chiniot",
    code: "CHI",
    hospitalCount: 6,
    localities: [
      { locality: "Bhowana Road", landmark: "Near Kacheri Chowk" },
      { locality: "Railway Road", landmark: "Opposite District Courts" },
      { locality: "Lalian Road", landmark: "Near Al-Habib Chowk" },
      { locality: "Muhammad Ali Road", landmark: "Near City Gate" },
      { locality: "Chenab Nagar", landmark: "Beside Main Market" },
      { locality: "Jhang Road", landmark: "Close to Old Bus Stand" },
    ],
  },
  {
    city: "Lahore",
    code: "LHR",
    hospitalCount: 6,
    localities: [
      { locality: "Johar Town", landmark: "Near Emporium Boulevard" },
      { locality: "DHA Phase 5", landmark: "Near Khayaban-e-Iqbal" },
      { locality: "Gulberg III", landmark: "Along Main Boulevard" },
      { locality: "Garden Town", landmark: "Near Kalma Chowk" },
      { locality: "Model Town", landmark: "Close to Model Town Park" },
      { locality: "Cantt", landmark: "Near Saddar Road" },
    ],
  },
  {
    city: "Faisalabad",
    code: "FSD",
    hospitalCount: 6,
    localities: [
      { locality: "D-Ground", landmark: "Near ChenOne Road" },
      { locality: "Madina Town", landmark: "Opposite Allied Hospital Road" },
      { locality: "Susan Road", landmark: "Near Kohinoor City" },
      { locality: "Jinnah Colony", landmark: "Close to Clock Tower Approach" },
      { locality: "Peoples Colony", landmark: "Near Main Boulevard" },
      { locality: "Samundri Road", landmark: "Near Samanabad Bridge" },
    ],
  },
  {
    city: "Sargodha",
    code: "SGD",
    hospitalCount: 6,
    localities: [
      { locality: "Satellite Town", landmark: "Near University Road" },
      { locality: "University Road", landmark: "Close to District Headquarters" },
      { locality: "49 Tail", landmark: "Near Masjid Road" },
      { locality: "Mianwali Road", landmark: "Opposite Food Street" },
      { locality: "Bhera Road", landmark: "Near Railway Crossing" },
      { locality: "Kutchery Road", landmark: "Near Civil Lines" },
    ],
  },
  {
    city: "Jhang",
    code: "JHN",
    hospitalCount: 6,
    localities: [
      { locality: "Satellite Town", landmark: "Near Jhang Chiniot Road" },
      { locality: "Shorkot Road", landmark: "Close to District Council" },
      { locality: "Chenab Road", landmark: "Near General Bus Stand" },
      { locality: "Toba Road", landmark: "Opposite Old Market" },
      { locality: "Kutchery Road", landmark: "Near Civil Hospital Road" },
      { locality: "Railway Road", landmark: "Near Railway Station" },
    ],
  },
];

const DEPARTMENT_FIXTURES = [
  { name: "Emergency", fileName: "Emergency.xlsx", diseases: ["Road accidents", "Heart attack", "Stroke", "Severe bleeding", "Burn injuries"] },
  { name: "OPD", fileName: "OPD.xlsx", diseases: ["Fever", "Cold & flu", "Headache", "Body pain", "Cough"] },
  { name: "Pediatrics", fileName: "Pediatrics.xlsx", diseases: ["Fever", "Diarrhea", "Asthma", "Chickenpox", "Pneumonia"] },
  { name: "Orthopedics", fileName: "Orthopedics.xlsx", diseases: ["Fractures", "Arthritis", "Back pain", "Joint pain", "Sports injury"] },
  { name: "Urology", fileName: "Urology.xlsx", diseases: ["Kidney stones", "UTI", "Bladder infection", "Prostate enlargement", "Urinary incontinence"] },
  { name: "General Medicine", fileName: "General_Medicine.xlsx", diseases: ["Diabetes", "Hypertension", "Infections", "Anemia", "Thyroid disorders"] },
  { name: "ENT", fileName: "ENT.xlsx", diseases: ["Ear infection", "Hearing loss", "Sinusitis", "Tonsillitis", "Throat infection"] },
  { name: "Dermatology", fileName: "Dermatology.xlsx", diseases: ["Acne", "Eczema", "Psoriasis", "Fungal infection", "Dermatitis"] },
  { name: "Cardiology", fileName: "Cardiology.xlsx", diseases: ["Hypertension", "Heart failure", "Arrhythmia", "Angina", "Cardiomyopathy"] },
  { name: "Radiology", fileName: "Radiology.xlsx", diseases: ["Fracture detection", "Tumor detection", "Brain hemorrhage", "Kidney stones scan", "Chest infection"] },
  { name: "Oncology", fileName: "Oncology.xlsx", diseases: ["Breast cancer", "Lung cancer", "Blood cancer", "Skin cancer", "Colon cancer"] },
  { name: "Neurology", fileName: "Neurology.xlsx", diseases: ["Stroke", "Epilepsy", "Migraine", "Parkinson's disease", "Neuropathy"] },
  { name: "Gynecology Obstetrics", fileName: "Gynecology_Obstetrics.xlsx", diseases: ["Pregnancy", "PCOS", "Menstrual disorders", "Infertility", "C-section cases"] },
];

const HOSPITAL_SUFFIXES = [
  "Shifa Hospital",
  "Care Hospital",
  "Medical Centre",
  "General Hospital",
  "Community Hospital",
  "Hope Hospital",
];

const ADMIN_NAMES = [
  "Ayesha Khan",
  "Sana Tariq",
  "Hira Qureshi",
  "Imran Aziz",
  "Adeel Hussain",
  "Maryam Shah",
  "Usman Riaz",
  "Fatima Noor",
  "Bilal Farooq",
  "Sara Ahmed",
  "Nimra Iqbal",
  "Hamza Malik",
  "Amina Sheikh",
  "Saad Rehman",
  "Laiba Javed",
  "Tariq Aslam",
  "Maham Siddiqui",
  "Faisal Butt",
  "Rabia Yousaf",
  "Danish Arif",
  "Nida Khalid",
  "Ahsan Ali",
  "Sidra Iqbal",
  "Kamran Shahid",
  "Marium Naqvi",
  "Zain Ul Haq",
  "Kalsoom Bibi",
  "Shahbaz Raza",
  "Noor Fatima",
  "Muneeb Khan",
];

const RECEPTIONIST_NAMES = [
  "Areeba Rashid",
  "Madiha Nawaz",
  "Hina Tariq",
  "Iqra Aslam",
  "Mahnoor Ali",
  "Anum Riaz",
  "Saba Noor",
  "Marium Akhtar",
  "Nimra Sheikh",
  "Rabia Hassan",
  "Hafsa Qureshi",
  "Aiman Shah",
  "Sania Malik",
  "Uzma Farooq",
  "Lubna Javed",
  "Saniya Khan",
  "Anusha Ahmed",
  "Hania Rehman",
  "Rida Butt",
  "Maha Iqbal",
  "Nida Saleem",
  "Alina Tariq",
  "Sanam Raza",
  "Kiran Hussain",
  "Zoya Arif",
  "Minal Shahid",
  "Sundas Nazir",
  "Hafiza Yousaf",
  "Mishal Awan",
  "Aiman Siddique",
];

const DOCTOR_FIRST_NAMES = [
  "Ahsan",
  "Ali",
  "Hamza",
  "Usman",
  "Saad",
  "Bilal",
  "Faisal",
  "Hassan",
  "Imran",
  "Tariq",
  "Zain",
  "Danish",
  "Kamran",
  "Arslan",
  "Murtaza",
  "Nadeem",
  "Fawad",
  "Adeel",
  "Shahbaz",
  "Rizwan",
  "Ayaan",
  "Sarmad",
  "Ammar",
  "Maaz",
  "Farhan",
  "Kashif",
  "Noman",
  "Yasir",
  "Omar",
  "Musa",
  "Areej",
  "Hira",
  "Fatima",
  "Ayesha",
  "Sana",
  "Maryam",
  "Hania",
  "Nimra",
  "Iqra",
  "Sidra",
];

const DOCTOR_LAST_NAMES = [
  "Khan",
  "Malik",
  "Qureshi",
  "Hussain",
  "Raza",
  "Ahmed",
  "Sheikh",
  "Tariq",
  "Butt",
  "Javed",
  "Siddiqui",
  "Iqbal",
  "Aslam",
  "Farooq",
  "Arif",
  "Naqvi",
  "Rehman",
  "Yousaf",
  "Shahid",
  "Nawaz",
  "Aziz",
  "Rashid",
  "Khalid",
  "Saeed",
  "Anwar",
  "Awan",
  "Bukhari",
  "Latif",
  "Naseer",
  "Zaman",
];

const PATIENT_FIRST_NAMES = [
  "Amaan",
  "Musa",
  "Haris",
  "Areeb",
  "Rayyan",
  "Zuhair",
  "Azaan",
  "Usaid",
  "Afnan",
  "Hamdan",
  "Sufyan",
  "Ahsan",
  "Abeer",
  "Mahad",
  "Ayan",
  "Aliyan",
  "Mahrukh",
  "Hafsa",
  "Anaya",
  "Minal",
  "Hadiya",
  "Aiza",
  "Noor",
  "Laiba",
  "Saman",
  "Zoya",
  "Nayab",
  "Rida",
  "Aleena",
  "Sara",
  "Kashan",
  "Noman",
  "Bilal",
  "Zain",
  "Adeel",
  "Saad",
  "Fahad",
  "Hassan",
  "Faizan",
  "Dua",
];

const PATIENT_LAST_NAMES = [
  "Khan",
  "Malik",
  "Qureshi",
  "Hussain",
  "Raza",
  "Ahmed",
  "Sheikh",
  "Butt",
  "Javed",
  "Siddique",
  "Iqbal",
  "Aslam",
  "Farooq",
  "Arif",
  "Naqvi",
  "Rehman",
  "Yousaf",
  "Shahid",
  "Nawaz",
  "Aziz",
];

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DOCTOR_SHIFTS = ["morning", "morning", "evening", "evening", "night", "flex"];
const DEPARTMENT_ROWS_PER_FILE = 1000;
const HASH_ROUNDS = 8;

const hospitalCodeToCity = new Map();

function ensureDirectorySync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function removeDirectorySync(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function capitalizeWords(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function safeFilename(value) {
  return String(value || "upload")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "upload";
}

function buildDomainBase(hospitalName) {
  return `${slugify(hospitalName)}.pk`;
}

function makeEmail(localPart, domainBase) {
  return `${slugify(localPart).replace(/-/g, ".")}@${domainBase}`;
}

function buildHospitalName(city, locality, suffix) {
  return `${locality} ${suffix}`;
}

function buildHospitalAddress(city, locality, landmark, index) {
  const roadNumber = 100 + index * 7;
  return `${roadNumber} ${locality}, ${landmark}, ${city}`;
}

function buildPhone(seed) {
  const numeric = String(300000000 + (Math.abs(seed * 7919) % 699999999)).slice(-9);
  return `03${numeric}`;
}

function buildDoctorId(cityCode, hospitalIndex, departmentCode, doctorIndex) {
  return `DR-${cityCode}${String(hospitalIndex + 1).padStart(2, "0")}-${departmentCode}-${String(doctorIndex + 1).padStart(2, "0")}`;
}

function pickName(firstNames, lastNames, globalIndex, offset = 0) {
  const first = firstNames[(globalIndex + offset) % firstNames.length];
  const last = lastNames[(globalIndex * 3 + offset) % lastNames.length];
  return `${first} ${last}`;
}

function getDoctorWorkDays(doctorIndex) {
  const holidayIndex = doctorIndex % WEEKDAYS.length;
  return WEEKDAYS.filter((_, idx) => idx !== holidayIndex);
}

function buildRosterPlan(doctors) {
  const roster = [];
  const coverage = WEEKDAYS.map((weekday) => ({ weekday, doctor_count: 0, doctors: [] }));

  doctors.forEach((doctor, doctorIndex) => {
    const holiday = WEEKDAYS[doctorIndex % WEEKDAYS.length];
    const workDays = getDoctorWorkDays(doctorIndex);
    roster.push({
      doctor_id: doctor._id,
      doctor_name: doctor.name,
      holiday,
      work_days: workDays,
      shift: doctor.shift || "flex",
    });

    for (const day of workDays) {
      const entry = coverage.find((item) => item.weekday === day);
      if (entry) {
        entry.doctor_count += 1;
        entry.doctors.push(doctor.name);
      }
    }
  });

  return {
    roster,
    coverage,
    isValid: coverage.every((item) => item.doctor_count >= 3),
  };
}

function createPatientRows({ hospital, hospitalCode, department, doctors, fileName, createdById }) {
  const rows = [];
  const domainBase = buildDomainBase(hospital.name);
  const departmentDoctors = doctors.length > 0 ? doctors : [];

  for (let i = 0; i < DEPARTMENT_ROWS_PER_FILE; i += 1) {
    const doctor = departmentDoctors[i % departmentDoctors.length] || null;
    const first = PATIENT_FIRST_NAMES[(hospitalCode.length + i * 2) % PATIENT_FIRST_NAMES.length];
    const last = PATIENT_LAST_NAMES[(i * 3 + hospitalCode.length) % PATIENT_LAST_NAMES.length];
    const patientName = `${first} ${last}`;
    const sourceRecordId = `REC-${hospitalCode}-${String(department.code).toUpperCase()}-${String(i + 1).padStart(3, "0")}`;
    const email = makeEmail(`${first}.${last}.${hospitalCode.toLowerCase()}.${i + 1}`, domainBase);
    const phone = `03${hospitalCode.slice(-2)}${String(i + 1).padStart(2, "0")}4567`;
    const date = new Date();
    date.setDate(date.getDate() - (i + 1));
    const gender = i % 2 === 0 ? "male" : "female";
    const bloodTypes = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-"];
    const bloodType = bloodTypes[i % bloodTypes.length];
    const disease = department.diseases[i % department.diseases.length];
    const address = `${department.locality || hospital.locality}, ${hospital.city}`;

    rows.push({
      patient_id: `seed-${hospitalCode}-${department.code}-${String(i + 1).padStart(2, "0")}`,
      source_record_id: sourceRecordId,
      name: patientName,
      email,
      phone,
      city: hospital.city,
      date_of_birth: new Date(1988 + (i % 16), (i % 11), (i % 27) + 1).toISOString(),
      gender,
      blood_type: bloodType,
      address,
      hospital_id: String(hospital._id),
      department_id: String(department._id),
      assigned_doctor_id: doctor ? String(doctor._id) : "",
      department_name: department.name,
      disease,
      medical_history: `${disease} follow-up record for ${patientName}.`,
      status: "active",
      created_by: String(createdById || ""),
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
      source_data_json: JSON.stringify({
        source_record_id: sourceRecordId,
        department: department.name,
        disease,
        note: `Seed record for ${department.name}.`,
      }),
      file_name: fileName,
    });
  }

  return rows;
}

async function hashPassword(password, cache) {
  if (!cache.has(password)) {
    cache.set(password, await bcrypt.hash(password, HASH_ROUNDS));
  }
  return cache.get(password);
}

async function upsertHospitalAdmin({ hospital, adminName, adminEmail, password, passwordCache }) {
  const passwordHash = await hashPassword(password, passwordCache);
  const user = await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: {
        username: adminName,
        email: adminEmail,
        password: passwordHash,
        role: "hospital_admin",
        hospital_id: hospital._id,
        approval_status: "approved",
        is_verified: true,
        is_blocked: false,
        auth_provider: "local",
        hospital_info: {
          name: hospital.name,
          city: hospital.city,
          address: hospital.address,
          license_number: hospital.license_number,
          specializations: [],
        },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return user;
}

async function upsertStaffMember({
  name,
  email,
  password,
  role,
  hospitalId,
  departmentId = null,
  doctorId = null,
  phone = "",
  specialization = "",
  shift = "",
  availableDays = [],
  maxPatientsPerDay = null,
  experienceYears = 0,
  status = "active",
  passwordCache,
}) {
  const passwordHash = await hashPassword(password, passwordCache);
  const staff = await Staff.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        email,
        password: passwordHash,
        role,
        hospital_id: hospitalId,
        department_id: departmentId,
        doctor_id: doctorId,
        phone,
        specialization,
        shift,
        available_days: availableDays,
        max_patients_per_day: maxPatientsPerDay,
        experience_years: experienceYears,
        status,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return staff;
}

async function upsertDepartment({ hospitalId, name, description, status = "active" }) {
  return Department.findOneAndUpdate(
    { hospital_id: hospitalId, name },
    {
      $set: {
        name,
        hospital_id: hospitalId,
        description,
        status,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

function buildDepartmentSet(globalHospitalIndex) {
  const start = (globalHospitalIndex * 5) % DEPARTMENT_FIXTURES.length;
  const selected = [];
  for (let i = 0; i < 5; i += 1) {
    selected.push(DEPARTMENT_FIXTURES[(start + i) % DEPARTMENT_FIXTURES.length]);
  }
  return selected;
}

function buildHospitalFixture(cityFixture, cityHospitalIndex, globalHospitalIndex) {
  const locality = cityFixture.localities[cityHospitalIndex % cityFixture.localities.length];
  const suffix = HOSPITAL_SUFFIXES[cityHospitalIndex % HOSPITAL_SUFFIXES.length];
  const hospitalName = buildHospitalName(cityFixture.city, locality.locality, suffix);
  const cityCode = cityFixture.code;
  const hospitalCode = `${cityCode}${String(cityHospitalIndex + 1).padStart(2, "0")}`;
  const adminName = ADMIN_NAMES[globalHospitalIndex % ADMIN_NAMES.length];
  const receptionistName = RECEPTIONIST_NAMES[globalHospitalIndex % RECEPTIONIST_NAMES.length];
  const domainBase = buildDomainBase(hospitalName);

  return {
    city: cityFixture.city,
    cityCode,
    cityHospitalIndex,
    globalHospitalIndex,
    hospitalCode,
    locality: locality.locality,
    landmark: locality.landmark,
    hospitalName,
    hospitalAddress: buildHospitalAddress(cityFixture.city, locality.locality, locality.landmark, cityHospitalIndex),
    hospitalEmail: makeEmail(`admin.${hospitalCode}`, domainBase),
    hospitalPhone: buildPhone(globalHospitalIndex + 1),
    adminName,
    adminEmail: makeEmail(adminName, domainBase),
    adminPassword: `Admin@${hospitalCode}`,
    receptionistName,
    receptionistEmail: makeEmail(receptionistName, domainBase),
    receptionistPassword: `Reception@${hospitalCode}`,
    receptionistPhone: buildPhone(globalHospitalIndex + 11),
    departments: buildDepartmentSet(globalHospitalIndex),
  };
}

function writeDepartmentUploadFile({ hospital, departmentId, fileName, rows }) {
  const uploadsRoot = path.join(PATIENT_RECORDS_ROOT, String(hospital._id), "uploads", String(departmentId));
  ensureDirectorySync(uploadsRoot);
  const filePath = path.join(uploadsRoot, fileName);
  const worksheet = XLSX.utils.json_to_sheet(rows, { cellDates: true });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");
  XLSX.writeFile(workbook, filePath, { bookType: "xlsx" });
  return filePath;
}

async function createScheduleArtifacts({ hospital, createdAdmin, departments }) {
  const departmentPlans = [];
  const proposalChanges = [];
  let totalDoctors = 0;

  for (const department of departments) {
    const doctors = await Staff.find({ hospital_id: hospital._id, department_id: department._id, role: "doctor" }).sort({ created_at: 1 });
    const roster = buildRosterPlan(doctors);
    totalDoctors += doctors.length;

    departmentPlans.push({
      department_id: String(department._id),
      department_name: department.name,
      minimum_doctors_per_day: 3,
      roster: roster.roster,
      weekday_coverage: roster.coverage,
      is_valid: roster.isValid,
    });

    for (const doctor of doctors) {
      proposalChanges.push({
        doctor_id: doctor._id,
        doctor_name: doctor.name,
        department_id: department._id,
        department_name: department.name,
        change_type: "optimal_roster_assignment",
        from_state: { available_days: [] , shift: "" },
        to_state: { available_days: doctor.available_days, shift: doctor.shift, personal_holiday: WEEKDAYS.find((day) => !doctor.available_days.includes(day)) || "" },
        affected_appointments: 0,
        appointment_ids: [],
        description: `Assign ${doctor.name} to the optimized ${department.name} roster.`,
      });
    }
  }

  const plan = await SmartSchedulePlan.findOneAndUpdate(
    { hospital_id: hospital._id, start_date: new Date().toISOString().slice(0, 10), end_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
    {
      $set: {
        hospital_id: hospital._id,
        generated_by: createdAdmin._id,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        horizon_days: 7,
        safety_buffer_pct: 10,
        department_filter: null,
        summary: {
          total_departments: departments.length,
          total_doctors: totalDoctors,
          minimum_doctors_per_day: 3,
          coverage_mode: "6_days_1_holiday_per_doctor",
          coverage_status: "full",
        },
        alerts: [],
        departments_plan: departmentPlans,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const proposal = await ScheduleOptimizationProposal.findOneAndUpdate(
    { hospital_id: hospital._id, title: `${hospital.name} roster optimization` },
    {
      $set: {
        hospital_id: hospital._id,
        created_by: createdAdmin._id,
        approved_by: createdAdmin._id,
        status: "applied",
        title: `${hospital.name} roster optimization`,
        description: "Seeded optimal roster for the hospital departments.",
        optimization_type: "weekly_coverage",
        department_filter: null,
        summary: {
          total_gaps_to_close: 0,
          doctors_affected: totalDoctors,
          coverage_improvement_pct: 100,
          appointments_to_review: 0,
        },
        changes: proposalChanges,
        approval_feedback: "Seed applied during bulk hospital setup.",
        applied_at: new Date(),
        rejection_reason: "",
        rejected_at: null,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return { plan, proposal };
}

async function seedHospital({ fixture, passwordCache, globalHospitalIndex }) {
  const hospital = await Hospital.findOneAndUpdate(
    { license_number: `${fixture.hospitalCode}-LIC-${String(globalHospitalIndex + 1).padStart(3, "0")}` },
    {
      $set: {
        name: fixture.hospitalName,
        city: fixture.city,
        address: fixture.hospitalAddress,
        license_number: `${fixture.hospitalCode}-LIC-${String(globalHospitalIndex + 1).padStart(3, "0")}`,
        email: fixture.hospitalEmail,
        phone: fixture.hospitalPhone,
        contact_number: fixture.hospitalPhone,
        description: `Seeded hospital in ${fixture.city} at ${fixture.locality}.`,
        status: "approved",
        is_active: true,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const admin = await upsertHospitalAdmin({
    hospital,
    adminName: fixture.adminName,
    adminEmail: fixture.adminEmail,
    password: fixture.adminPassword,
    passwordCache,
  });

  hospitalCodeToCity.set(String(hospital._id), fixture.city);
  await Hospital.updateOne({ _id: hospital._id }, { $set: { created_by: admin._id } });

  const receptionist = await upsertStaffMember({
    name: fixture.receptionistName,
    email: fixture.receptionistEmail,
    password: fixture.receptionistPassword,
    role: "receptionist",
    hospitalId: hospital._id,
    phone: fixture.receptionistPhone,
    specialization: "Front Desk",
    shift: "flex",
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    experienceYears: 4,
    status: "active",
    passwordCache,
  });

  const departments = [];
  const departmentSeeds = [];
  for (let i = 0; i < fixture.departments.length; i += 1) {
    const deptFixture = fixture.departments[i];
    const department = await upsertDepartment({
      hospitalId: hospital._id,
      name: deptFixture.name,
      description: `${deptFixture.name} services for ${fixture.city} patients in ${fixture.locality}.`,
    });
    departments.push(department);
    departmentSeeds.push(deptFixture);
  }

  const doctorsCreated = [];
  for (let deptIndex = 0; deptIndex < departments.length; deptIndex += 1) {
    const department = departments[deptIndex];
    const deptFixture = departmentSeeds[deptIndex];

    for (let doctorIndex = 0; doctorIndex < 6; doctorIndex += 1) {
      const globalDoctorIndex = globalHospitalIndex * 30 + deptIndex * 6 + doctorIndex;
      const doctorName = `Dr. ${pickName(DOCTOR_FIRST_NAMES, DOCTOR_LAST_NAMES, globalDoctorIndex)}`;
      const domainBase = buildDomainBase(fixture.hospitalName);
      const doctorEmail = makeEmail(`${doctorName.replace(/^Dr\.\s*/i, "")} ${fixture.hospitalCode} ${deptIndex + 1} ${doctorIndex + 1}`, domainBase);
      const doctorId = buildDoctorId(fixture.cityCode, fixture.cityHospitalIndex, deptFixture.fileName.replace(/[^A-Z]/gi, "").slice(0, 3).toUpperCase() || "DPT", doctorIndex);
      const shift = DOCTOR_SHIFTS[doctorIndex % DOCTOR_SHIFTS.length];
      const availableDays = getDoctorWorkDays(doctorIndex);
      const specialization = deptFixture.name;
      const doctor = await upsertStaffMember({
        name: doctorName,
        email: doctorEmail,
        password: `Doctor@${fixture.hospitalCode}`,
        role: "doctor",
        hospitalId: hospital._id,
        departmentId: department._id,
        doctorId,
        phone: buildPhone(globalHospitalIndex * 100 + deptIndex * 10 + doctorIndex + 100),
        specialization,
        shift,
        availableDays,
        maxPatientsPerDay: 24 + doctorIndex * 2,
        experienceYears: 6 + ((deptIndex + doctorIndex) % 12),
        status: "active",
        passwordCache,
      });
      doctorsCreated.push(doctor);
    }

    const firstDoctor = await Staff.findOne({ hospital_id: hospital._id, department_id: department._id, role: "doctor" }).sort({ created_at: 1 });
    if (firstDoctor) {
      department.head_doctor_id = firstDoctor._id;
      await department.save();
    }
  }

  await createScheduleArtifacts({ hospital, createdAdmin: admin, departments });

  const fileReports = [];
  removeDirectorySync(path.join(PATIENT_RECORDS_ROOT, String(hospital._id), "uploads", "undefined"));
  for (let deptIndex = 0; deptIndex < departments.length; deptIndex += 1) {
    const department = departments[deptIndex];
    const deptFixture = departmentSeeds[deptIndex];
    const doctors = await Staff.find({ hospital_id: hospital._id, department_id: department._id, role: "doctor" }).sort({ created_at: 1 });
    const rows = createPatientRows({
      hospital,
      hospitalCode: fixture.hospitalCode,
      department: { ...deptFixture, _id: department._id, locality: fixture.locality },
      doctors,
      fileName: deptFixture.fileName,
      createdById: admin._id,
    });
    const filePath = writeDepartmentUploadFile({
      hospital,
      departmentId: department._id,
      fileName: deptFixture.fileName,
      rows,
    });
    fileReports.push({
      department_id: String(department._id),
      department_name: department.name,
      file_name: deptFixture.fileName,
      file_path: filePath,
      rows: rows.length,
    });
  }

  return {
    hospital,
    admin,
    receptionist,
    departments,
    doctorsCreated,
    fileReports,
    city: fixture.city,
    locality: fixture.locality,
    hospitalCode: fixture.hospitalCode,
  };
}

function buildCredentialReport(seedResults) {
  const hospitals = seedResults.map((result) => ({
    hospital_id: String(result.hospital._id),
    hospital_name: result.hospital.name,
    city: result.city,
    locality: result.locality,
    hospital_code: result.hospitalCode,
    login: {
      email: result.admin.email,
      password: result.hospitalCode ? `Admin@${result.hospitalCode}` : "",
    },
    receptionist: {
      name: result.receptionist.name,
      email: result.receptionist.email,
      password: `Reception@${result.hospitalCode}`,
    },
    departments: result.departments.map((department, index) => ({
      department_id: String(department._id),
      department_name: department.name,
      file_name: result.fileReports[index]?.file_name || "",
      doctors: result.doctorsCreated
        .filter((doctor) => String(doctor.department_id) === String(department._id))
        .map((doctor) => ({
          name: doctor.name,
          email: doctor.email,
          password: `Doctor@${result.hospitalCode}`,
          shift: doctor.shift,
          available_days: doctor.available_days,
          doctor_id: doctor.doctor_id,
        })),
    })),
  }));

  return {
    generated_at: new Date().toISOString(),
    totals: {
      hospitals: hospitals.length,
      departments: hospitals.reduce((sum, item) => sum + item.departments.length, 0),
      doctors: hospitals.reduce((sum, item) => sum + item.departments.reduce((deptSum, dept) => deptSum + dept.doctors.length, 0), 0),
      receptionists: hospitals.length,
      hospital_admins: hospitals.length,
    },
    hospitals,
  };
}

function writeReports(report) {
  ensureDirectorySync(REPORT_DIR);
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2), "utf-8");

  const lines = [];
  lines.push("# Bulk Hospital Seed Credentials");
  lines.push("");
  lines.push(`Generated: ${report.generated_at}`);
  lines.push("");
  lines.push(`Hospitals: ${report.totals.hospitals}`);
  lines.push(`Departments: ${report.totals.departments}`);
  lines.push(`Doctors: ${report.totals.doctors}`);
  lines.push(`Receptionists: ${report.totals.receptionists}`);
  lines.push("");
  lines.push(`Full credential export: ${path.relative(ROOT_DIR, REPORT_JSON).replace(/\\/g, "/")}`);
  lines.push("");

  for (const hospital of report.hospitals) {
    lines.push(`## ${hospital.hospital_name}`);
    lines.push(`City: ${hospital.city}`);
    lines.push(`Location: ${hospital.locality}`);
    lines.push("Hospital admin:");
    lines.push(`- Email: ${hospital.login.email}`);
    lines.push(`- Password: ${hospital.login.password}`);
    lines.push("Receptionist:");
    lines.push(`- Name: ${hospital.receptionist.name}`);
    lines.push(`- Email: ${hospital.receptionist.email}`);
    lines.push(`- Password: ${hospital.receptionist.password}`);
    lines.push("");
    lines.push("Departments:");
    for (const dept of hospital.departments) {
      lines.push(`- ${dept.department_name} | File: ${dept.file_name}`);
      for (const doctor of dept.doctors) {
        lines.push(`  - ${doctor.name} <${doctor.email}> / ${doctor.password} | ${doctor.doctor_id}`);
      }
    }
    lines.push("");
  }

  fs.writeFileSync(REPORT_MD, `${lines.join("\n")}\n`, "utf-8");
}

async function main() {
  ensureDirectorySync(PATIENT_RECORDS_ROOT);
  ensureDirectorySync(REPORT_DIR);

  await connectDatabase();
  const passwordCache = new Map();

  const seedResults = [];
  let globalHospitalIndex = 0;

  for (const cityFixture of CITY_FIXTURES) {
    for (let cityHospitalIndex = 0; cityHospitalIndex < cityFixture.hospitalCount; cityHospitalIndex += 1) {
      const fixture = buildHospitalFixture(cityFixture, cityHospitalIndex, globalHospitalIndex);
      const result = await seedHospital({ fixture, passwordCache, globalHospitalIndex });
      seedResults.push(result);
      console.log(`Seeded ${result.hospital.name} (${result.city})`);
      globalHospitalIndex += 1;
    }
  }

  const report = buildCredentialReport(seedResults);
  writeReports(report);

  console.log("----------------------------------------");
  console.log(`Hospitals seeded: ${report.totals.hospitals}`);
  console.log(`Departments seeded: ${report.totals.departments}`);
  console.log(`Doctors seeded: ${report.totals.doctors}`);
  console.log(`Receptionists seeded: ${report.totals.receptionists}`);
  console.log(`Credential report: ${path.relative(ROOT_DIR, REPORT_MD).replace(/\\/g, "/")}`);

  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error("Failed to seed bulk hospitals:", error);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore close errors
  }
  process.exit(1);
});
