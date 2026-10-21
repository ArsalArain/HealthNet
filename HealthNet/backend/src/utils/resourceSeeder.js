const Resource = require("../models/Resource");

const DEPT_RESOURCES_MAP = {
  "cardiology": ["ECG Machine", "Cardiac Monitor", "Defibrillator", "BP Monitor", "Stethoscope"],
  "pulmonology": ["Oxygen Cylinder", "Nebulizer", "Pulse Oximeter", "Spirometer", "Chest X-Ray"],
  "neurology": ["MRI Scanner", "CT Scanner", "Reflex Hammer", "EEG Machine", "Stethoscope"],
  "gastroenterology": ["Endoscope", "Ultrasound Machine", "Suction Device", "IV Fluids", "Stethoscope"],
  "orthopedics": ["X-Ray Machine", "Wheelchair", "Crutches", "Plaster Cast", "Surgical Kit"],
  "dermatology": ["Dermatoscope", "Sterile Gauze", "Antiseptic Solution", "Gloves", "Surgical Mask"],
  "ent (ear, nose, throat)": ["Otoscope", "Laryngoscope", "Endoscope", "Nasal Speculum", "Suction Device"],
  "ent": ["Otoscope", "Laryngoscope", "Endoscope", "Nasal Speculum", "Suction Device"],
  "ophthalmology": ["Ophthalmoscope", "Slit Lamp", "Eye Drops", "Tonometer", "Gloves"],
  "urology": ["Ultrasound Machine", "Catheter Kit", "Cystoscope", "Urine Bags", "Stethoscope"],
  "gynecology / obstetrics": ["Ultrasound Machine", "Fetal Monitor", "Delivery Bed", "Surgical Kit", "Hospital Bed"],
  "gynecology & obstetrics": ["Ultrasound Machine", "Fetal Monitor", "Delivery Bed", "Surgical Kit", "Hospital Bed"],
  "endocrinology": ["Glucometer", "Insulin Pen", "BP Monitor", "Stethoscope", "Gloves"],
  "psychiatry": ["Assessment Tools", "Sedatives", "Hospital Bed", "Gloves", "Stethoscope"],
  "psychiatry / mental health": ["Assessment Tools", "Sedatives", "Hospital Bed", "Gloves", "Stethoscope"],
  "dentistry": ["Dental Chair", "Dental Drill", "Dental X-Ray", "Autoclave", "Surgical Kit"],
  "oncology": ["Chemotherapy Drugs", "Infusion Pump", "Surgical Kit", "Hospital Bed", "IV Line"],
  "hematology": ["Centrifuge", "Blood Bags", "IV Line", "Stethoscope", "Gloves"],
  "infectious disease": ["Isolation Ward", "PPE Kit", "Thermometer", "Gloves", "Surgical Mask"],
  "general surgery": ["Surgical Kit", "Operating Theater", "Anesthesia Machine", "IV Fluids", "Suction Device"],
  "emergency medicine": ["Defibrillator", "Ventilator", "Oxygen Cylinder", "Ambulance", "Stethoscope"],
  "emergency": ["Defibrillator", "Ventilator", "Oxygen Cylinder", "Ambulance", "Stethoscope"],
  "general physician": ["Stethoscope", "Thermometer", "BP Monitor", "Basic Medicines", "Gloves"],
  "general medicine": ["Stethoscope", "Thermometer", "BP Monitor", "Basic Medicines", "Gloves"],
  "rheumatology": ["Joint Support", "Heating Pad", "Stethoscope", "BP Monitor", "Gloves"],
  "pediatrics": ["Nebulizer", "Infant Incubator", "Stethoscope", "Thermometer", "Surgical Mask"],
  "radiology": ["MRI Scanner", "CT Scanner", "X-Ray Machine", "Ultrasound Machine", "Lead Apron"],
  "allergy & immunology": ["Nebulizer", "Spirometer", "Oxygen Cylinder", "Adrenaline Auto-injector", "Stethoscope"]
};

function getResourceType(resourceName) {
  const nameLower = resourceName.toLowerCase();
  if (nameLower.includes("bed")) return "bed";
  if (nameLower.includes("room") || nameLower.includes("ward") || nameLower.includes("theater")) return "room";
  if (
    nameLower.includes("medicine") ||
    nameLower.includes("drugs") ||
    nameLower.includes("sedatives") ||
    nameLower.includes("pen") ||
    nameLower.includes("drops") ||
    nameLower.includes("paracetamol") ||
    nameLower.includes("drip") ||
    nameLower.includes("fluid")
  ) {
    return "medicine";
  }
  return "equipment";
}

async function seedResourcesForDepartment(hospitalId, departmentId, departmentName) {
  try {
    const deptNameNormalized = String(departmentName || "").trim().toLowerCase();
    const resources = DEPT_RESOURCES_MAP[deptNameNormalized] || DEPT_RESOURCES_MAP["general physician"];
    
    const seeded = [];
    for (const resName of resources) {
      // Check if this resource already exists in this hospital department to prevent duplicate seeds
      const existing = await Resource.findOne({
        hospital_id: hospitalId,
        department_id: departmentId,
        name: resName
      });
      
      if (!existing) {
        const totalQty = Math.floor(Math.random() * 45) + 15; // 15 to 60
        const availQty = Math.floor(Math.random() * (totalQty + 1));
        const status = availQty === 0 ? "out_of_stock" : (availQty < 5 ? "low_stock" : "available");
        
        const resObj = await Resource.create({
          name: resName,
          type: getResourceType(resName),
          hospital_id: hospitalId,
          department_id: departmentId,
          quantity: totalQty,
          available_quantity: availQty,
          status: status,
          unit: "units",
          notes: "Automatically seeded based on department requirements"
        });
        seeded.push(resObj);
      }
    }
    return seeded;
  } catch (err) {
    console.error(`Error auto-seeding resources for department ${departmentName}:`, err);
    return [];
  }
}

module.exports = {
  seedResourcesForDepartment,
  DEPT_RESOURCES_MAP,
  getResourceType
};
