const mongoose = require("mongoose");
const path = require("path");
const env = require("../src/config/env");
const Hospital = require("../src/models/Hospital");
const Staff = require("../src/models/Staff");
const XLSX = require("xlsx");

async function exportData() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(env.mongoUri);
    console.log("Database connected successfully!");

    // Fetch all hospitals
    console.log("Fetching hospitals...");
    const hospitals = await Hospital.find({}).lean();
    console.log(`Found ${hospitals.length} hospitals.`);

    // Fetch all doctors
    console.log("Fetching doctors...");
    const doctors = await Staff.find({ role: "doctor" }).populate("hospital_id").lean();
    console.log(`Found ${doctors.length} doctors.`);

    // Prepare Hospital Data
    const hospitalRows = hospitals.map(h => ({
      "Hospital Name": h.name || "",
      "City": h.city || "",
      "Address": h.address || "",
      "License Number": h.license_number || "",
      "Email": h.email || "",
      "Phone": h.phone || "",
      "Contact Number": h.contact_number || "",
      "Description": h.description || "",
      "Latitude": h.geo_location?.lat || "",
      "Longitude": h.geo_location?.lng || "",
      "Status": h.status || "",
      "Is Active": h.is_active ? "Yes" : "No",
      "Created At": h.created_at ? new Date(h.created_at).toLocaleString() : ""
    }));

    // Prepare Doctor Data
    const doctorRows = doctors.map(d => {
      const h = d.hospital_id || {};
      return {
        "Doctor Name": d.name || "",
        "Doctor Email": d.email || "",
        "Doctor Phone": d.phone || "",
        "Doctor ID": d.doctor_id || "",
        "Specialization": d.specialization || "",
        "Shift": d.shift || "",
        "Available Days": Array.isArray(d.available_days) ? d.available_days.join(", ") : "",
        "Max Patients Per Day": d.max_patients_per_day || "",
        "Experience (Years)": d.experience_years || 0,
        "Status": d.status || "",
        "Hospital Name": h.name || "N/A",
        "Hospital City": h.city || "N/A",
        "Hospital License": h.license_number || "N/A",
        "Hospital Email": h.email || "N/A",
        "Hospital Phone": h.phone || "N/A"
      };
    });

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheets
    const wsDoctors = XLSX.utils.json_to_sheet(doctorRows);
    const wsHospitals = XLSX.utils.json_to_sheet(hospitalRows);

    // Append sheets to workbook
    XLSX.utils.book_append_sheet(wb, wsDoctors, "Doctors");
    XLSX.utils.book_append_sheet(wb, wsHospitals, "Hospitals");

    // Define output path
    const outputPath = path.join(__dirname, "../../hospitals_doctors_details.xlsx");
    
    // Write file
    XLSX.writeFile(wb, outputPath);
    console.log(`Excel file successfully written to: ${outputPath}`);

  } catch (error) {
    console.error("Error exporting data:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

exportData();
