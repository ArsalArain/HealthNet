import os
import re
import json
import math
from datetime import datetime, timedelta
from bson import ObjectId
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from anthropic import Anthropic

# Load environment variables
load_dotenv()

# Import helper modules
from roman_urdu_map import ROMAN_URDU_MAP
from specialist_map import get_specialist_for_disease
from symptom_matcher import init_matcher, init_ml_model, match_symptoms, predict_diseases, get_symptom_columns

app = Flask(__name__)
# Enable CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Global database client and matcher initialization status
db = None
csv_loaded = False

def init_db():
    global db
    database_url = os.getenv("DATABASE_URL") or os.getenv("MONGO_URI")
    if not database_url:
        print("[Warning] Neither DATABASE_URL nor MONGO_URI environment variables are set.")
        return
        
    try:
        print(f"Connecting to MongoDB...")
        client = MongoClient(database_url)
        # Parse database name from URI, defaulting to 'healthnet'
        db_name = database_url.split('/')[-1].split('?')[0] if '/' in database_url else 'healthnet'
        if not db_name:
            db_name = 'healthnet'
        db = client[db_name]
        print(f"Connected to database: {db.name}")
    except Exception as e:
        print(f"[Error] Failed to connect to MongoDB: {e}")

# Initialize dataset matcher
csv_path = os.getenv("CSV_PATH") or os.path.join(
    os.path.dirname(__file__),
    "Final_Augmented_dataset_Diseases_and_Symptoms.csv"
)

try:
    init_matcher(csv_path)
    csv_loaded = True
except Exception as e:
    print(f"[Error] Failed to load dataset: {e}")

# Attempt to load trained ML model (auto-activates after train_model.py is run)
try:
    init_ml_model(os.path.dirname(csv_path) or os.path.dirname(__file__))
except Exception as e:
    print(f"[Warning] ML model init failed: {e}")

# Initialize DB connection
init_db()

# Load disease resources data
disease_resources_map = {}
try:
    resources_json_path = os.path.join(os.path.dirname(csv_path) or os.path.dirname(__file__), "disease_resources_complete.json")
    if os.path.exists(resources_json_path):
        with open(resources_json_path, 'r', encoding='utf-8') as f:
            resources_data = json.load(f)
            for item in resources_data:
                disease_resources_map[item["disease"].lower().strip()] = item.get("resources", [])
        print(f"[Success] Loaded resources mapping for {len(disease_resources_map)} diseases.")
    else:
        print(f"[Warning] disease_resources_complete.json not found at {resources_json_path}")
except Exception as e:
    print(f"[Error] Failed to load disease resources JSON: {e}")

DEFAULT_DEPT_RESOURCES = {
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
}



def detect_language(text):
    """
    Detects language based on characters and common Roman Urdu vocabulary.
    Returns: 'English', 'Roman Urdu', or 'Mixed'
    """
    if not text:
        return "English"
        
    # 1. Check for Arabic/Urdu script characters
    if re.search(r'[\u0600-\u06FF]', text):
        return "Urdu"
        
    text_lower = text.lower()
    roman_urdu_keys = set(ROMAN_URDU_MAP.keys())
    common_urdu_words = {
        "aur", "hy", "hai", "he", "main", "mein", "ka", "ki", "ke", "ko",
        "mojhy", "mujhe", "mujhy", "mujhay", "mera", "mere", "meri", "par",
        "se", "bi", "bhi", "ya", "toh", "to", "krta", "karta", "horaha", "ho",
        "raha", "rahi", "hay", "e", "or"
    }
    
    words = re.findall(r'\b\w+\b', text_lower)
    if not words:
        return "English"
        
    roman_urdu_count = sum(1 for w in words if w in roman_urdu_keys or w in common_urdu_words)
    ratio = roman_urdu_count / len(words)
    
    has_roman = any(re.search(r'\b' + re.escape(k) + r'\b', text_lower) for k in ROMAN_URDU_MAP.keys())
    has_english = any(re.search(r'\b' + re.escape(w) + r'\b', text_lower) for w in ["fever", "cough", "headache", "chest pain", "vomiting", "diarrhea", "pain", "breathing"])
    
    if ratio > 0.12 or has_roman:
        if has_english:
            return "Mixed"
        return "Roman Urdu"
    return "English"


def translate_roman_urdu(text):
    """
    Translates Roman Urdu symptoms in the input text to English symptom phrases.
    Returns a list of translated English symptom terms.
    """
    text_lower = text.lower()
    translated = []
    
    # Sort keys by length descending to replace larger phrases first
    sorted_keys = sorted(ROMAN_URDU_MAP.keys(), key=len, reverse=True)
    
    for key in sorted_keys:
        val = ROMAN_URDU_MAP[key]
        pattern = r'\b' + re.escape(key) + r'\b'
        if re.search(pattern, text_lower):
            translated.append(val)
            # Remove from text to prevent double matches
            text_lower = re.sub(pattern, ' ', text_lower)
            
    return translated


def query_hospitals(city, specialist, required_resources, target_date):
    """
    Queries the MongoDB database for hospitals in the patient's city,
    filtering by:
      1. Has matching specialty department.
      2. Has at least one required resource (from disease/dept) with available_quantity > 0.
      3. Has at least one doctor in the matching department with available slots on target_date.
    """
    if db is None:
        raise Exception("Database connection is not available.")
        
    # Search by city (optional) — if city is empty, search all approved hospitals
    hospital_query = {"status": "approved", "is_active": True}
    if city and city.strip():
        city_regex = re.compile(f"^{re.escape(city.strip())}$", re.IGNORECASE)
        hospital_query["city"] = city_regex

    hospitals_cursor = db.hospitals.find(hospital_query)
    hospitals_list = list(hospitals_cursor)

    # Specialist department matching rules — maps specialist/dept name to DB department names
    specialist_to_dept = {
        "Cardiology": ["Cardiology"],
        "Pulmonology": ["Pulmonology"],
        "Endocrinology": ["Endocrinology", "General Medicine"],
        "Neurology": ["Neurology"],
        "Psychiatry": ["Psychiatry"],
        "Rheumatology": ["Rheumatology", "Orthopedics", "General Medicine"],
        "Dermatology": ["Dermatology"],
        "Urology": ["Urology"],
        "General Surgery": ["General Surgery", "Surgery"],
        "Ophthalmology": ["Ophthalmology", "Eye"],
        "ENT": ["ENT", "Ear Nose Throat"],
        "General Medicine": ["General Medicine", "OPD", "Internal Medicine"],
        "Gastroenterology": ["Gastroenterology", "General Medicine", "General Surgery"],
        "Orthopedics": ["Orthopedics", "Orthopaedics", "Bone & Joint"],
        "Nephrology": ["Nephrology", "Urology", "General Medicine"],
        "Gynecology & Obstetrics": ["Gynecology & Obstetrics", "Gynecology", "Obstetrics", "OB/GYN", "Maternity"],
        "Pediatrics": ["Pediatrics", "Paediatrics", "Child Health"],
        "Oncology": ["Oncology", "Cancer", "Hematology"],
        "Radiology": ["Radiology", "Imaging"],
        "Cardiologist": ["Cardiology"],
        "Pulmonologist": ["Pulmonology"],
        "Endocrinologist": ["Endocrinology", "General Medicine"],
        "Neurologist": ["Neurology"],
        "Psychiatrist": ["Psychiatry"],
        "Rheumatologist": ["Rheumatology", "General Medicine"],
        "Dermatologist": ["Dermatology"],
        "Urologist": ["Urology"],
        "General Surgeon": ["General Surgery"],
        "Ophthalmologist": ["Ophthalmology"],
        "ENT Specialist": ["ENT"],
        "General Physician": ["General Medicine", "OPD"],
        "Gastroenterologist": ["Gastroenterology", "General Medicine"],
        "Orthopedist": ["Orthopedics"],
        "Nephrologist": ["Nephrology"],
        "Gynecologist": ["Gynecology & Obstetrics", "Gynecology"],
        "Pediatrician": ["Pediatrics"],
        "Oncologist": ["Oncology"],
    }
    
    target_depts = specialist_to_dept.get(specialist, [specialist] if specialist else ["General Medicine", "OPD"])
    
    # Parse target date details
    try:
        parsed_date = datetime.strptime(target_date, "%Y-%m-%d")
        day_name = parsed_date.strftime("%A")
        start_dt = parsed_date
        end_dt = start_dt + timedelta(days=1)
    except Exception as e:
        # Fallback to today
        parsed_date = datetime.now()
        day_name = parsed_date.strftime("%A")
        start_dt = datetime(parsed_date.year, parsed_date.month, parsed_date.day)
        end_dt = start_dt + timedelta(days=1)

    recommended = []
    for h in hospitals_list:
        h_id = h["_id"]
        
        # 1. Fetch departments
        depts_cursor = db.departments.find({
            "hospital_id": h_id,
            "status": "active"
        })
        depts_list = list(depts_cursor)
        dept_names = [d["name"] for d in depts_list]
        
        # Check if department matches
        matching_dept_ids = []
        for d in depts_list:
            if d["name"] in target_depts:
                matching_dept_ids.append(d["_id"])
        
        if not matching_dept_ids:
            # Check fallback via staffs
            staff_count = db.staffs.count_documents({
                "hospital_id": h_id,
                "role": "doctor",
                "status": "active",
                "specialization": re.compile(specialist, re.IGNORECASE)
            })
            if staff_count > 0:
                first_dept = db.departments.find_one({"hospital_id": h_id, "status": "active"})
                if first_dept:
                    matching_dept_ids.append(first_dept["_id"])
            else:
                continue # Skip hospital (no department or doctor match)
        
        # 2. FILTER A: Check department/disease-based resources availability
        has_res_avail = False
        lower_required = [r.lower().strip() for r in required_resources]
        
        res_query = {
            "hospital_id": h_id,
            "available_quantity": {"$gt": 0}
        }
        resources_cursor = db.resources.find(res_query)
        for res in resources_cursor:
            rname = res.get("name", "").lower().strip()
            if any(req in rname or rname in req for req in lower_required):
                has_res_avail = True
                break
                
        if not has_res_avail:
            continue # Skip hospital (resources not available)
            
        # 3. FILTER B: Check doctor availability & slots on target_date
        has_doc_avail = False
        doctors_query = {
            "hospital_id": h_id,
            "role": "doctor",
            "status": "active",
            "department_id": {"$in": matching_dept_ids}
        }
        doctors_cursor = db.staffs.find(doctors_query)
        
        for doc in doctors_cursor:
            # Check daily capacity
            max_patients = int(doc.get("max_patients_per_day") or 12)
            
            # Count appointments for this doctor on target date
            appt_count = db.appointments.count_documents({
                "doctor_id": doc["_id"],
                "appointment_at": {
                    "$gte": start_dt,
                    "$lt": end_dt
                },
                "status": {"$ne": "cancelled"}
            })
            
            # Check if doctor allows this day of the week
            doc_days = doc.get("available_days", [])
            day_allowed = True
            if doc_days:
                day_allowed = any(day_name.lower() == str(day).lower().strip() for day in doc_days)
                
            if day_allowed and appt_count < max_patients:
                has_doc_avail = True
                break
                
        if not has_doc_avail:
            continue # Skip hospital (no doctors with open slots on target date)
            
        # Fetch live resources for this hospital
        hospital_resources = {}
        res_cursor = db.resources.find({"hospital_id": h_id})
        for r in res_cursor:
            rtype = r.get("type", "Other").capitalize()
            if rtype not in hospital_resources:
                hospital_resources[rtype] = []
            hospital_resources[rtype].append({
                'name':        r.get('name', 'Unknown Resource'),
                'available':   r.get('status') in ['available', 'low_stock'],
                'units':       r.get('available_quantity', 0),
                'total':       r.get('quantity', 0),
                'status':      r.get('status', 'Unknown').replace('_', ' ').title(),
            })

        recommended.append({
            "id": str(h_id),
            "name": h["name"],
            "city": h["city"],
            "type": h.get("type") or h.get("hospital_type") or "General",
            "address": h.get("address", ""),
            "phone": h.get("phone") or h.get("contact_number") or "041-XXXXXXX",
            "emergency": bool(h.get("emergency_services") or h.get("has_emergency") or any("emergency" in d.lower() for d in dept_names)),
            "specialties": sorted(dept_names),
            "resources": hospital_resources,
            "emergency_score": 1 if (h.get("emergency_services") or h.get("has_emergency")) else 0,
            "specialty_score": 1
        })
        
    recommended.sort(key=lambda x: (x["emergency_score"], x["specialty_score"]), reverse=True)
    top_3 = recommended[:3]
    for item in top_3:
        item.pop("emergency_score", None)
        item.pop("specialty_score", None)
        
    return top_3


@app.route('/api/analyze', methods=['POST'])
def analyze():
    if not csv_loaded:
        return jsonify({"success": False, "error": "CSV dataset failed to load on the server."}), 500
        
    req_data = request.json or {}
    raw_symptoms = req_data.get("symptoms", "")
    city = req_data.get("city", "")
    
    if not raw_symptoms or not isinstance(raw_symptoms, str):
        return jsonify({"success": False, "error": "Invalid or missing 'symptoms' field."}), 400
        
    # 1. Detect language
    detected_lang = detect_language(raw_symptoms)
    
    # 2. Local Urdu Translation
    local_translated = []
    if detected_lang in ["Roman Urdu", "Mixed"]:
        local_translated = translate_roman_urdu(raw_symptoms)
        
    # 3. Call Claude API to extract clean English symptoms
    claude_extracted = []
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        try:
            client = Anthropic(api_key=api_key)
            prompt = f"""You are a medical symptom extraction assistant.
            Analyze the raw text below and extract a list of clean, standardized English symptom phrases.
            Do not include durations, severities, or background stories. Just list the symptoms as noun phrases (e.g., "headache", "fever", "shortness of breath").
            
            Raw text: "{raw_symptoms}"
            
            Return ONLY a JSON list of strings, for example:
            ["headache", "fever", "cough"]
            """
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            response_text = response.content[0].text.strip()
            
            # Find and parse JSON array
            json_match = re.search(r'\[\s*".*?"\s*\]|\[\s*\]', response_text, re.DOTALL)
            if json_match:
                claude_extracted = json.loads(json_match.group(0))
            else:
                claude_extracted = json.loads(response_text)
        except Exception as e:
            print(f"Error calling Claude API: {e}")
            # Fallback to local translation
            
    # 4. Combine local translated + Claude symptoms and deduplicate
    combined = list(set(local_translated + [s.lower().strip() for s in claude_extracted]))
    
    # If combined list is empty, also append phrases from the raw input as fallback terms
    if not combined:
        phrases = re.split(r'[,;]|\band\b|\bwith\b|\bor\b', raw_symptoms)
        filler_prefixes = [
            "i have ", "i am having ", "i feel ", "i am feeling ", "i got ",
            "i'm having ", "i'm feeling ", "my ", "there is ", "having ",
            "feeling ", "experiencing ", "suffering from ", "got "
        ]
        noise_words = {"i have", "my", "feel", "symptoms", "mushkil", "takleef", "i", "the", "a", "an"}
        for p in phrases:
            clean_p = p.strip().lower()
            # Strip common filler prefixes
            for prefix in filler_prefixes:
                if clean_p.startswith(prefix):
                    clean_p = clean_p[len(prefix):].strip()
                    break
            if clean_p and clean_p not in noise_words and len(clean_p) > 1:
                combined.append(clean_p)
                
    combined = list(set(combined))
    
    # 5a. DIRECT DISEASE NAME MATCH — if user typed a known disease name, use it directly
    direct_disease_match = None
    raw_lower = raw_symptoms.lower().strip()
    
    # 1. Exact match with raw user input
    if raw_lower in disease_resources_map:
        direct_disease_match = raw_lower
    else:
        # 2. Check if a disease name is a substring of the raw user input, or vice versa.
        # Disable this substring check if the input looks like a list of multiple symptoms
        # (e.g. contains commas/conjunctions and has 2 or more extracted symptom keywords)
        has_list_indicators = "," in raw_lower or ";" in raw_lower or " and " in raw_lower or " with " in raw_lower
        is_symptom_list = len(combined) >= 2 and has_list_indicators
        
        if not is_symptom_list:
            for disease_name in disease_resources_map:
                if len(disease_name) > 3:
                    d_clean = disease_name.lower().strip()
                    if d_clean == raw_lower or d_clean in raw_lower or (len(raw_lower) > 3 and raw_lower in d_clean):
                        direct_disease_match = disease_name
                        break
    
    if direct_disease_match:
        # Direct match found — skip ML, use disease data directly
        specialist = get_specialist_for_disease(direct_disease_match)
        required_res = disease_resources_map.get(direct_disease_match, [])
        top_diseases_raw = [{"name": direct_disease_match, "score": 100, "match_detail": "Direct disease name match"}]
        matched_cols = combined if combined else [raw_lower]
    else:
        # 5b. Fuzzy match against CSV column names (threshold 75 — stricter to avoid wrong matches)
        matched_cols = match_symptoms(combined, threshold=75)
        
        # 6. Run Cosine Similarity to get top 3 diseases only
        top_diseases_raw = predict_diseases(matched_cols, top_n=3)
    
    # 7. Urgency Logic
    high_urgency_symptoms = [
        "sharp chest pain", "difficulty breathing", "seizures", 
        "vomiting blood", "focal weakness", "slurring words", 
        "blindness", "decreased heart rate"
    ]
    
    urgency_level = "low"
    if any(sym in high_urgency_symptoms for sym in matched_cols):
        urgency_level = "high"
    elif len(matched_cols) >= 3:
        urgency_level = "medium"
        
    if urgency_level == "high":
        urgency_reason = "Critical symptoms detected. Please seek emergency medical care immediately."
    elif urgency_level == "medium":
        urgency_reason = f"{len(matched_cols)} symptoms matched. Visit a doctor within 24 hours."
    else:
        urgency_reason = f"{len(matched_cols)} symptom(s) matched. Low risk pattern, monitor at home."
        
    # 8-9. Get specialist type, build top diseases list with match details
    top_diseases = []
    hospitals = []
    low_confidence = len(matched_cols) < 2  # Flag when only 1 symptom matched
    
    for idx, d_match in enumerate(top_diseases_raw):
        specialist = get_specialist_for_disease(d_match["name"])
        disease_key = d_match["name"].lower().strip()
        required_res = disease_resources_map.get(disease_key, [])
        top_diseases.append({
            "name": d_match["name"],
            "score": d_match["score"],
            "match_detail": d_match.get("match_detail", ""),
            "urgency": "high" if idx == 0 and urgency_level == "high" else ("medium" if idx < 3 and urgency_level != "low" else "low"),
            "specialist": specialist,
            "low_confidence": low_confidence,
            "required_resources": required_res
        })

        
    if top_diseases:
        top_specialist = top_diseases[0]["specialist"]
        top_resources = top_diseases[0].get("required_resources") or DEFAULT_DEPT_RESOURCES.get(top_specialist.lower()) or DEFAULT_DEPT_RESOURCES.get("general medicine")
        target_date = req_data.get("date", "")
        if not target_date:
            target_date = datetime.now().strftime("%Y-%m-%d")
        try:
            hospitals = query_hospitals(city, top_specialist, top_resources, target_date)
            # If no city-based hospitals found, try without city filter (fallback)
            if not hospitals and city:
                hospitals = query_hospitals("", top_specialist, top_resources, target_date)
        except Exception as e:
            return jsonify({"success": False, "error": f"Database query failed: {str(e)}"}), 500
            
    # 10. Return exact JSON structure
    return jsonify({
        "detectedSymptoms": combined,
        "matchedColumns": matched_cols,
        "topDiseases": top_diseases,
        "urgencyLevel": urgency_level,
        "urgencyReason": urgency_reason,
        "languageDetected": detected_lang,
        "recommendedHospitals": hospitals
    })


@app.route('/api/symptoms', methods=['GET'])
def symptoms():
    if not csv_loaded:
        return jsonify({"success": False, "error": "CSV dataset failed to load on the server."}), 500
        
    cols = get_symptom_columns()
    if cols is None:
        return jsonify([])
    return jsonify(cols)


# ── CITY LOCATION FALLBACKS ───────────────────────────────
CITY_COORDINATE_FALLBACKS = {
    "abbottabad": {"lat": 34.1463, "lng": 73.2117},
    "bahawalpur": {"lat": 29.3956, "lng": 71.6836},
    "chiniot": {"lat": 31.7222, "lng": 72.9789},
    "faisalabad": {"lat": 31.4504, "lng": 73.135},
    "gujranwala": {"lat": 32.1877, "lng": 74.1945},
    "gujrat": {"lat": 32.5731, "lng": 74.0789},
    "hyderabad": {"lat": 25.396, "lng": 68.3578},
    "islamabad": {"lat": 33.6844, "lng": 73.0479},
    "jhang": {"lat": 31.2781, "lng": 72.3317},
    "karachi": {"lat": 24.8607, "lng": 67.0011},
    "kasur": {"lat": 31.1177, "lng": 74.4497},
    "lahore": {"lat": 31.5204, "lng": 74.3587},
    "larkana": {"lat": 27.559, "lng": 68.212},
    "multan": {"lat": 30.1575, "lng": 71.5249},
    "okara": {"lat": 30.81, "lng": 73.4516},
    "peshawar": {"lat": 34.0151, "lng": 71.5249},
    "quetta": {"lat": 30.1798, "lng": 66.975},
    "rawalpindi": {"lat": 33.5651, "lng": 73.0169},
    "sahiwal": {"lat": 30.6717, "lng": 73.1064},
    "sargodha": {"lat": 32.0836, "lng": 72.6711},
    "sialkot": {"lat": 32.4945, "lng": 74.5229},
}

def resolve_hospital_location(h):
    geo = h.get('geo_location')
    if geo and isinstance(geo, dict):
        glat = geo.get('lat')
        glng = geo.get('lng')
        if glat is not None and glng is not None:
            try:
                return float(glat), float(glng)
            except:
                pass
    city = h.get('city', '').strip().lower()
    fallback = CITY_COORDINATE_FALLBACKS.get(city)
    if fallback:
        return fallback['lat'], fallback['lng']
    return 31.5204, 74.3587  # default Lahore

# ── HAVERSINE ───────────────────────────────────────────────
def haversine(lat1, lng1, lat2, lng2):
    R    = 6371
    dLat = math.radians(lat2 - lat1)
    dLng = math.radians(lng2 - lng1)
    a    = (math.sin(dLat/2)**2 +
            math.cos(math.radians(lat1)) *
            math.cos(math.radians(lat2)) *
            math.sin(dLng/2)**2)
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a)), 2)

def format_distance(km):
    if km < 0.01:
        return f'{int(km*1000)} meters away'
    elif km < 1:
        return f'{int(km*1000)} meters away'
    elif km < 10:
        return f'{km} km away'
    else:
        return f'{round(km)} km away'

def estimate_drive_time(km):
    minutes = round((km / 30) * 60)
    if minutes < 1:
        return 'Less than 1 min'
    elif minutes < 60:
        return f'{minutes} min drive'
    else:
        h = minutes // 60
        m = minutes % 60
        return f'{h}h {m}min drive'

def matches_specialty(filter_specialty, dept_name):
    fs = filter_specialty.lower().strip()
    dn = dept_name.lower().strip()
    
    if fs in dn or dn in fs:
        return True
        
    roots = {
        "cardiologist": "cardio",
        "neurologist": "neuro",
        "pulmonologist": "pulmono",
        "orthopedic surgeon": "ortho",
        "gynecologist": "gyne",
        "pediatrician": "pediatr",
        "urologist": "uro",
        "dermatologist": "derm",
        "ent specialist": "ent",
        "ophthalmologist": "ophthalm",
        "psychiatrist": "psych",
        "general surgeon": "surg",
        "endocrinologist": "endocrin",
        "general physician": "general medicine"
    }
    
    fs_root = roots.get(fs, fs)
    dn_root = roots.get(dn, dn)
    
    if fs_root in dn or dn_root in fs or fs_root in dn_root:
        return True
        
    return False

# ── NEAREST HOSPITALS ───────────────────────────────────────
@app.route('/api/hospitals/nearest', methods=['GET'])
def get_nearest_hospitals():
    try:
        patient_lat = float(request.args.get('lat'))
        patient_lng = float(request.args.get('lng'))
        specialty   = request.args.get('specialty', None)
        emergency   = request.args.get('emergency', None)
        limit       = int(request.args.get('limit', 5))

        hospitals_raw = list(db.hospitals.find({'status': 'approved', 'is_active': True}))
        filtered_hospitals = []

        for h in hospitals_raw:
            h['_id'] = str(h['_id'])
            if 'created_by' in h:
                h['created_by'] = str(h['created_by'])
            if 'created_at' in h and isinstance(h['created_at'], datetime):
                h['created_at'] = h['created_at'].isoformat()
            if 'updated_at' in h and isinstance(h['updated_at'], datetime):
                h['updated_at'] = h['updated_at'].isoformat()

            h_lat, h_lng = resolve_hospital_location(h)
            h['lat'] = h_lat
            h['lng'] = h_lng

            # Fetch active departments
            depts = list(db.departments.find({
                'hospital_id': ObjectId(h['_id']),
                'status': 'active'
            }))
            h_depts = [d['name'] for d in depts]
            h['specialties'] = h_depts
            h['emergency'] = any(name.lower() in ['emergency', 'emergency medicine', 'emergency department', 'casualty', 'trauma'] for name in h_depts)

            if emergency == 'true' and not h['emergency']:
                continue
            if specialty:
                if not any(matches_specialty(specialty, name) for name in h_depts):
                    continue

            dist = haversine(patient_lat, patient_lng, h_lat, h_lng)
            h['distance_km']     = dist
            h['distance_label']  = format_distance(dist)
            h['estimated_drive'] = estimate_drive_time(dist)

            # Live resource summary
            resources = list(db.resources.find(
                {'hospital_id': ObjectId(h['_id'])},
                {'name': 1, 'available_quantity': 1, 'status': 1}
            ))
            total     = len(resources)
            available = sum(1 for r in resources
                           if r.get('status') in ['available', 'low_stock'] and
                           r.get('available_quantity', 0) > 0)
            critical  = sum(1 for r in resources
                           if r.get('status') in ['out_of_stock'])

            h['resource_summary'] = {
                'total':                total,
                'available':            available,
                'critical_alerts':      critical,
                'availability_percent': round(
                    (available / total * 100) if total > 0 else 0
                )
            }

            # Emergency resource live check
            er_names = [
                'Emergency Ward', 'ICU Beds',
                'Oxygen Cylinders', 'Emergency Medicines Kit'
            ]
            er_status = {}
            for name in er_names:
                res = db.resources.find_one({
                    'hospital_id': ObjectId(h['_id']),
                    'name': re.compile(name, re.IGNORECASE)
                })
                if res:
                    er_status[name] = {
                        'available': res.get('status') in ['available', 'low_stock'],
                        'units':     res.get('available_quantity', 0),
                        'status':    res.get('status', 'Unknown')
                    }
                else:
                    er_status[name] = {
                        'available': True,
                        'units':     5,
                        'status':    'available'
                    }
            h['emergency_resources'] = er_status
            filtered_hospitals.append(h)

        # Sort by distance closest first
        filtered_hospitals.sort(key=lambda x: x['distance_km'])

        for i, h in enumerate(filtered_hospitals[:limit]):
            h['rank']       = i + 1
            h['is_nearest'] = (i == 0)

        return jsonify({
            'success':          True,
            'patient_location': {'lat': patient_lat, 'lng': patient_lng},
            'total_hospitals':  len(filtered_hospitals),
            'hospitals':        filtered_hospitals[:limit],
            'nearest':          filtered_hospitals[0] if filtered_hospitals else None,
            'generated_at':     datetime.now().isoformat()
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ── ALL HOSPITALS FOR MAP ───────────────────────────────────
@app.route('/api/hospitals/all', methods=['GET'])
def get_all_hospitals():
    try:
        hospitals = list(db.hospitals.find(
            {'status': 'approved', 'is_active': True}
        ))
        for h in hospitals:
            h['_id'] = str(h['_id'])
            if 'created_by' in h:
                h['created_by'] = str(h['created_by'])
            if 'created_at' in h and isinstance(h['created_at'], datetime):
                h['created_at'] = h['created_at'].isoformat()
            if 'updated_at' in h and isinstance(h['updated_at'], datetime):
                h['updated_at'] = h['updated_at'].isoformat()

            h_lat, h_lng = resolve_hospital_location(h)
            h['lat'] = h_lat
            h['lng'] = h_lng

            # Fetch active departments
            depts = list(db.departments.find({
                'hospital_id': ObjectId(h['_id']),
                'status': 'active'
            }))
            h['specialties'] = [d['name'] for d in depts]
            h['emergency'] = any(name.lower() in ['emergency', 'emergency medicine', 'emergency department', 'casualty', 'trauma'] for name in h['specialties'])
        return jsonify({'success': True, 'hospitals': hospitals})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ── LIVE RESOURCES FOR ONE HOSPITAL ────────────────────────
@app.route('/api/hospitals/<hospital_id>/resources/live', methods=['GET'])
def get_live_resources(hospital_id):
    try:
        resources = list(db.resources.find(
            {'hospital_id': ObjectId(hospital_id)}
        ))
        
        # Map department_id to department name
        depts = {str(d['_id']): d.get('name') for d in db.departments.find({'hospital_id': ObjectId(hospital_id)})}

        grouped = {}
        for r in resources:
            rtype = r.get('type', 'Other').capitalize()
            if rtype not in grouped:
                grouped[rtype] = []
                
            dept_id_str = str(r.get('department_id')) if r.get('department_id') else None
            dept_name = depts.get(dept_id_str) if dept_id_str else None
            
            grouped[rtype].append({
                'name':            r.get('name', 'Unknown Resource'),
                'available':       r.get('status') in ['available', 'low_stock'],
                'units':           r.get('available_quantity', 0),
                'total':           r.get('quantity', 0),
                'status':          r.get('status', 'Unknown').replace('_', ' ').title(),
                'alert_level':     'critical' if r.get('status') == 'out_of_stock' else ('warning' if r.get('status') == 'low_stock' else 'normal'),
                'hours':           '24/7',
                'department_id':   dept_id_str,
                'department_name': dept_name
            })
        return jsonify({
            'success':      True,
            'hospital_id':  hospital_id,
            'resources':    grouped,
            'last_updated': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv("FLASK_PORT") or 5002)
    print(f"Starting Flask App on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
