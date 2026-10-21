const mongoose = require("mongoose");

const connectDatabase = require("../src/db");
const Department = require("../src/models/Department");
const Staff = require("../src/models/Staff");
const Patient = require("../src/models/Patient");
const Appointment = require("../src/models/Appointment");

const AUTO_REASON_PREFIX = "AUTO-SEED";
const PATIENTS_PER_DOCTOR = 6;

function randomPhone(seed) {
  const n = 1000000 + (seed % 9000000);
  return `03${n}`;
}

function toDateAt(hour, minute, offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function getShiftTemplate(shift) {
  const key = String(shift || "").trim().toLowerCase();
  if (key === "morning") {
    return {
      upcoming: [
        toDateAt(8, 0, 0),
        toDateAt(8, 30, 0),
        toDateAt(9, 0, 1),
        toDateAt(9, 30, 1),
        toDateAt(10, 0, 2),
        toDateAt(10, 30, 2),
      ],
      completed: [toDateAt(11, 0, -1), toDateAt(11, 30, -2)],
    };
  }

  if (key === "evening") {
    return {
      upcoming: [
        toDateAt(14, 0, 0),
        toDateAt(14, 30, 0),
        toDateAt(15, 0, 1),
        toDateAt(15, 30, 1),
        toDateAt(16, 0, 2),
        toDateAt(16, 30, 2),
      ],
      completed: [toDateAt(17, 0, -1), toDateAt(17, 30, -2)],
    };
  }

  if (key === "night") {
    return {
      upcoming: [
        toDateAt(20, 0, 0),
        toDateAt(20, 30, 0),
        toDateAt(21, 0, 1),
        toDateAt(21, 30, 1),
        toDateAt(22, 0, 2),
        toDateAt(22, 30, 2),
      ],
      completed: [toDateAt(23, 0, -1), toDateAt(23, 30, -2)],
    };
  }

  return {
    upcoming: [
      toDateAt(10, 0, 0),
      toDateAt(10, 30, 0),
      toDateAt(11, 0, 1),
      toDateAt(11, 30, 1),
      toDateAt(12, 0, 2),
      toDateAt(12, 30, 2),
    ],
    completed: [toDateAt(13, 0, -1), toDateAt(13, 30, -2)],
  };
}

async function ensurePatientsForDoctor(doctor, departmentName) {
  let patients = await Patient.find({
    hospital_id: doctor.hospital_id,
    assigned_doctor_id: doctor._id,
  })
    .sort({ created_at: -1 })
    .limit(PATIENTS_PER_DOCTOR);

  if (patients.length >= PATIENTS_PER_DOCTOR) {
    return patients;
  }

  const toCreate = PATIENTS_PER_DOCTOR - patients.length;
  const baseName = String(departmentName || "General").replace(/[^A-Za-z]/g, "") || "General";

  for (let i = 0; i < toCreate; i += 1) {
    const seed = Date.now() + i;
    const suffix = String(seed).slice(-6);
    const name = `${baseName} Patient ${suffix}`;

    // Patient email is not unique; this value helps test search/history flows.
    const created = await Patient.create({
      name,
      email: `auto.patient.${suffix}@healthnet.local`,
      phone: randomPhone(seed),
      gender: i % 2 === 0 ? "male" : "female",
      medical_history: `Auto-seeded sample history for ${departmentName || "department"}.`,
      hospital_id: doctor.hospital_id,
      assigned_doctor_id: doctor._id,
      department_id: doctor.department_id || null,
      status: "active",
      source_record_id: `${AUTO_REASON_PREFIX}-PAT-${suffix}`,
    });

    patients.push(created);
  }

  return patients;
}

async function seedForDoctor(doctor, department) {
  const existingAutoCount = await Appointment.countDocuments({
    hospital_id: doctor.hospital_id,
    doctor_id: doctor._id,
    reason: { $regex: `^${AUTO_REASON_PREFIX}` },
  });

  if (existingAutoCount > 0) {
    return { created: 0, skipped: true, reason: "already_seeded" };
  }

  const patients = await ensurePatientsForDoctor(doctor, department?.name || "General");
  const { upcoming, completed } = getShiftTemplate(doctor.shift);

  const upcomingDocs = upcoming.map((appointmentAt, idx) => ({
    hospital_id: doctor.hospital_id,
    doctor_id: doctor._id,
    patient_id: patients[idx % patients.length]._id,
    appointment_at: appointmentAt,
    duration_minutes: 30,
    status: "pending",
    reason: `${AUTO_REASON_PREFIX}: Follow-up consultation`,
    notes: "Auto generated sample appointment.",
  }));

  const completedDocs = completed.map((appointmentAt, idx) => ({
    hospital_id: doctor.hospital_id,
    doctor_id: doctor._id,
    patient_id: patients[(idx + 2) % patients.length]._id,
    appointment_at: appointmentAt,
    duration_minutes: 30,
    status: "completed",
    reason: `${AUTO_REASON_PREFIX}: Previous case review`,
    notes: "Auto generated sample completed appointment.",
  }));

  const docs = [...upcomingDocs, ...completedDocs];
  if (docs.length === 0) {
    return { created: 0, skipped: true, reason: "no_docs" };
  }

  const created = await Appointment.insertMany(docs);
  return { created: created.length, skipped: false, reason: "seeded" };
}

async function main() {
  await connectDatabase();

  const departments = await Department.find({}).sort({ name: 1 });
  if (departments.length === 0) {
    console.log("No departments found. Nothing to seed.");
    await mongoose.connection.close();
    return;
  }

  let totalCreated = 0;
  let totalDoctors = 0;
  let skippedDoctors = 0;

  for (const department of departments) {
    const doctors = await Staff.find({
      hospital_id: department.hospital_id,
      department_id: department._id,
      role: "doctor",
      status: { $ne: "suspended" },
    });

    if (doctors.length === 0) {
      console.log(`[${department.name}] no active doctors found.`);
      continue;
    }

    for (const doctor of doctors) {
      totalDoctors += 1;
      const result = await seedForDoctor(doctor, department);
      totalCreated += result.created;
      if (result.skipped) skippedDoctors += 1;
      console.log(
        `[${department.name}] ${doctor.name} (${doctor.doctor_id || doctor._id}) -> ${result.skipped ? "skipped" : `created ${result.created}`}`
      );
    }
  }

  console.log("----------------------------------------");
  console.log(`Doctors processed: ${totalDoctors}`);
  console.log(`Appointments created: ${totalCreated}`);
  console.log(`Doctors skipped: ${skippedDoctors}`);

  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error("Failed to seed doctor appointments:", error.message);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore close errors
  }
  process.exit(1);
});
