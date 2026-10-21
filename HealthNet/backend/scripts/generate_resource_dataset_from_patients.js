/**
 * Generate realistic hospital resources based on actual patient data
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Counts active patients per hospital and department
 * 3. Calculates ideal resource distributions based on patient census
 * 4. Generates time-series resource availability data (60 days)
 * 5. Exports to CSV with department assignments
 * 
 * Usage:
 *   node scripts/generate_resource_dataset_from_patients.js --days 60 --seed 42
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { createWriteStream } = require("fs");
const csv = require("csv-writer").createObjectCsvWriter;
const { DateTime } = require("luxon");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Hospital = require("../src/models/Hospital");
const Department = require("../src/models/Department");
const Patient = require("../src/models/Patient");

// Resource definitions with patient-to-resource ratios
const RESOURCE_CONFIG = {
  "Beds": { 
    ratio: 0.95, // 1 bed per 0.95 active patients
    departments: ["Hospital Shared Pool", "Emergency", "OPD", "Pediatrics"],
    priorityFor: ["Hospital Shared Pool", "Emergency"]
  },
    ratio: 0.03, // 1 per ~33 patients (severe respiratory)
  const mongoose = require("mongoose");
  const fs = require("fs");
  const path = require("path");
    departments: ["ICU", "Emergency"],
    priorityFor: ["Emergency"]
  },
  "Oxygen Cylinders": {
    ratio: 0.4, // 1 per 2.5 patients
    departments: ["Hospital Shared Pool", "Emergency", "OPD"],
    priorityFor: ["Emergency", "OPD"]
  },
  "ECG Machine": {
    ratio: 0.05, // 1 per 20 patients
    departments: ["Emergency", "OPD", "Pediatrics"],
    priorityFor: ["Emergency"]
  },
  "Incubators": {
    ratio: 0.02, // 1 per 50 patients (pediatric only)
    departments: ["Pediatrics"],
    priorityFor: ["Pediatrics"]
  },
  "MRI": {
    ratio: 0.002, // 1 per 500 patients (shared diagnostic)
    departments: ["Hospital Shared Pool"],
    priorityFor: ["Hospital Shared Pool"]
  },
  "CT Scan": {
    ratio: 0.002, // 1 per 500 patients (shared diagnostic)
    departments: ["Hospital Shared Pool"],
    priorityFor: ["Hospital Shared Pool"]
  },
  "X-Ray Machine": {
    ratio: 0.01, // 1 per 100 patients
    departments: ["Hospital Shared Pool", "Emergency", "OPD"],
    priorityFor: ["Emergency"]
  },
  "Dialysis Machine": {
    ratio: 0.002, // 1 per 500 patients
    departments: ["Hospital Shared Pool"],
    priorityFor: ["Hospital Shared Pool"]
  },
  "Ultrasound": {
    ratio: 0.008, // 1 per 125 patients
    departments: ["Hospital Shared Pool", "OPD"],
    priorityFor: ["OPD"]
  },
  "Chemotherapy Equipment": {
    ratio: 0.001, // 1 per 1000 patients
    departments: ["Hospital Shared Pool"],
    priorityFor: ["Hospital Shared Pool"]
  },
  "Brain Scanner": {
    ratio: 0.0005, // 1 per 2000 patients
    departments: ["Hospital Shared Pool"],
    priorityFor: ["Hospital Shared Pool"]
  },
  "Surgical Tools": {
    ratio: 0.15, // 1 set per ~6.5 patients
    departments: ["Hospital Shared Pool", "Emergency"],
    priorityFor: ["Emergency"]
  },
  "Skin Equipment": {
    ratio: 0.08, // 1 per ~12 patients
    departments: ["OPD", "Pediatrics"],
    priorityFor: ["OPD"]
  },
  "ENT Equipment": {
    ratio: 0.06, // 1 per ~16 patients
    departments: ["OPD", "Pediatrics"],
    priorityFor: ["OPD"]
  },
  "Basic Equipment": {
    ratio: 0.3, // 1 set per ~3 patients
    departments: ["Hospital Shared Pool", "Emergency", "OPD", "Pediatrics"],
    priorityFor: ["Emergency", "OPD"]
  },
};

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStatus(total, available, forceMaintenance = false) {
  if (forceMaintenance) return "Maintenance";
  if (available <= 0) return "Out of Stock";
  
  const percent = (available / total) * 100;
  if (percent < 20) return "Critical";
  if (percent < 50) return "Low Stock";
  if (percent < 80) return "Moderate";
  return "Available";
}

async function generateDataset(options = {}) {
  const startDate = options.startDate || "2026-01-01";
  const days = options.days || 60;
  const seed = options.seed || 42;
  const output = options.output || "storage/resource_dataset_patient_driven.csv";

  // Seed random for reproducibility
  Math.seedrandom = function(seed) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  };
  const random = Math.seedrandom(seed);

  console.log("🏥 Connecting to MongoDB...");
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }

  try {
    console.log("📊 Querying hospital and patient data...");
    
    // Get all hospitals
    const hospitals = await Hospital.find().lean();
    console.log(`   Found ${hospitals.length} hospitals`);

    // Get all departments
    const departments = await Department.find().lean();
    console.log(`   Found ${departments.length} departments`);

    // Count active patients per hospital and department
    const patientStats = await Patient.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: {
            hospital_id: "$hospital_id",
            department_id: "$department_id"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`   Found ${patientStats.length} patient distributions`);

    // Build stats map
    const statsByHospitalDept = {};
    const statsByHospital = {};
    
    patientStats.forEach(stat => {
      const hospKey = stat._id.hospital_id.toString();
      const deptKey = stat._id.department_id ? stat._id.department_id.toString() : "null";
      const key = `${hospKey}|${deptKey}`;
      
      statsByHospitalDept[key] = stat.count;
      statsByHospital[hospKey] = (statsByHospital[hospKey] || 0) + stat.count;
    });

    console.log("\n📈 Patient Census by Hospital:");
    Object.entries(statsByHospital).forEach(([hospId, count]) => {
      const hosp = hospitals.find(h => h._id.toString() === hospId);
      console.log(`   ${hosp?.name || hospId}: ${count} active patients`);
    });

    // Generate CSV
    const csvPath = path.join(__dirname, "..", output);
    fs.mkdirSync(path.dirname(csvPath), { recursive: true });

    const csvPath = path.join(__dirname, "..", output);
    fs.mkdirSync(path.dirname(csvPath), { recursive: true });

    console.log(`\n💾 Generating CSV to: ${csvPath}`);
    
    const records = [];
    let totalRows = 0;
    
    // Parse start date
    const [year, month, day] = startDate.split('-').map(Number);
    const startDateObj = new Date(year, month - 1, day);

    for (const hospital of hospitals) {
      const hospId = hospital._id.toString();
      const totalPatients = statsByHospital[hospId] || 5; // Default if unknown
      
      console.log(`\n🏥 Generating resources for ${hospital.name} (${totalPatients} patients)`);

      // Initialize resource stock per department
      const resourceStock = {};

      for (const resourceName in RESOURCE_CONFIG) {
        const config = RESOURCE_CONFIG[resourceName];
        resourceStock[resourceName] = {};

        // Distribute resources to departments based on patient count and priority
        for (const dept of config.departments) {
          let deptKey = null;
          let deptPatients = 0;

          if (dept === "Hospital Shared Pool") {
            deptKey = "null";
            // Shared pool serves all patients
            deptPatients = totalPatients;
          } else {
            const deptDoc = departments.find(d => d.name === dept && d.hospital_id.toString() === hospId);
            if (deptDoc) {
              deptKey = deptDoc._id.toString();
              deptPatients = statsByHospitalDept[`${hospId}|${deptKey}`] || 1;
            }
          }

          if (!deptKey) continue;

          // Calculate total capacity based on patient ratio
          let total = Math.max(
            1,
            Math.ceil(deptPatients * config.ratio)
          );

          // Add priority multiplier if this is a priority department
          if (config.priorityFor.includes(dept)) {
            total = Math.ceil(total * 1.2); // 20% extra for priority depts
          }

          resourceStock[resourceName][deptKey] = {
            total,
            available: Math.floor(total * (0.6 + random() * 0.3)), // 60-90% available
            deptName: dept,
            patients: deptPatients
          };
        }
      }

      // Generate time series (days)
      for (let d = 0; d < days; d++) {
        const currentDate = new Date(startDateObj);
        currentDate.setDate(currentDate.getDate() + d);
        const dateStr = formatDate(currentDate);

        for (const resourceName in resourceStock) {
          for (const deptKey in resourceStock[resourceName]) {
            const state = resourceStock[resourceName][deptKey];
            const total = state.total;
            let available = state.available;

            // Daily fluctuation ±10%
            const change = Math.floor((random() - 0.5) * total * 0.2);
            available = Math.max(0, Math.min(total, available + change));

            // 5% chance of maintenance
            const isMaintenance = random() < 0.05;
            const status = getStatus(total, available, isMaintenance);

            const used = total - available;
            const utilizationRate = total > 0 ? ((used / total) * 100).toFixed(2) : 0;

            records.push({
              hospital_id: hospital.code || `H${String(Math.abs(hospital._id.getTimestamp().getTime()) % 1000).padStart(3, '0')}`,
              date: dateStr,
              department: state.deptName,
              resource_type: resourceName,
              total: total.toString(),
              available: available.toString(),
              used: used.toString(),
              status,
              patients_count: state.patients.toString(),
              utilization_rate: utilizationRate
            });

            // Update state for next day
            state.available = available;
            totalRows++;
          }
        }
      }
    }

    // Write CSV header
    const header = "hospital_id,date,department,resource_type,total,available,used,status,patients_count,utilization_rate";
    let csvContent = header + "\n";
    
    // Write records
    records.forEach(record => {
      const row = [
        record.hospital_id,
        record.date,
        record.department,
        record.resource_type,
        record.total,
        record.available,
        record.used,
        record.status,
        record.patients_count,
        record.utilization_rate
      ].map(v => `"${v}"`).join(",");
      csvContent += row + "\n";
    });
    
    fs.writeFileSync(csvPath, csvContent, "utf-8");

    console.log(`\n✅ Success! Generated ${totalRows} rows`);
    console.log(`📂 Output: ${csvPath}`);
    console.log(`   - Days simulated: ${days}`);
    console.log(`   - Hospitals: ${hospitals.length}`);
    console.log(`   - Resources per hospital: ${Object.keys(RESOURCE_CONFIG).length}`);
    console.log(`   - Links to ${Object.fromEntries(patientStats.map(s => [s._id.hospital_id, 'patients'])).length} active patient records`);

  } catch (error) {
    console.error("❌ Error generating dataset:", error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    const value = args[i + 1];

    if (key === "start-date") options.startDate = value;
    if (key === "days") options.days = parseInt(value);
    if (key === "seed") options.seed = parseInt(value);
    if (key === "output") options.output = value;
  }

  return options;
}

// Main
if (require.main === module) {
  const options = parseArgs();
  generateDataset(options)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { generateDataset };
