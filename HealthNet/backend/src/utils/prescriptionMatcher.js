const keywordMap = {
  "blood pressure": ["Blood pressure cuff", "Pulse oximeter", "Vital signs monitor"],
  "bp": ["Blood pressure cuff", "Pulse oximeter", "Vital signs monitor"],
  "hypertension": ["Blood pressure cuff", "Pulse oximeter", "Vital signs monitor"],
  
  "oxygen": ["Oxygen cylinder", "Oxygen concentrator", "Pulse oximeter"],
  "oximetry": ["Pulse oximeter"],
  "spo2": ["Pulse oximeter"],
  "respiratory": ["Oxygen cylinder", "Oxygen concentrator", "Ventilator"],
  "breathing": ["Oxygen cylinder", "Oxygen concentrator", "Ventilator"],
  
  "ventilator": ["Ventilator", "Oxygen cylinder"],
  "intubation": ["Ventilator", "Oxygen cylinder"],
  "ventilate": ["Ventilator"],
  
  "ecg": ["ECG machine (12-lead)", "Vital signs monitor"],
  "ekg": ["ECG machine (12-lead)", "Vital signs monitor"],
  "electrocardiogram": ["ECG machine (12-lead)", "Vital signs monitor"],
  "chest pain": ["ECG machine (12-lead)", "Vital signs monitor", "Nitroglycerine spray"],
  "heart": ["ECG machine (12-lead)", "Defibrillator / AED"],
  
  "iv": ["Saline IV drip", "IV cannula (set)", "Infusion pump"],
  "intravenous": ["Saline IV drip", "IV cannula (set)", "Infusion pump"],
  "drip": ["Saline IV drip", "IV cannula (set)"],
  "saline": ["Saline IV drip"],
  "cannula": ["IV cannula (set)"],
  
  "paracetamol": ["Paracetamol tablets"],
  "panadol": ["Paracetamol tablets"],
  "acetaminophen": ["Paracetamol tablets"],
  "fever": ["Paracetamol tablets", "Thermometer (digital)"],
  
  "nebulize": ["Nebulizer", "Oxygen cylinder"],
  "nebulizer": ["Nebulizer"],
  "asthma": ["Nebulizer", "Salbutamol inhaler"],
  
  "x-ray": ["X-ray viewer"],
  "xray": ["X-ray viewer"],
  "fracture": ["Orthopedic cast material", "Crutches (pair)", "X-ray viewer"],
  "bone": ["Orthopedic cast material", "Crutches (pair)", "X-ray viewer"],
  
  "cast": ["Orthopedic cast material"],
  "plaster": ["Orthopedic cast material"],
  
  "crutch": ["Crutches (pair)"],
  "crutches": ["Crutches (pair)"],
  "wheelchair": ["Wheelchair"],
  
  "mask": ["Surgical mask (N95)", "Surgical mask"],
  "n95": ["Surgical mask (N95)"],
  "gloves": ["Gloves (box)", "Sterile gloves (box)"],
  
  "cotton": ["Cotton swabs (pack)"],
  "swab": ["Cotton swabs (pack)"],
  
  "bandage": ["Bandage roll", "Wound dressing pack"],
  "dressing": ["Wound dressing pack", "Bandage roll"],
  "wound": ["Wound dressing pack", "Bandage roll", "Antiseptic solution"],
  
  "antiseptic": ["Antiseptic solution"],
  "pyodine": ["Antiseptic solution"],
  "spirit": ["Antiseptic solution"],
  
  "spirometer": ["Spirometer"],
  "defibrillator": ["Defibrillator / AED"],
  "aed": ["Defibrillator / AED"],
  
  "salbutamol": ["Salbutamol inhaler"],
  "ventolin": ["Salbutamol inhaler"],
  
  "corticosteroid": ["Corticosteroid injection"],
  "eeg": ["EEG machine"],
  "mri": ["MRI request form"],
  "ct scan": ["CT scan request form"],
  "ctscan": ["CT scan request form"],
  
  "reflex": ["Reflex hammer"],
  "ophthalmoscope": ["Ophthalmoscope"],
  
  "eye": ["Ophthalmoscope", "Slit lamp", "Snellen chart", "Eye drops"],
  "otoscopy": ["Otoscope"],
  "otoscope": ["Otoscope"],
  "thermometer": ["Thermometer (digital)"],
  "stethoscope": ["Stethoscope"],
  "prescription": ["Prescription pad"],
  "tongue": ["Tongue depressor"],
};

/**
 * Extracts list of matching resources based on medicines & instructions text
 * @param {Array<string>} medicines 
 * @param {string} instructions 
 * @param {Array<Object>} dbResources (resources from MongoDB for the doctor's department)
 * @returns {Array<Object>} list of matched resources { resource_id, name, quantity_requested }
 */
function extractResourcesFromPrescription(medicines = [], instructions = "", dbResources = []) {
  const normalizedMedicines = medicines.map(m => String(m || "").trim().toLowerCase()).join(" ");
  const normalizedInstructions = String(instructions || "").trim().toLowerCase();
  const text = `${normalizedMedicines} ${normalizedInstructions}`;

  const matchedResourceNames = new Set();

  for (const [keyword, resourceNames] of Object.entries(keywordMap)) {
    if (text.includes(keyword)) {
      resourceNames.forEach(name => matchedResourceNames.add(name.toLowerCase()));
    }
  }

  const matches = [];

  for (const resource of dbResources) {
    const resNameLower = String(resource.name || "").toLowerCase();
    
    // Check if the resource name matches directly or contains any matched keyword name
    let isMatch = false;
    for (const matchedName of matchedResourceNames) {
      if (resNameLower.includes(matchedName) || matchedName.includes(resNameLower)) {
        isMatch = true;
        break;
      }
    }

    if (isMatch) {
      matches.push({
        resource_id: resource._id,
        name: resource.name,
        quantity_requested: 1 // Default to 1 unit per prescription use
      });
    }
  }

  return matches;
}

module.exports = {
  extractResourcesFromPrescription
};
