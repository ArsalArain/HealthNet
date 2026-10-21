/**
 * hospitalRecommendation.js
 * Utilities for mapping diseases/symptoms → departments and scoring hospitals.
 * Supports English, Roman Urdu, and common symptom phrases.
 */

"use strict";

// ─────────────────────────────────────────────
// ROMAN URDU  →  English translation map
// Covers the most common symptom phrases patients type
// ─────────────────────────────────────────────
const ROMAN_URDU_MAP = [
  // Fever / Temperature
  { pattern: /\b(bukhar|bukhaar|buxar|tapish|garmi|jism ki garmi)\b/i, english: "fever" },
  // Cough
  { pattern: /\b(khansi|khasi|khaansi|khaansy|khansy|sookhi khansi|khushk khansi)\b/i, english: "cough" },
  // Cold / Flu
  { pattern: /\b(zukam|zukaam|nazla|neezla|naak bund|naak band|sardi|thanda)\b/i, english: "cold flu" },
  // Headache
  { pattern: /\b(sar dard|sir dard|sar ka dard|sir ka dard|sirdard|sardard)\b/i, english: "headache" },
  // Throat
  { pattern: /\b(gala dard|gale mein dard|galaa|kharash|gale ki takleef|sore throat)\b/i, english: "sore throat" },
  // Stomach pain
  { pattern: /\b(pait dard|pet dard|pait ka dard|pet mein dard|maida|shikam dard|tond dard)\b/i, english: "stomach pain" },
  // Vomiting / Nausea
  { pattern: /\b(ulti|ulty|qay|qai|matli|matali|ji machlana|ghbrahana)\b/i, english: "vomiting nausea" },
  // Diarrhea
  { pattern: /\b(dast|ishal|pait kharabi|loose motion|latrine|pakhana)\b/i, english: "diarrhea" },
  // Shortness of breath
  { pattern: /\b(sans phoolna|saans phoolna|sans lena mushkil|saans ki takleef|dam ghutna|dam phoolna)\b/i, english: "shortness of breath" },
  // Chest pain
  { pattern: /\b(seena dard|sina dard|seene mein dard|sine mein dard|dil dard|dil ka dard)\b/i, english: "chest pain" },
  // Back pain
  { pattern: /\b(kamar dard|pith dard|peeth dard|kamar mein dard|pith mein dard)\b/i, english: "back pain" },
  // Joint pain
  { pattern: /\b(joro(n)? ka dard|juron ka dard|haddi dard|ghutne ka dard)\b/i, english: "joint pain" },
  // Eye problems
  { pattern: /\b(ankh dard|aankh mein dard|aankh jalana|ankh ki takleef|dhundla dikhai)\b/i, english: "eye pain blurred vision" },
  // Ear problems
  { pattern: /\b(kan dard|kaan mein dard|kan bund|kaan ki takleef)\b/i, english: "ear pain" },
  // Urination
  { pattern: /\b(peshab mein jalan|peshab mein dard|bar bar peshab|peshaab)\b/i, english: "painful urination frequent urination" },
  // Skin rash
  { pattern: /\b(khujli|kharish|daane|chamri ka masla|jild ki bimari|phunsi)\b/i, english: "skin rash itching" },
  // Weakness / Fatigue
  { pattern: /\b(kamzori|thakaan|thakan|jism mein susti|lasst pana|lazzt)\b/i, english: "weakness fatigue" },
  // Swelling
  { pattern: /\b(sujan|sawzish|waram|phoolna|soojna)\b/i, english: "swelling" },
  // Dizziness
  { pattern: /\b(chakkar|chakkir|chakkhar|sar ghoomna|sir ghoomna)\b/i, english: "dizziness" },
  // Bleeding
  { pattern: /\b(khoon aana|khoon nikalna|bleeding|rakt|khuni|naak se khoon)\b/i, english: "bleeding" },
  // Diabetes symptoms
  { pattern: /\b(sugar|shakar|diabetes|madhumeh|zyada pyas|zyada peshab)\b/i, english: "diabetes sugar" },
  // Heart palpitations
  { pattern: /\b(dil ki dhadkan|dhadkan|dil tez dharna|ghabrahut)\b/i, english: "palpitations heart" },
  // Pregnancy
  { pattern: /\b(hamla|hamal|pait mein bacha|baby bump|delivery|wiladat)\b/i, english: "pregnancy" },
  // Dental
  { pattern: /\b(daant dard|daant mein dard|masi dard|dant dard)\b/i, english: "toothache" },
  // Constipation
  { pattern: /\b(qabz|qabaz|pakhana na aana|constipation)\b/i, english: "constipation" },
  // Injury / Fracture
  { pattern: /\b(chot|chot lagna|haddi tooti|fracture|haadsa)\b/i, english: "injury fracture" },
  // Allergy
  { pattern: /\b(allergy|elsarji|phool ki allergy|dust allergy)\b/i, english: "allergy" },
  // Anxiety / Mental
  { pattern: /\b(fikr|ghabrahut|tension|zehni takleef|depression|udasi|dil ghabrana)\b/i, english: "anxiety depression" },
  // Blood pressure
  { pattern: /\b(bp|blood pressure|feshar|fashar|high bp|low bp)\b/i, english: "blood pressure" },
  // Malaria / Dengue
  { pattern: /\b(malaria|maleriya|dengue|dengee|dengi|machar wali bimari)\b/i, english: "malaria dengue fever" },
  // Typhoid
  { pattern: /\b(typhoid|tyfoid|mojzoon ka bukhar|miada bukhar)\b/i, english: "typhoid fever" },
  // Appendix
  { pattern: /\b(appendix|appendiks|pet ka nichla hissa dard)\b/i, english: "appendix pain" },
  // Kidney
  { pattern: /\b(gurda|kidney|pathri|pathari|gurde ka dard)\b/i, english: "kidney stone pain" },
];

/**
 * Translates Roman Urdu / common spellings in a string to their English equivalents.
 * Preserves any existing English words.
 */
function translateRomanUrdu(input) {
  let text = String(input || "").trim();
  for (const { pattern, english } of ROMAN_URDU_MAP) {
    text = text.replace(pattern, english);
  }
  return text;
}

// ─────────────────────────────────────────────
// DEPARTMENT ALIASES  (name → canonical key)
// ─────────────────────────────────────────────
const DEPARTMENT_ALIASES = {
  "general medicine": [
    "general medicine", "general", "internal medicine", "medicine", "opd", "general opd",
    "family medicine", "general physician", "physician", "gp", "mbbs", "outdoor", "outpatient",
  ],
  cardiology: ["cardiology", "cardiac", "heart", "cvt", "cardio", "cardiovascular"],
  neurology: ["neurology", "neuro", "brain", "stroke", "seizure", "nervous system"],
  orthopedics: ["orthopedics", "orthopaedics", "ortho", "bone", "fracture", "joint", "musculoskeletal"],
  emergency: ["emergency", "emergency medicine", "casualty", "trauma", "a&e", "accident", "er"],
  pediatrics: ["pediatrics", "paediatrics", "pediatric", "child", "children", "neonatal", "baby"],
  dermatology: ["dermatology", "skin", "derma"],
  ent: ["ent", "otolaryngology", "ear nose throat", "ear", "nose", "throat", "ent specialist"],
  pulmonology: ["pulmonology", "respiratory", "chest", "lung", "pulmonary"],
  gynecology: ["gynecology", "obstetrics", "obgyn", "women", "maternity", "gynae", "gynaecology", "obs"],
  urology: ["urology", "urinary", "kidney", "bladder", "urologist"],
  oncology: ["oncology", "cancer", "tumor", "chemotherapy"],
  psychiatry: ["psychiatry", "mental health", "psychology", "mental", "psychiatric", "counseling"],
  endocrinology: ["endocrinology", "diabetes", "thyroid", "hormone", "endocrine"],
  gastroenterology: ["gastroenterology", "gastro", "gi", "liver", "gastrointestinal", "digestive"],
  nephrology: ["nephrology", "renal", "dialysis", "kidney specialist"],
  ophthalmology: ["ophthalmology", "eye", "eyes", "ophthalmologist", "optometry"],
  rheumatology: ["rheumatology", "rheumatoid", "arthritis", "lupus"],
  hematology: ["hematology", "blood", "haematology", "anemia"],
  dentistry: ["dentistry", "dental", "teeth", "tooth", "oral", "dentist"],
};

// ─────────────────────────────────────────────
// DISEASE/SYMPTOM → DEPARTMENT RULES
// Much more comprehensive than before — covers 50+ common patterns
// ─────────────────────────────────────────────
const DISEASE_TO_DEPARTMENT = [
  // ── Critical / Emergency ──
  {
    match: ["heart attack", "myocardial infarction", "cardiac arrest", "angina", "chest pain", "palpitation",
      "palpitations", "irregular heartbeat", "heart failure", "arrhythmia", "atrial fibrillation"],
    department: "Cardiology", critical: true,
  },
  {
    match: ["stroke", "epilepsy", "seizure", "fits", "migraine", "head injury", "unconscious", "concussion",
      "brain hemorrhage", "paralysis", "parkinson", "alzheimer", "dementia", "meningitis", "encephalitis"],
    department: "Neurology", critical: true,
  },
  {
    match: ["burn", "severe bleeding", "bleeding", "poisoning", "accident", "trauma", "anaphylaxis",
      "asthma attack", "heat stroke", "overdose", "crushing", "drowning", "electric shock", "road accident"],
    department: "Emergency Medicine", critical: true,
  },
  {
    match: ["cancer", "tumor", "leukemia", "lymphoma", "oncology", "chemotherapy", "malignant"],
    department: "Oncology", critical: true,
  },
  {
    match: ["pneumonia", "shortness of breath", "breathlessness", "asthma", "copd", "lung infection",
      "difficulty breathing", "breathing difficulty", "tuberculosis", "tb", "bronchitis", "bronchiolitis",
      "emphysema", "pleurisy", "pulmonary embolism"],
    department: "Pulmonology", critical: true,
  },

  // ── Specialty ──
  {
    match: ["fracture", "broken bone", "bone injury", "dislocation", "sprain", "joint pain", "back pain",
      "knee pain", "hip pain", "shoulder pain", "spondylosis", "arthritis", "osteoporosis", "bone pain",
      "neck pain", "disc herniation", "sciatica", "sports injury"],
    department: "Orthopedics", critical: false,
  },
  {
    match: ["pregnancy", "pcos", "miscarriage", "fibroids", "delivery", "labor", "period", "menstrual",
      "vaginal", "ovarian", "uterine", "gynecology", "periods", "irregular periods", "pelvic pain",
      "pregnancy test", "maternity", "endometriosis", "menopause", "cervical"],
    department: "Gynecology / Obstetrics", critical: false,
  },
  {
    match: ["kidney stone", "kidney stones", "uti", "urinary infection", "urinary", "bladder",
      "prostate", "frequent urination", "painful urination", "blood in urine", "kidney pain"],
    department: "Urology", critical: false,
  },
  {
    match: ["skin rash", "rash", "eczema", "psoriasis", "acne", "itching", "skin disease", "skin infection",
      "fungal skin", "dermatitis", "hives", "urticaria", "skin allergy", "ringworm", "scabies",
      "pimples", "hair loss", "alopecia"],
    department: "Dermatology", critical: false,
  },
  {
    match: ["ear pain", "ear infection", "sore throat", "throat pain", "tonsils", "tonsillitis",
      "sinusitis", "nasal", "nose bleed", "nosebleed", "ear discharge", "hearing loss", "hoarse voice",
      "adenoid", "ent", "nasal polyp", "deviated septum"],
    department: "ENT (Ear, Nose, Throat)", critical: false,
  },
  {
    match: ["eye pain", "eye infection", "conjunctivitis", "cataract", "glaucoma", "vision",
      "blurred vision", "red eye", "watery eyes", "retina", "cornea", "spectacles", "presbyopia"],
    department: "Ophthalmology", critical: false,
  },
  {
    match: ["stomach pain", "abdominal pain", "stomach ache", "gastritis", "gastro", "ulcer",
      "liver", "jaundice", "hepatitis", "cirrhosis", "gallstone", "pancreatitis", "diarrhea",
      "constipation", "ibs", "crohn", "colitis", "appendix", "vomiting blood", "acidity", "gerd",
      "indigestion", "gas", "bloating", "stomach problem"],
    department: "Gastroenterology", critical: false,
  },
  {
    match: ["kidney failure", "renal failure", "dialysis", "kidney disease", "nephrotic",
      "renal disease", "kidney specialist"],
    department: "Nephrology", critical: false,
  },
  {
    match: ["diabetes", "sugar disease", "blood sugar", "high sugar", "low sugar", "thyroid",
      "hypothyroid", "hyperthyroid", "goiter", "hormone imbalance", "obesity", "metabolic",
      "adrenal", "cushing", "pituitary"],
    department: "Endocrinology", critical: false,
  },
  {
    match: ["anxiety", "depression", "stress", "mental health", "insomnia", "schizophrenia",
      "bipolar", "panic attack", "ptsd", "ocd", "adhd", "autism", "mental disorder",
      "eating disorder", "addiction", "drug abuse", "alcohol addiction", "suicide"],
    department: "Psychiatry / Mental Health", critical: false,
  },
  {
    match: ["toothache", "tooth pain", "dental", "tooth decay", "gum pain", "gum disease",
      "broken tooth", "oral", "mouth ulcer", "dental abscess"],
    department: "Dentistry", critical: false,
  },
  {
    match: ["child fever", "child cough", "child illness", "baby", "infant", "newborn",
      "diaper rash", "teething", "vaccination", "immunization", "growth problem"],
    department: "Pediatrics", critical: false,
  },
  {
    match: ["lupus", "rheumatoid arthritis", "gout", "fibromyalgia", "vasculitis", "scleroderma"],
    department: "Rheumatology", critical: false,
  },
  {
    match: ["anemia", "blood disorder", "hemophilia", "sickle cell", "platelet", "thalassemia", "low blood"],
    department: "Hematology", critical: false,
  },
  {
    match: ["malaria", "dengue", "typhoid", "hiv", "aids", "hepatitis a", "hepatitis b", "tuberculosis",
      "sepsis", "chickenpox", "measles", "mumps", "rabies", "lyme", "dengue fever", "typhoid fever"],
    department: "Infectious Disease", critical: false,
  },
  {
    match: ["blood pressure", "hypertension", "high blood pressure", "low blood pressure", "hypotension"],
    department: "Cardiology", critical: false,
  },
  {
    match: ["allergy", "hay fever", "food allergy", "dust allergy", "allergic reaction"],
    department: "Allergy & Immunology", critical: false,
  },

  // ── General / Catch-all ── (MUST be last — broadest terms)
  {
    match: ["fever", "flu", "influenza", "cold", "cough", "headache", "body pain", "weakness",
      "viral", "infection", "fatigue", "tiredness", "body ache", "vomiting", "nausea",
      "sore throat", "runny nose", "general checkup", "checkup", "not feeling well", "feeling sick"],
    department: "General Medicine", critical: false,
  },
];

// ─────────────────────────────────────────────
// normalizeToken
// ─────────────────────────────────────────────
function normalizeToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─────────────────────────────────────────────
// buildAliasMap
// ─────────────────────────────────────────────
function buildAliasMap() {
  const map = new Map();
  for (const [department, aliases] of Object.entries(DEPARTMENT_ALIASES)) {
    for (const alias of aliases) {
      map.set(normalizeToken(alias), department);
    }
    map.set(normalizeToken(department), department);
  }
  return map;
}

const NORMALIZED_ALIAS_MAP = buildAliasMap();

// ─────────────────────────────────────────────
// mapDiseaseToDepartment
// Accepts English, Roman Urdu, or mixed input.
// ─────────────────────────────────────────────
function mapDiseaseToDepartment(disease) {
  // 1. Translate Roman Urdu phrases first
  const translated = translateRomanUrdu(disease);
  const token = normalizeToken(translated);

  if (!token) {
    return { department_name: "General Medicine", match_source: "fallback", is_critical: false };
  }

  // 2. Exact department alias match (e.g., input is literally "cardiology")
  if (NORMALIZED_ALIAS_MAP.has(token)) {
    const departmentKey = NORMALIZED_ALIAS_MAP.get(token);
    // Map canonical key → display name
    const displayName = CANONICAL_TO_DISPLAY[departmentKey] || capitalizeFirst(departmentKey);
    const rule = DISEASE_TO_DEPARTMENT.find((entry) =>
      normalizeToken(entry.department) === normalizeToken(displayName)
    );
    return {
      department_name: displayName,
      match_source: "department_alias",
      is_critical: Boolean(rule?.critical),
    };
  }

  // 3. Keyword/phrase matching — check each rule
  for (const rule of DISEASE_TO_DEPARTMENT) {
    if (rule.match.some((phrase) => token.includes(normalizeToken(phrase)))) {
      return {
        department_name: rule.department,
        match_source: "disease_rule",
        is_critical: Boolean(rule.critical),
      };
    }
  }

  // 4. Partial alias match — check if any department alias is a substring
  for (const [alias, departmentKey] of NORMALIZED_ALIAS_MAP.entries()) {
    if (token.includes(alias) && alias.length >= 4) {
      const displayName = CANONICAL_TO_DISPLAY[departmentKey] || capitalizeFirst(departmentKey);
      return {
        department_name: displayName,
        match_source: "alias_substring",
        is_critical: false,
      };
    }
  }

  // 5. Fallback
  return { department_name: "General Medicine", match_source: "fallback", is_critical: false };
}

// ─────────────────────────────────────────────
// Canonical key → user-facing display name
// ─────────────────────────────────────────────
const CANONICAL_TO_DISPLAY = {
  "general medicine": "General Medicine",
  cardiology: "Cardiology",
  neurology: "Neurology",
  orthopedics: "Orthopedics",
  emergency: "Emergency Medicine",
  pediatrics: "Pediatrics",
  dermatology: "Dermatology",
  ent: "ENT (Ear, Nose, Throat)",
  pulmonology: "Pulmonology",
  gynecology: "Gynecology / Obstetrics",
  urology: "Urology",
  oncology: "Oncology",
  psychiatry: "Psychiatry / Mental Health",
  endocrinology: "Endocrinology",
  gastroenterology: "Gastroenterology",
  nephrology: "Nephrology",
  ophthalmology: "Ophthalmology",
  rheumatology: "Rheumatology",
  hematology: "Hematology",
  dentistry: "Dentistry",
};

function capitalizeFirst(str) {
  return String(str || "").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─────────────────────────────────────────────
// haversineDistanceKm
// ─────────────────────────────────────────────
function haversineDistanceKm(fromLat, fromLng, toLat, toLng) {
  const earthRadiusKm = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const lat1 = (fromLat * Math.PI) / 180;
  const lat2 = (toLat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// ─────────────────────────────────────────────
// scoreHospitalRecommendation
// ─────────────────────────────────────────────
function scoreHospitalRecommendation({
  distanceKm,
  availableBeds,
  availableDoctors,
  availableEquipment,
  isCritical,
  hasEmergencyDepartment,
}) {
  const distanceScore = distanceKm === null
    ? 0
    : Math.max(0, 40 - clamp(distanceKm, 0, 50) * 0.8);

  const resourceScore = clamp((Number(availableBeds || 0) * 4) + (Number(availableEquipment || 0) * 1.5), 0, 30);
  const doctorScore = clamp(Number(availableDoctors || 0) * 5, 0, 20);
  const departmentScore = 10;
  const emergencyBonus = isCritical && hasEmergencyDepartment ? 10 : 0;
  const locationBonus = distanceKm !== null && distanceKm <= 5 ? 5 : 0;

  return Number((distanceScore + resourceScore + doctorScore + departmentScore + emergencyBonus + locationBonus).toFixed(1));
}

// ─────────────────────────────────────────────
// rankLabelByIndex
// ─────────────────────────────────────────────
function rankLabelByIndex(index) {
  if (index === 0) return "Best Match";
  if (index === 1) return "Recommended";
  return "Backup Option";
}

module.exports = {
  clamp,
  haversineDistanceKm,
  mapDiseaseToDepartment,
  normalizeToken,
  rankLabelByIndex,
  scoreHospitalRecommendation,
  translateRomanUrdu,
};