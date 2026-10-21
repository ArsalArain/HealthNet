/**
 * seedDepartmentsAndDoctors.js
 *
 * This script:
 * 1. Adds ALL 23 department types to EVERY approved hospital (upsert — no duplicates)
 * 2. Assigns each doctor to the correct department based on their specialization field
 * 3. Updates doctor specialization field to match the standardized department name
 *
 * Run: node src/seedDepartmentsAndDoctors.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Hospital = require("./models/Hospital");
const Department = require("./models/Department");
const Staff = require("./models/Staff");
const { ALL_DEPARTMENT_NAMES, DEPARTMENTS, getDepartmentForDisease } = require("./diseaseDepartmentMap");

// Map specialization strings (as stored in DB) to standardized department names
const SPEC_TO_DEPT = {
  // Emergency
  "emergency": DEPARTMENTS.EMERGENCY,
  "emergency medicine": DEPARTMENTS.EMERGENCY,
  "emergency physician": DEPARTMENTS.EMERGENCY,
  // OPD / General
  "opd": DEPARTMENTS.GENERAL_PHYSICIAN,
  "general physician": DEPARTMENTS.GENERAL_PHYSICIAN,
  "general medicine": DEPARTMENTS.GENERAL_PHYSICIAN,
  "general practice": DEPARTMENTS.GENERAL_PHYSICIAN,
  "gp": DEPARTMENTS.GENERAL_PHYSICIAN,
  "family medicine": DEPARTMENTS.GENERAL_PHYSICIAN,
  // Cardiology
  "cardiology": DEPARTMENTS.CARDIOLOGY,
  "cardiologist": DEPARTMENTS.CARDIOLOGY,
  "cardiac": DEPARTMENTS.CARDIOLOGY,
  "heart": DEPARTMENTS.CARDIOLOGY,
  // Neurology
  "neurology": DEPARTMENTS.NEUROLOGY,
  "neurologist": DEPARTMENTS.NEUROLOGY,
  "neuro": DEPARTMENTS.NEUROLOGY,
  // Pulmonology
  "pulmonology": DEPARTMENTS.PULMONOLOGY,
  "pulmonologist": DEPARTMENTS.PULMONOLOGY,
  "respiratory": DEPARTMENTS.PULMONOLOGY,
  "chest": DEPARTMENTS.PULMONOLOGY,
  // Gastroenterology
  "gastroenterology": DEPARTMENTS.GASTROENTEROLOGY,
  "gastroenterologist": DEPARTMENTS.GASTROENTEROLOGY,
  "gi": DEPARTMENTS.GASTROENTEROLOGY,
  "gastro": DEPARTMENTS.GASTROENTEROLOGY,
  // Orthopedics
  "orthopedics": DEPARTMENTS.ORTHOPEDICS,
  "orthopaedics": DEPARTMENTS.ORTHOPEDICS,
  "orthopedist": DEPARTMENTS.ORTHOPEDICS,
  "ortho": DEPARTMENTS.ORTHOPEDICS,
  "bone": DEPARTMENTS.ORTHOPEDICS,
  // Dermatology
  "dermatology": DEPARTMENTS.DERMATOLOGY,
  "dermatologist": DEPARTMENTS.DERMATOLOGY,
  "skin": DEPARTMENTS.DERMATOLOGY,
  // ENT
  "ent": DEPARTMENTS.ENT,
  "ear nose throat": DEPARTMENTS.ENT,
  "ear, nose, throat": DEPARTMENTS.ENT,
  // Ophthalmology
  "ophthalmology": DEPARTMENTS.OPHTHALMOLOGY,
  "ophthalmologist": DEPARTMENTS.OPHTHALMOLOGY,
  "eye": DEPARTMENTS.OPHTHALMOLOGY,
  // Urology
  "urology": DEPARTMENTS.UROLOGY,
  "urologist": DEPARTMENTS.UROLOGY,
  // Nephrology
  "nephrology": DEPARTMENTS.NEPHROLOGY,
  "nephrologist": DEPARTMENTS.NEPHROLOGY,
  "kidney": DEPARTMENTS.NEPHROLOGY,
  // Gynecology
  "gynecology": DEPARTMENTS.GYNECOLOGY,
  "gynecologist": DEPARTMENTS.GYNECOLOGY,
  "obstetrics": DEPARTMENTS.GYNECOLOGY,
  "gynecology obstetrics": DEPARTMENTS.GYNECOLOGY,
  "gynecology / obstetrics": DEPARTMENTS.GYNECOLOGY,
  "ob/gyn": DEPARTMENTS.GYNECOLOGY,
  "obgyn": DEPARTMENTS.GYNECOLOGY,
  "maternity": DEPARTMENTS.GYNECOLOGY,
  // Endocrinology
  "endocrinology": DEPARTMENTS.ENDOCRINOLOGY,
  "endocrinologist": DEPARTMENTS.ENDOCRINOLOGY,
  "diabetes": DEPARTMENTS.ENDOCRINOLOGY,
  // Psychiatry
  "psychiatry": DEPARTMENTS.PSYCHIATRY,
  "psychiatrist": DEPARTMENTS.PSYCHIATRY,
  "mental health": DEPARTMENTS.PSYCHIATRY,
  "psychology": DEPARTMENTS.PSYCHIATRY,
  // Oncology
  "oncology": DEPARTMENTS.ONCOLOGY,
  "oncologist": DEPARTMENTS.ONCOLOGY,
  "cancer": DEPARTMENTS.ONCOLOGY,
  // Hematology
  "hematology": DEPARTMENTS.HEMATOLOGY,
  "hematologist": DEPARTMENTS.HEMATOLOGY,
  // Rheumatology
  "rheumatology": DEPARTMENTS.RHEUMATOLOGY,
  "rheumatologist": DEPARTMENTS.RHEUMATOLOGY,
  // Infectious Disease
  "infectious disease": DEPARTMENTS.INFECTIOUS_DISEASE,
  "infectiology": DEPARTMENTS.INFECTIOUS_DISEASE,
  // Dentistry
  "dentistry": DEPARTMENTS.DENTISTRY,
  "dentist": DEPARTMENTS.DENTISTRY,
  "dental": DEPARTMENTS.DENTISTRY,
  // Pediatrics
  "pediatrics": DEPARTMENTS.PEDIATRICS,
  "paediatrics": DEPARTMENTS.PEDIATRICS,
  "pediatrician": DEPARTMENTS.PEDIATRICS,
  "child health": DEPARTMENTS.PEDIATRICS,
  // General Surgery
  "general surgery": DEPARTMENTS.GENERAL_SURGERY,
  "surgery": DEPARTMENTS.GENERAL_SURGERY,
  "surgeon": DEPARTMENTS.GENERAL_SURGERY,
  // Allergy & Immunology
  "allergy": DEPARTMENTS.ALLERGY_IMMUNOLOGY,
  "allergy & immunology": DEPARTMENTS.ALLERGY_IMMUNOLOGY,
  "immunology": DEPARTMENTS.ALLERGY_IMMUNOLOGY,
  // Radiology (not in new map, map to General Physician)
  "radiology": DEPARTMENTS.GENERAL_PHYSICIAN,
  "radiologist": DEPARTMENTS.GENERAL_PHYSICIAN,
};

function mapSpecToDept(spec) {
  if (!spec) return DEPARTMENTS.GENERAL_PHYSICIAN;
  const key = spec.trim().toLowerCase();
  return SPEC_TO_DEPT[key] || getDepartmentForDisease(key) || DEPARTMENTS.GENERAL_PHYSICIAN;
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  // ─────────────────────────────────────────────
  // STEP 1: Get all approved + active hospitals
  // ─────────────────────────────────────────────
  const hospitals = await Hospital.find({ status: "approved", is_active: true }, { _id: 1, name: 1 });
  console.log(`Found ${hospitals.length} approved hospitals.\n`);

  let deptCreated = 0;
  let deptSkipped = 0;
  const hospitalDeptMap = {}; // hospitalId -> { deptName -> deptId }

  for (const hospital of hospitals) {
    hospitalDeptMap[hospital._id] = {};

    for (const deptName of ALL_DEPARTMENT_NAMES) {
      // Upsert: create only if it doesn't already exist
      let dept = await Department.findOne({
        hospital_id: hospital._id,
        name: { $regex: new RegExp(`^${deptName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      });

      if (!dept) {
        dept = await Department.create({
          hospital_id: hospital._id,
          name: deptName,
          description: `${deptName} department`,
          status: "active",
        });
        deptCreated++;
      } else {
        deptSkipped++;
        // Ensure it's active
        if (dept.status !== "active") {
          await Department.updateOne({ _id: dept._id }, { status: "active" });
        }
      }
      hospitalDeptMap[hospital._id][deptName.toLowerCase()] = dept._id;
    }
  }

  console.log(`Departments: ${deptCreated} created, ${deptSkipped} already existed.\n`);

  // ─────────────────────────────────────────────
  // STEP 2: Assign doctors to correct departments
  // ─────────────────────────────────────────────
  const doctors = await Staff.find({ role: "doctor" });
  console.log(`Found ${doctors.length} doctors. Assigning to departments...`);

  let doctorUpdated = 0;
  let doctorSkipped = 0;
  let doctorNoHospital = 0;

  for (const doc of doctors) {
    const hospId = String(doc.hospital_id);
    const deptMap = hospitalDeptMap[doc.hospital_id];

    if (!deptMap) {
      doctorNoHospital++;
      continue;
    }

    // Determine target department from specialization
    const targetDeptName = mapSpecToDept(doc.specialization);
    const targetDeptId = deptMap[targetDeptName.toLowerCase()];

    if (!targetDeptId) {
      // Department not in map (shouldn't happen), skip
      doctorSkipped++;
      continue;
    }

    // Only update if department assignment has changed
    if (String(doc.department_id) !== String(targetDeptId)) {
      await Staff.updateOne(
        { _id: doc._id },
        {
          department_id: targetDeptId,
          specialization: targetDeptName, // Normalize specialization to department name
        }
      );
      doctorUpdated++;
    } else {
      doctorSkipped++;
    }
  }

  console.log(`Doctors: ${doctorUpdated} updated, ${doctorSkipped} unchanged, ${doctorNoHospital} missing hospital.\n`);

  // ─────────────────────────────────────────────
  // STEP 3: Summary verification
  // ─────────────────────────────────────────────
  const totalDepts = await Department.countDocuments({ status: "active" });
  const breakdown = await Department.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: "$name", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log(`\n=== FINAL DEPARTMENT SUMMARY ===`);
  console.log(`Total active departments across all hospitals: ${totalDepts}`);
  breakdown.forEach((b) => console.log(`  ${b._id}: ${b.count} hospitals`));

  console.log("\n✅ Done! All departments seeded and doctors assigned.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
