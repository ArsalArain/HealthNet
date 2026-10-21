/**
 * assign_doctor_fees.js
 *
 * One-time script to assign deterministic consultation_fee (PKR 200–2000)
 * to all doctors in the database based on their department tier and experience.
 *
 * Run: node scripts/assign_doctor_fees.js
 *
 * Fee Tiers:
 *  Premium (Cardiology, Oncology, Neurology, Nephrology, Radiology):
 *    5+ yrs → PKR 1500–2000 | <5 yrs → PKR 1000–1499
 *  Mid (Orthopedics, Gastroenterology, Gynecology, Urology, Pulmonology, Psychiatry, Ophthalmology, Dermatology):
 *    5+ yrs → PKR 800–1200  | <5 yrs → PKR 600–900
 *  General (General Medicine, Pediatrics, ENT, Emergency, Dentistry):
 *    5+ yrs → PKR 400–700   | <5 yrs → PKR 200–500
 */

require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const env = require("../src/config/env");
const Staff = require("../src/models/Staff");
const Department = require("../src/models/Department");

// ── Department Tier Configuration ──────────────────────────────────────────
const PREMIUM_DEPTS = new Set([
  "Cardiology", "Oncology", "Neurology", "Nephrology", "Radiology",
]);

const MID_DEPTS = new Set([
  "Orthopedics", "Gastroenterology", "Gynecology & Obstetrics",
  "Urology", "Pulmonology", "Psychiatry", "Ophthalmology", "Dermatology",
]);

const FEE_RANGES = {
  premium:  { experienced: [1500, 2000], junior: [1000, 1499] },
  mid:      { experienced: [800,  1200], junior: [600,  900]  },
  general:  { experienced: [400,  700],  junior: [200,  500]  },
};

// ── Deterministic hash from doctor name (no randomness, reproducible) ──────
function deterministicFee(name, min, max) {
  const str = String(name || "doctor");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0; // unsigned 32-bit
  }
  return min + (hash % (max - min + 1));
}

function calculateFee(doctorName, departmentName, experienceYears) {
  const tier = PREMIUM_DEPTS.has(departmentName) ? "premium"
    : MID_DEPTS.has(departmentName) ? "mid"
    : "general";

  const isExperienced = Number(experienceYears || 0) >= 5;
  const [min, max] = FEE_RANGES[tier][isExperienced ? "experienced" : "junior"];
  return deterministicFee(doctorName, min, max);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("Connecting to database...");
  await mongoose.connect(env.mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);

  // Fetch all doctors with their department populated
  const doctors = await Staff.find({ role: "doctor" }).populate("department_id", "name").lean();
  console.log(`Found ${doctors.length} doctors.`);

  let updated = 0;
  let skipped = 0;

  const bulkOps = [];

  for (const doctor of doctors) {
    const departmentName = doctor.department_id?.name || "General Medicine";
    const fee = calculateFee(doctor.name, departmentName, doctor.experience_years || 0);

    bulkOps.push({
      updateOne: {
        filter: { _id: doctor._id },
        update: { $set: { consultation_fee: fee } },
      },
    });
  }

  if (bulkOps.length > 0) {
    const result = await Staff.bulkWrite(bulkOps, { ordered: false });
    updated = result.modifiedCount;
    skipped = doctors.length - updated;
  }

  console.log(`\n✅ Done!`);
  console.log(`   Updated: ${updated} doctors`);
  console.log(`   Skipped: ${skipped} (already had correct fee)`);
  console.log(`\nSample fees assigned:`);

  // Print sample for verification
  const samples = await Staff.find({ role: "doctor" }, { name: 1, consultation_fee: 1, specialization: 1 })
    .populate("department_id", "name")
    .limit(10)
    .lean();

  for (const s of samples) {
    console.log(`  ${s.name} (${s.department_id?.name || "N/A"}) — PKR ${s.consultation_fee}`);
  }

  await mongoose.connection.close();
  console.log("\nDatabase connection closed.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  mongoose.connection.close();
  process.exit(1);
});
