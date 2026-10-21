import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import { clearAuthSession, getAuthToken, getAuthUser, getRememberPreference, setAuthSession } from "../utils/authStorage";
import { Button, Card, CardBody, CardHeader } from "../components/ui";
import Modal from "../components/ui/Modal";
import NotificationBell from "../components/NotificationBell";
import StripePaymentModal from "../components/StripePaymentModal";
import "../styles/symptom-analysis.css";
import NearestHospital from "./NearestHospital";

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function getTodayLocalYmd() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentShift() {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 14) return "morning";
  if (hour >= 14 && hour < 20) return "evening";
  return "night";
}

function isSlotInPastLocal(dateYmd, slot) {
  try {
    if (!dateYmd || !slot) return false;
    const split = slot.split("-").map((s) => s.trim()).filter(Boolean);
    if (split.length < 2) return false;

    const parseTimeLabelToMinute = (label) => {
      const text = String(label || "").trim();
      let m = text.match(/^(\d{1,2}):(\d{2})$/);
      if (m) {
        const hh = Number(m[1]);
        const mm = Number(m[2]);
        if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return hh * 60 + mm;
        return null;
      }
      m = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
      if (m) {
        let hh = Number(m[1]);
        const mm = Number(m[2] || "0");
        const ap = String(m[3]).toUpperCase();
        if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
        if (ap === "AM") {
          if (hh === 12) hh = 0;
        } else if (hh !== 12) {
          hh += 12;
        }
        return hh * 60 + mm;
      }
      return null;
    };

    const startMinute = parseTimeLabelToMinute(split[0]);
    if (startMinute === null) return false;

    const hh = Math.floor(startMinute / 60) % 24;
    const mm = startMinute % 60;

    const parts = String(dateYmd || "").split("-");
    if (parts.length !== 3) return false;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return false;

    const appointmentAt = new Date(year, month - 1, day, hh, mm, 0, 0);
    if (Number.isNaN(appointmentAt.getTime())) return false;

    const now = new Date();
    return appointmentAt.getTime() <= now.getTime();
  } catch (e) {
    return false;
  }
}


function getAppointmentStatusLabel(status) {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "completed") return "FINISHED";
  return normalized.toUpperCase();
}

function formatLocationNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
}

function formatDistanceKm(value) {
  if (value === null || value === undefined || value === "") return "-";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return `${parsed.toFixed(2)} km`;
}

function formatRecommendationDistance(distanceKm, distanceSource) {
  const base = formatDistanceKm(distanceKm);
  if (base === "-") return base;
  return String(distanceSource || "").toLowerCase() === "exact"
    ? base
    : `~${base} (approx)`;
}

const normalizeDeptName = (name) => {
  if (!name) return "";
  let norm = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "");
  if (norm === "general" || norm === "generalmedicine" || norm === "generalphysician" || norm === "generalmedicineopd") {
    return "generalphysician";
  }
  if (norm === "gynecology" || norm === "gynecologyobstetrics" || norm === "obstetrics" || norm === "obgyn") {
    return "gynecologyobstetrics";
  }
  if (norm === "emergencymedicine" || norm === "emergency") {
    return "emergencymedicine";
  }
  if (norm === "psychiatrymentalhealth" || norm === "psychiatry" || norm === "mentalhealth") {
    return "psychiatrymentalhealth";
  }
  return norm;
};

// ── Roman Urdu → English Symptom Translator ──────────────────────────────────
// Allows patients to type in Roman Urdu (e.g. "bukhar", "sir dard", "khansi")
// and get correct English for the AI/hospital search pipeline.
const ROMAN_URDU_PHRASES = [
  { rx: /\b(bukhar|bukhaar|buxar|tapish|garmi)\b/gi, en: "fever" },
  { rx: /\b(khansi|khasi|khaansi|khaansy|sookhi khansi)\b/gi, en: "cough" },
  { rx: /\b(zukam|zukaam|nazla|neezla|naak bund|naak band|sardi)\b/gi, en: "cold flu" },
  { rx: /\b(sar dard|sir dard|sardard|sirdard|sar ka dard|sir ka dard)\b/gi, en: "headache" },
  { rx: /\b(gala dard|gale mein dard|galaa|kharash|gale ki takleef)\b/gi, en: "sore throat" },
  { rx: /\b(pait dard|pet dard|pait ka dard|pet mein dard|shikam dard)\b/gi, en: "stomach pain" },
  { rx: /\b(ulti|ulty|qay|qai|matli|matali|ji machlana)\b/gi, en: "vomiting nausea" },
  { rx: /\b(dast|ishal|loose motion|pait kharabi)\b/gi, en: "diarrhea" },
  { rx: /\b(sans phoolna|saans phoolna|sans lena mushkil|saans ki takleef|dam ghutna|dam phoolna)\b/gi, en: "shortness of breath" },
  { rx: /\b(seena dard|sina dard|seene mein dard|sine mein dard|dil dard|dil ka dard)\b/gi, en: "chest pain" },
  { rx: /\b(kamar dard|pith dard|peeth dard|kamar mein dard)\b/gi, en: "back pain" },
  { rx: /\b(joro(n)? ka dard|juron ka dard|haddi dard|ghutne ka dard)\b/gi, en: "joint pain" },
  { rx: /\b(ankh dard|aankh mein dard|aankh jalana|dhundla dikhai dena)\b/gi, en: "eye pain blurred vision" },
  { rx: /\b(kan dard|kaan mein dard|kan bund)\b/gi, en: "ear pain" },
  { rx: /\b(peshab mein jalan|peshab mein dard|bar bar peshab|peshaab)\b/gi, en: "painful urination frequent urination" },
  { rx: /\b(khujli|kharish|daane|chamri ka masla|phunsi)\b/gi, en: "skin rash itching" },
  { rx: /\b(kamzori|thakaan|thakan|jism mein susti)\b/gi, en: "weakness fatigue" },
  { rx: /\b(sujan|sawzish|waram|soojna)\b/gi, en: "swelling" },
  { rx: /\b(chakkar|chakkir|chakkhar|sar ghoomna|sir ghoomna)\b/gi, en: "dizziness" },
  { rx: /\b(khoon aana|khoon nikalna|naak se khoon)\b/gi, en: "bleeding" },
  { rx: /\b(sugar|shakar|zyada pyas|madhumeh)\b/gi, en: "diabetes sugar" },
  { rx: /\b(dil ki dhadkan|dhadkan|dil tez dharna|ghabrahut)\b/gi, en: "palpitations heart" },
  { rx: /\b(hamla|hamal|pait mein bacha|delivery|wiladat)\b/gi, en: "pregnancy" },
  { rx: /\b(daant dard|daant mein dard|masi dard|dant dard)\b/gi, en: "toothache" },
  { rx: /\b(qabz|qabaz|pakhana na aana)\b/gi, en: "constipation" },
  { rx: /\b(chot|chot lagna|haddi tooti|haadsa)\b/gi, en: "injury fracture" },
  { rx: /\b(bp|feshar|fashar|high bp|low bp)\b/gi, en: "blood pressure" },
  { rx: /\b(malaria|maleriya|dengue|dengee|dengi)\b/gi, en: "malaria dengue fever" },
  { rx: /\b(typhoid|tyfoid|miada bukhar)\b/gi, en: "typhoid fever" },
  { rx: /\b(appendix|appendiks)\b/gi, en: "appendix pain" },
  { rx: /\b(gurda|kidney pathri|gurde ka dard)\b/gi, en: "kidney stone pain" },
  { rx: /\b(fikr|tension|udasi|dil ghabrana)\b/gi, en: "anxiety depression" },
  { rx: /\b(ghabrahut)\b/gi, en: "anxiety" },
];

/**
 * Translate Roman Urdu symptom input to English.
 * Returns { translated: string, wasTranslated: boolean }
 */
function translateRomanUrduClient(input) {
  let text = String(input || "").trim();
  let changed = false;
  for (const { rx, en } of ROMAN_URDU_PHRASES) {
    const result = text.replace(rx, en);
    if (result !== text) { changed = true; text = result; }
  }
  return { translated: text, wasTranslated: changed };
}

function getGeolocationErrorMessage(error) {
  if (!error || typeof error !== "object") {
    return "Location access failed. Please allow browser location permission and try again.";
  }

  if (error.code === 1) {
    return "Location permission is blocked. Please allow location access in browser site settings.";
  }
  if (error.code === 2) {
    return "Unable to detect your location right now. Please check GPS/network and retry.";
  }
  if (error.code === 3) {
    return "Location request timed out. Move to an open area and try again.";
  }

  return "Location access failed. Please allow browser location permission and try again.";
}

function buildHospitalLocationQuery(hospital = {}) {
  if (hospital && Object.prototype.hasOwnProperty.call(hospital, "distance_source")) {
    const source = String(hospital?.distance_source || "").trim().toLowerCase();
    if (source && source !== "exact") {
      return "";
    }
  }

  const lat = Number(hospital?.geo_location?.lat);
  const lng = Number(hospital?.geo_location?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `${lat},${lng}`;
  }

  return "";
}

function buildHospitalSearchTextQuery(hospital = {}) {
  const coordinateQuery = buildHospitalLocationQuery(hospital);
  if (coordinateQuery) return coordinateQuery;

  return [hospital?.name, hospital?.address, hospital?.city]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

function buildMapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(query || ""))}`;
}

function buildMapsEmbedUrl(query) {
  return `https://www.google.com/maps?q=${encodeURIComponent(String(query || ""))}&z=15&output=embed`;
}

function buildDirectionsUrl(originLat, originLng, destinationQuery, mode = "driving") {
  const origin = `${originLat},${originLng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destinationQuery)}&travelmode=${encodeURIComponent(mode)}`;
}

function buildLiveNavigationUrl(destinationQuery, mode = "driving") {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(String(destinationQuery || ""))}&travelmode=${encodeURIComponent(mode)}&dir_action=navigate`;
}

function getHospitalCoordinates(hospital = {}) {
  const lat = Number(hospital?.geo_location?.lat);
  const lng = Number(hospital?.geo_location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function fetchApproxLocationFromIP() {
  const providers = [
    "https://ipapi.co/json/",
    "https://ipwho.is/",
  ];

  for (const endpoint of providers) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) continue;

      const payload = await response.json();
      const lat = Number(payload?.latitude ?? payload?.lat);
      const lng = Number(payload?.longitude ?? payload?.lon ?? payload?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    } catch {
      // Try the next provider.
    }
  }

  return null;
}

function haversineDistanceKmLocal(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function formatTravelDuration(minutes) {
  const totalMinutes = Number(minutes);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "-";
  if (totalMinutes < 60) return `${Math.round(totalMinutes)} mins`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

const DISEASE_DEPARTMENT_CATALOG = [
  {
    name: "Emergency",
    description: "Critical and life-threatening conditions",
    diseases: ["Road accidents", "Heart attack", "Stroke", "Severe bleeding", "Burn injuries", "Poisoning", "Asthma attack", "Fractures", "Head injury", "Seizures"],
  },
  {
    name: "General Medicine",
    description: "Common infections and routine medical care",
    diseases: ["Fever", "Cold & flu", "Headache", "Body pain", "Allergy", "Cough", "Stomach pain", "Minor infections", "Skin rash", "Weakness"],
  },
  {
    name: "Cardiology",
    description: "Heart and blood vessel conditions",
    diseases: ["Hypertension", "Heart attack", "Arrhythmia", "Heart failure", "Coronary artery disease", "Angina", "Valve disease", "Cardiomyopathy", "Congenital heart disease", "Blood clots"],
  },
  {
    name: "Pediatrics",
    description: "Child health and pediatric care",
    diseases: ["Fever", "Diarrhea", "Malnutrition", "Asthma", "Chickenpox", "Measles", "Cold & cough", "Ear infection", "Pneumonia", "Growth issues"],
  },
  {
    name: "Orthopedics",
    description: "Bones, joints, and musculoskeletal problems",
    diseases: ["Fractures", "Arthritis", "Back pain", "Joint pain", "Dislocations", "Osteoporosis", "Sports injury", "Spinal problems", "Ligament tears", "Bone infection"],
  },
  {
    name: "Dermatology",
    description: "Skin, hair, and nail conditions",
    diseases: ["Acne", "Eczema", "Psoriasis", "Fungal infection", "Allergy rash", "Skin infection", "Hair loss", "Skin cancer", "Vitiligo", "Dermatitis"],
  },
  {
    name: "ENT",
    description: "Ear, nose, throat, sinus, and hearing care",
    diseases: ["Ear infection", "Hearing loss", "Sinusitis", "Tonsillitis", "Nose bleeding", "Throat infection", "Allergy", "Voice disorders", "Ear pain", "Nasal blockage"],
  },
  {
    name: "Urology",
    description: "Kidney, bladder, and urinary tract care",
    diseases: ["Kidney stones", "UTI", "Prostate enlargement", "Bladder infection", "Kidney failure", "Urinary incontinence", "Blood in urine", "Erectile dysfunction", "Cystitis", "Tumors"],
  },
  {
    name: "Oncology",
    description: "Cancer and tumor treatment",
    diseases: ["Breast cancer", "Lung cancer", "Blood cancer", "Skin cancer", "Prostate cancer", "Colon cancer", "Brain tumor", "Liver cancer", "Pancreatic cancer", "Leukemia"],
  },
  {
    name: "Radiology",
    description: "Imaging and scan interpretation",
    diseases: ["Fracture detection", "Tumor detection", "Lung infection (X-ray)", "Brain hemorrhage", "Kidney stones scan", "MRI abnormalities", "CT scan findings", "Ultrasound pregnancy", "Chest infection", "Spinal issues"],
  },
  {
    name: "Gynecology & Obstetrics",
    description: "Women’s health, pregnancy, and childbirth",
    diseases: ["Pregnancy", "PCOS", "Menstrual disorders", "Infertility", "C-section cases", "Miscarriage", "Hormonal imbalance", "Fibroids", "Endometriosis", "Vaginal infections"],
  },
  {
    name: "Neurology",
    description: "Brain, nerves, and nervous system care",
    diseases: ["Stroke", "Epilepsy", "Migraine", "Parkinson's disease", "Alzheimer's", "Brain tumor", "Nerve damage", "Multiple sclerosis", "Head injury", "Neuropathy"],
  },
  {
    name: "Pulmonology",
    description: "Lung and respiratory conditions",
    diseases: ["Asthma", "Pneumonia", "COPD", "Lung infection", "Shortness of breath", "Chest infection", "Tuberculosis", "Bronchitis", "Respiratory allergy", "Wheezing"],
  },
  {
    name: "Gastroenterology",
    description: "Stomach, liver, and digestive health",
    diseases: ["Acidity", "Ulcer", "Indigestion", "Constipation", "Diarrhea", "Liver disease", "Hepatitis", "Gastritis", "Vomiting", "Stomach infection"],
  },
  {
    name: "Ophthalmology",
    description: "Eye and vision care",
    diseases: ["Blurred vision", "Cataract", "Eye pain", "Glaucoma", "Eye infection", "Red eye", "Retinal problem", "Dry eyes", "Vision loss", "Eye injury"],
  },
  {
    name: "Nephrology",
    description: "Kidney disease and renal care",
    diseases: ["Kidney failure", "Chronic kidney disease", "Protein in urine", "Kidney infection", "Dialysis care", "Swelling", "High creatinine", "Blood pressure kidney issues", "Electrolyte disorder", "Renal stones"],
  },
  {
    name: "Psychiatry",
    description: "Mental health and behavioral care",
    diseases: ["Depression", "Anxiety", "Panic attacks", "Insomnia", "Stress", "Mood disorder", "Bipolar disorder", "Psychosis", "Addiction", "PTSD"],
  },
  {
    name: "Dentistry",
    description: "Teeth, gums, and oral health",
    diseases: ["Tooth pain", "Cavity", "Gum bleeding", "Mouth ulcer", "Tooth infection", "Wisdom tooth pain", "Jaw pain", "Broken tooth", "Bad breath", "Dental abscess"],
  },
];

function buildDiseasePickerItems() {
  return DISEASE_DEPARTMENT_CATALOG.flatMap((department) =>
    department.diseases.map((disease) => ({
      department: department.name,
      disease,
      description: department.description,
    }))
  );
}

const DISEASE_PICKER_ITEMS = buildDiseasePickerItems();
const RECOMMENDATION_MAX_DISTANCE_KM = 35;

const DEPARTMENT_DEFAULT_RESOURCES = {
  "Cardiology": ["ECG Machine", "Cardiac Monitor", "Defibrillator", "BP Monitor", "Stethoscope"],
  "Pulmonology": ["Oxygen Cylinder", "Nebulizer", "Pulse Oximeter", "Spirometer", "Chest X-Ray"],
  "Neurology": ["MRI Scanner", "CT Scanner", "Reflex Hammer", "EEG Machine", "Stethoscope"],
  "Gastroenterology": ["Endoscope", "Ultrasound Machine", "Suction Device", "IV Fluids", "Stethoscope"],
  "Orthopedics": ["X-Ray Machine", "Wheelchair", "Crutches", "Plaster Cast", "Surgical Kit"],
  "Dermatology": ["Dermatoscope", "Sterile Gauze", "Antiseptic Solution", "Gloves", "Surgical Mask"],
  "ENT": ["Otoscope", "Laryngoscope", "Endoscope", "Nasal Speculum", "Suction Device"],
  "ENT (Ear, Nose, Throat)": ["Otoscope", "Laryngoscope", "Endoscope", "Nasal Speculum", "Suction Device"],
  "Ophthalmology": ["Ophthalmoscope", "Slit Lamp", "Eye Drops", "Tonometer", "Gloves"],
  "Urology": ["Ultrasound Machine", "Catheter Kit", "Cystoscope", "Urine Bags", "Stethoscope"],
  "Gynecology / Obstetrics": ["Ultrasound Machine", "Fetal Monitor", "Delivery Bed", "Surgical Kit", "Hospital Bed"],
  "Gynecology & Obstetrics": ["Ultrasound Machine", "Fetal Monitor", "Delivery Bed", "Surgical Kit", "Hospital Bed"],
  "Endocrinology": ["Glucometer", "Insulin Pen", "BP Monitor", "Stethoscope", "Gloves"],
  "Psychiatry": ["Assessment Tools", "Sedatives", "Hospital Bed", "Gloves", "Stethoscope"],
  "Psychiatry / Mental Health": ["Assessment Tools", "Sedatives", "Hospital Bed", "Gloves", "Stethoscope"],
  "Dentistry": ["Dental Chair", "Dental Drill", "Dental X-Ray", "Autoclave", "Surgical Kit"],
  "Oncology": ["Chemotherapy Drugs", "Infusion Pump", "Surgical Kit", "Hospital Bed", "IV Line"],
  "Hematology": ["Centrifuge", "Blood Bags", "IV Line", "Stethoscope", "Gloves"],
  "Infectious Disease": ["Isolation Ward", "PPE Kit", "Thermometer", "Gloves", "Surgical Mask"],
  "General Surgery": ["Surgical Kit", "Operating Theater", "Anesthesia Machine", "IV Fluids", "Suction Device"],
  "Emergency Medicine": ["Defibrillator", "Ventilator", "Oxygen Cylinder", "Ambulance", "Stethoscope"],
  "Emergency": ["Defibrillator", "Ventilator", "Oxygen Cylinder", "Ambulance", "Stethoscope"],
  "General Physician": ["Stethoscope", "Thermometer", "BP Monitor", "Basic Medicines", "Gloves"],
  "General Medicine": ["Stethoscope", "Thermometer", "BP Monitor", "Basic Medicines", "Gloves"],
  "Rheumatology": ["Joint Support", "Heating Pad", "Stethoscope", "BP Monitor", "Gloves"],
  "Pediatrics": ["Nebulizer", "Infant Incubator", "Stethoscope", "Thermometer", "Surgical Mask"],
  "Radiology": ["MRI Scanner", "CT Scanner", "X-Ray Machine", "Ultrasound Machine", "Lead Apron"]
};

export default function PatientProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = getAuthUser();
  const profileLoadStartedRef = useRef(false);
  const mapWatchIdRef = useRef(null);
  const lastRouteOriginRef = useRef(null);
  const routeRequestTokenRef = useRef(0);
  const authRole = String(authUser?.role || "");

  const getPatientMenuIcon = (id, isActive) => {
    const color = isActive ? "#a78bfa" : "rgba(255, 255, 255, 0.7)";
    const strokeWidth = 2;
    switch (id) {
      case "profile":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case "booking":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="12" y1="14" x2="12" y2="20" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        );
      case "nearest":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        );
      case "search":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        );
      case "appointments":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case "settings":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.2s" }}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(() => {
    return location.state?.section || new URLSearchParams(location.search).get("section") || "profile";
  });

  useEffect(() => {
    const section = location.state?.section || new URLSearchParams(location.search).get("section");
    if (section && ["profile", "booking", "search", "appointments", "settings", "nearest"].includes(section)) {
      setActiveSection(section);
    }
  }, [location]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("healthnetTheme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("healthnetTheme", theme);
  }, [theme]);

  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [changeEmailModalOpen, setChangeEmailModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", phone: "", city: "", address: "", age: "", gender: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [emailForm, setEmailForm] = useState({ currentEmail: "", email: "", code: "" });
  const [requestingEmailOtp, setRequestingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailOtpRequested, setEmailOtpRequested] = useState(false);

  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [symptom, setSymptom] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [symptomAnalysisResult, setSymptomAnalysisResult] = useState(null);
  const [analyzingSymptoms, setAnalyzingSymptoms] = useState(false);
  const [filteredSymptoms, setFilteredSymptoms] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [detectingDepartment, setDetectingDepartment] = useState(false);
  const [romanUrduNote, setRomanUrduNote] = useState(""); // Roman Urdu translation notice
  const [patientLocation, setPatientLocation] = useState({ lat: "", lng: "" });
  const [manualPatientLocation, setManualPatientLocation] = useState({ lat: "", lng: "" });
  const [locationReady, setLocationReady] = useState(false);
  const [diseasePickerOpen, setDiseasePickerOpen] = useState(false);
  const [diseaseSearch, setDiseaseSearch] = useState("");
  const [hospitalRecommendations, setHospitalRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState("");
  const [doctorDate, setDoctorDate] = useState(getTodayLocalYmd());
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentFeedbackDrafts, setAppointmentFeedbackDrafts] = useState({});
  const [submittingFeedbackAppointmentId, setSubmittingFeedbackAppointmentId] = useState("");
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapHospital, setMapHospital] = useState(null);
  const [mapUserLocation, setMapUserLocation] = useState(null);
  const [mapLocationSource, setMapLocationSource] = useState("");
  const [manualOrigin, setManualOrigin] = useState({ lat: "", lng: "" });
  const [loadingMapLocation, setLoadingMapLocation] = useState(false);
  const [loadingRouteInsights, setLoadingRouteInsights] = useState(false);
  const [routeInsightsError, setRouteInsightsError] = useState("");
  const [routeInsights, setRouteInsights] = useState({
    driving: null,
    cycling: null,
    shortest_path: null,
  });
  const [bookingForm, setBookingForm] = useState({
    doctor_id: "",
    time_slot: "",
    date: getTodayLocalYmd(),
  });
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const PATIENT_DISMISSED_KEY = `dismissed_notifs_${authUser?._id || 'patient'}`;
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`dismissed_notifs_${authUser?._id || 'patient'}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [bookingShift, setBookingShift] = useState(getCurrentShift());
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [detectedDepartment, setDetectedDepartment] = useState("");
  const [selectedHospitalResources, setSelectedHospitalResources] = useState(null);
  const [loadingSelectedHospitalResources, setLoadingSelectedHospitalResources] = useState(false);

  useEffect(() => {
    if (!selectedRecommendationId) {
      setSelectedHospitalResources(null);
      return;
    }
    const fetchResources = async () => {
      setLoadingSelectedHospitalResources(true);
      try {
        const flaskHost = window.location.hostname || "localhost";
        const res = await fetch(`http://${flaskHost}:5002/api/hospitals/${selectedRecommendationId}/resources/live`);
        const data = await res.json();
        if (data.success) {
          setSelectedHospitalResources(data.resources);
        }
      } catch (err) {
        console.error("Error fetching hospital live resources:", err);
      } finally {
        setLoadingSelectedHospitalResources(false);
      }
    };
    void fetchResources();
  }, [selectedRecommendationId]);

  const getResourceAvailability = (resourceName) => {
    if (!selectedHospitalResources) return null;
    const allResources = Object.values(selectedHospitalResources).flat();
    const topDisease = symptomAnalysisResult?.topDiseases?.[0];
    const dept = topDisease?.specialist || detectedDepartment || aiResult?.department || "General Medicine";

    // Try matching by name AND department
    let match = allResources.find(
      (r) =>
        (r.name.toLowerCase().trim() === resourceName.toLowerCase().trim() ||
         resourceName.toLowerCase().trim().includes(r.name.toLowerCase().trim()) ||
         r.name.toLowerCase().trim().includes(resourceName.toLowerCase().trim())) &&
        r.department_name && normalizeDeptName(r.department_name) === normalizeDeptName(dept)
    );

    // Fallback to name only
    if (!match) {
      match = allResources.find(
        (r) =>
          r.name.toLowerCase().trim() === resourceName.toLowerCase().trim() ||
          resourceName.toLowerCase().trim().includes(r.name.toLowerCase().trim()) ||
          r.name.toLowerCase().trim().includes(resourceName.toLowerCase().trim())
      );
    }
    return match || null;
  };

  const getLiveResourceSummary = () => {
    // 1. Get required resources for the current predicted department/disease
    const topDisease = symptomAnalysisResult?.topDiseases?.[0];
    const dept = topDisease?.specialist || detectedDepartment || aiResult?.department || "General Medicine";

    // Get live resources for this department from the hospital
    let deptLiveResources = [];
    if (selectedHospitalResources) {
      const allRes = Object.values(selectedHospitalResources).flat();
      deptLiveResources = allRes.filter(r =>
        r.department_name && normalizeDeptName(r.department_name) === normalizeDeptName(dept)
      );
    }

    const baseResources = deptLiveResources.length > 0
      ? deptLiveResources.map(r => r.name)
      : ((topDisease?.required_resources && topDisease.required_resources.length > 0)
          ? topDisease.required_resources
          : (DEPARTMENT_DEFAULT_RESOURCES[dept] || DEPARTMENT_DEFAULT_RESOURCES["General Medicine"] || []));

    const genericSet = new Set([
      "hospital bed","pediatric bed","thermometer","gloves","surgical mask",
      "basic medicines","stethoscope","bp monitor","pulse oximeter","iv line",
      "iv fluids","surgical gown","oxygen cylinder","oxygen mask","syringe",
      "bandage","cotton","antiseptic","gauze","saline","drip stand",
      "wheelchair","stretcher","bed sheet","pillow","blanket","towel",
      "hand sanitizer","face shield","ppe kit","waste bin","sharps container"
    ]);
    const specialtyResources = baseResources.filter(r => !genericSet.has(r.toLowerCase().trim()));
    const genericResources = baseResources.filter(r => genericSet.has(r.toLowerCase().trim()));
    
    const sortedResources = deptLiveResources.length > 0
      ? deptLiveResources.map(r => r.name).slice(0, 5)
      : (specialtyResources.length >= 3
          ? specialtyResources.slice(0, 5)
          : [...specialtyResources, ...genericResources].slice(0, 5));

    if (sortedResources.length === 0) {
      return { availableCount: 0, totalCount: 0, statusText: "No resources needed" };
    }

    // 2. Count how many of these sorted resources are actually available
    let availableCount = 0;
    let totalCount = sortedResources.length;

    sortedResources.forEach(resName => {
      const avail = getResourceAvailability(resName);
      if (avail) {
        const isOut = avail.status.toLowerCase().includes("out") || avail.units === 0;
        if (!isOut) {
          availableCount++;
        }
      }
    });

    const statusText = availableCount === totalCount ? "Available" : (availableCount > 0 ? "Partially Available" : "Not Available");

    return { availableCount, totalCount, statusText };
  };

  // Manual Search State Variables
  const [searchFilters, setSearchFilters] = useState({
    department: "",
    doctor_name: "",
    hospital_name: "",
    city: "",
  });
  const [searchResults, setSearchResults] = useState({ hospitals: [], doctors: [] });
  const [searching, setSearching] = useState(false);

  // Stripe payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingBookingDetails, setPendingBookingDetails] = useState(null);

  const selectedRecommendation = hospitalRecommendations.find(
    (item) => String(item.hospital_id) === String(selectedRecommendationId)
  ) || null;
  const effectiveHospitalId = String(selectedRecommendation?.hospital_id || "");
  const effectiveDepartment = String(
    selectedRecommendation?.department || aiResult?.department || ""
  );

  const syncSessionUser = (updatedProfile) => {
    const token = getAuthToken();
    if (!token || !updatedProfile) return;

    const remember = getRememberPreference();
    const existing = getAuthUser() || {};
    setAuthSession(
      token,
      {
        ...existing,
        username: updatedProfile.username || existing.username,
        email: updatedProfile.email || existing.email,
        role: updatedProfile.role || existing.role,
        auth_provider: updatedProfile.auth_provider || existing.auth_provider,
      },
      remember
    );
  };

  useEffect(() => {
    if (!authUser || authRole !== "patient") {
      navigate("/login", { replace: true });
      return;
    }

    if (profileLoadStartedRef.current) return;
    profileLoadStartedRef.current = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/patient/profile");
        const loadedProfile = data?.profile || null;
        setProfile(loadedProfile);
        setEditForm({
          username: "", // Disabled auto-fill as requested by user
          phone: String(loadedProfile?.phone || ""),
          city: "", // Disabled auto-fill as requested by user
          address: String(loadedProfile?.address || ""),
          age: loadedProfile?.age === null || loadedProfile?.age === undefined ? "" : String(loadedProfile?.age),
          gender: String(loadedProfile?.gender || ""),
        });
        setEmailForm({ currentEmail: "", email: "", code: "" }); // Disabled auto-fill as requested by user

        let loc = null;
        try {
          loc = await fetchApproxLocationFromIP();
        } catch (err) {
          console.warn("Could not fetch IP location on mount", err);
        }

        const params = {};
        if (loadedProfile?.city) params.city = loadedProfile.city;
        if (loc) {
          params.lat = loc.lat;
          params.lng = loc.lng;
          // Set state so other components can use it
          setPatientLocation({ lat: String(loc.lat), lng: String(loc.lng) });
          setLocationReady(true);
        }

        const [hospitalResp, appointmentResp] = await Promise.all([
          api.get("/hospitals", { params }),
          api.get("/patient/appointments").catch(() => ({ data: { appointments: [] } })),
        ]);

        const hospitalRows = hospitalResp?.data?.hospitals || [];
        setHospitals(hospitalRows);
        if (hospitalRows.length > 0) setSelectedHospitalId(String(hospitalRows[0]._id));
        setAppointments(appointmentResp?.data?.appointments || []);
      } catch (error) {
        if (error?.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          clearAuthSession();
          navigate("/login", { replace: true });
          return;
        }
        toast.error(error?.response?.data?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [authRole, navigate]);

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  const handleRefresh = async () => {
    try {
      const [profileResp, appointmentResp] = await Promise.all([
        api.get("/patient/profile").catch(() => null),
        api.get("/patient/appointments").catch(() => null),
      ]);
      if (profileResp?.data?.profile) {
        setProfile(profileResp.data.profile);
      }
      if (appointmentResp?.data?.appointments) {
        setAppointments(appointmentResp.data.appointments);
      }
      if (selectedRecommendationId) {
        try {
          const flaskHost = window.location.hostname || "localhost";
          const res = await fetch(`http://${flaskHost}:5002/api/hospitals/${selectedRecommendationId}/resources/live`);
          const data = await res.json();
          if (data.success) {
            setSelectedHospitalResources(data.resources);
          }
        } catch (err) {
          console.error("Error refreshing hospital live resources:", err);
        }
      }
      toast.success("Dashboard data refreshed.");
    } catch (err) {
      toast.error("Failed to refresh data.");
    }
  };

  const clearMapLocationWatcher = () => {
    if (mapWatchIdRef.current !== null && navigator?.geolocation) {
      navigator.geolocation.clearWatch(mapWatchIdRef.current);
      mapWatchIdRef.current = null;
    }
  };

  useEffect(() => () => {
    clearMapLocationWatcher();
  }, []);

  const closeMapModal = () => {
    clearMapLocationWatcher();
    setMapModalOpen(false);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const username = String(editForm.username || "").trim();
    const phone = String(editForm.phone || "").trim();
    const city = String(editForm.city || "").trim();
    const address = String(editForm.address || "").trim();
    const ageValue = String(editForm.age || "").trim();
    const gender = String(editForm.gender || "").trim();

    if (username.length < 3) {
      toast.error("Name must be at least 3 characters.");
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        name: username,
        phone,
        city,
        address,
        age: ageValue === "" ? undefined : Number(ageValue),
        gender,
      };

      const { data } = await api.put("/patient/profile", payload);
      const updatedProfile = data?.profile || null;
      setProfile((prev) => ({ ...(prev || {}), ...(updatedProfile || {}), username, phone, city, address, age: payload.age, gender }));
      syncSessionUser({ ...(profile || {}), ...(updatedProfile || {}), username, phone, city, address, age: payload.age, gender });
      toast.success(data?.message || "Profile updated successfully.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestEmailOtp = async () => {
    const currentEmail = String(emailForm.currentEmail || "").trim().toLowerCase();
    const email = String(emailForm.email || "").trim().toLowerCase();

    if (!currentEmail) {
      toast.error("Please enter your current email address.");
      return;
    }
    if (currentEmail !== String(profile?.email || "").trim().toLowerCase()) {
      toast.error("Current email address is incorrect.");
      return;
    }
    if (!email) {
      toast.error("Please enter a new email address.");
      return;
    }

    setRequestingEmailOtp(true);
    try {
      const { data } = await api.post("/auth/profile/request-email-change", { email });
      setEmailOtpRequested(true);
      toast.success(data?.message || "OTP sent to your new email.");
      if (data?.delivery === "console" && data?.debug_otp) {
        toast.info(`Debug OTP: ${data.debug_otp}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send email change OTP.");
    } finally {
      setRequestingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const email = String(emailForm.email || "").trim().toLowerCase();
    const code = String(emailForm.code || "").trim();

    if (!email || !code) {
      toast.error("Please enter email and OTP code.");
      return;
    }

    setVerifyingEmailOtp(true);
    try {
      const { data } = await api.post("/auth/profile/verify-email-change", { email, code });
      const updatedProfile = data?.profile || null;
      setProfile((prev) => ({ ...(prev || {}), ...(updatedProfile || {}), email }));
      syncSessionUser({ ...(profile || {}), ...(updatedProfile || {}), email });
      setEmailOtpRequested(false);
      setEmailForm({ email, code: "" });
      toast.success(data?.message || "Email updated successfully.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to verify OTP.");
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const loadDoctors = async (hospitalId = effectiveHospitalId, departmentName = effectiveDepartment, dateValue = doctorDate) => {
    if (!hospitalId) {
      toast.error("Select a hospital first.");
      return;
    }

    setLoadingDoctors(true);
    try {
      const { data } = await api.get("/patient/doctors", {
        params: {
          hospital_id: hospitalId,
          department: departmentName || undefined,
          date: dateValue,
        },
      });
      const rows = data?.doctors || [];
      setDoctors(rows);
      setBookingForm((prev) => ({ ...prev, doctor_id: "", time_slot: "", date: dateValue }));

      // If department was not found in this hospital, show info (not an error)
      if (data?.department_fallback && data?.department_fallback_message) {
        toast(`ℹ️ ${data.department_fallback_message}`, { icon: "ℹ️" });
      } else if (rows.length === 0) {
        toast("No doctors found for this hospital on the selected date.", { icon: "⚠️" });
      }
    } catch (error) {
      // If it was a department-not-found error from old backend, just retry without department
      if (error?.response?.status === 400 && error?.response?.data?.message?.includes("Department")) {
        try {
          const { data } = await api.get("/patient/doctors", {
            params: { hospital_id: hospitalId, date: dateValue },
          });
          const rows = data?.doctors || [];
          setDoctors(rows);
          setBookingForm((prev) => ({ ...prev, doctor_id: "", time_slot: "", date: dateValue }));
          toast(`ℹ️ "${departmentName}" not in this hospital — showing all doctors.`, { icon: "ℹ️" });
        } catch (retryError) {
          toast.error(retryError?.response?.data?.message || "Failed to load doctors.");
          setDoctors([]);
        }
      } else {
        toast.error(error?.response?.data?.message || "Failed to load doctors.");
        setDoctors([]);
      }
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleUseCurrentLocation = async ({
    silentSuccess = false,
    forceRefresh = false,
    allowApproximateFallback = true,
    allowManualFallback = true,
  } = {}) => {
    const currentLat = Number(patientLocation.lat);
    const currentLng = Number(patientLocation.lng);
    if (!forceRefresh && locationReady && Number.isFinite(currentLat) && Number.isFinite(currentLng)) {
      return { ok: true, lat: currentLat, lng: currentLng };
    }

    const saveLocation = (lat, lng) => {
      setPatientLocation({
        lat: formatLocationNumber(lat),
        lng: formatLocationNumber(lng),
      });
      setLocationReady(true);
    };

    const getManualPatientCoordinates = () => {
      if (!allowManualFallback) return null;
      const manualLat = Number(manualPatientLocation.lat);
      const manualLng = Number(manualPatientLocation.lng);
      if (!Number.isFinite(manualLat) || !Number.isFinite(manualLng)) {
        return null;
      }
      return { lat: manualLat, lng: manualLng };
    };

    const requestCoordinates = (options) => new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords?.latitude);
          const lng = Number(position.coords?.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            resolve({ ok: false, lat: null, lng: null });
            return;
          }

          saveLocation(lat, lng);
          resolve({ ok: true, lat, lng });
        },
        () => resolve({ ok: false, lat: null, lng: null }),
        options
      );
    });

    const useApproximateIPFallback = async () => {
      if (!allowApproximateFallback) {
        return { ok: false, lat: null, lng: null };
      }

      const approx = await fetchApproxLocationFromIP();
      if (!approx) {
        return { ok: false, lat: null, lng: null };
      }

      saveLocation(approx.lat, approx.lng);
      if (!silentSuccess) {
        toast.info("Using approximate location (IP). For better accuracy, enable device GPS/location services.");
      }
      return { ok: true, lat: approx.lat, lng: approx.lng };
    };

    if (!navigator?.geolocation) {
      const manualCoordinates = getManualPatientCoordinates();
      if (manualCoordinates) {
        saveLocation(manualCoordinates.lat, manualCoordinates.lng);
        if (!silentSuccess) {
          toast.info("Using manually entered location coordinates.");
        }
        return { ok: true, lat: manualCoordinates.lat, lng: manualCoordinates.lng };
      }

      const fallbackResult = await useApproximateIPFallback();
      if (!fallbackResult.ok) {
        toast.error("Geolocation is not supported in this browser.");
        setLocationReady(false);
      }
      return fallbackResult;
    }

    try {
      if (navigator.permissions?.query) {
        const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
        if (permissionStatus.state === "denied") {
          const manualCoordinates = getManualPatientCoordinates();
          if (manualCoordinates) {
            saveLocation(manualCoordinates.lat, manualCoordinates.lng);
            if (!silentSuccess) {
              toast.info("Using manually entered location coordinates.");
            }
            return { ok: true, lat: manualCoordinates.lat, lng: manualCoordinates.lng };
          }

          const fallbackResult = await useApproximateIPFallback();
          if (!fallbackResult.ok) {
            setLocationReady(false);
            toast.error("Location permission is denied. Enable it in browser settings and try again.");
          }
          return fallbackResult;
        }
      }
    } catch {
      // Continue and request location directly when permissions API is unavailable.
    }

    const preciseResult = await requestCoordinates({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
    if (preciseResult.ok) {
      if (!silentSuccess) toast.success("Current location captured.");
      return preciseResult;
    }

    const coarseResult = await requestCoordinates({ enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 });
    if (coarseResult.ok) {
      if (!silentSuccess) {
        toast.info("Approximate device location captured. Accuracy may vary on desktop/laptop.");
      }
      return coarseResult;
    }

    const fallbackResult = await useApproximateIPFallback();
    if (!fallbackResult.ok) {
      const manualCoordinates = getManualPatientCoordinates();
      if (manualCoordinates) {
        saveLocation(manualCoordinates.lat, manualCoordinates.lng);
        if (!silentSuccess) {
          toast.info("Using manually entered location coordinates.");
        }
        return { ok: true, lat: manualCoordinates.lat, lng: manualCoordinates.lng };
      }

      setLocationReady(false);
      toast.error("Unable to detect your live GPS location. Please allow location permission and try again.");
    }
    return fallbackResult;
  };

  const selectedDiseaseDetails = (() => {
    const normalizedSymptom = String(symptom || "").trim().toLowerCase();
    if (!normalizedSymptom) return null;

    return DISEASE_PICKER_ITEMS.find((item) => String(item.disease || "").trim().toLowerCase() === normalizedSymptom) ||
      DISEASE_PICKER_ITEMS.find((item) => normalizedSymptom.includes(String(item.disease || "").trim().toLowerCase()));
  })();

  const filteredDiseaseItems = DISEASE_PICKER_ITEMS.filter((item) => {
    const searchText = String(diseaseSearch || "").trim().toLowerCase();
    if (!searchText) return true;
    return String(item.disease || "").toLowerCase().includes(searchText);
  });

  const diseasePickerSummary = selectedDiseaseDetails
    ? `${selectedDiseaseDetails.disease}`
    : symptom
      ? symptom
      : "Choose a disease from the 18 department catalog";

  const openDiseasePicker = async () => {
    await handleUseCurrentLocation({ silentSuccess: true });
    setDiseasePickerOpen(true);
    setDiseaseSearch(String(symptom || ""));
  };

  const chooseDisease = (disease) => {
    setSymptom(disease);
    setAiResult(null);
    setHospitalRecommendations([]);
    setSelectedRecommendationId("");
    setDoctors([]);
    setSelectedHospitalId("");
    setBookingForm((prev) => ({ ...prev, doctor_id: "", time_slot: "" }));
    setDiseasePickerOpen(false);
    setShowAllDoctors(false);
    setBookingShift(getCurrentShift());

    // Set detected department from catalog
    const catalogItem = DISEASE_PICKER_ITEMS.find(
      (item) => String(item.disease || "").toLowerCase() === String(disease || "").toLowerCase()
    );
    if (catalogItem?.department) {
      setDetectedDepartment(catalogItem.department);
    } else {
      setDetectedDepartment("");
    }

    toast.success(`Selected ${disease}.`);

    // Ask for live location once when disease is selected.
    if (!locationReady) {
      void handleUseCurrentLocation({
        forceRefresh: true,
        allowApproximateFallback: false,
        allowManualFallback: false,
      });
    }
  };

  const handleSymptomChange = async (e) => {
    const val = e.target.value;
    setSymptom(val);

    if (val.trim().length >= 2) {
      try {
        const { data } = await api.get("/symptoms");
        if (Array.isArray(data)) {
          const parts = val.split(/,\s*/);
          const lastPart = parts[parts.length - 1].toLowerCase().trim();
          if (lastPart.length >= 2) {
            const matches = data.filter(s => s.toLowerCase().includes(lastPart));
            setFilteredSymptoms(matches.slice(0, 10));
            setShowAutocomplete(true);
          } else {
            setShowAutocomplete(false);
          }
        }
      } catch (err) {
        console.error("Error fetching symptoms for autocomplete:", err);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  const selectSymptomSuggestion = (selected) => {
    const parts = symptom.split(/,\s*/);
    parts[parts.length - 1] = selected;
    setSymptom(parts.join(", ") + ", ");
    setShowAutocomplete(false);
  };

  const analyzeSymptomInput = async () => {
    const rawInput = String(symptom || "").trim();

    if (!rawInput || rawInput.length === 0) {
      toast.error("Please enter your symptoms first.");
      return;
    }

    // Translate Roman Urdu → English before sending to AI
    const { translated: userInput, wasTranslated } = translateRomanUrduClient(rawInput);
    if (wasTranslated) {
      setRomanUrduNote(`Roman Urdu detected — translated to: "${userInput}"`);
      toast.info(`Roman Urdu translated: "${userInput}"`, { autoClose: 4000 });
    } else {
      setRomanUrduNote("");
    }

    const city = profile?.city || editForm.city || "Faisalabad";

    setAnalyzingSymptoms(true);
    try {
      const { data } = await api.post("/analyze", {
        symptoms: userInput,
        city: city,
        date: doctorDate
      });

      setSymptomAnalysisResult(data);

      // Detect department from top disease
      const topDisease = data.topDiseases && data.topDiseases.length > 0 ? data.topDiseases[0] : null;
      const targetDept = topDisease ? topDisease.specialist : "General Medicine";
      setDetectedDepartment(targetDept);

      // Auto-set shift to current shift
      const currentShift = getCurrentShift();
      setBookingShift(currentShift);
      setShowAllDoctors(false);

      // Update hospital recommendations with the ones returned from the Flask API
      const flaskHospitals = Array.isArray(data.recommendedHospitals) ? data.recommendedHospitals : [];
      if (flaskHospitals.length > 0) {
        const formatted = flaskHospitals.map(h => ({
          hospital_id: h.id,
          hospital_name: h.name,
          city: h.city,
          type: h.type,
          address: h.address,
          phone: h.phone,
          emergency_priority: h.emergency,
          specialties: h.specialties,
          resources: h.resources || {},
          available_beds: h.emergency ? 5 : 2,
          available_doctors: 3,
          hospital_rating: 4.5,
          estimated_waiting_time_minutes: h.emergency ? 10 : 30,
          status: "approved",
          distance_km: null,
          distance_source: null
        }));
        setHospitalRecommendations(formatted);

        // Auto-select first recommended hospital if any
        if (formatted.length > 0) {
          const firstHosp = formatted[0];
          setSelectedRecommendationId(firstHosp.hospital_id);
          setSelectedHospitalId(firstHosp.hospital_id);

          setAiResult({
            department: targetDept,
            message: `Selected ${firstHosp.hospital_name}. Showing ${currentShift} doctors for ${targetDept}.`,
            hospital_department_available: true,
            resource_availability: {
              available: true,
              available_resources: 5,
              total_resources: 5
            }
          });

          await loadDoctors(firstHosp.hospital_id, targetDept, doctorDate);
        }
      } else {
        // ── Fallback: Flask returned no hospitals → use our DB-based recommendation ──
        // This commonly happens with broad symptoms like "fever" where Flask ML
        // can't narrow down a specific disease from just 1 symptom.
        try {
          // Get patient location
          const locResult = await handleUseCurrentLocation({
            silentSuccess: true,
            forceRefresh: false,
            allowApproximateFallback: true,
            allowManualFallback: false,
          });
          const lat = Number(locResult?.lat);
          const lng = Number(locResult?.lng);
          const patientCity = String(profile?.city || editForm.city || "").trim() || undefined;

          const { data: recData } = await api.post("/ai/recommend-hospitals", {
            disease: userInput,
            patient_location: Number.isFinite(lat) && Number.isFinite(lng)
              ? { lat, lng }
              : { lat: 31.5204, lng: 74.3587 }, // default Lahore if no GPS
            preferred_city: patientCity,
            max_distance_km: 300,
            require_exact_location: false,
          });

          const recommendations = recData?.recommendations || [];
          if (recommendations.length > 0) {
            setHospitalRecommendations(recommendations);
            const firstHosp = recommendations[0];
            setSelectedRecommendationId(firstHosp.hospital_id);
            setSelectedHospitalId(firstHosp.hospital_id);

            const recDept = recData?.input?.mapped_department || targetDept;
            setDetectedDepartment(recDept);

            setAiResult({
              department: recDept,
              message: `Found ${recommendations.length} hospital(s) for "${userInput}" (${recDept}). Select one to view doctors.`,
              hospital_department_available: true,
            });

            await loadDoctors(firstHosp.hospital_id, recDept, doctorDate);
          } else {
            setAiResult({
              department: targetDept,
              message: `Symptoms analyzed. Department: ${targetDept}. Click "Find Best Hospitals & Doctors" to search nearby hospitals.`,
              hospital_department_available: false,
            });
          }
        } catch (recError) {
          console.warn("Fallback hospital recommendation failed:", recError);
          setAiResult({
            department: targetDept,
            message: `Symptoms analyzed. Department: ${targetDept}. Click "Find Best Hospitals & Doctors" to search nearby hospitals.`,
            hospital_department_available: false,
          });
        }
      }

      toast.success("Symptoms analyzed! Check the department, hospitals and doctors below.");
    } catch (error) {
      console.error("Error analyzing symptoms:", error);
      toast.error(error?.response?.data?.error || "Error analyzing symptoms. Please try again.");
    } finally {
      setAnalyzingSymptoms(false);
    }
  };


  const handleFindHospitalRecommendations = async () => {
    const rawDisease = String(symptom || "").trim();

    if (!rawDisease) {
      toast.error("Please enter disease/symptom.");
      return;
    }

    // Translate Roman Urdu → English before sending to backend
    const { translated: disease, wasTranslated } = translateRomanUrduClient(rawDisease);
    if (wasTranslated) {
      setRomanUrduNote(`Roman Urdu detected — searching for: "${disease}"`);
      toast.info(`Searching hospitals for: "${disease}"`, { autoClose: 3000 });
    } else {
      setRomanUrduNote("");
    }

    const locationResult = await handleUseCurrentLocation({
      silentSuccess: true,
      forceRefresh: false,
      allowApproximateFallback: false,
      allowManualFallback: false,
    });
    if (!locationResult.ok || !Number.isFinite(locationResult.lat) || !Number.isFinite(locationResult.lng)) {
      toast.error("Live GPS location is required. Allow browser location permission and retry.");
      return;
    }

    const lat = Number(locationResult.lat);
    const lng = Number(locationResult.lng);

    setLoadingRecommendations(true);
    try {
      const { data: exactData } = await api.post("/ai/recommend-hospitals", {
        disease,
        patient_location: { lat, lng },
        preferred_city: String(profile?.city || "").trim() || undefined,
        max_distance_km: RECOMMENDATION_MAX_DISTANCE_KM,
        require_exact_location: true,
      });

      let data = exactData;
      let usedRelaxedFallback = false;
      if (!Array.isArray(exactData?.recommendations) || exactData.recommendations.length === 0) {
        const { data: fallbackData } = await api.post("/ai/recommend-hospitals", {
          disease,
          patient_location: { lat, lng },
          preferred_city: String(profile?.city || "").trim() || undefined,
          max_distance_km: RECOMMENDATION_MAX_DISTANCE_KM,
          require_exact_location: false,
        });
        data = fallbackData;
        usedRelaxedFallback = true;
      }

      const recommendations = data?.recommendations || [];
      const routableRecommendations = recommendations.map((item) => {
        const hospitalLat = Number(item?.geo_location?.lat);
        const hospitalLng = Number(item?.geo_location?.lng);

        const apiDistance = Number(item?.distance_km);
        const resolvedDistance = Number.isFinite(apiDistance)
          ? apiDistance
          : (Number.isFinite(hospitalLat) && Number.isFinite(hospitalLng)
            ? Number(haversineDistanceKmLocal(lat, lng, hospitalLat, hospitalLng).toFixed(2))
            : null);

        return { ...item, distance_km: resolvedDistance };
      });

      setHospitalRecommendations(routableRecommendations);
      setSelectedRecommendationId("");
      setDoctors([]);
      setSelectedHospitalId("");
      setBookingForm((prev) => ({ ...prev, doctor_id: "", time_slot: "", date: doctorDate }));
      setShowAllDoctors(false);
      setBookingShift(getCurrentShift());
      setAiResult({
        department: data?.input?.mapped_department || "",
        message: routableRecommendations.length > 0
          ? (usedRelaxedFallback
            ? "Exact GPS hospitals were not found nearby. Showing best registered hospitals from this app instead."
            : "Hospitals found. Select a hospital to load doctors.")
          : (data?.message || `No hospitals with available resources found within ${RECOMMENDATION_MAX_DISTANCE_KM} km for this disease.`),
        hospital_department_available: routableRecommendations.length > 0,
      });

      toast.success(routableRecommendations.length > 0
        ? (usedRelaxedFallback ? "Loaded best registered hospitals (fallback mode)." : "Hospital recommendations loaded.")
        : "No hospitals found.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load hospital recommendations.");
      setHospitalRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleManualSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSearching(true);
    try {
      const params = { ...searchFilters };
      if (patientLocation.lat && patientLocation.lng) {
        params.lat = patientLocation.lat;
        params.lng = patientLocation.lng;
      }
      const { data } = await api.get("/patient/search", { params });
      if (data.success) {
        setSearchResults({
          hospitals: data.hospitals || [],
          doctors: data.doctors || [],
        });
        toast.success("Search results updated.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const handleBookFromSearch = async (doctor) => {
    const rec = {
      hospital_id: doctor.hospital.id,
      hospital_name: doctor.hospital.name,
      city: doctor.hospital.city,
      address: doctor.hospital.address,
      department: doctor.department,
      available_beds: 5,
      available_doctors: 3,
      distance_km: doctor.hospital.distance_km,
    };

    setHospitalRecommendations([rec]);
    setSelectedRecommendationId(doctor.hospital.id);
    setSelectedHospitalId(doctor.hospital.id);
    setSymptom(doctor.specialization || doctor.department);

    setAiResult({
      department: doctor.department,
      message: `Selected ${doctor.hospital.name} via Search.`,
      hospital_department_available: true,
    });

    setBookingForm((prev) => ({
      ...prev,
      doctor_id: doctor.id,
      time_slot: "",
      date: doctorDate,
    }));

    setActiveSection("booking");
    await loadDoctors(doctor.hospital.id, doctor.department, doctorDate);
    setBookingForm((prev) => ({
      ...prev,
      doctor_id: doctor.id,
      time_slot: "",
      date: doctorDate,
    }));
  };

  const applyRecommendation = async (recommendation) => {
    // Reset to current shift and hide other doctors when new hospital is selected
    setBookingShift(getCurrentShift());
    setShowAllDoctors(false);
    if (!recommendation?.hospital_id) return;

    if (String(selectedRecommendationId) === String(recommendation.hospital_id)) {
      setSelectedRecommendationId("");
      setSelectedHospitalId("");
      setDoctors([]);
      setBookingForm((prev) => ({
        ...prev,
        doctor_id: "",
        time_slot: "",
      }));
      toast.success("Hospital unselected. Showing all recommendations.");
      return;
    }

    const locationResult = await handleUseCurrentLocation({ silentSuccess: true });
    const hospitalCoordinates = getHospitalCoordinates(recommendation);
    if (locationResult.ok && hospitalCoordinates) {
      const recalculatedDistance = Number(
        haversineDistanceKmLocal(
          Number(locationResult.lat),
          Number(locationResult.lng),
          hospitalCoordinates.lat,
          hospitalCoordinates.lng
        ).toFixed(2)
      );

      setHospitalRecommendations((prev) => prev.map((item) => (
        String(item.hospital_id) === String(recommendation.hospital_id)
          ? { ...item, distance_km: recalculatedDistance }
          : item
      )));
    }

    setSelectedRecommendationId(String(recommendation.hospital_id));
    setSelectedHospitalId(String(recommendation.hospital_id));

    const nextDate = doctorDate;
    setAiResult({
      department: recommendation.department || aiResult?.department || "",
      message: `Selected ${recommendation.hospital_name}. Doctors are loading.`,
      hospital_department_available: true,
      resource_availability: {
        available: Number(recommendation.available_beds || 0) > 0 && Number(recommendation.available_doctors || 0) > 0,
        available_resources: Number(recommendation.available_beds || 0),
        total_resources: Number(recommendation.available_beds || 0),
      },
    });

    await loadDoctors(String(recommendation.hospital_id), recommendation.department || aiResult?.department || "", nextDate);

    setBookingForm((prev) => ({
      ...prev,
      doctor_id: "",
      time_slot: "",
      date: nextDate,
    }));
  };

  const handleNotifyAdminResource = async (resName, hospitalId, hospitalName, deptName) => {
    if (!hospitalId) {
      toast.error("Please select a hospital first to notify its admin.");
      return;
    }
    try {
      const { data } = await api.post("/patient/notify-admin-resource", {
        resource_name: resName,
        hospital_id: hospitalId,
        department_name: deptName || ""
      });
      if (data.success) {
        toast.success(`🚀 Admin of ${hospitalName || "selected hospital"} has been notified to check stock for "${resName}"!`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to notify hospital admin.");
    }
  };

  const detectDepartment = async () => {
    if (!selectedHospitalId) {
      toast.error("Please select hospital first.");
      return;
    }
    if (!String(symptom || "").trim()) {
      toast.error("Please enter disease/symptom.");
      return;
    }

    setDetectingDepartment(true);
    try {
      const { data } = await api.post("/ai/detect-department", {
        symptom,
        hospital_id: selectedHospitalId,
      });
      setAiResult(data || null);
      if (data?.hospital_department_available === false) {
        setDoctors([]);
        toast.error(data?.message || "Department not available in this hospital");
        return;
      }
      await loadDoctors(selectedHospitalId, data?.department || "", doctorDate);
      toast.success("Department detected successfully.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to detect department.");
    } finally {
      setDetectingDepartment(false);
    }
  };

  const loadAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const { data } = await api.get("/patient/appointments");
      setAppointments(data?.appointments || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load appointments.");
    } finally {
      setLoadingAppointments(false);
    }
  };

  const setAppointmentFeedbackDraft = (appointmentId, patch) => {
    const key = String(appointmentId || "");
    if (!key) return;
    setAppointmentFeedbackDrafts((prev) => {
      const current = prev[key] || { rating: "", comment: "" };
      return {
        ...prev,
        [key]: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const submitAppointmentFeedback = async (appointmentId) => {
    const key = String(appointmentId || "");
    if (!key) return;

    const draft = appointmentFeedbackDrafts[key] || {};
    const rating = Number(draft.rating);
    const comment = String(draft.comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      toast.error("Please select a rating from 1 to 5.");
      return;
    }

    setSubmittingFeedbackAppointmentId(key);
    try {
      const { data } = await api.post(`/patient/appointments/${key}/feedback`, {
        rating,
        comment,
      });
      toast.success(data?.message || "Feedback submitted.");
      setAppointmentFeedbackDrafts((prev) => ({ ...prev, [key]: { rating: "", comment: "" } }));
      await loadAppointments();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit feedback.");
    } finally {
      setSubmittingFeedbackAppointmentId("");
    }
  };

  const openHospitalMap = (hospital) => {
    if (!hospital) {
      toast.error("Hospital location is not available for this appointment.");
      return;
    }

    const normalizedHospital = {
      name: hospital?.name || hospital?.hospital_name || "Hospital",
      address: hospital?.address || "",
      city: hospital?.city || "",
      geo_location: hospital?.geo_location || null,
    };

    setMapHospital(normalizedHospital);
    setMapModalOpen(true);
    setMapUserLocation(null);
    setMapLocationSource("");
    setManualOrigin({ lat: "", lng: "" });
    setLoadingMapLocation(true);
    setRouteInsightsError("");
    setRouteInsights({ driving: null, cycling: null, shortest_path: null });
    setLoadingRouteInsights(false);
    lastRouteOriginRef.current = null;
    routeRequestTokenRef.current = 0;

    clearMapLocationWatcher();

    const destination = getHospitalCoordinates(normalizedHospital);
    if (!destination) {
      setLoadingMapLocation(false);
      setRouteInsightsError("Hospital coordinates are missing, so route distance cannot be calculated.");
      return;
    }

    const requestRoutes = async (origin, destinationLocation) => {
      const requestToken = routeRequestTokenRef.current + 1;
      routeRequestTokenRef.current = requestToken;

      try {
        setLoadingRouteInsights(true);
        setRouteInsightsError("");

        const fetchRoute = async (profile) => {
          const endpoint = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${destinationLocation.lng},${destinationLocation.lat}?alternatives=true&overview=false&steps=false`;
          const response = await fetch(endpoint);
          if (!response.ok) {
            throw new Error(`Route API failed for ${profile}`);
          }

          const payload = await response.json();
          const routes = Array.isArray(payload?.routes) ? payload.routes : [];
          if (routes.length === 0) {
            throw new Error(`No ${profile} routes found`);
          }

          const fastest = routes.reduce((best, route) => (route.duration < best.duration ? route : best), routes[0]);
          const shortest = routes.reduce((best, route) => (route.distance < best.distance ? route : best), routes[0]);

          return {
            fastest_duration_min: Number((Number(fastest.duration || 0) / 60).toFixed(1)),
            fastest_distance_km: Number((Number(fastest.distance || 0) / 1000).toFixed(2)),
            shortest_distance_km: Number((Number(shortest.distance || 0) / 1000).toFixed(2)),
            shortest_duration_min: Number((Number(shortest.duration || 0) / 60).toFixed(1)),
          };
        };

        const [driving, cycling] = await Promise.all([fetchRoute("driving"), fetchRoute("cycling")]);

        const shortestPathCandidates = [
          driving ? { mode: "Car", distance_km: driving.shortest_distance_km, duration_min: driving.shortest_duration_min } : null,
          cycling ? { mode: "Bike", distance_km: cycling.shortest_distance_km, duration_min: cycling.shortest_duration_min } : null,
        ].filter(Boolean);

        const shortestPath = shortestPathCandidates.length > 0
          ? shortestPathCandidates.reduce((best, current) => (current.distance_km < best.distance_km ? current : best), shortestPathCandidates[0])
          : null;

        if (requestToken !== routeRequestTokenRef.current) return;
        setRouteInsights({ driving, cycling, shortest_path: shortestPath });
      } catch {
        const fallbackDistance = Number(haversineDistanceKmLocal(origin.lat, origin.lng, destinationLocation.lat, destinationLocation.lng).toFixed(2));
        if (requestToken !== routeRequestTokenRef.current) return;
        setRouteInsights({
          driving: null,
          cycling: null,
          shortest_path: {
            mode: "Approx",
            distance_km: fallbackDistance,
            duration_min: null,
          },
        });
        setRouteInsightsError("Live route provider is unavailable. Showing approximate straight-line distance.");
      } finally {
        if (requestToken !== routeRequestTokenRef.current) return;
        setLoadingRouteInsights(false);
      }
    };

    const applyResolvedLocation = (resolvedLocation, sourceLabel) => {
      setMapUserLocation(resolvedLocation);
      setMapLocationSource(sourceLabel);
      setManualOrigin({
        lat: formatLocationNumber(resolvedLocation.lat),
        lng: formatLocationNumber(resolvedLocation.lng),
      });
      setLoadingMapLocation(false);
    };

    const useApproximateLocation = async (baseMessage) => {
      const approxLocation = await fetchApproxLocationFromIP();
      if (!approxLocation) {
        setRouteInsightsError(baseMessage);
        return false;
      }

      applyResolvedLocation(approxLocation, "Approximate (IP)");
      requestRoutes(approxLocation, destination);
      setRouteInsightsError(`${baseMessage} Using approximate IP location.`);
      return true;
    };

    const useCoarseDeviceLocation = () => new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords?.latitude);
          const lng = Number(position.coords?.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            resolve(null);
            return;
          }
          resolve({ lat, lng });
        },
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
      );
    });

    if (!navigator?.geolocation) {
      setLoadingMapLocation(false);
      void useApproximateLocation("Live location is not supported in this browser.");
      return;
    }

    if (!window.isSecureContext) {
      setLoadingMapLocation(false);
      void useApproximateLocation("Live location requires HTTPS or localhost in the browser.");
      return;
    }

    mapWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        applyResolvedLocation(userLocation, "Precise GPS");

        const previousOrigin = lastRouteOriginRef.current;
        lastRouteOriginRef.current = userLocation;

        if (previousOrigin) {
          const movedDistanceKm = haversineDistanceKmLocal(
            previousOrigin.lat,
            previousOrigin.lng,
            userLocation.lat,
            userLocation.lng
          );
          if (movedDistanceKm < 0.03) return;
        }

        requestRoutes(userLocation, destination);
      },
      async (error) => {
        setLoadingMapLocation(false);
        const message = getGeolocationErrorMessage(error);

        const coarseLocation = await useCoarseDeviceLocation();
        if (coarseLocation) {
          applyResolvedLocation(coarseLocation, "Approximate GPS");
          requestRoutes(coarseLocation, destination);
          setRouteInsightsError("Precise GPS unavailable. Using approximate device location.");
          return;
        }

        const usedApproximate = await useApproximateLocation(message);
        if (!usedApproximate) {
          setRouteInsightsError(message);
          toast.error(message);
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 2000 }
    );
  };

  // Step 1: Validate booking form, then open payment modal
  const handleBookAppointment = async (event) => {
    event.preventDefault();
    if (!selectedRecommendationId) {
      toast.error("Please select a hospital first.");
      return;
    }
    if (!effectiveHospitalId) {
      toast.error("Please select hospital first.");
      return;
    }
    if (!effectiveDepartment) {
      toast.error("Please detect department from symptom first.");
      return;
    }
    if (!bookingForm.doctor_id || !bookingForm.time_slot || !bookingForm.date) {
      toast.error("Please select doctor, date and slot.");
      return;
    }

    const todayStr = getTodayLocalYmd();
    if (bookingForm.date < todayStr) {
      toast.error("Cannot book an appointment in the past. Please select today or a future date.");
      return;
    }
    if (isSlotInPastLocal(bookingForm.date, bookingForm.time_slot)) {
      toast.error("This time slot has already passed today. Please select a future time slot.");
      return;
    }

    // Collect booking details for the payment modal
    const selectedHospital = hospitalRecommendations.find(
      (h) => String(h.hospital_id) === String(selectedRecommendationId)
    );
    const selectedDoc = doctors.find((d) => String(d.id) === String(bookingForm.doctor_id));

    setPendingBookingDetails({
      doctorName: selectedDoc?.name || "Doctor",
      department: selectedDoc?.department || effectiveDepartment || "General Medicine",
      hospitalName: selectedHospital?.hospital_name || "Hospital",
      date: bookingForm.date,
      timeSlot: bookingForm.time_slot,
      consultationFee: Number(selectedDoc?.consultation_fee || 500),
      doctorId: bookingForm.doctor_id,
      // pass through booking fields for use after payment
      hospital_id: effectiveHospitalId,
      department_name: effectiveDepartment,
      disease: symptom,
    });
    setPaymentModalOpen(true);
  };

  // Step 2: Called by StripePaymentModal after successful payment
  const handlePaymentSuccess = async ({ paymentIntentId, consultationFee }) => {
    setPaymentModalOpen(false);
    if (!pendingBookingDetails) return;

    setBookingInProgress(true);
    try {
      const { data } = await api.post("/patient/appointments", {
        hospital_id: pendingBookingDetails.hospital_id,
        doctor_id: bookingForm.doctor_id,
        department: pendingBookingDetails.department_name,
        date: bookingForm.date,
        time_slot: bookingForm.time_slot,
        disease: pendingBookingDetails.disease,
        payment_intent_id: paymentIntentId,
        consultation_fee: consultationFee,
      });
      toast.success(data?.message || "Appointment booked successfully! 🎉");
      await Promise.all([
        loadDoctors(effectiveHospitalId, effectiveDepartment, bookingForm.date),
        loadAppointments(),
      ]);
      setBookingForm((prev) => ({ ...prev, time_slot: "" }));
      setPendingBookingDetails(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Payment succeeded but appointment booking failed. Please contact support.");
    } finally {
      setBookingInProgress(false);
    }
  };

  const selectedDoctor = doctors.find((d) => String(d.id) === String(bookingForm.doctor_id)) || null;
  // Always show ALL recommended hospitals; the selected one is highlighted visually.
  // Previously this collapsed to 1 hospital after selection — now fixed to always show all 3.
  const visibleRecommendations = hospitalRecommendations;

  const manualOriginLat = Number(manualOrigin.lat);
  const manualOriginLng = Number(manualOrigin.lng);
  const hasManualOrigin = Number.isFinite(manualOriginLat) && Number.isFinite(manualOriginLng);

  const applyManualOriginForRoute = () => {
    if (!mapHospital) return;
    if (!hasManualOrigin) {
      toast.error("Enter valid manual latitude and longitude first.");
      return;
    }

    setMapUserLocation({ lat: manualOriginLat, lng: manualOriginLng });
    setMapLocationSource("Manual");
    setLoadingMapLocation(false);
    setRouteInsights({
      driving: null,
      cycling: null,
      shortest_path: {
        mode: "Manual Approx",
        distance_km: Number(haversineDistanceKmLocal(
          manualOriginLat,
          manualOriginLng,
          Number(mapHospital?.geo_location?.lat),
          Number(mapHospital?.geo_location?.lng)
        ).toFixed(2)),
        duration_min: null,
      },
    });
    setRouteInsightsError("Manual origin applied. For full turn-by-turn road route, use Manual Car/Bike Directions.");
  };

  if (loading) {
    return (
      <div className="doctor-dashboard-shell">
        <div className="doctor-panel">
          <h2>Loading patient profile...</h2>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="doctor-dashboard-shell">
        <div className="doctor-panel">
          <h2>Profile not found</h2>
          <p style={{ color: "var(--text-muted)" }}>Unable to load your patient profile right now.</p>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
    );
  }

  const notifications = (appointments || [])
    .map((appt, idx) => {
      const status = appt.status || "pending";
      let message = "";
      let type = "patient_update";
      if (status === "pending") {
        message = `Appointment request for Dr. ${appt.doctor_id?.name || "Doctor"} is pending confirmation.`;
        type = "patient_update";
      } else if (status === "confirmed") {
        message = `Appointment with Dr. ${appt.doctor_id?.name || "Doctor"} is confirmed!`;
        type = "appointment_update";
      } else if (status === "completed") {
        message = `Appointment with Dr. ${appt.doctor_id?.name || "Doctor"} is finished. Click to leave feedback.`;
        type = "new_appointment";
      } else {
        message = `Appointment with Dr. ${appt.doctor_id?.name || "Doctor"} status is ${status}.`;
      }
      return {
        _id: appt._id || String(idx),
        type,
        message,
        created_at: appt.appointment_at || appt.created_at || new Date(),
      };
    })
    .filter((notif) => !dismissedNotificationIds.includes(String(notif._id)));

  const handleNotificationClick = (notification) => {
    setActiveSection("appointments");
  };

  return (
    <div className="hn-shell">
      {/* SIDEBAR */}
      <aside className={`hn-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        {sidebarOpen && (
          <>
            <div className="hn-brand">
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800 }}>
                <span className="hn-brand-pulse">
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                    <rect x="9" y="2" width="6" height="20" rx="2" fill="#10B981" />
                    <rect x="2" y="9" width="20" height="6" rx="2" fill="#10B981" />
                    <path d="M2 12H7.5L9.5 8L12.5 16L14.5 10L15.5 12H22" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </span>
                <span className="hn-brand-gradient">HealthNet</span>
              </h2>
              <p style={{ opacity: 0.85, fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>Patient Portal</p>
              <p className="hn-brand-user" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>👤</span> {profile?.username || "Patient"}
              </p>
            </div>

            <nav className="hn-nav">
              <button
                type="button"
                className={`hn-nav-btn ${activeSection === "profile" ? "active" : ""}`}
                onClick={() => setActiveSection("profile")}
              >
                <span className="hn-nav-icon">{getPatientMenuIcon("profile", activeSection === "profile")}</span>
                <span className="hn-nav-label">Profile</span>
              </button>
              <button
                type="button"
                className={`hn-nav-btn ${activeSection === "booking" ? "active" : ""}`}
                onClick={() => setActiveSection("booking")}
              >
                <span className="hn-nav-icon">{getPatientMenuIcon("booking", activeSection === "booking")}</span>
                <span className="hn-nav-label">Smart Booking</span>
              </button>
              <button
                type="button"
                className="hn-nav-btn"
                onClick={() => navigate("/nearest-hospitals")}
              >
                <span className="hn-nav-icon">{getPatientMenuIcon("nearest", false)}</span>
                <span className="hn-nav-label">Nearest Hospitals</span>
              </button>
              <button
                type="button"
                className={`hn-nav-btn ${activeSection === "search" ? "active" : ""}`}
                onClick={() => setActiveSection("search")}
              >
                <span className="hn-nav-icon">{getPatientMenuIcon("search", activeSection === "search")}</span>
                <span className="hn-nav-label">Find Doctors/Hospitals</span>
              </button>
              <button
                type="button"
                className={`hn-nav-btn ${activeSection === "appointments" ? "active" : ""}`}
                onClick={() => setActiveSection("appointments")}
              >
                <span className="hn-nav-icon">{getPatientMenuIcon("appointments", activeSection === "appointments")}</span>
                <span className="hn-nav-label">Appointments</span>
              </button>
              <button
                type="button"
                className={`hn-nav-btn ${activeSection === "settings" ? "active" : ""}`}
                onClick={() => setActiveSection("settings")}
              >
                <span className="hn-nav-icon">{getPatientMenuIcon("settings", activeSection === "settings")}</span>
                <span className="hn-nav-label">Settings</span>
              </button>
            </nav>

            <div className="hn-logout-wrap">
              <button
                onClick={handleLogout}
                className="hn-logout-btn"
              >
                🚪 Logout
              </button>
            </div>
          </>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="hn-main">
        {/* TOP BAR */}
        <header className="hn-topbar">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hn-sidebar-toggle"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
          <h1 className="hn-title">
            {activeSection === "profile" && "My Profile"}
            {activeSection === "booking" && "Smart Appointment Booking"}
            {activeSection === "nearest" && "Nearest Hospitals"}
            {activeSection === "search" && "Find Doctors & Hospitals"}
            {activeSection === "appointments" && "My Appointments"}
            {activeSection === "settings" && "Account Settings"}
          </h1>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <NotificationBell
              notifications={notifications}
              unreadCount={notifications.length}
              onNotificationClick={handleNotificationClick}
              onDismiss={(id) => {
                const newIds = [...dismissedNotificationIds, String(id)];
                setDismissedNotificationIds(newIds);
                try { localStorage.setItem(PATIENT_DISMISSED_KEY, JSON.stringify(newIds)); } catch {}
              }}
              onClearAll={() => {
                const newIds = notifications.map(n => String(n._id));
                const merged = [...new Set([...dismissedNotificationIds, ...newIds])];
                setDismissedNotificationIds(merged);
                try { localStorage.setItem(PATIENT_DISMISSED_KEY, JSON.stringify(merged)); } catch {}
              }}
            />
            <button
              type="button"
              className="hn-sidebar-toggle"
              onClick={handleRefresh}
              aria-label="Refresh page"
              title="Refresh page"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ verticalAlign: "middle" }}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
            <button
              type="button"
              className="hn-sidebar-toggle"
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              aria-label="Toggle theme"
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? "Dark" : "Light"}
            </button>
            <Button
              type="button"
              style={{ backgroundColor: "#f97316", color: "#ffffff", border: "none" }}
              onClick={() => setActiveSection("booking")}
            >
              Book Appointment
            </Button>
            <div className="hn-date-pill">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <section className="hn-content-area">
          <div style={{ display: "grid", gap: 14 }}>
        {activeSection === "profile" && (
          <Card>
            <CardHeader>Account Information</CardHeader>
            <CardBody>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                <div><strong>Name:</strong> {profile?.username || "-"}</div>
                <div><strong>Email:</strong> {profile?.email || "-"}</div>
                <div><strong>Phone:</strong> {profile?.phone || "-"}</div>
                <div><strong>City:</strong> {profile?.city || "-"}</div>
                <div><strong>Address:</strong> {profile?.address || "-"}</div>
                <div><strong>Age:</strong> {profile?.age ?? "-"}</div>
                <div><strong>Gender:</strong> {profile?.gender || "-"}</div>
                <div><strong>Role:</strong> {String(profile?.role || "patient").toUpperCase()}</div>
                <div><strong>Auth Provider:</strong> {String(profile?.auth_provider || "local").toUpperCase()}</div>
                <div><strong>Status:</strong> {String(profile?.status || "active").toUpperCase()}</div>
                <div><strong>Verified:</strong> {profile?.is_verified ? "Yes" : "No"}</div>
                <div><strong>Created At:</strong> {formatDateTime(profile?.created_at)}</div>
                <div><strong>Last Login:</strong> {formatDateTime(profile?.last_login_at)}</div>
                <div><strong>Last Seen:</strong> {formatDateTime(profile?.last_seen_at)}</div>
              </div>
            </CardBody>
          </Card>
        )}

        {activeSection === "settings" && (
          <>
            <Card>
              <CardHeader>Edit Profile</CardHeader>
              <CardBody>
                <form onSubmit={handleProfileSave} style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    <div className="hnu-field">
                      <label className="hnu-label">Name</label>
                      <input
                        value={editForm.username}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))}
                        autoComplete="off"
                      />
                    </div>
                    <div className="hnu-field">
                      <label className="hnu-label">Phone</label>
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="hnu-field">
                      <label className="hnu-label">City</label>
                      <input
                        value={editForm.city}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                        autoComplete="off"
                      />
                    </div>
                    <div className="hnu-field">
                      <label className="hnu-label">Address</label>
                      <input
                        value={editForm.address}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="hnu-field">
                      <label className="hnu-label">Age</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={editForm.age}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, age: e.target.value }))}
                      />
                    </div>
                    <div className="hnu-field">
                      <label className="hnu-label">Gender</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Button type="submit" variant="primary" disabled={savingProfile}>
                      {savingProfile ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>Change Email (OTP on Current Email)</CardHeader>
              <CardBody>
                <div style={{ display: "grid", gap: 10 }}>
                  <div className="hnu-field">
                    <label className="hnu-label">Current Email</label>
                    <input
                      type="email"
                      value={emailForm.currentEmail}
                      onChange={(e) => setEmailForm((prev) => ({ ...prev, currentEmail: e.target.value }))}
                      placeholder="Enter current email"
                      autoComplete="off"
                    />
                  </div>

                  <div className="hnu-field">
                    <label className="hnu-label">New Email</label>
                    <input
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter new email"
                      autoComplete="off"
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button type="button" variant="soft" onClick={handleRequestEmailOtp} disabled={requestingEmailOtp}>
                      {requestingEmailOtp ? "Changing..." : "Change"}
                    </Button>
                  </div>

                  {emailOtpRequested ? (
                    <>
                      <div className="hnu-field">
                        <label className="hnu-label">OTP Code</label>
                        <input
                          value={emailForm.code}
                          onChange={(e) => setEmailForm((prev) => ({ ...prev, code: e.target.value }))}
                          placeholder="Enter 6-digit OTP"
                        />
                      </div>
                      <div>
                        <Button type="button" variant="primary" onClick={handleVerifyEmailOtp} disabled={verifyingEmailOtp}>
                          {verifyingEmailOtp ? "Verifying..." : "Verify & Update Email"}
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          </>
        )}

        {activeSection === "booking" && (
          <Card className="smart-booking-card">
            <CardHeader className="smart-booking-header">Smart Appointment Booking</CardHeader>
            <CardBody className="smart-booking-body">
              <div className="smart-booking-grid">
                <div className="smart-booking-field smart-booking-field-wide">
                  <label className="hnu-label">1. Disease / Symptoms</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className={`smart-symptom-input ${symptom ? 'filled' : 'empty'}`}
                      placeholder="Type your symptoms (e.g., headache, ear pain, fever)"
                      value={symptom}
                      onChange={(e) => {
                        handleSymptomChange(e);
                        const value = e.target.value;
                        if (value) {
                          setAiResult(null);
                          setHospitalRecommendations([]);
                          setSelectedRecommendationId("");
                          setDoctors([]);
                          setSelectedHospitalId("");
                          setBookingForm((prev) => ({ ...prev, doctor_id: "", time_slot: "" }));
                        }
                      }}
                      onBlur={() => {
                        // Small delay to allow clicking suggestions
                        setTimeout(() => setShowAutocomplete(false), 200);
                      }}
                      onFocus={async () => {
                        if (!locationReady) {
                          await handleUseCurrentLocation({
                            forceRefresh: true,
                            allowApproximateFallback: false,
                            allowManualFallback: false,
                          });
                        }
                      }}
                    />
                    {showAutocomplete && filteredSymptoms.length > 0 && (
                      <div className="symptom-autocomplete-dropdown" style={{
                        position: 'absolute',
                        background: 'white',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        zIndex: 1000,
                        left: 0,
                        right: 0,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '4px',
                        borderWidth: '1px'
                      }}>
                        {filteredSymptoms.map((sym, index) => (
                          <div
                            key={index}
                            className="autocomplete-item"
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              fontSize: '14px',
                              color: '#334155',
                              transition: 'background-color 0.2s',
                              textAlign: 'left'
                            }}
                            onMouseDown={() => selectSymptomSuggestion(sym)}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            {sym}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="smart-booking-hint">
                    Enter symptoms in English or Roman Urdu &nbsp;•&nbsp;
                    e.g. <em>fever, cough</em> or <em>bukhar, khansi, sir dard</em>
                  </div>

                  {/* Roman Urdu Translation Notice */}
                  {romanUrduNote && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 6,
                      padding: "6px 12px",
                      background: "linear-gradient(135deg, #ccfbf1, #d1fae5)",
                      border: "1px solid #6ee7b7",
                      borderRadius: 20,
                      fontSize: 12,
                      color: "#065f46",
                      fontWeight: 600,
                    }}>
                      🌐 {romanUrduNote}
                    </div>
                  )}

                  {/* Analyze Symptoms Button */}
                  {symptom && (
                    <Button
                      type="button"
                      variant="soft"
                      onClick={analyzeSymptomInput}
                      disabled={analyzingSymptoms}
                      style={{ marginTop: 8 }}
                    >
                      {analyzingSymptoms ? "Analyzing..." : "🔍 Analyze Symptoms"}
                    </Button>
                  )}

                  {/* Symptom Analysis Results */}
                  {symptomAnalysisResult && (
                    <div className="symptom-analysis-result">
                      <div className="analysis-header">
                        <h3>Analysis Results</h3>
                        <span className="analysis-lang">Language: {symptomAnalysisResult.languageDetected}</span>
                      </div>

                      {symptomAnalysisResult.urgencyLevel && (() => {
                        const overallUrgency = symptomAnalysisResult.urgencyLevel || "low";
                        const urgencyLabels = {
                          high: "🔴 Urgent — seek immediate medical attention",
                          medium: "🟡 Moderate — consult doctor within 24 hours",
                          low: "🟢 Mild — safe to monitor at home"
                        };
                        return (
                          <div className={`urgency-box ${overallUrgency}`}>
                            <div className="urgency-title">
                              {urgencyLabels[overallUrgency] || urgencyLabels.low}
                            </div>
                            <div className="urgency-desc">
                              {symptomAnalysisResult.urgencyReason}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="analysis-section">
                        <div className="analysis-label">🏷️ Matched Symptoms</div>
                        {symptomAnalysisResult.matchedColumns && symptomAnalysisResult.matchedColumns.length > 0 ? (
                          <div className="analysis-keywords">
                            {symptomAnalysisResult.matchedColumns.map((keyword, idx) => (
                              <span key={idx} className="keyword-badge">{keyword}</span>
                            ))}
                          </div>
                        ) : (
                          <div className="symptom-no-match">
                            Could not match symptoms directly. Try describing them differently or picking from the catalog.
                          </div>
                        )}
                      </div>


                      {symptomAnalysisResult.topDiseases && symptomAnalysisResult.topDiseases.length > 0 && (
                        <div className="analysis-section" style={{ marginTop: '16px' }}>
                          <div className="analysis-label">🏥 Predicted Diseases & Department</div>

                          {/* Low confidence warning */}
                          {symptomAnalysisResult.topDiseases[0]?.low_confidence && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              background: '#fefce8',
                              border: '1.5px solid #fbbf24',
                              borderRadius: '10px',
                              padding: '10px 14px',
                              marginBottom: '12px',
                              fontSize: '13px',
                              color: '#92400e',
                            }}>
                              <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                              <div>
                                <strong>Low confidence — add more symptoms for accurate predictions.</strong>
                                <div style={{ marginTop: 3, color: '#78350f' }}>
                                  Only 1 symptom was matched from your input. With just "fever" or "cough" alone,
                                  76+ diseases could match. Please add 2–3 more specific symptoms (e.g. "fever, chills, headache, body ache")
                                  for reliable disease prediction.
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Department badge — prominent */}
                          {detectedDepartment && (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                              color: '#fff',
                              borderRadius: '10px',
                              padding: '10px 18px',
                              fontWeight: 700,
                              fontSize: '15px',
                              marginBottom: '12px',
                              boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
                            }}>
                              🏨 Recommended Department: <span style={{ fontSize: '16px', letterSpacing: '0.03em' }}>{detectedDepartment}</span>
                            </div>
                          )}

                          <div className="predictions-list">
                            {symptomAnalysisResult.topDiseases.map((pred, idx) => {
                              const barColor = pred.score > 70 ? "#22c55e" : (pred.score >= 40 ? "#eab308" : "#ef4444");
                              return (
                                <div key={idx} className="prediction-card">
                                  <div className="prediction-card-top">
                                    <span className="prediction-card-name" style={{ textTransform: 'capitalize' }}>{pred.name}</span>
                                    <span className="prediction-card-score" style={{ color: barColor, backgroundColor: barColor + '15' }}>
                                      {pred.score}% Match
                                    </span>
                                  </div>
                                  <div className="prediction-progress-bg">
                                    <div
                                      className="prediction-progress-bar"
                                      style={{ width: `${pred.score}%`, backgroundColor: barColor }}
                                    />
                                  </div>
                                  <div className="prediction-card-specialist" style={{ marginTop: '6px', fontSize: '12px' }}>
                                    🏨 Department: <strong>{pred.specialist}</strong>
                                  </div>

                                  {/* Required Resources Section */}
                                  {(() => {
                                    const resourcesToShow = (pred.required_resources && pred.required_resources.length > 0)
                                      ? pred.required_resources
                                      : (DEPARTMENT_DEFAULT_RESOURCES[pred.specialist] || DEPARTMENT_DEFAULT_RESOURCES["General Medicine"] || []);
                                    
                                    // Set of very common/generic clinic items to move to the end
                                    const genericClinicItems = new Set([
                                      "hospital bed",
                                      "pediatric bed",
                                      "thermometer",
                                      "gloves",
                                      "surgical mask",
                                      "basic medicines",
                                      "stethoscope",
                                      "bp monitor",
                                      "pulse oximeter",
                                      "iv line",
                                      "iv fluids"
                                    ]);

                                    const specialtyItems = resourcesToShow.filter(res => !genericClinicItems.has(res.toLowerCase().trim()));
                                    const genericItems = resourcesToShow.filter(res => genericClinicItems.has(res.toLowerCase().trim()));
                                    
                                                                    // Combine placing specialty/unique resources at the front
                                    const sortedResources = [...specialtyItems, ...genericItems];
                                    
                                    // Only show resources that are actually tracked in the selected hospital
                                    let finalResources = sortedResources;
                                    if (selectedRecommendationId) {
                                      finalResources = sortedResources.filter(resName => getResourceAvailability(resName) !== null);
                                    }
                                    
                                    const limitedResources = finalResources.slice(0, 5);
                                    if (limitedResources.length === 0) return null;

                                    const selectedRec = hospitalRecommendations.find(h => String(h.hospital_id) === String(selectedRecommendationId));
                                    const selectedHospName = selectedRec ? selectedRec.hospital_name : "";

                                    return (
                                      <div className="hn-resource-table-container">
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          📋 Required Resources (Top 5)
                                        </div>
                                        <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--surface-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                          <table className="hn-resource-table">
                                            <thead>
                                              <tr style={{ background: 'var(--surface-soft)', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontWeight: '700' }}>
                                                <th style={{ padding: '10px 14px' }}>Resource</th>
                                                <th style={{ padding: '10px 14px' }}>Live Quantity</th>
                                                <th style={{ padding: '10px 14px' }}>Status</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {limitedResources.map((resName, rIdx) => {
                                                const avail = getResourceAvailability(resName);
                                                
                                                if (avail) {
                                                  const isOut = avail.status.toLowerCase().includes("out") || avail.units === 0;
                                                  const isLow = avail.status.toLowerCase().includes("low");
                                                  const percentage = Math.min(100, Math.max(0, (avail.units / avail.total) * 100));
                                                  const barColor = isOut ? '#ef4444' : (isLow ? '#f59e0b' : '#10b981');
                                                  
                                                  const badgeStyle = {
                                                    fontSize: '10px',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontWeight: '700',
                                                    backgroundColor: isOut ? '#fee2e2' : (isLow ? '#fef9c3' : '#dcfce7'),
                                                    color: isOut ? '#b91c1c' : (isLow ? '#a16207' : '#15803d'),
                                                    textTransform: 'uppercase',
                                                    border: `1px solid ${isOut ? '#fca5a5' : (isLow ? '#fde047' : '#bbf7d0')}`
                                                  };

                                                  return (
                                                    <tr key={rIdx} className="hn-resource-row">
                                                      <td style={{ padding: '10px 14px', fontWeight: '700', color: 'var(--text-main)' }}>
                                                        {resName}
                                                      </td>
                                                      <td style={{ padding: '10px 14px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                          <span style={{ minWidth: '40px', fontWeight: '800', color: 'var(--text-main)' }}>
                                                            {avail.units} / {avail.total}
                                                          </span>
                                                          <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', minWidth: '70px', position: 'relative' }}>
                                                            <div style={{
                                                              width: `${percentage}%`,
                                                              height: '100%',
                                                              backgroundColor: barColor,
                                                              borderRadius: '4px',
                                                              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                                                            }} />
                                                          </div>
                                                        </div>
                                                      </td>
                                                      <td style={{ padding: '10px 14px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                          <span style={badgeStyle}>
                                                            {isOut ? 'Out of Stock' : (isLow ? 'Low Stock' : 'Available')}
                                                          </span>
                                                          {(isOut || isLow) && selectedRecommendationId && (
                                                            <button
                                                              type="button"
                                                              style={{
                                                                fontSize: '10px',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                backgroundColor: '#fef2f2',
                                                                color: '#dc2626',
                                                                border: '1px solid #fecaca',
                                                                cursor: 'pointer',
                                                                fontWeight: '700'
                                                              }}
                                                              onClick={() => handleNotifyAdminResource(resName, selectedRecommendationId, selectedHospName, pred.specialist)}
                                                            >
                                                              Notify Admin
                                                            </button>
                                                          )}
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  );
                                                } else {
                                                  return (
                                                    <tr key={rIdx} className="hn-resource-row">
                                                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#475569' }}>
                                                        {resName}
                                                      </td>
                                                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '500' }}>
                                                        Quantity N/A
                                                      </td>
                                                      <td style={{ padding: '10px 14px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                          <span style={{
                                                            fontSize: '10px',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            fontWeight: '600',
                                                            backgroundColor: '#f1f5f9',
                                                            color: '#64748b',
                                                            border: '1px solid #cbd5e1'
                                                          }}>
                                                            Not Tracked
                                                          </span>
                                                          {selectedRecommendationId && (
                                                            <button
                                                              type="button"
                                                              style={{
                                                                fontSize: '10px',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                backgroundColor: '#fef2f2',
                                                                color: '#dc2626',
                                                                border: '1px solid #fecaca',
                                                                cursor: 'pointer',
                                                                fontWeight: '700'
                                                              }}
                                                              onClick={() => handleNotifyAdminResource(resName, selectedRecommendationId, selectedHospName, pred.specialist)}
                                                            >
                                                              Notify Admin
                                                            </button>
                                                          )}
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  );
                                                }
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                        {selectedRecommendationId ? (
                                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                            <span className="hn-pulse-dot" />
                                            Showing live quantities at the selected hospital.
                                          </div>
                                        ) : (
                                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>
                                            💡 Select a recommended hospital below to see live resource quantities.
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="smart-booking-field">
                  <label className="hnu-label">2. Visit Date</label>
                  <input
                    type="date"
                    value={doctorDate}
                    min={getTodayLocalYmd()}
                    onChange={(e) => {
                      const value = e.target.value;
                      const today = getTodayLocalYmd();
                      if (value < today) {
                        toast.error("Cannot select a past date.");
                        return;
                      }
                      setDoctorDate(value);
                      setBookingForm((prev) => ({ ...prev, date: value, time_slot: "" }));
                    }}
                  />
                </div>

              </div>

              <div className="smart-booking-actions">
                <Button type="button" variant="primary" onClick={handleFindHospitalRecommendations} disabled={loadingRecommendations}>
                  {loadingRecommendations ? "Finding..." : "Find Best Hospitals & Doctors"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadDoctors(effectiveHospitalId, effectiveDepartment, doctorDate)}
                  disabled={!effectiveHospitalId}
                >
                  Refresh Doctors
                </Button>
              </div>

              <div className="smart-booking-hint" style={{ marginTop: -4 }}>
                Current live location: {patientLocation.lat && patientLocation.lng ? `${patientLocation.lat}, ${patientLocation.lng}` : "Not captured yet"}
              </div>

              {hospitalRecommendations.length > 0 ? (
                <div className="smart-booking-recommendations">
                  <div className="smart-booking-section-title">
                    {selectedRecommendationId ? "Selected Hospital" : "Recommended Hospitals"}
                  </div>
                  <div className="smart-booking-recommendation-list">
                    {visibleRecommendations
                      .filter(item => !selectedRecommendationId || String(selectedRecommendationId) === String(item.hospital_id))
                      .map((item, index) => {
                      const isSelected = String(selectedRecommendationId) === String(item.hospital_id);
                      const bestDoctor = item.best_doctor || null;
                      return (
                        <Card key={`${item.hospital_id}-${index}`} className={isSelected ? "smart-recommendation-card selected" : "smart-recommendation-card"}>
                          <CardBody>
                            <div className="smart-recommendation-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div className="smart-recommendation-title" style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                  {item.hospital_name}
                                </div>
                                <div className="smart-recommendation-subtitle" style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>
                                  {item.city || "-"} · {item.type || "-"}
                                </div>
                              </div>

                              {item.emergency_priority && (
                                <span style={{
                                  backgroundColor: '#fee2e2',
                                  color: '#ef4444',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  border: '1px solid #fca5a5',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  🚨 ER Available
                                </span>
                              )}
                            </div>

                            <div style={{ marginTop: '12px', fontSize: '14px', color: '#334155', display: 'grid', gap: '4px' }}>
                              <div><strong>Address:</strong> {item.address}</div>
                              <div><strong>Phone:</strong> {item.phone}</div>
                            </div>

                            {item.specialties && item.specialties.length > 0 && (
                              <div style={{ marginTop: '10px' }}>
                                <strong style={{ fontSize: '13px', color: '#475569' }}>Specialties:</strong>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                  {item.specialties.map((spec, sIdx) => (
                                    <span key={sIdx} style={{
                                      backgroundColor: '#f1f5f9',
                                      color: '#475569',
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      fontSize: '11px',
                                      fontWeight: 500
                                    }}>{spec}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Hospital Specific Resources Table */}
                            {(() => {
                              // Determine which resources are needed for this disease/department
                              const topDisease = symptomAnalysisResult?.topDiseases?.[0];
                              const dept = item.department || topDisease?.specialist || detectedDepartment || aiResult?.department || "General Medicine";

                              // Get live resources for this department from the hospital
                              let deptLiveResources = [];
                              if (item.resources && Object.keys(item.resources).length > 0) {
                                const allRes = Object.values(item.resources).flat();
                                deptLiveResources = allRes.filter(r =>
                                  r.department_name && normalizeDeptName(r.department_name) === normalizeDeptName(dept)
                                );
                              }
                              if (deptLiveResources.length === 0 && isSelected && selectedHospitalResources) {
                                const allRes = Object.values(selectedHospitalResources).flat();
                                deptLiveResources = allRes.filter(r =>
                                  r.department_name && normalizeDeptName(r.department_name) === normalizeDeptName(dept)
                                );
                              }

                              const baseResources = deptLiveResources.length > 0
                                ? deptLiveResources.map(r => r.name)
                                : ((topDisease?.required_resources && topDisease.required_resources.length > 0)
                                    ? topDisease.required_resources
                                    : (DEPARTMENT_DEFAULT_RESOURCES[dept] || DEPARTMENT_DEFAULT_RESOURCES["General Medicine"] || []));

                              // Filter OUT generic supplies every hospital has — only show disease-specific resources
                              const genericSet = new Set([
                                "hospital bed","pediatric bed","thermometer","gloves","surgical mask",
                                "basic medicines","stethoscope","bp monitor","pulse oximeter","iv line",
                                "iv fluids","surgical gown","oxygen cylinder","oxygen mask","syringe",
                                "bandage","cotton","antiseptic","gauze","saline","drip stand",
                                "wheelchair","stretcher","bed sheet","pillow","blanket","towel",
                                "hand sanitizer","face shield","ppe kit","waste bin","sharps container"
                              ]);
                              const specialtyResources = baseResources.filter(r => !genericSet.has(r.toLowerCase().trim()));
                              const genericResources = baseResources.filter(r => genericSet.has(r.toLowerCase().trim()));
                              
                              // If we have department-specific live resources in the DB, use their names directly!
                              // Otherwise, fallback to the hardcoded required resources logic.
                              const sortedResources = deptLiveResources.length > 0
                                ? deptLiveResources.map(r => r.name).slice(0, 5)
                                : (specialtyResources.length >= 3
                                    ? specialtyResources.slice(0, 5)
                                    : [...specialtyResources, ...genericResources].slice(0, 5));

                              if (sortedResources.length === 0) return null;

                              // Priority: 1) item.resources (from Flask analyze — available for all cards)
                              //           2) selectedHospitalResources (from live API — only for selected card)
                              const getResourceData = (resName) => {
                                // Check embedded resources in item first (from Flask response)
                                if (item.resources && Object.keys(item.resources).length > 0) {
                                  const allRes = Object.values(item.resources).flat();
                                  let match = allRes.find(r =>
                                    (r.name.toLowerCase().trim() === resName.toLowerCase().trim() ||
                                     resName.toLowerCase().trim().includes(r.name.toLowerCase().trim()) ||
                                     r.name.toLowerCase().trim().includes(resName.toLowerCase().trim())) &&
                                    r.department_name && normalizeDeptName(r.department_name) === normalizeDeptName(dept)
                                  );
                                  if (!match) {
                                    match = allRes.find(r =>
                                      r.name.toLowerCase().trim() === resName.toLowerCase().trim() ||
                                      resName.toLowerCase().trim().includes(r.name.toLowerCase().trim()) ||
                                      r.name.toLowerCase().trim().includes(resName.toLowerCase().trim())
                                    );
                                  }
                                  if (match) return match;
                                }
                                // Fallback: use live API data for the selected hospital
                                if (isSelected && selectedHospitalResources) {
                                  const allRes = Object.values(selectedHospitalResources).flat();
                                  let match = allRes.find(r =>
                                    (r.name.toLowerCase().trim() === resName.toLowerCase().trim() ||
                                     resName.toLowerCase().trim().includes(r.name.toLowerCase().trim()) ||
                                     r.name.toLowerCase().trim().includes(resName.toLowerCase().trim())) &&
                                    r.department_name && normalizeDeptName(r.department_name) === normalizeDeptName(dept)
                                  );
                                  if (!match) {
                                    match = allRes.find(r =>
                                      r.name.toLowerCase().trim() === resName.toLowerCase().trim() ||
                                      resName.toLowerCase().trim().includes(r.name.toLowerCase().trim()) ||
                                      r.name.toLowerCase().trim().includes(resName.toLowerCase().trim())
                                    );
                                  }
                                  return match || null;
                                }
                                return null;
                              };

                              const hasLiveData = (item.resources && Object.keys(item.resources).length > 0) ||
                                (isSelected && selectedHospitalResources);

                              return (
                                <div style={{ marginTop: '14px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    📦 Required Resources
                                    {hasLiveData && (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '600', color: '#10b981', backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                                        <span className="hn-pulse-dot" style={{ width: 6, height: 6 }} /> Live
                                      </span>
                                    )}
                                    {isSelected && loadingSelectedHospitalResources && (
                                      <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>Loading live data...</span>
                                    )}
                                  </div>
                                  <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                      <thead>
                                        <tr style={{ background: 'linear-gradient(90deg, #f0f9ff 0%, #f8fafc 100%)', borderBottom: '2px solid #e2e8f0' }}>
                                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#374151', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resource</th>
                                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#374151', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {hasLiveData ? 'Live Qty' : 'Required'}
                                          </th>
                                          <th style={{ padding: '8px 12px', textAlign: 'left', color: '#374151', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sortedResources.map((resName, rIdx) => {
                                          const liveData = getResourceData(resName);
                                          const isEven = rIdx % 2 === 0;

                                          if (liveData) {
                                            const isOut = liveData.status.toLowerCase().includes("out") || liveData.units === 0;
                                            const isLow = liveData.status.toLowerCase().includes("low");
                                            const percentage = Math.min(100, Math.max(0, (liveData.units / Math.max(liveData.total, 1)) * 100));
                                            const barColor = isOut ? '#ef4444' : (isLow ? '#f59e0b' : '#10b981');
                                            const badgeStyle = {
                                              fontSize: '10px', padding: '2px 7px', borderRadius: '4px', fontWeight: '700',
                                              backgroundColor: isOut ? '#fee2e2' : (isLow ? '#fef9c3' : '#dcfce7'),
                                              color: isOut ? '#b91c1c' : (isLow ? '#a16207' : '#15803d'),
                                              textTransform: 'uppercase',
                                              border: `1px solid ${isOut ? '#fca5a5' : (isLow ? '#fde047' : '#bbf7d0')}`
                                            };
                                            return (
                                              <tr key={rIdx} style={{ backgroundColor: isEven ? 'var(--surface-card)' : 'var(--surface-soft)', borderBottom: '1px solid var(--surface-border)', transition: 'background 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-soft)'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = isEven ? 'var(--surface-card)' : 'var(--surface-soft)'}>
                                                <td style={{ padding: '9px 12px', fontWeight: '600', color: 'var(--text-main)' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: barColor, flexShrink: 0, display: 'inline-block' }} />
                                                    {resName}
                                                  </div>
                                                </td>
                                                <td style={{ padding: '9px 12px' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: '800', color: 'var(--text-main)', minWidth: '36px' }}>{liveData.units}/{liveData.total}</span>
                                                    <div style={{ flex: 1, height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', minWidth: '50px' }}>
                                                      <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: barColor, borderRadius: '4px', transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)' }} />
                                                    </div>
                                                  </div>
                                                </td>
                                                <td style={{ padding: '9px 12px' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={badgeStyle}>{isOut ? 'Out of Stock' : (isLow ? 'Low Stock' : 'Available')}</span>
                                                    {(isOut || isLow) && (
                                                      <button
                                                        type="button"
                                                        style={{
                                                          fontSize: '10px',
                                                          padding: '2px 6px',
                                                          borderRadius: '4px',
                                                          backgroundColor: '#fef2f2',
                                                          color: '#dc2626',
                                                          border: '1px solid #fecaca',
                                                          cursor: 'pointer',
                                                          fontWeight: '700'
                                                        }}
                                                        onClick={() => handleNotifyAdminResource(resName, item.hospital_id, item.hospital_name, dept)}
                                                      >
                                                        Notify Admin
                                                      </button>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          } else {
                                            // No live data — show as "Required" resource
                                            return (
                                              <tr key={rIdx} style={{ backgroundColor: isEven ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = isEven ? '#ffffff' : '#f8fafc'}>
                                                <td style={{ padding: '9px 12px', fontWeight: '600', color: '#334155' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94a3b8', flexShrink: 0, display: 'inline-block' }} />
                                                    {resName}
                                                  </div>
                                                </td>
                                                <td style={{ padding: '9px 12px', color: '#64748b', fontSize: '11px', fontStyle: 'italic' }}>
                                                  {hasLiveData ? '—' : 'Required'}
                                                </td>
                                                <td style={{ padding: '9px 12px' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                                      {hasLiveData ? 'Not Tracked' : 'Needed'}
                                                    </span>
                                                    {hasLiveData && (
                                                      <button
                                                        type="button"
                                                        style={{
                                                          fontSize: '10px',
                                                          padding: '2px 6px',
                                                          borderRadius: '4px',
                                                          backgroundColor: '#fef2f2',
                                                          color: '#dc2626',
                                                          border: '1px solid #fecaca',
                                                          cursor: 'pointer',
                                                          fontWeight: '700'
                                                        }}
                                                        onClick={() => handleNotifyAdminResource(resName, item.hospital_id, item.hospital_name, dept)}
                                                      >
                                                        Notify Admin
                                                      </button>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          }
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                  {!hasLiveData && (
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                                      💡 Analyze symptoms first to see live quantities
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {isSelected ? (
                              <div className="smart-doctor-card" style={{ marginBottom: 12, marginTop: 12 }}>
                                <div className="smart-doctor-card-head">
                                  <strong>Selected Hospital Details</strong>
                                  <span>{item.status || "Recommended"}</span>
                                </div>
                                <div className="smart-doctor-grid">
                                  <div><strong>Hospital:</strong> {item.hospital_name || "-"}</div>
                                  <div><strong>City:</strong> {item.city || "-"}</div>
                                  <div><strong>Address:</strong> {item.address || "-"}</div>
                                  {item.distance_km !== null && (
                                    <div><strong>Distance:</strong> {formatRecommendationDistance(item.distance_km, item.distance_source)}</div>
                                  )}
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                                  <Button
                                    type="button"
                                    variant="soft"
                                    size="sm"
                                    onClick={() => openHospitalMap(item)}
                                  >
                                    Location Route
                                  </Button>
                                  <a
                                    href={buildMapsSearchUrl(buildHospitalSearchTextQuery(item || {}))}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", alignSelf: "center" }}
                                  >
                                    Open in Google Maps
                                  </a>
                                </div>

                                {bestDoctor ? (
                                  <>
                                    <div style={{ marginTop: 10, fontWeight: 700 }}>Recommended Doctor</div>
                                    <div className="smart-doctor-grid" style={{ marginTop: 8 }}>
                                      <div><strong>Name:</strong> {bestDoctor.doctor_name || "-"}</div>
                                      <div><strong>Experience:</strong> {bestDoctor.experience_years ?? 0} years</div>
                                      <div><strong>Duty:</strong> {bestDoctor.duty?.shift_label || "-"}</div>
                                      <div><strong>Duty Window:</strong> {bestDoctor.duty?.duty_window || "-"}</div>
                                      <div><strong>Next Date:</strong> {bestDoctor.next_available_date || "-"}</div>
                                      <div><strong>Today Free Slots:</strong> {(bestDoctor.free_slots_today || []).length}</div>
                                    </div>
                                    {Array.isArray(bestDoctor.next_available_slots) && bestDoctor.next_available_slots.length > 0 ? (
                                      <div className="smart-next-slots">
                                        <strong>Next available slots:</strong> {bestDoctor.next_available_slots.join(", ")}
                                      </div>
                                    ) : null}
                                  </>
                                ) : null}
                              </div>
                            ) : null}

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                              <Button type="button" variant={isSelected ? "primary" : "soft"} onClick={() => applyRecommendation(item)}>
                                {isSelected ? "Hospital Selected (Click to Unselect)" : "Select Hospital"}
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {aiResult ? (
                <div className={aiResult?.hospital_department_available === false ? "hnu-message error" : "hnu-message success"}>
                  <strong>AI Result:</strong> {symptom || "Selected symptom"}
                  <div style={{ marginTop: 4 }}>{aiResult.message || "Department detected."}</div>
                  {aiResult?.resource_availability ? (() => {
                    const liveSummary = selectedHospitalResources ? getLiveResourceSummary() : null;
                    const statusText = liveSummary ? liveSummary.statusText : (aiResult.resource_availability.available ? "Available" : "Not Available");
                    const availableCount = liveSummary ? liveSummary.availableCount : (aiResult.resource_availability.available_resources || 0);
                    const totalCount = liveSummary ? liveSummary.totalCount : (aiResult.resource_availability.total_resources || 0);
                    
                    return (
                      <div style={{ marginTop: 6 }}>
                        <strong>Resources:</strong> {statusText}
                        {` (Available ${availableCount} / Total ${totalCount})`}
                      </div>
                    );
                  })() : null}
                </div>
              ) : null}

              {selectedRecommendationId ? (
                <form onSubmit={handleBookAppointment} className="smart-booking-form">

                  {/* Department header banner */}
                  {(detectedDepartment || effectiveDepartment) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
                      color: '#e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 18px',
                      marginBottom: '14px',
                      fontSize: '14px',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(15,23,42,0.18)',
                    }}>
                      <span style={{ fontSize: '20px' }}>🏨</span>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Matched Department</div>
                        <div style={{ fontSize: '16px', color: '#f1f5f9' }}>{detectedDepartment || effectiveDepartment}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Shift</div>
                        <div style={{ fontSize: '14px', color: '#38bdf8', textTransform: 'capitalize' }}>{bookingShift || getCurrentShift()}</div>
                      </div>
                    </div>
                  )}

                  <div className="smart-booking-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "14px" }}>
                    <div className="smart-booking-field">
                      <label className="hnu-label">3. Filter Shift
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#64748b', fontWeight: 400 }}>(auto-detected)</span>
                      </label>
                      <select
                        value={bookingShift}
                        onChange={(e) => {
                          setBookingShift(e.target.value);
                          setShowAllDoctors(false);
                          setBookingForm((prev) => ({ ...prev, doctor_id: "", time_slot: "" }));
                        }}
                      >
                        <option value="">All Shifts</option>
                        <option value="morning">☀️ Morning (8AM–2PM)</option>
                        <option value="evening">🌤️ Evening (2PM–8PM)</option>
                        <option value="night">🌙 Night (8PM–8AM)</option>
                      </select>
                    </div>

                    <div className="smart-booking-field">
                      <label className="hnu-label">4. Select Doctor
                        {bookingShift && (
                          <span style={{ marginLeft: 6, fontSize: 11, color: '#0ea5e9', fontWeight: 500 }}>
                            — {bookingShift.charAt(0).toUpperCase() + bookingShift.slice(1)} only
                          </span>
                        )}
                      </label>

                      {/* Show count of filtered vs all doctors */}
                      {(() => {
                        const filteredDocs = showAllDoctors
                          ? doctors.filter((d) => d.available)
                          : doctors.filter((d) => d.available && (!bookingShift || String(d.shift || "").toLowerCase() === bookingShift.toLowerCase()));
                        const allAvailDocs = doctors.filter((d) => d.available);
                        const otherDocs = allAvailDocs.filter((d) => !filteredDocs.includes(d));

                        return (
                          <>
                            <select
                              value={bookingForm.doctor_id}
                              onChange={(e) => setBookingForm((prev) => ({ ...prev, doctor_id: e.target.value, time_slot: "" }))}
                            >
                              <option value="">
                                {filteredDocs.length === 0
                                  ? `No ${bookingShift} doctors available — see others below`
                                  : `Select doctor (${filteredDocs.length} available)`}
                              </option>
                              {filteredDocs.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                  {doctor.name} ({doctor.department}) — {String(doctor.shift || "").toUpperCase()} — PKR {Number(doctor.consultation_fee || 500).toLocaleString()}
                                </option>
                              ))}
                              {showAllDoctors && otherDocs.length > 0 && (
                                <optgroup label="─── Other Shifts / Days ───">
                                  {doctors.filter(d => !d.available).map((doctor) => (
                                    <option key={doctor.id} value={doctor.id} disabled>
                                      {doctor.name} — {String(doctor.shift || "").toUpperCase()} — ⚠️ {doctor.reason_unavailable || "Not available today"}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>

                            {/* Show other doctors button */}
                            {!showAllDoctors && otherDocs.length > 0 && (
                              <button
                                type="button"
                                onClick={() => { setShowAllDoctors(true); setBookingForm(prev => ({ ...prev, doctor_id: "", time_slot: "" })); }}
                                style={{
                                  marginTop: 6,
                                  background: 'none',
                                  border: '1.5px dashed #6366f1',
                                  color: '#6366f1',
                                  borderRadius: 8,
                                  padding: '6px 14px',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  width: '100%',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.target.style.background = '#ede9fe'}
                                onMouseLeave={e => e.target.style.background = 'none'}
                              >
                                👁️ Show {otherDocs.length} Doctor(s) with Other Shifts/Days
                              </button>
                            )}
                            {showAllDoctors && (
                              <button
                                type="button"
                                onClick={() => { setShowAllDoctors(false); setBookingForm(prev => ({ ...prev, doctor_id: "", time_slot: "" })); }}
                                style={{
                                  marginTop: 6,
                                  background: '#ede9fe',
                                  border: '1.5px solid #6366f1',
                                  color: '#4f46e5',
                                  borderRadius: 8,
                                  padding: '6px 14px',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  width: '100%',
                                }}
                              >
                                ✅ Showing All Available Doctors — Click to Filter by Shift
                              </button>
                            )}
                          </>
                        );
                      })()}

                      {/* Fee info card shown once doctor is selected */}
                      {selectedDoctor && (
                        <div className="stripe-doctor-fee-card">
                          <div className="stripe-doctor-fee-info">
                            <span className="stripe-doctor-fee-label">💳 Consultation Fee</span>
                            <span className="stripe-doctor-fee-value">PKR {Number(selectedDoctor.consultation_fee || 500).toLocaleString()}</span>
                            <span className="stripe-doctor-fee-note">
                              {selectedDoctor.experience_years || 0} yrs exp · {selectedDoctor.specialization || selectedDoctor.department} · {String(selectedDoctor.shift || "").toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "#8b5cf6", maxWidth: 140, textAlign: "right" }}>
                            Paid securely via Stripe after slot selection
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="smart-booking-field">
                      <label className="hnu-label">5. Select Slot</label>
                      <select
                        value={bookingForm.time_slot}
                        onChange={(e) => setBookingForm((prev) => ({ ...prev, time_slot: e.target.value }))}
                      >
                        <option value="">
                          {selectedDoctor ? `Select slot (${(selectedDoctor?.available_slots || []).filter(slot => !isSlotInPastLocal(bookingForm.date, slot)).length} available)` : "Select doctor first"}
                        </option>
                        {(selectedDoctor?.available_slots || [])
                          .filter((slot) => !isSlotInPastLocal(bookingForm.date, slot))
                          .map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                      </select>
                      {selectedDoctor && (selectedDoctor?.available_slots || []).filter(slot => !isSlotInPastLocal(bookingForm.date, slot)).length === 0 && (
                        <div style={{ marginTop: 6, fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                          ⚠️ No slots available for today. Try another date or doctor.
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button type="submit" variant="primary" disabled={bookingInProgress || loadingDoctors || !bookingForm.doctor_id || !bookingForm.time_slot}>
                      {bookingInProgress ? "Booking..." : "💳 Pay & Book Appointment"}
                    </Button>
                    {selectedDoctor && bookingForm.time_slot && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280" }}>
                        <span className="doctor-fee-badge">PKR {Number(selectedDoctor.consultation_fee || 500).toLocaleString()}</span>
                        <span>will be charged on next step</span>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <div className="hnu-message" style={{ marginBottom: 0 }}>
                  Select a hospital first to load doctors and available time slots.
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {activeSection === "nearest" && (
          <NearestHospital embed={true} />
        )}

        {activeSection === "search" && (
          <Card>
            <CardHeader>Search Doctors & Hospitals</CardHeader>
            <CardBody>
              <form onSubmit={handleManualSearch} style={{ display: "grid", gap: 14, marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                  <div className="hnu-field">
                    <label className="hnu-label">Department / Specialty</label>
                    <input
                      type="text"
                      placeholder="e.g. Cardiology, Dermatology"
                      value={searchFilters.department}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                  <div className="hnu-field">
                    <label className="hnu-label">Doctor Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. John"
                      value={searchFilters.doctor_name}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, doctor_name: e.target.value }))}
                    />
                  </div>
                  <div className="hnu-field">
                    <label className="hnu-label">Hospital Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Allied Hospital"
                      value={searchFilters.hospital_name}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, hospital_name: e.target.value }))}
                    />
                  </div>
                  <div className="hnu-field">
                    <label className="hnu-label">City / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Faisalabad"
                      value={searchFilters.city}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Button type="submit" variant="primary" disabled={searching}>
                    {searching ? "Searching..." : "🔍 Search"}
                  </Button>
                </div>
              </form>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: 6 }}>
                    👨‍⚕️ Matching Doctors ({searchResults.doctors.length})
                  </h3>
                  {searchResults.doctors.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: 14, margin: "10px 0" }}>No doctors found matching filters.</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10, marginTop: 10 }}>
                      {searchResults.doctors.map((doctor) => (
                        <Card key={doctor.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{doctor.name}</div>
                          <div style={{ fontSize: 13, color: "#4b5563", marginTop: 2 }}>
                            {doctor.specialization || doctor.department} · {doctor.experience_years} yrs exp
                          </div>
                          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                            🏥 <strong>{doctor.hospital.name}</strong> ({doctor.hospital.city})
                          </div>
                          {doctor.hospital.distance_km !== null && (
                            <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 2 }}>
                              📍 Distance: {doctor.hospital.distance_km.toFixed(2)} km
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>
                              PKR {doctor.consultation_fee.toLocaleString()}
                            </span>
                            <Button type="button" size="sm" variant="primary" onClick={() => handleBookFromSearch(doctor)}>
                              Book Appointment
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 10 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: 6 }}>
                    🏥 Matching Hospitals ({searchResults.hospitals.length})
                  </h3>
                  {searchResults.hospitals.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: 14, margin: "10px 0" }}>No hospitals found matching filters.</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10, marginTop: 10 }}>
                      {searchResults.hospitals.map((hosp) => (
                        <Card key={hosp._id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>{hosp.name}</div>
                          <div style={{ fontSize: 13, color: "#4b5563", marginTop: 2 }}>
                            {hosp.address}, {hosp.city}
                          </div>
                          {hosp.phone && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>📞 {hosp.phone}</div>}
                          {hosp.distance_km !== null && (
                            <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 2 }}>
                              📍 Distance: {hosp.distance_km.toFixed(2)} km
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {activeSection === "appointments" && (
          <Card>
            <CardHeader>My Appointments</CardHeader>
            <CardBody>
              <div style={{ marginBottom: 10 }}>
                <Button type="button" variant="soft" onClick={loadAppointments} disabled={loadingAppointments}>
                  {loadingAppointments ? "Loading..." : "Refresh Appointments"}
                </Button>
              </div>

              {appointments.length === 0 ? (
                <div style={{ color: "var(--text-muted)" }}>No appointments found.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="hnu-table">
                    <thead>
                      <tr>
                        <th>Hospital</th>
                        <th>Doctor</th>
                        <th>Disease / Reason</th>
                        <th>Date/Time</th>
                        <th>Prescription / Rx</th>
                        <th>Status</th>
                        <th>Feedback</th>
                        <th>Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((row) => (
                        <tr key={String(row._id)}>
                          <td>
                            <div style={{ display: "grid", gap: 2 }}>
                              <span>{row?.hospital_id?.name || "-"}</span>
                              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                                {[row?.hospital_id?.city || "", row?.hospital_id?._id ? `ID: ${String(row.hospital_id._id)}` : ""]
                                  .filter(Boolean)
                                  .join(" | ") || "Location details unavailable"}
                              </span>
                            </div>
                          </td>
                          <td>{row?.doctor_id?.name || "-"}</td>
                          <td>
                            {row?.reason ? (
                              <div style={{ display: "grid", gap: 2 }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    background: "linear-gradient(135deg, #ede9fe, #dbeafe)",
                                    color: "#4338ca",
                                    fontWeight: 600,
                                    fontSize: 12,
                                    borderRadius: 20,
                                    padding: "3px 10px",
                                    border: "1px solid #c7d2fe",
                                    maxWidth: 160,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={row.reason}
                                >
                                  🔍 {row.reason}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td>{formatDateTime(row?.appointment_at)}</td>
                          <td>
                            {row?.prescription ? (
                              <div style={{ display: "grid", gap: 4, minWidth: 160 }}>
                                <div style={{ fontSize: 16, color: "var(--color-primary, #0284c7)", fontWeight: "bold" }}>Rx</div>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                  {Array.isArray(row.prescription.medicines) && row.prescription.medicines.map((med, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        display: "inline-block",
                                        background: "#f0fdf4",
                                        color: "#166534",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        padding: "2px 8px",
                                        borderRadius: "12px",
                                        border: "1px solid #bbf7d0",
                                      }}
                                    >
                                      💊 {med}
                                    </span>
                                  ))}
                                </div>
                                {row.prescription.instructions && (
                                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", marginTop: 2 }}>
                                    💡 {row.prescription.instructions}
                                  </div>
                                )}
                              </div>
                            ) : row?.status === "completed" ? (
                              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No prescription issued</span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                            )}
                          </td>
                          <td>{getAppointmentStatusLabel(row?.status)}</td>
                          <td>
                            {String(row?.status || "") === "completed" ? (
                              row?.patient_feedback?.rating ? (
                                <div style={{ display: "grid", gap: 2 }}>
                                  <strong>{Number(row.patient_feedback.rating)}/5</strong>
                                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                                    {row?.patient_feedback?.comment || "No comment"}
                                  </span>
                                </div>
                              ) : (
                                <div style={{ display: "grid", gap: 6, minWidth: 180 }}>
                                  <select
                                    value={appointmentFeedbackDrafts[String(row._id)]?.rating || ""}
                                    onChange={(event) => setAppointmentFeedbackDraft(row._id, { rating: event.target.value })}
                                  >
                                    <option value="">Rate visit</option>
                                    <option value="5">5 - Excellent</option>
                                    <option value="4">4 - Good</option>
                                    <option value="3">3 - Average</option>
                                    <option value="2">2 - Poor</option>
                                    <option value="1">1 - Very Poor</option>
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Optional comment"
                                    value={appointmentFeedbackDrafts[String(row._id)]?.comment || ""}
                                    onChange={(event) => setAppointmentFeedbackDraft(row._id, { comment: event.target.value })}
                                    maxLength={500}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => submitAppointmentFeedback(row._id)}
                                    disabled={submittingFeedbackAppointmentId === String(row._id)}
                                  >
                                    {submittingFeedbackAppointmentId === String(row._id) ? "Saving..." : "Submit"}
                                  </Button>
                                </div>
                              )
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Available after visit is finished</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <Button type="button" variant="soft" size="sm" onClick={() => openHospitalMap(row?.hospital_id)}>
                                View Map
                              </Button>
                              <a
                                href={buildMapsSearchUrl(buildHospitalSearchTextQuery(row?.hospital_id || {}))}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: 12, fontWeight: 700, color: "#0369a1", alignSelf: "center" }}
                              >
                                Open in Google Maps
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        )}
          </div>
        </section>
      </main>

      <Modal
        open={mapModalOpen}
        title="Hospital Live Location"
        onClose={closeMapModal}
        size="lg"
        footer={(
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {mapHospital ? (
              <a
                href={buildMapsSearchUrl(buildHospitalSearchTextQuery(mapHospital))}
                target="_blank"
                rel="noreferrer"
              >
                <Button type="button" variant="soft">Open in Google Maps</Button>
              </a>
            ) : null}
            {mapHospital && buildHospitalLocationQuery(mapHospital) ? (
              <a
                href={buildLiveNavigationUrl(buildHospitalLocationQuery(mapHospital), "driving")}
                target="_blank"
                rel="noreferrer"
              >
                <Button type="button" variant="primary">Start Live Navigation</Button>
              </a>
            ) : null}
            {mapHospital && mapUserLocation && buildHospitalLocationQuery(mapHospital) ? (
              <a
                href={buildDirectionsUrl(
                  mapUserLocation.lat,
                  mapUserLocation.lng,
                  buildHospitalLocationQuery(mapHospital),
                  "driving"
                )}
                target="_blank"
                rel="noreferrer"
              >
                <Button type="button" variant="primary">Car Directions</Button>
              </a>
            ) : null}
            {mapHospital && mapUserLocation && buildHospitalLocationQuery(mapHospital) ? (
              <a
                href={buildDirectionsUrl(
                  mapUserLocation.lat,
                  mapUserLocation.lng,
                  buildHospitalLocationQuery(mapHospital),
                  "bicycling"
                )}
                target="_blank"
                rel="noreferrer"
              >
                <Button type="button" variant="soft">Bike Directions</Button>
              </a>
            ) : null}
            {mapHospital && hasManualOrigin && buildHospitalLocationQuery(mapHospital) ? (
              <a
                href={buildDirectionsUrl(
                  manualOriginLat,
                  manualOriginLng,
                  buildHospitalLocationQuery(mapHospital),
                  "driving"
                )}
                target="_blank"
                rel="noreferrer"
              >
                <Button type="button" variant="soft">Manual Car Directions</Button>
              </a>
            ) : null}
            {mapHospital && hasManualOrigin && buildHospitalLocationQuery(mapHospital) ? (
              <a
                href={buildDirectionsUrl(
                  manualOriginLat,
                  manualOriginLng,
                  buildHospitalLocationQuery(mapHospital),
                  "bicycling"
                )}
                target="_blank"
                rel="noreferrer"
              >
                <Button type="button" variant="soft">Manual Bike Directions</Button>
              </a>
            ) : null}
            <Button type="button" variant="outline" onClick={closeMapModal}>
              Close
            </Button>
          </div>
        )}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <strong>{mapHospital?.name || "Hospital"}</strong>
            <div style={{ color: "#64748b", marginTop: 4 }}>
              {[mapHospital?.address, mapHospital?.city].filter(Boolean).join(", ") || "Address not available"}
            </div>
          </div>

          {mapHospital ? (
            <iframe
              title="Hospital Map"
              src={buildMapsEmbedUrl(buildHospitalSearchTextQuery(mapHospital))}
              style={{ width: "100%", height: 360, border: "1px solid #d1d5db", borderRadius: 12 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : null}

          <div style={{ color: "#64748b", fontSize: 13 }}>
            {loadingMapLocation
              ? "Tracking your live location for directions..."
              : (mapUserLocation
                ? (mapLocationSource === "Precise GPS"
                  ? "Live location is active. Car/Bike directions and distance update as you move."
                  : "Using approximate location. Enter manual origin for better accuracy.")
                : "Allow location in browser to use live directions.")}
          </div>

          {mapLocationSource ? (
            <div style={{ color: "#0f172a", fontSize: 13 }}>
              <strong>Location source:</strong> {mapLocationSource}
            </div>
          ) : null}

          <div
            style={{
              border: "1px solid #dbe2ea",
              borderRadius: 12,
              padding: 12,
              background: "#ffffff",
              display: "grid",
              gap: 8,
            }}
          >
            <strong style={{ color: "#0f172a" }}>Manual Origin (PC/Laptop fallback)</strong>
            <div style={{ color: "#64748b", fontSize: 12 }}>
              If browser blocks precise GPS, enter your current coordinates and use manual directions.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8 }}>
              <input
                type="text"
                value={manualOrigin.lat}
                onChange={(event) => setManualOrigin((prev) => ({ ...prev, lat: event.target.value }))}
                placeholder="Latitude (e.g. 31.4504)"
              />
              <input
                type="text"
                value={manualOrigin.lng}
                onChange={(event) => setManualOrigin((prev) => ({ ...prev, lng: event.target.value }))}
                placeholder="Longitude (e.g. 73.1350)"
              />
            </div>
            <div>
              <Button type="button" variant="soft" onClick={applyManualOriginForRoute}>
                Apply Manual Origin
              </Button>
            </div>
          </div>

          {routeInsightsError ? (
            <div style={{ color: "#b45309", fontSize: 13, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 10px" }}>
              {routeInsightsError}
            </div>
          ) : null}

          {(loadingRouteInsights || routeInsights.driving || routeInsights.cycling || routeInsights.shortest_path) ? (
            <div
              style={{
                border: "1px solid #dbe2ea",
                borderRadius: 12,
                padding: 12,
                background: "#f8fbff",
                display: "grid",
                gap: 8,
              }}
            >
              <strong style={{ color: "#0f172a" }}>Live Route Estimates</strong>
              {loadingRouteInsights ? (
                <div style={{ color: "#64748b", fontSize: 13 }}>Calculating car and bike routes...</div>
              ) : null}

              {routeInsights.driving ? (
                <div style={{ color: "#0f172a", fontSize: 13 }}>
                  <strong>Car:</strong> {formatTravelDuration(routeInsights.driving.fastest_duration_min)} · {formatDistanceKm(routeInsights.driving.fastest_distance_km)}
                </div>
              ) : null}

              {routeInsights.cycling ? (
                <div style={{ color: "#0f172a", fontSize: 13 }}>
                  <strong>Bike:</strong> {formatTravelDuration(routeInsights.cycling.fastest_duration_min)} · {formatDistanceKm(routeInsights.cycling.fastest_distance_km)}
                </div>
              ) : null}

              {routeInsights.shortest_path ? (
                <div style={{ color: "#0f172a", fontSize: 13 }}>
                  <strong>Shortest path:</strong> {routeInsights.shortest_path.mode} · {formatDistanceKm(routeInsights.shortest_path.distance_km)} · {formatTravelDuration(routeInsights.shortest_path.duration_min)}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={diseasePickerOpen}
        title="Choose Disease / Symptom"
        onClose={() => setDiseasePickerOpen(false)}
        size="lg"
        footer={(
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button type="button" variant="outline" onClick={() => setDiseasePickerOpen(false)}>
              Close
            </Button>
          </div>
        )}
      >
        <div className="disease-picker-shell">
          <div className="disease-picker-header">
            <div>
              <div className="disease-picker-title">Disease catalog</div>
              <div className="disease-picker-subtitle">Pick a disease to auto-fill the Smart Booking input.</div>
            </div>
            <div className="disease-picker-search">
              <input
                value={diseaseSearch}
                onChange={(event) => setDiseaseSearch(event.target.value)}
                placeholder="Search disease"
              />
            </div>
          </div>

          <div className="disease-picker-content">
            <section className="disease-department-card">
              <div className="disease-chip-grid">
                {filteredDiseaseItems.map((item) => (
                  <button
                    key={`${item.department}-${item.disease}`}
                    type="button"
                    className="disease-chip"
                    onClick={() => chooseDisease(item.disease)}
                  >
                    {item.disease}
                  </button>
                ))}
              </div>
            </section>
            {filteredDiseaseItems.length === 0 ? (
              <div className="disease-picker-empty">No diseases match your search.</div>
            ) : null}
          </div>

          <div className="disease-picker-manual">
            <div>
              <strong>Manual symptom</strong>
              <p>Type a custom disease name in the search box and use it as the input if it is not in the list.</p>
            </div>
            <Button type="button" variant="soft" onClick={() => chooseDisease(String(diseaseSearch || "").trim())} disabled={!String(diseaseSearch || "").trim()}>
              Use Typed Symptom
            </Button>
          </div>
        </div>
      </Modal>

      <StripePaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        bookingDetails={pendingBookingDetails}
      />
    </div>
  );
}
