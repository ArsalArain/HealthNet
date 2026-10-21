/**
 * diseaseResourcesComplete.js
 * Auto-generated from generate_disease_resources.py
 * Covers all 773 diseases from the HealthNet CSV dataset.
 *
 * Usage:
 *   const { getResourceInfo, getAllDiseases } = require('./diseaseResourcesComplete');
 *   const info = getResourceInfo('dengue fever');
 *   // => { disease: 'dengue fever', department: 'Infectious Disease', resources: [...] }
 */

"use strict";

const DISEASE_RESOURCE_DATA = [
  {
    "disease": "abdominal aortic aneurysm",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "abdominal hernia",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device",
      "Ultrasound Machine",
      "IV Fluids",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "abscess of nose",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "abscess of the lung",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line"
    ]
  },
  {
    "disease": "abscess of the pharynx",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "acanthosis nigricans",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "Glucometer",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "acariasis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "achalasia",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Oxygen Cylinder",
      "Pulse Oximeter",
      "Cardiac Monitor"
    ]
  },
  {
    "disease": "acne",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "actinic keratosis",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "acute bronchiolitis",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "acute bronchitis",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "acute bronchospasm",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "acute fatty liver of pregnancy (aflp)",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "acute glaucoma",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "acute kidney injury",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Diuretics",
      "Compression Bandage",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "acute otitis media",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "acute pancreatitis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit",
      "Blood Transfusion Kit",
      "Bronchoscope",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "acute respiratory distress syndrome (ards)",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "Cooling Blanket",
      "IV Fluids",
      "Warming Blanket"
    ]
  },
  {
    "disease": "acute sinusitis",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "acute stress reaction",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "adhesive capsulitis of the shoulder",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "adjustment reaction",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "adrenal adenoma",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "adrenal cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit"
    ]
  },
  {
    "disease": "alcohol abuse",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "IV Fluids",
      "Blood Transfusion Kit",
      "Endoscope"
    ]
  },
  {
    "disease": "alcohol intoxication",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "alcohol withdrawal",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Anti-seizure Drugs",
      "IV Line",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "alcoholic liver disease",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "ORS",
      "Stool Analysis Kit",
      "Diuretics",
      "Compression Bandage",
      "Glucometer",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "allergy",
    "department": "Allergy & Immunology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Epinephrine Auto-Injector",
      "IV Line",
      "Pulse Oximeter",
      "Stethoscope",
      "BP Monitor",
      "Allergy Test Kit",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "allergy to animals",
    "department": "Allergy & Immunology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Epinephrine Auto-Injector",
      "IV Line",
      "Pulse Oximeter",
      "Stethoscope",
      "BP Monitor",
      "Allergy Test Kit"
    ]
  },
  {
    "disease": "alopecia",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "alzheimer disease",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "amblyopia",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "amyloidosis",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "amyotrophic lateral sclerosis (als)",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "anal fissure",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "Blood Transfusion Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "anal fistula",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "Blood Transfusion Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "anemia",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "IV Fluids",
      "Blood Transfusion Kit",
      "Endoscope",
      "Nasal Packing Kit",
      "Suction Device",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "anemia due to chronic kidney disease",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage",
      "Nutritional Supplement Kit",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "anemia due to malignancy",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "anemia of chronic disease",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit"
    ]
  },
  {
    "disease": "angina",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor"
    ]
  },
  {
    "disease": "ankylosing spondylitis",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment",
      "Neurological Assessment Kit",
      "MRI Scanner"
    ]
  },
  {
    "disease": "anxiety",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Holter Monitor",
      "Defibrillator"
    ]
  },
  {
    "disease": "aortic valve disease",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "IV Fluids",
      "Diuretics",
      "Compression Bandage"
    ]
  },
  {
    "disease": "aphakia",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "aphthous ulcer",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "aplastic anemia",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Speech Therapy Kit",
      "MRI Scanner",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "appendicitis",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "ORS",
      "Stool Analysis Kit",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "arrhythmia",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "IV Fluids",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "arthritis of the hip",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "ascending cholangitis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Cooling Blanket",
      "IV Fluids",
      "Liver Function Test Kit",
      "Catheter",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "asperger syndrome",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "IV Fluids",
      "ECG Machine",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "aspergillosis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Oxygen Cylinder",
      "Nebulizer"
    ]
  },
  {
    "disease": "asthma",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "astigmatism",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "atelectasis",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor"
    ]
  },
  {
    "disease": "athlete's foot",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "atonic bladder",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "atrial fibrillation",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "atrial flutter",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "Biopsy Kit",
      "Blood Culture Kit"
    ]
  },
  {
    "disease": "atrophic skin condition",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "atrophic vaginitis",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "Catheter"
    ]
  },
  {
    "disease": "atrophy of the corpus cavernosum",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "attention deficit hyperactivity disorder (adhd)",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "autism",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "IV Line",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "autonomic nervous system disorder",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "avascular necrosis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "balanitis",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Urine Analysis Kit",
      "Catheter",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "bell palsy",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "benign kidney cyst",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Urine Analysis Kit",
      "Cystoscope"
    ]
  },
  {
    "disease": "benign paroxysmal positional vertical (bppv)",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "benign prostatic hyperplasia (bph)",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids",
      "Dialysis Machine"
    ]
  },
  {
    "disease": "benign vaginal discharge (leukorrhea)",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Urine Analysis Kit",
      "Catheter"
    ]
  },
  {
    "disease": "bipolar disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "birth trauma",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale"
    ]
  },
  {
    "disease": "bladder cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "Catheter"
    ]
  },
  {
    "disease": "bladder disorder",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "bladder obstruction",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "blepharitis",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "blepharospasm",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "bone cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "bone disorder",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "bone spur of the calcaneous",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "brachial neuritis",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "X-Ray Machine",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "brain cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "Padded Bed Rails",
      "Physiotherapy Equipment",
      "MRI Scanner",
      "Speech Therapy Kit"
    ]
  },
  {
    "disease": "breast cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit"
    ]
  },
  {
    "disease": "breast cyst",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "breast infection (mastitis)",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Cooling Blanket",
      "IV Fluids",
      "Warming Blanket"
    ]
  },
  {
    "disease": "broken tooth",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe",
      "Dental Emergency Kit"
    ]
  },
  {
    "disease": "bunion",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "burn",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher"
    ]
  },
  {
    "disease": "bursitis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "callus",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "carbon monoxide poisoning",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "carcinoid syndrome",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "cardiac arrest",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor"
    ]
  },
  {
    "disease": "cardiomyopathy",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "carpal tunnel syndrome",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Neurological Assessment Kit"
    ]
  },
  {
    "disease": "cat scratch disease",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "cataract",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "celiac disease",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Diuretics",
      "Compression Bandage"
    ]
  },
  {
    "disease": "cellulitis or abscess of mouth",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe"
    ]
  },
  {
    "disease": "central atherosclerosis",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "central retinal artery or vein occlusion",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator"
    ]
  },
  {
    "disease": "cerebral edema",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "cerebral palsy",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "IV Line",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "cervical cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Liver Function Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "cervical disorder",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "cervicitis",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Urine Analysis Kit",
      "Catheter"
    ]
  },
  {
    "disease": "chalazion",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "chickenpox",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "Cooling Blanket",
      "IV Fluids",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "chlamydia",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "cholecystitis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "choledocholithiasis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Warming Blanket",
      "Liver Function Test Kit"
    ]
  },
  {
    "disease": "cholesteatoma",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "chondromalacia of the patella",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "chorioretinitis",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "chronic back pain",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "chronic constipation",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Blood Transfusion Kit",
      "Endoscope",
      "Catheter",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "chronic glaucoma",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "chronic inflammatory demyelinating polyneuropathy (cidp)",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "chronic kidney disease",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "chronic knee pain",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "chronic obstructive pulmonary disease (copd)",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor"
    ]
  },
  {
    "disease": "chronic otitis media",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "chronic pain disorder",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "chronic pancreatitis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "chronic rheumatic fever",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Holter Monitor"
    ]
  },
  {
    "disease": "chronic sinusitis",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "chronic ulcer",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "cirrhosis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "IV Fluids",
      "Blood Transfusion Kit",
      "Diuretics",
      "Compression Bandage"
    ]
  },
  {
    "disease": "coagulation (bleeding) disorder",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Blood Transfusion Kit",
      "IV Fluids",
      "Endoscope",
      "Urine Analysis Kit",
      "Cystoscope"
    ]
  },
  {
    "disease": "cold sore",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "colonic polyp",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "ORS",
      "Stool Analysis Kit",
      "Blood Transfusion Kit"
    ]
  },
  {
    "disease": "colorectal cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Blood Transfusion Kit",
      "Endoscope",
      "IV Fluids"
    ]
  },
  {
    "disease": "common cold",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Cooling Blanket",
      "Warming Blanket"
    ]
  },
  {
    "disease": "complex regional pain syndrome",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Neurological Assessment Kit",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "concussion",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "X-Ray Machine",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "conduct disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "IV Line",
      "Padded Bed Rails",
      "IV Fluids",
      "ECG Machine"
    ]
  },
  {
    "disease": "conductive hearing loss",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "congenital heart defect",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "congenital malformation syndrome",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "IV Line",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "conjunctivitis",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "conjunctivitis due to allergy",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "conjunctivitis due to bacteria",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "conjunctivitis due to virus",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "connective tissue disorder",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "X-Ray Machine",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "contact dermatitis",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "conversion disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "IV Line",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "cornea infection",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "corneal abrasion",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "corneal disorder",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "coronary atherosclerosis",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "cranial nerve palsy",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "crohn disease",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit",
      "Blood Transfusion Kit"
    ]
  },
  {
    "disease": "croup",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "crushing injury",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher"
    ]
  },
  {
    "disease": "cryptococcosis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "cryptorchidism",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale"
    ]
  },
  {
    "disease": "cushing syndrome",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "cyst of the eyelid",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "cystic fibrosis",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line"
    ]
  },
  {
    "disease": "cysticercosis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Anti-seizure Drugs",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "cystitis",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "Catheter",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "de quervain disease",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "decubitus ulcer",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "deep vein thrombosis (dvt)",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "degenerative disc disease",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Neurological Assessment Kit",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "delirium",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner",
      "Speech Therapy Kit"
    ]
  },
  {
    "disease": "dementia",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "dengue fever",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "dental caries",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "depression",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "dermatitis due to sun exposure",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "developmental disability",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "IV Line",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "deviated nasal septum",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Ventilator",
      "Nasal Packing Kit"
    ]
  },
  {
    "disease": "diabetes",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "diabetes insipidus",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "diabetic ketoacidosis",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "diabetic kidney disease",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "Blood Transfusion Kit",
      "Endoscope",
      "IV Fluids"
    ]
  },
  {
    "disease": "diabetic peripheral neuropathy",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "diabetic retinopathy",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "diaper rash",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "ORS",
      "Stool Analysis Kit",
      "Blood Transfusion Kit",
      "Endoscope",
      "Cooling Blanket",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "dislocation of the ankle",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "dislocation of the elbow",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "dislocation of the finger",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "dislocation of the foot",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "dislocation of the hip",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "dislocation of the knee",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "dislocation of the patella",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "dislocation of the shoulder",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "dislocation of the vertebra",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "dislocation of the wrist",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "dissociative disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "diverticulitis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit",
      "Blood Transfusion Kit",
      "Warming Blanket"
    ]
  },
  {
    "disease": "diverticulosis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit",
      "Blood Transfusion Kit"
    ]
  },
  {
    "disease": "down syndrome",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "IV Line",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "drug abuse",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "drug abuse (barbiturates)",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "drug abuse (cocaine)",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "drug abuse (methamphetamine)",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Holter Monitor"
    ]
  },
  {
    "disease": "drug abuse (opioids)",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "drug poisoning due to medication",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "Speech Therapy Kit",
      "MRI Scanner",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "drug reaction",
    "department": "Allergy & Immunology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Epinephrine Auto-Injector",
      "IV Line",
      "Pulse Oximeter",
      "Stethoscope",
      "BP Monitor",
      "Allergy Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Diuretics",
      "Compression Bandage",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "drug withdrawal",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Warming Blanket",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "dry eye of unknown cause",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "dumping syndrome",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "dyshidrosis",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "dysthymic disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Speech Therapy Kit",
      "MRI Scanner"
    ]
  },
  {
    "disease": "ear drum damage",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "ear wax impaction",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "eating disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Glucometer",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "ectopic pregnancy",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "ectropion",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "eczema",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "edward syndrome",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale"
    ]
  },
  {
    "disease": "emphysema",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor"
    ]
  },
  {
    "disease": "empyema",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor"
    ]
  },
  {
    "disease": "encephalitis",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "endocarditis",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor"
    ]
  },
  {
    "disease": "endometrial cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit"
    ]
  },
  {
    "disease": "endometrial hyperplasia",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "endometriosis",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "endophthalmitis",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope",
      "Urine Analysis Kit",
      "Catheter"
    ]
  },
  {
    "disease": "envenomation from spider or animal bite",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "Neurological Assessment Kit"
    ]
  },
  {
    "disease": "ependymoma",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "epididymitis",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Urine Analysis Kit",
      "Catheter"
    ]
  },
  {
    "disease": "epidural hemorrhage",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "epilepsy",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "erectile dysfunction",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "Catheter"
    ]
  },
  {
    "disease": "erythema multiforme",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "esophageal cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Oxygen Cylinder",
      "Nebulizer"
    ]
  },
  {
    "disease": "esophageal varices",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "esophagitis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "essential tremor",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "eustachian tube dysfunction (ear disorder)",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "extrapyramidal effect of drugs",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "Padded Bed Rails",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "eye alignment disorder",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "factitious disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "female genitalia infection",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "female infertility of unknown cause",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "fetal alcohol syndrome",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "fibroadenoma",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "fibrocystic breast disease",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "fibromyalgia",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "MRI Scanner"
    ]
  },
  {
    "disease": "flat feet",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "floaters",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "flu",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "ORS",
      "Stool Analysis Kit",
      "Warming Blanket"
    ]
  },
  {
    "disease": "fluid overload",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Diuretics",
      "Compression Bandage"
    ]
  },
  {
    "disease": "folate deficiency",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Oxygen Cylinder",
      "Nebulizer",
      "ECG Machine",
      "Cardiac Monitor",
      "IV Fluids",
      "Blood Transfusion Kit",
      "Endoscope"
    ]
  },
  {
    "disease": "food allergy",
    "department": "Allergy & Immunology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Epinephrine Auto-Injector",
      "IV Line",
      "Pulse Oximeter",
      "Stethoscope",
      "BP Monitor",
      "Allergy Test Kit",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "foreign body in the ear",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "foreign body in the eye",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "foreign body in the gastrointestinal tract",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Blood Transfusion Kit",
      "Nutritional Supplement Kit"
    ]
  },
  {
    "disease": "foreign body in the nose",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "foreign body in the throat",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "foreign body in the vagina",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Urine Analysis Kit",
      "Catheter"
    ]
  },
  {
    "disease": "fracture of the ankle",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "fracture of the arm",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "fracture of the facial bones",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "fracture of the finger",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "fracture of the foot",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "fracture of the hand",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "fracture of the jaw",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "fracture of the leg",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "fracture of the neck",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "fracture of the patella",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "fracture of the pelvis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "fracture of the rib",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "fracture of the shoulder",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "fracture of the skull",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "fracture of the vertebra",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "friedrich ataxia",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "frostbite",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "ECG Machine"
    ]
  },
  {
    "disease": "fungal infection of the hair",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "fungal infection of the skin",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "g6pd enzyme deficiency",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit"
    ]
  },
  {
    "disease": "galactorrhea of unknown cause",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "gallstone",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "ganglion cyst",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "gas gangrene",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device"
    ]
  },
  {
    "disease": "gastritis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Blood Transfusion Kit",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "gastroduodenal ulcer",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Blood Transfusion Kit"
    ]
  },
  {
    "disease": "gastroesophageal reflux disease (gerd)",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Oxygen Cylinder",
      "Pulse Oximeter",
      "Cardiac Monitor",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "gastrointestinal hemorrhage",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Blood Transfusion Kit",
      "ORS",
      "Stool Analysis Kit",
      "ECG Machine",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "gastroparesis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "genital herpes",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Urine Analysis Kit",
      "Catheter",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "gestational diabetes",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "glaucoma",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "glucocorticoid deficiency",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "IV Fluids",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "goiter",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "gonorrhea",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "gout",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "granuloma inguinale",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "graves disease",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "ECG Machine",
      "Cardiac Monitor",
      "Holter Monitor",
      "Defibrillator",
      "Blood Transfusion Kit",
      "Bronchoscope",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "guillain barre syndrome",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "gum disease",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe",
      "Dental Emergency Kit",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "gynecomastia",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "hammer toe",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "hashimoto thyroiditis",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "head and neck cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Blood Transfusion Kit",
      "Bronchoscope",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "head injury",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "ECG Machine",
      "Oxygen Cylinder",
      "X-Ray Machine",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "headache after lumbar puncture",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Urine Analysis Kit",
      "Catheter"
    ]
  },
  {
    "disease": "heart attack",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "heart block",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "IV Fluids",
      "Diuretics",
      "Compression Bandage",
      "Glucometer",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "heart contusion",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "heart failure",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "Glucometer",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "heat exhaustion",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "Nebulizer",
      "ECG Machine",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "heat stroke",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher"
    ]
  },
  {
    "disease": "hemangioma",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "hemarthrosis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "hematoma",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device"
    ]
  },
  {
    "disease": "hemiplegia",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "Padded Bed Rails",
      "Speech Therapy Kit"
    ]
  },
  {
    "disease": "hemochromatosis",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit"
    ]
  },
  {
    "disease": "hemolytic anemia",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "hemophilia",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Dental Emergency Kit"
    ]
  },
  {
    "disease": "hemorrhoids",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "Blood Transfusion Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "hepatic encephalopathy",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "IV Fluids",
      "ECG Machine"
    ]
  },
  {
    "disease": "hepatitis due to a toxin",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Blood Transfusion Kit",
      "Liver Function Test Kit",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "herniated disk",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Neurological Assessment Kit",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "herpangina",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Cooling Blanket",
      "Biopsy Kit",
      "Blood Culture Kit",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "hiatal hernia",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Blood Transfusion Kit",
      "Anti-emetic Drugs",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "hidradenitis suppurativa",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "high blood pressure",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "hirschsprung disease",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale"
    ]
  },
  {
    "disease": "hirsutism",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "Ventilator",
      "Oxygen Cylinder",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "histoplasmosis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "hormone disorder",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "hpv",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "human immunodeficiency virus infection (hiv)",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "huntington disease",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "hydatidiform mole",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "hydrocele of the testicle",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Catheter",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "hydrocephalus",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "hydronephrosis",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "hypercalcemia",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "Catheter",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "hypercholesterolemia",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "Holter Monitor"
    ]
  },
  {
    "disease": "hyperemesis gravidarum",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Blood Transfusion Kit",
      "Endoscope",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "hypergammaglobulinemia",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Blood Transfusion Kit",
      "Endoscope",
      "IV Fluids",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "hyperhidrosis",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "hyperkalemia",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "hyperlipidemia",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "hypernatremia",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "IV Fluids",
      "ECG Machine",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "hyperopia",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "hyperosmotic hyperketotic state",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "hypertension of pregnancy",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "hypertensive heart disease",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "hypertrophic obstructive cardiomyopathy (hocm)",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "hypocalcemia",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor"
    ]
  },
  {
    "disease": "hypoglycemia",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "Padded Bed Rails",
      "ECG Machine"
    ]
  },
  {
    "disease": "hypokalemia",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "ORS",
      "Stool Analysis Kit",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "hyponatremia",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Anti-seizure Drugs",
      "Padded Bed Rails",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "hypothermia",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "IV Fluids",
      "ECG Machine"
    ]
  },
  {
    "disease": "hypothyroidism",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "hypovolemia",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "ORS",
      "Stool Analysis Kit",
      "ECG Machine",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "idiopathic absence of menstruation",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "idiopathic excessive menstruation",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "idiopathic infrequent menstruation",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Catheter",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "idiopathic irregular menstrual cycle",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "idiopathic nonmenstrual bleeding",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Urine Analysis Kit",
      "Catheter"
    ]
  },
  {
    "disease": "idiopathic painful menstruation",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "ileus",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "impetigo",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "impulse control disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "indigestion",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "induced abortion",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "infection of open wound",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "infectious gastroenteritis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit",
      "Blood Transfusion Kit",
      "Cooling Blanket",
      "Warming Blanket"
    ]
  },
  {
    "disease": "ingrown toe nail",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "inguinal hernia",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device",
      "Ultrasound Machine",
      "IV Fluids",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "injury of the ankle",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "injury to internal organ",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "Catheter",
      "Urine Analysis Kit",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "injury to the abdomen",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "injury to the arm",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "injury to the face",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Nasal Packing Kit",
      "Suction Device",
      "MRI Scanner",
      "Lumbar Puncture Kit"
    ]
  },
  {
    "disease": "injury to the finger",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "injury to the hand",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "injury to the hip",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "injury to the knee",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "injury to the leg",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "injury to the shoulder",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "injury to the spinal cord",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Catheter",
      "Urine Analysis Kit",
      "X-Ray Machine",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "injury to the trunk",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "insect bite",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "insulin overdose",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher"
    ]
  },
  {
    "disease": "interstitial lung disease",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "intertrigo (skin condition)",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "intestinal cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "IV Fluids",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "intestinal disease",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "intestinal malabsorption",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "intestinal obstruction",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Catheter",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "intracerebral hemorrhage",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "Padded Bed Rails",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "intracranial abscess",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "intracranial hemorrhage",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "intussusception",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device",
      "Blood Transfusion Kit",
      "Endoscope",
      "IV Fluids"
    ]
  },
  {
    "disease": "iridocyclitis",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "iron deficiency anemia",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Blood Transfusion Kit",
      "Endoscope",
      "IV Fluids",
      "Glucometer",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "irritable bowel syndrome",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "ischemia of the bowel",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Blood Transfusion Kit",
      "Catheter",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "ischemic heart disease",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "itching of unknown cause",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "jaw disorder",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "joint effusion",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "juvenile rheumatoid arthritis",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "kaposi sarcoma",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "kidney cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "Catheter"
    ]
  },
  {
    "disease": "kidney disease due to longstanding hypertension",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "kidney failure",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "kidney stone",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "knee ligament or meniscus tear",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "labyrinthitis",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "lactose intolerance",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "IV Fluids",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "laryngitis",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "lateral epicondylitis (tennis elbow)",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "leukemia",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "lewy body dementia",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "lice",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "lichen planus",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "lichen simplex",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "lipoma",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "liver cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit"
    ]
  },
  {
    "disease": "liver disease",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit",
      "Blood Transfusion Kit",
      "Liver Function Test Kit",
      "Diuretics",
      "Compression Bandage"
    ]
  },
  {
    "disease": "lumbago",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "lung cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Blood Transfusion Kit",
      "Bronchoscope",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "lung contusion",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "lyme disease",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Cooling Blanket",
      "IV Fluids",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "lymphadenitis",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "lymphangitis",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device"
    ]
  },
  {
    "disease": "lymphedema",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "lymphogranuloma venereum",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "lymphoma",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "macular degeneration",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope",
      "Ophthalmic Emergency Kit"
    ]
  },
  {
    "disease": "magnesium deficiency",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor"
    ]
  },
  {
    "disease": "malaria",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "IV Fluids",
      "ECG Machine",
      "Oxygen Cylinder",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "male genitalia infection",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "malignant hypertension",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "marijuana abuse",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "mastectomy",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit"
    ]
  },
  {
    "disease": "mastoiditis",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "meckel diverticulum",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor"
    ]
  },
  {
    "disease": "melanoma",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Blood Culture Kit"
    ]
  },
  {
    "disease": "meniere disease",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "meningioma",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "meningitis",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Cooling Blanket",
      "Lumbar Puncture Kit"
    ]
  },
  {
    "disease": "menopause",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "metabolic disorder",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "Liver Function Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "metastatic cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Physiotherapy Equipment",
      "MRI Scanner",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "migraine",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "missed abortion",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Blood Transfusion Kit",
      "Endoscope",
      "IV Fluids"
    ]
  },
  {
    "disease": "mitral valve disease",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "mittelschmerz",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "molluscum contagiosum",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "mononeuritis",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "mononucleosis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Cooling Blanket",
      "IV Fluids",
      "Biopsy Kit",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "moyamoya disease",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "mucositis",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit"
    ]
  },
  {
    "disease": "multiple myeloma",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "multiple sclerosis",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Physiotherapy Equipment",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "mumps",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "Biopsy Kit",
      "Blood Culture Kit"
    ]
  },
  {
    "disease": "muscle spasm",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "muscular dystrophy",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "myasthenia gravis",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Oxygen Cylinder",
      "Nebulizer",
      "Speech Therapy Kit",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "myelodysplastic syndrome",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Warming Blanket",
      "IV Fluids",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "myocarditis",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "Holter Monitor"
    ]
  },
  {
    "disease": "myoclonus",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "myopia",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "myositis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "narcolepsy",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Oxygen Cylinder",
      "Nebulizer",
      "Ventilator",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "nasal polyp",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "necrotizing fasciitis",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device"
    ]
  },
  {
    "disease": "neonatal jaundice",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "Liver Function Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "nerve impingement near the shoulder",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "neuralgia",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "X-Ray Machine",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "neurofibromatosis",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "neuropathy due to drugs",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "neurosis",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "nonalcoholic liver disease (nash)",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Glucometer",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "noninfectious gastroenteritis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit",
      "Blood Transfusion Kit",
      "Warming Blanket"
    ]
  },
  {
    "disease": "normal pressure hydrocephalus",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Holter Monitor"
    ]
  },
  {
    "disease": "nose disorder",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Nasal Packing Kit"
    ]
  },
  {
    "disease": "obesity",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "obsessive compulsive disorder (ocd)",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "obstructive sleep apnea (osa)",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "Ventilator",
      "Glucometer",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "omphalitis",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale"
    ]
  },
  {
    "disease": "onychomycosis",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound due to trauma",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound from surgical incision",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device"
    ]
  },
  {
    "disease": "open wound of the abdomen",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound of the arm",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound of the back",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "Glucometer",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "open wound of the cheek",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound of the chest",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "open wound of the ear",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "open wound of the eye",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "open wound of the face",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound of the finger",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound of the foot",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound of the hand",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound of the head",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound of the jaw",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound of the knee",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound of the lip",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "open wound of the mouth",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "IV Line",
      "Padded Bed Rails",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "open wound of the neck",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "open wound of the nose",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "Nasal Packing Kit",
      "Suction Device"
    ]
  },
  {
    "disease": "open wound of the shoulder",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "oppositional disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "IV Fluids",
      "ECG Machine",
      "Oxygen Cylinder",
      "Catheter",
      "Dialysis Machine"
    ]
  },
  {
    "disease": "optic neuritis",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope",
      "Catheter",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "oral leukoplakia",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe"
    ]
  },
  {
    "disease": "oral mucosal lesion",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "oral thrush (yeast infection)",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "orbital cellulitis",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "orthostatic hypotension",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "Defibrillator",
      "IV Fluids"
    ]
  },
  {
    "disease": "osteoarthritis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "osteochondroma",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "osteochondrosis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "osteomyelitis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "osteoporosis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "otitis externa (swimmer's ear)",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "otitis media",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "otosclerosis",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "ovarian cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit"
    ]
  },
  {
    "disease": "ovarian cyst",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "ovarian torsion",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "overflow incontinence",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "pain after an operation",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "pain disorder affecting the neck",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner",
      "Lumbar Puncture Kit"
    ]
  },
  {
    "disease": "pancreatic cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit",
      "Liver Function Test Kit"
    ]
  },
  {
    "disease": "panic attack",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator"
    ]
  },
  {
    "disease": "panic disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Holter Monitor",
      "Defibrillator"
    ]
  },
  {
    "disease": "parasitic disease",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Catheter",
      "Urine Analysis Kit",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "parathyroid adenoma",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "parkinson disease",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "paronychia",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "paroxysmal supraventricular tachycardia",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor"
    ]
  },
  {
    "disease": "paroxysmal ventricular tachycardia",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "IV Fluids",
      "Glucometer",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "pelvic fistula",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "pelvic inflammatory disease",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Urine Analysis Kit",
      "Catheter",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "pelvic organ prolapse",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "Catheter"
    ]
  },
  {
    "disease": "pemphigus",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "pericarditis",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor"
    ]
  },
  {
    "disease": "peripheral arterial disease",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "peripheral arterial embolism",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Neurological Assessment Kit"
    ]
  },
  {
    "disease": "peripheral nerve disorder",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "X-Ray Machine",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "perirectal infection",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor"
    ]
  },
  {
    "disease": "peritonitis",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "peritonsillar abscess",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Biopsy Kit",
      "Blood Culture Kit"
    ]
  },
  {
    "disease": "persistent vomiting of unknown cause",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "ORS",
      "Stool Analysis Kit",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "personality disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "peyronie disease",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "pharyngitis",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Nebulizer",
      "Oxygen Cylinder",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "phimosis",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "Catheter"
    ]
  },
  {
    "disease": "pilonidal cyst",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device"
    ]
  },
  {
    "disease": "pinguecula",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "pinworm infection",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Urine Analysis Kit",
      "Catheter"
    ]
  },
  {
    "disease": "pituitary adenoma",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "pituitary disorder",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "pityriasis rosea",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "placenta previa",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "placental abruption",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "plantar fasciitis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "pleural effusion",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "pneumoconiosis",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "pneumonia",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Warming Blanket"
    ]
  },
  {
    "disease": "pneumothorax",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "poisoning due to analgesics",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "poisoning due to anticonvulsants",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "poisoning due to antidepressants",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "poisoning due to antihypertensives",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher"
    ]
  },
  {
    "disease": "poisoning due to antimicrobial drugs",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "Nebulizer",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "poisoning due to antipsychotics",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "ECG Machine",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "poisoning due to ethylene glycol",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "IV Fluids",
      "ECG Machine",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "poisoning due to gas",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "Nebulizer",
      "ECG Machine"
    ]
  },
  {
    "disease": "poisoning due to opioids",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher"
    ]
  },
  {
    "disease": "poisoning due to sedatives",
    "department": "Emergency Medicine",
    "resources": [
      "Emergency Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Defibrillator",
      "Oxygen Cylinder",
      "IV Line",
      "Cardiac Monitor",
      "Pulse Oximeter",
      "BP Monitor",
      "Suction Device",
      "Ambulance Stretcher",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "polycystic kidney disease",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "polycystic ovarian syndrome (pcos)",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Glucometer",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "polycythemia vera",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Glucometer",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "polymyalgia rheumatica",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "Defibrillator",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "post-traumatic stress disorder (ptsd)",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "postoperative infection",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "postpartum depression",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "preeclampsia",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "pregnancy",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "premature atrial contractions (pacs)",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "IV Fluids",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "premature ovarian failure",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Glucometer",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "premature rupture of amniotic membrane",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "premature ventricular contractions (pvcs)",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "IV Fluids"
    ]
  },
  {
    "disease": "premenstrual tension syndrome",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "presbyacusis",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "presbyopia",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "priapism",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Urine Analysis Kit",
      "Catheter"
    ]
  },
  {
    "disease": "primary immunodeficiency",
    "department": "Allergy & Immunology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Epinephrine Auto-Injector",
      "IV Line",
      "Pulse Oximeter",
      "Stethoscope",
      "BP Monitor",
      "Allergy Test Kit",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "primary insomnia",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Oxygen Cylinder",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "primary kidney disease",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "Diuretics",
      "Compression Bandage"
    ]
  },
  {
    "disease": "primary thrombocythemia",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "problem during pregnancy",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "prostate cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids",
      "Catheter"
    ]
  },
  {
    "disease": "prostatitis",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids",
      "Cooling Blanket",
      "Warming Blanket",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "protein deficiency",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "pseudohypoparathyroidism",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "pseudotumor cerebri",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit"
    ]
  },
  {
    "disease": "psoriasis",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "X-Ray Machine",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "psychosexual disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "psychotic disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "pterygium",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "pulmonary congestion",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator"
    ]
  },
  {
    "disease": "pulmonary embolism",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Blood Transfusion Kit",
      "Bronchoscope"
    ]
  },
  {
    "disease": "pulmonary eosinophilia",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "Cooling Blanket",
      "IV Fluids",
      "Neurological Assessment Kit"
    ]
  },
  {
    "disease": "pulmonary fibrosis",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "IV Fluids",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "pulmonary hypertension",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Ventilator",
      "Holter Monitor",
      "Blood Transfusion Kit",
      "Bronchoscope",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "pulmonic valve disease",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer"
    ]
  },
  {
    "disease": "pyelonephritis",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Urine Analysis Kit",
      "Cystoscope",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "pyloric stenosis",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "pyogenic skin infection",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "raynaud disease",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "reactive arthritis",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "rectal disorder",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "ORS",
      "Stool Analysis Kit",
      "Blood Transfusion Kit"
    ]
  },
  {
    "disease": "restless leg syndrome",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Ventilator",
      "Oxygen Cylinder",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "retinal detachment",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "retinopathy due to high blood pressure",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "rhabdomyolysis",
    "department": "Nephrology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dialysis Machine",
      "Ultrasound Machine",
      "IV Line",
      "Catheter",
      "BP Monitor",
      "Stethoscope",
      "Electrolyte Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "rheumatic fever",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "rheumatoid arthritis",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "rocky mountain spotted fever",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "rosacea",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "rotator cuff injury",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "salivary gland disorder",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Biopsy Kit",
      "Blood Culture Kit"
    ]
  },
  {
    "disease": "sarcoidosis",
    "department": "Pulmonology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Spirometer",
      "Chest X-Ray",
      "Stethoscope",
      "IV Line",
      "ECG Machine",
      "Cardiac Monitor",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "scabies",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "scar",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "scarlet fever",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "Cooling Blanket",
      "IV Fluids",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "schizophrenia",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "sciatica",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "scleritis",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "scleroderma",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "scoliosis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "scurvy",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "seasonal allergies (hay fever)",
    "department": "Allergy & Immunology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Epinephrine Auto-Injector",
      "IV Line",
      "Pulse Oximeter",
      "Stethoscope",
      "BP Monitor",
      "Allergy Test Kit"
    ]
  },
  {
    "disease": "sebaceous cyst",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "seborrheic dermatitis",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "seborrheic keratosis",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "sensorineural hearing loss",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "sepsis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Cooling Blanket",
      "Warming Blanket"
    ]
  },
  {
    "disease": "septic arthritis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "shingles (herpes zoster)",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "sialoadenitis",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage",
      "Biopsy Kit",
      "Blood Culture Kit"
    ]
  },
  {
    "disease": "sick sinus syndrome",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "IV Fluids"
    ]
  },
  {
    "disease": "sickle cell anemia",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Cooling Blanket",
      "IV Fluids",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "sickle cell crisis",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "sinus bradycardia",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Holter Monitor",
      "IV Fluids"
    ]
  },
  {
    "disease": "sjogren syndrome",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "X-Ray Machine",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "skin cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit"
    ]
  },
  {
    "disease": "skin disorder",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "skin pigmentation disorder",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "skin polyp",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "smoking or tobacco addiction",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Blood Transfusion Kit",
      "Bronchoscope"
    ]
  },
  {
    "disease": "social phobia",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "soft tissue sarcoma",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit"
    ]
  },
  {
    "disease": "somatization disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor",
      "IV Fluids",
      "ECG Machine",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "spermatocele",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Catheter",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "spherocytosis",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "spina bifida",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "spinal stenosis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Neurological Assessment Kit",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "spinocerebellar ataxia",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "spondylitis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "spondylolisthesis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Neurological Assessment Kit",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "spondylosis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Neurological Assessment Kit",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "spontaneous abortion",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "sporotrichosis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "sprain or strain",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "stenosis of the tear duct",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "stomach cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "ORS",
      "Stool Analysis Kit"
    ]
  },
  {
    "disease": "strep throat",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Cooling Blanket",
      "Warming Blanket",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "stress incontinence",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "stricture of the esophagus",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "stroke",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "Padded Bed Rails",
      "Physiotherapy Equipment",
      "Speech Therapy Kit"
    ]
  },
  {
    "disease": "stye",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "subacute thyroiditis",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "ECG Machine",
      "Cardiac Monitor",
      "Holter Monitor",
      "Blood Transfusion Kit",
      "Endoscope",
      "IV Fluids"
    ]
  },
  {
    "disease": "subarachnoid hemorrhage",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "ECG Machine",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "subconjunctival hemorrhage",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope",
      "Ophthalmic Emergency Kit"
    ]
  },
  {
    "disease": "subdural hemorrhage",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "substance-related mental disorder",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "syndrome of inappropriate secretion of adh (siadh)",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "syphilis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "syringomyelia",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "ECG Machine",
      "Oxygen Cylinder",
      "X-Ray Machine",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "systemic lupus erythematosis (sle)",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "teething syndrome",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "IV Fluids",
      "ORS",
      "Stool Analysis Kit",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "temporary or benign blood in urine",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "temporomandibular joint disorder",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "tendinitis",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "tension headache",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Warming Blanket",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Lumbar Puncture Kit"
    ]
  },
  {
    "disease": "testicular cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "testicular disorder",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "testicular torsion",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "thalassemia",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit"
    ]
  },
  {
    "disease": "thoracic aortic aneurysm",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Nebulizer",
      "Liver Function Test Kit",
      "IV Fluids",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "thoracic outlet syndrome",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "threatened pregnancy",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "thrombocytopenia",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "Blood Transfusion Kit",
      "Endoscope",
      "IV Fluids",
      "Nasal Packing Kit",
      "Suction Device",
      "Dental Emergency Kit",
      "Urine Analysis Kit",
      "Cystoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "thrombophlebitis",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "thyroid cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "Lab Test Kit",
      "IV Fluids",
      "Blood Culture Kit"
    ]
  },
  {
    "disease": "thyroid disease",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "thyroid nodule",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "tic (movement) disorder",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "tietze syndrome",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "IV Fluids",
      "Anti-emetic Drugs"
    ]
  },
  {
    "disease": "tinnitus of unknown cause",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "tonsillar hypertrophy",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Ventilator",
      "Oxygen Cylinder",
      "Pulse Oximeter",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "tonsillitis",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "tooth abscess",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "tooth disorder",
    "department": "Dentistry",
    "resources": [
      "Dental Chair",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dental Drill",
      "Dental X-Ray",
      "Forceps",
      "Scaler",
      "Suction Device",
      "Local Anesthetic",
      "Mirror & Probe",
      "Dental Emergency Kit",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "torticollis",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "MRI Scanner",
      "Lumbar Puncture Kit"
    ]
  },
  {
    "disease": "tourette syndrome",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "toxic multinodular goiter",
    "department": "Endocrinology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Glucometer",
      "Insulin Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Lab Test Kit",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "IV Fluids"
    ]
  },
  {
    "disease": "toxoplasmosis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "tracheitis",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device",
      "Oxygen Cylinder",
      "Nebulizer",
      "Pulse Oximeter",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "transient ischemic attack",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "trichiasis",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "trichinosis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit"
    ]
  },
  {
    "disease": "trichomonas infection",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "tricuspid valve disease",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "trigeminal neuralgia",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "trigger finger (finger disorder)",
    "department": "Orthopedics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "X-Ray Machine",
      "Orthopedic Splint",
      "Cast Material",
      "Stethoscope",
      "IV Line",
      "Crutches",
      "BP Monitor"
    ]
  },
  {
    "disease": "tuberculosis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Oxygen Cylinder",
      "Nebulizer"
    ]
  },
  {
    "disease": "tuberous sclerosis",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "Anti-seizure Drugs",
      "Oxygen Cylinder",
      "IV Line",
      "Padded Bed Rails"
    ]
  },
  {
    "disease": "turner syndrome",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Psychiatric Assessment Tools",
      "Counseling Room"
    ]
  },
  {
    "disease": "typhoid fever",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "ulcerative colitis",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "IV Fluids",
      "Anti-emetic Drugs",
      "ORS",
      "Stool Analysis Kit",
      "Blood Transfusion Kit",
      "Biopsy Kit",
      "Blood Culture Kit"
    ]
  },
  {
    "disease": "urethral disorder",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "urethral stricture",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "urethral valves",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit"
    ]
  },
  {
    "disease": "urethritis",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "urge incontinence",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "urinary tract infection",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "urinary tract obstruction",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "uterine atony",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Urine Analysis Kit",
      "Cystoscope",
      "IV Fluids"
    ]
  },
  {
    "disease": "uterine cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit"
    ]
  },
  {
    "disease": "uterine fibroids",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "uveitis",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "vacterl syndrome",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale"
    ]
  },
  {
    "disease": "vaginal cyst",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "vaginal yeast infection",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Urine Analysis Kit",
      "Catheter"
    ]
  },
  {
    "disease": "vaginismus",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "vaginitis",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "Urine Analysis Kit",
      "Catheter"
    ]
  },
  {
    "disease": "valley fever",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Oxygen Cylinder",
      "Nebulizer",
      "Cooling Blanket",
      "IV Fluids"
    ]
  },
  {
    "disease": "varicocele of the testicles",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "varicose veins",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder",
      "Diuretics",
      "IV Fluids",
      "Compression Bandage"
    ]
  },
  {
    "disease": "vasculitis",
    "department": "Rheumatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Joint Assessment Kit",
      "X-Ray Machine",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Physiotherapy Equipment",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "venous insufficiency",
    "department": "Cardiology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "ECG Machine",
      "Cardiac Monitor",
      "Defibrillator",
      "BP Monitor",
      "Stethoscope",
      "Pulse Oximeter",
      "IV Line",
      "Oxygen Cylinder"
    ]
  },
  {
    "disease": "vertebrobasilar insufficiency",
    "department": "Neurology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "MRI Scanner",
      "CT Scanner",
      "EEG Machine",
      "Neurological Assessment Kit",
      "BP Monitor",
      "Stethoscope",
      "IV Line",
      "Pulse Oximeter",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder",
      "X-Ray Machine",
      "Physiotherapy Equipment"
    ]
  },
  {
    "disease": "vesicoureteral reflux",
    "department": "Urology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Cystoscope",
      "Ultrasound Machine",
      "Catheter",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Urine Analysis Kit",
      "IV Fluids",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "viral exanthem",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "Cooling Blanket"
    ]
  },
  {
    "disease": "viral hepatitis",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Blood Transfusion Kit",
      "IV Fluids",
      "Endoscope"
    ]
  },
  {
    "disease": "viral warts",
    "department": "Dermatology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Dermatoscope",
      "Topical Treatments",
      "Stethoscope",
      "UV Light Therapy"
    ]
  },
  {
    "disease": "vitamin a deficiency",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "vitamin b12 deficiency",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "vitamin d deficiency",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter",
      "Lab Test Kit",
      "IV Fluids"
    ]
  },
  {
    "disease": "vitreous degeneration",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "vitreous hemorrhage",
    "department": "Ophthalmology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Slit Lamp",
      "Ophthalmoscope",
      "Tonometer",
      "Visual Acuity Chart",
      "Eye Drops",
      "Stethoscope"
    ]
  },
  {
    "disease": "vocal cord polyp",
    "department": "ENT (Ear, Nose, Throat)",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Otoscope",
      "Laryngoscope",
      "Endoscope",
      "Audiometer",
      "Stethoscope",
      "Nasal Speculum",
      "Suction Device"
    ]
  },
  {
    "disease": "volvulus",
    "department": "General Surgery",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Surgical Kit",
      "Operating Theater",
      "IV Line",
      "Anesthesia Machine",
      "Stethoscope",
      "BP Monitor",
      "Suction Device",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "von willebrand disease",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "Blood Transfusion Kit",
      "Endoscope",
      "IV Fluids",
      "Nasal Packing Kit",
      "Suction Device"
    ]
  },
  {
    "disease": "vulvar cancer",
    "department": "Oncology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Chemotherapy Equipment",
      "IV Line",
      "Blood Bank Access",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Biopsy Kit",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "vulvar disorder",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula"
    ]
  },
  {
    "disease": "vulvodynia",
    "department": "Gynecology / Obstetrics",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Ultrasound Machine",
      "Fetal Monitor",
      "Delivery Kit",
      "IV Line",
      "BP Monitor",
      "Stethoscope",
      "Specula",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Urine Analysis Kit",
      "Catheter",
      "X-Ray Machine",
      "Physiotherapy Equipment",
      "MRI Scanner"
    ]
  },
  {
    "disease": "wernicke korsakoff syndrome",
    "department": "Psychiatry / Mental Health",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Psychiatric Assessment Tools",
      "Counseling Room",
      "Stethoscope",
      "BP Monitor"
    ]
  },
  {
    "disease": "white blood cell disease",
    "department": "Hematology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Blood Bank Access",
      "Transfusion Set",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Complete Blood Count (CBC) Kit",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube",
      "ORS",
      "Stool Analysis Kit",
      "Cooling Blanket",
      "Warming Blanket",
      "Lab Test Kit"
    ]
  },
  {
    "disease": "whooping cough",
    "department": "Pediatrics",
    "resources": [
      "Pediatric Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Incubator",
      "Pediatric IV Line",
      "Pulse Oximeter",
      "Nebulizer",
      "Stethoscope",
      "BP Monitor",
      "Weigh Scale",
      "Oxygen Cylinder",
      "IV Fluids",
      "Anti-emetic Drugs",
      "Nasogastric Tube"
    ]
  },
  {
    "disease": "wilson disease",
    "department": "General Physician",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Stethoscope",
      "BP Monitor",
      "IV Line",
      "Pulse Oximeter"
    ]
  },
  {
    "disease": "yeast infection",
    "department": "Infectious Disease",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Isolation Ward",
      "IV Line",
      "Stethoscope",
      "BP Monitor",
      "Pulse Oximeter",
      "Blood Culture Kit",
      "Rapid Diagnostic Test Kit",
      "Dermatoscope",
      "Topical Treatments"
    ]
  },
  {
    "disease": "zenker diverticulum",
    "department": "Gastroenterology",
    "resources": [
      "Hospital Bed",
      "Thermometer",
      "Gloves",
      "Surgical Mask",
      "Basic Medicines",
      "Endoscope",
      "Ultrasound Machine",
      "IV Line",
      "Stethoscope",
      "Nasogastric Tube",
      "BP Monitor",
      "ECG Machine",
      "Cardiac Monitor",
      "Oxygen Cylinder"
    ]
  }
];

/**
 * Look up a disease by name (case-insensitive, trims whitespace).
 * @param {string} name
 * @returns {{ disease: string, department: string, resources: string[] }|null}
 */
function getResourceInfo(name) {
  const key = String(name || "").trim().toLowerCase();
  return DISEASE_RESOURCE_DATA.find((d) => d.disease === key) || null;
}

/**
 * Returns the department for a disease name.
 * @param {string} name
 * @returns {string}
 */
function getDepartmentForDisease(name) {
  const info = getResourceInfo(name);
  return info ? info.department : "General Physician";
}

/**
 * Returns the resources list for a disease name.
 * @param {string} name
 * @returns {string[]}
 */
function getResourcesForDisease(name) {
  const info = getResourceInfo(name);
  return info ? info.resources : ["Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines"];
}

/**
 * Returns all disease names as an array.
 * @returns {string[]}
 */
function getAllDiseases() {
  return DISEASE_RESOURCE_DATA.map((d) => d.disease);
}

module.exports = { DISEASE_RESOURCE_DATA, getResourceInfo, getDepartmentForDisease, getResourcesForDisease, getAllDiseases };
