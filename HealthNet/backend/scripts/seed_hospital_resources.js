/**
 * seed_hospital_resources.js
 *
 * Seeds resources for ALL active approved hospitals' departments in the database.
 * Run: node scripts/seed_hospital_resources.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Hospital = require("../src/models/Hospital");
const Department = require("../src/models/Department");
const { seedResourcesForDepartment } = require("../src/utils/resourceSeeder");

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/healthnet";
  console.log("Connecting to MongoDB at:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("Connected successfully.\n");

  const hospitals = await Hospital.find({ status: "approved", is_active: true });
  console.log(`Found ${hospitals.length} approved active hospitals.`);

  let totalSeeded = 0;

  for (const hospital of hospitals) {
    const depts = await Department.find({ hospital_id: hospital._id, status: "active" });
    console.log(`\nHospital: "${hospital.name}" (${hospital.city}) - Found ${depts.length} departments.`);

    for (const dept of depts) {
      const seeded = await seedResourcesForDepartment(hospital._id, dept._id, dept.name);
      if (seeded.length > 0) {
        console.log(`  - Seeded ${seeded.length} resources for department: "${dept.name}"`);
        totalSeeded += seeded.length;
      } else {
        console.log(`  - Department "${dept.name}" already has resources. Skipped.`);
      }
    }
  }

  console.log(`\n✅ Done! Seeded a total of ${totalSeeded} new resources across all hospitals.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
