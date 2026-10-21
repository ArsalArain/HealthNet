"""
generate_disease_resources.py
================================
Reads the HealthNet CSV, computes per-disease symptom frequencies,
assigns resources based on department rules + actual symptom data,
and writes 3 output files:
  • disease_resources_complete.json
  • disease_resources_complete.csv
  • diseaseResourcesComplete.js

Run:  python backend/scripts/generate_disease_resources.py
"""

import csv, json, os, re, sys, io

# Force UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from collections import defaultdict

# ──────────────────────────────────────────────
# PATHS
# ──────────────────────────────────────────────
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
BACKEND_SRC = os.path.join(SCRIPT_DIR, "..", "src")
CSV_PATH    = os.path.join(BACKEND_SRC, "Final_Augmented_dataset_Diseases_and_Symptoms.csv")
OUT_JSON    = os.path.join(BACKEND_SRC, "disease_resources_complete.json")
OUT_CSV     = os.path.join(BACKEND_SRC, "disease_resources_complete.csv")
OUT_JS      = os.path.join(BACKEND_SRC, "diseaseResourcesComplete.js")

# ──────────────────────────────────────────────
# DEPARTMENT MAP  (disease-name → department)
# Matches specialist_map.py + diseaseDepartmentMap.js master list
# ──────────────────────────────────────────────
def load_department_map():
    """
    Return a dict:  normalized_disease_name  →  department_string
    Priority order: explicit overrides first, then keyword rules.
    """
    # ----- explicit overrides for diseases that are in the CSV -----
    overrides = {
        # Cardiology
        "heart attack": "Cardiology",
        "angina": "Cardiology",
        "heart failure": "Cardiology",
        "arrhythmia": "Cardiology",
        "cardiac arrest": "Cardiology",
        "hypertensive heart disease": "Cardiology",
        "ischemic heart disease": "Cardiology",
        "cardiomyopathy": "Cardiology",
        "pericarditis": "Cardiology",
        "atrial fibrillation": "Cardiology",
        "atrial flutter": "Cardiology",
        "heart block": "Cardiology",
        "sick sinus syndrome": "Cardiology",
        "sinus bradycardia": "Cardiology",
        "mitral valve disease": "Cardiology",
        "aortic valve disease": "Cardiology",
        "pulmonic valve disease": "Cardiology",
        "tricuspid valve disease": "Cardiology",
        "paroxysmal ventricular tachycardia": "Cardiology",
        "paroxysmal supraventricular tachycardia": "Cardiology",
        "premature ventricular contractions (pvcs)": "Cardiology",
        "premature atrial contractions (pacs)": "Cardiology",
        "coronary atherosclerosis": "Cardiology",
        "deep vein thrombosis (dvt)": "Cardiology",
        "pulmonary embolism": "Cardiology",
        "pulmonary hypertension": "Cardiology",
        "thoracic aortic aneurysm": "Cardiology",
        "abdominal aortic aneurysm": "Cardiology",
        "venous insufficiency": "Cardiology",
        "peripheral arterial disease": "Cardiology",
        "peripheral arterial embolism": "Cardiology",
        "varicose veins": "Cardiology",
        "thrombophlebitis": "Cardiology",
        "central atherosclerosis": "Cardiology",
        "endocarditis": "Cardiology",
        "heart contusion": "Cardiology",
        "hypertrophic obstructive cardiomyopathy (hocm)": "Cardiology",
        "high blood pressure": "Cardiology",
        "malignant hypertension": "Cardiology",

        # Pulmonology
        "asthma": "Pulmonology",
        "chronic obstructive pulmonary disease (copd)": "Pulmonology",
        "pneumonia": "Pulmonology",
        "acute bronchitis": "Pulmonology",
        "acute bronchiolitis": "Pulmonology",
        "acute bronchospasm": "Pulmonology",
        "pleural effusion": "Pulmonology",
        "pneumothorax": "Pulmonology",
        "pulmonary fibrosis": "Pulmonology",
        "pulmonary congestion": "Pulmonology",
        "pulmonary eosinophilia": "Pulmonology",
        "interstitial lung disease": "Pulmonology",
        "obstructive sleep apnea (osa)": "Pulmonology",
        "lung cancer": "Oncology",
        "lung contusion": "Pulmonology",
        "atelectasis": "Pulmonology",
        "sarcoidosis": "Pulmonology",
        "emphysema": "Pulmonology",
        "tracheitis": "Pulmonology",
        "croup": "Pulmonology",
        "whooping cough": "Pulmonology",
        "abscess of the lung": "Pulmonology",
        "acute respiratory distress syndrome (ards)": "Pulmonology",
        "pneumoconiosis": "Pulmonology",
        "cystic fibrosis": "Pulmonology",
        "tuberculosis": "Infectious Disease",
        "empyema": "Pulmonology",

        # Neurology
        "stroke": "Neurology",
        "epilepsy": "Neurology",
        "migraine": "Neurology",
        "parkinson disease": "Neurology",
        "alzheimer disease": "Neurology",
        "multiple sclerosis": "Neurology",
        "dementia": "Neurology",
        "lewy body dementia": "Neurology",
        "transient ischemic attack": "Neurology",
        "intracerebral hemorrhage": "Neurology",
        "intracranial hemorrhage": "Neurology",
        "subarachnoid hemorrhage": "Neurology",
        "subdural hemorrhage": "Neurology",
        "epidural hemorrhage": "Neurology",
        "head injury": "Neurology",
        "concussion": "Neurology",
        "hemiplegia": "Neurology",
        "cerebral palsy": "Neurology",
        "cerebral edema": "Neurology",
        "hydrocephalus": "Neurology",
        "normal pressure hydrocephalus": "Neurology",
        "brain cancer": "Neurology",
        "meningitis": "Neurology",
        "encephalitis": "Neurology",
        "bell palsy": "Neurology",
        "neuralgia": "Neurology",
        "trigeminal neuralgia": "Neurology",
        "essential tremor": "Neurology",
        "tic (movement) disorder": "Neurology",
        "tourette syndrome": "Neurology",
        "myoclonus": "Neurology",
        "amyotrophic lateral sclerosis (als)": "Neurology",
        "guillain barre syndrome": "Neurology",
        "myasthenia gravis": "Neurology",
        "cranial nerve palsy": "Neurology",
        "autonomic nervous system disorder": "Neurology",
        "extrapyramidal effect of drugs": "Neurology",
        "spinocerebellar ataxia": "Neurology",
        "friedrich ataxia": "Neurology",
        "narcolepsy": "Neurology",
        "restless leg syndrome": "Neurology",
        "tension headache": "Neurology",
        "moyamoya disease": "Neurology",
        "intracranial abscess": "Neurology",
        "syringomyelia": "Neurology",
        "vertebrobasilar insufficiency": "Neurology",
        "mononeuritis": "Neurology",
        "brachial neuritis": "Neurology",
        "peripheral nerve disorder": "Neurology",
        "thoracic outlet syndrome": "Neurology",
        "headache after lumbar puncture": "Neurology",
        "sciatica": "Neurology",
        "nerve impingement near the shoulder": "Neurology",
        "ependymoma": "Neurology",
        "meningioma": "Neurology",

        # Gastroenterology
        "appendicitis": "Gastroenterology",
        "gastritis": "Gastroenterology",
        "peptic ulcer": "Gastroenterology",
        "gastroduodenal ulcer": "Gastroenterology",
        "gastroesophageal reflux disease (gerd)": "Gastroenterology",
        "hiatal hernia": "Gastroenterology",
        "esophagitis": "Gastroenterology",
        "esophageal cancer": "Oncology",
        "esophageal varices": "Gastroenterology",
        "stricture of the esophagus": "Gastroenterology",
        "achalasia": "Gastroenterology",
        "indigestion": "Gastroenterology",
        "irritable bowel syndrome": "Gastroenterology",
        "crohn disease": "Gastroenterology",
        "ulcerative colitis": "Gastroenterology",
        "diverticulitis": "Gastroenterology",
        "diverticulosis": "Gastroenterology",
        "intestinal obstruction": "Gastroenterology",
        "ileus": "Gastroenterology",
        "intestinal malabsorption": "Gastroenterology",
        "lactose intolerance": "Gastroenterology",
        "celiac disease": "Gastroenterology",
        "intestinal disease": "Gastroenterology",
        "intestinal cancer": "Oncology",
        "colorectal cancer": "Oncology",
        "colonic polyp": "Gastroenterology",
        "gastrointestinal hemorrhage": "Gastroenterology",
        "rectal disorder": "Gastroenterology",
        "hemorrhoids": "Gastroenterology",
        "anal fissure": "Gastroenterology",
        "anal fistula": "Gastroenterology",
        "perirectal infection": "Gastroenterology",
        "gallstone": "Gastroenterology",
        "cholecystitis": "Gastroenterology",
        "choledocholithiasis": "Gastroenterology",
        "ascending cholangitis": "Gastroenterology",
        "acute pancreatitis": "Gastroenterology",
        "chronic pancreatitis": "Gastroenterology",
        "pancreatic cancer": "Oncology",
        "liver disease": "Gastroenterology",
        "alcoholic liver disease": "Gastroenterology",
        "nonalcoholic liver disease (nash)": "Gastroenterology",
        "hepatic encephalopathy": "Gastroenterology",
        "cirrhosis": "Gastroenterology",
        "liver cancer": "Oncology",
        "stomach cancer": "Oncology",
        "ischemia of the bowel": "Gastroenterology",
        "abdominal hernia": "General Surgery",
        "inguinal hernia": "General Surgery",
        "peritonitis": "General Surgery",
        "volvulus": "General Surgery",
        "intussusception": "General Surgery",
        "pilonidal cyst": "General Surgery",
        "infectious gastroenteritis": "Gastroenterology",
        "noninfectious gastroenteritis": "Gastroenterology",
        "zenker diverticulum": "Gastroenterology",
        "dumping syndrome": "Gastroenterology",
        "meckel diverticulum": "Gastroenterology",
        "foreign body in the gastrointestinal tract": "Gastroenterology",
        "hepatitis due to a toxin": "Gastroenterology",
        "viral hepatitis": "Infectious Disease",

        # Orthopedics
        "osteoarthritis": "Orthopedics",
        "rheumatoid arthritis": "Rheumatology",
        "gout": "Rheumatology",
        "fibromyalgia": "Rheumatology",
        "ankylosing spondylitis": "Rheumatology",
        "systemic lupus erythematosis (sle)": "Rheumatology",
        "scleroderma": "Rheumatology",
        "vasculitis": "Rheumatology",
        "polymyalgia rheumatica": "Rheumatology",
        "juvenile rheumatoid arthritis": "Rheumatology",
        "spondylosis": "Orthopedics",
        "spondylolisthesis": "Orthopedics",
        "spondylitis": "Orthopedics",
        "herniated disk": "Orthopedics",
        "degenerative disc disease": "Orthopedics",
        "spinal stenosis": "Orthopedics",
        "chronic back pain": "Orthopedics",
        "lumbago": "Orthopedics",
        "fracture of the rib": "Orthopedics",
        "fracture of the leg": "Orthopedics",
        "fracture of the arm": "Orthopedics",
        "fracture of the shoulder": "Orthopedics",
        "fracture of the skull": "Orthopedics",
        "fracture of the vertebra": "Orthopedics",
        "fracture of the pelvis": "Orthopedics",
        "fracture of the hand": "Orthopedics",
        "fracture of the patella": "Orthopedics",
        "fracture of the jaw": "Orthopedics",
        "fracture of the ankle": "Orthopedics",
        "fracture of the neck": "Orthopedics",
        "fracture of the foot": "Orthopedics",
        "fracture of the finger": "Orthopedics",
        "fracture of the facial bones": "Orthopedics",
        "sprain or strain": "Orthopedics",
        "dislocation of the shoulder": "Orthopedics",
        "dislocation of the elbow": "Orthopedics",
        "dislocation of the wrist": "Orthopedics",
        "dislocation of the vertebra": "Orthopedics",
        "dislocation of the hip": "Orthopedics",
        "dislocation of the knee": "Orthopedics",
        "dislocation of the ankle": "Orthopedics",
        "dislocation of the foot": "Orthopedics",
        "dislocation of the finger": "Orthopedics",
        "dislocation of the patella": "Orthopedics",
        "carpal tunnel syndrome": "Orthopedics",
        "tendinitis": "Orthopedics",
        "lateral epicondylitis (tennis elbow)": "Orthopedics",
        "bursitis": "Orthopedics",
        "osteoporosis": "Orthopedics",
        "bone disorder": "Orthopedics",
        "bone cancer": "Oncology",
        "osteomyelitis": "Orthopedics",
        "osteochondroma": "Orthopedics",
        "osteochondrosis": "Orthopedics",
        "avascular necrosis": "Orthopedics",
        "joint effusion": "Orthopedics",
        "septic arthritis": "Orthopedics",
        "arthritis of the hip": "Orthopedics",
        "rotator cuff injury": "Orthopedics",
        "adhesive capsulitis of the shoulder": "Orthopedics",
        "chronic knee pain": "Orthopedics",
        "knee ligament or meniscus tear": "Orthopedics",
        "chondromalacia of the patella": "Orthopedics",
        "plantar fasciitis": "Orthopedics",
        "bone spur of the calcaneous": "Orthopedics",
        "bunion": "Orthopedics",
        "flat feet": "Orthopedics",
        "scoliosis": "Orthopedics",
        "muscle spasm": "Orthopedics",
        "myositis": "Orthopedics",
        "muscular dystrophy": "Neurology",
        "de quervain disease": "Orthopedics",
        "trigger finger (finger disorder)": "Orthopedics",
        "ingrown toe nail": "Orthopedics",
        "tietze syndrome": "Orthopedics",
        "injury to the arm": "Orthopedics",
        "injury to the leg": "Orthopedics",
        "injury to the trunk": "Orthopedics",
        "injury to the shoulder": "Orthopedics",
        "injury to the knee": "Orthopedics",
        "injury to the hip": "Orthopedics",
        "injury to the hand": "Orthopedics",
        "injury to the face": "Orthopedics",
        "injury to the finger": "Orthopedics",
        "injury to the spinal cord": "Neurology",
        "injury to internal organ": "General Surgery",
        "injury of the ankle": "Orthopedics",
        "crushing injury": "Emergency Medicine",
        "soft tissue sarcoma": "Oncology",
        "hamartoma": "Orthopedics",
        "hemarthrosis": "Orthopedics",
        "myasthenia gravis": "Neurology",
        "chronic rheumatic fever": "Rheumatology",
        "reactive arthritis": "Rheumatology",

        # Dermatology
        "acne": "Dermatology",
        "eczema": "Dermatology",
        "psoriasis": "Dermatology",
        "contact dermatitis": "Dermatology",
        "seborrheic dermatitis": "Dermatology",
        "dermatitis due to sun exposure": "Dermatology",
        "rosacea": "Dermatology",
        "skin cancer": "Oncology",
        "melanoma": "Oncology",
        "skin disorder": "Dermatology",
        "skin pigmentation disorder": "Dermatology",
        "fungal infection of the skin": "Dermatology",
        "fungal infection of the hair": "Dermatology",
        "impetigo": "Dermatology",
        "pyogenic skin infection": "Dermatology",
        "insect bite": "Dermatology",
        "scabies": "Dermatology",
        "lice": "Dermatology",
        "viral warts": "Dermatology",
        "viral exanthem": "Dermatology",
        "shingles (herpes zoster)": "Dermatology",
        "chickenpox": "Infectious Disease",
        "cold sore": "Dermatology",
        "sebaceous cyst": "Dermatology",
        "seborrheic keratosis": "Dermatology",
        "actinic keratosis": "Dermatology",
        "alopecia": "Dermatology",
        "hirsutism": "Dermatology",
        "hemangioma": "Dermatology",
        "lipoma": "Dermatology",
        "ganglion cyst": "Orthopedics",
        "scar": "Dermatology",
        "callus": "Dermatology",
        "warts": "Dermatology",
        "molluscum contagiosum": "Dermatology",
        "onychomycosis": "Dermatology",
        "dyshidrosis": "Dermatology",
        "pityriasis rosea": "Dermatology",
        "intertrigo (skin condition)": "Dermatology",
        "athlete's foot": "Dermatology",
        "lichen simplex": "Dermatology",
        "lichen planus": "Dermatology",
        "hidradenitis suppurativa": "Dermatology",
        "erythema multiforme": "Dermatology",
        "pemphigus": "Dermatology",
        "atrophic skin condition": "Dermatology",
        "skin polyp": "Dermatology",
        "acanthosis nigricans": "Dermatology",
        "neurofibromatosis": "Dermatology",
        "diaper rash": "Pediatrics",
        "burn": "Emergency Medicine",

        # ENT
        "strep throat": "ENT (Ear, Nose, Throat)",
        "tonsillitis": "ENT (Ear, Nose, Throat)",
        "tonsillar hypertrophy": "ENT (Ear, Nose, Throat)",
        "peritonsillar abscess": "ENT (Ear, Nose, Throat)",
        "abscess of the pharynx": "ENT (Ear, Nose, Throat)",
        "pharyngitis": "ENT (Ear, Nose, Throat)",
        "laryngitis": "ENT (Ear, Nose, Throat)",
        "acute sinusitis": "ENT (Ear, Nose, Throat)",
        "chronic sinusitis": "ENT (Ear, Nose, Throat)",
        "nasal polyp": "ENT (Ear, Nose, Throat)",
        "deviated nasal septum": "ENT (Ear, Nose, Throat)",
        "abscess of nose": "ENT (Ear, Nose, Throat)",
        "nose disorder": "ENT (Ear, Nose, Throat)",
        "otitis media": "ENT (Ear, Nose, Throat)",
        "acute otitis media": "ENT (Ear, Nose, Throat)",
        "chronic otitis media": "ENT (Ear, Nose, Throat)",
        "otitis externa (swimmer's ear)": "ENT (Ear, Nose, Throat)",
        "eustachian tube dysfunction (ear disorder)": "ENT (Ear, Nose, Throat)",
        "ear wax impaction": "ENT (Ear, Nose, Throat)",
        "ear drum damage": "ENT (Ear, Nose, Throat)",
        "mastoiditis": "ENT (Ear, Nose, Throat)",
        "cholesteatoma": "ENT (Ear, Nose, Throat)",
        "labyrinthitis": "ENT (Ear, Nose, Throat)",
        "sensorineural hearing loss": "ENT (Ear, Nose, Throat)",
        "conductive hearing loss": "ENT (Ear, Nose, Throat)",
        "presbyacusis": "ENT (Ear, Nose, Throat)",
        "tinnitus of unknown cause": "ENT (Ear, Nose, Throat)",
        "meniere disease": "ENT (Ear, Nose, Throat)",
        "benign paroxysmal positional vertical (bppv)": "ENT (Ear, Nose, Throat)",
        "otosclerosis": "ENT (Ear, Nose, Throat)",
        "vocal cord polyp": "ENT (Ear, Nose, Throat)",
        "head and neck cancer": "Oncology",
        "foreign body in the throat": "ENT (Ear, Nose, Throat)",
        "sialoadenitis": "ENT (Ear, Nose, Throat)",
        "salivary gland disorder": "ENT (Ear, Nose, Throat)",
        "temporomandibular joint disorder": "ENT (Ear, Nose, Throat)",
        "tracheitis": "ENT (Ear, Nose, Throat)",
        "common cold": "General Physician",
        "flu": "General Physician",
        "mononucleosis": "Infectious Disease",
        "foreign body in the ear": "ENT (Ear, Nose, Throat)",
        "open wound of the ear": "ENT (Ear, Nose, Throat)",
        "scarlet fever": "Infectious Disease",

        # Ophthalmology
        "conjunctivitis": "Ophthalmology",
        "conjunctivitis due to allergy": "Ophthalmology",
        "conjunctivitis due to virus": "Ophthalmology",
        "conjunctivitis due to bacteria": "Ophthalmology",
        "blepharitis": "Ophthalmology",
        "stye": "Ophthalmology",
        "chalazion": "Ophthalmology",
        "cataract": "Ophthalmology",
        "glaucoma": "Ophthalmology",
        "chronic glaucoma": "Ophthalmology",
        "acute glaucoma": "Ophthalmology",
        "macular degeneration": "Ophthalmology",
        "diabetic retinopathy": "Ophthalmology",
        "retinal detachment": "Ophthalmology",
        "retinopathy due to high blood pressure": "Ophthalmology",
        "cornea infection": "Ophthalmology",
        "corneal disorder": "Ophthalmology",
        "corneal abrasion": "Ophthalmology",
        "dry eye of unknown cause": "Ophthalmology",
        "iridocyclitis": "Ophthalmology",
        "uveitis": "Ophthalmology",
        "scleritis": "Ophthalmology",
        "vitreous degeneration": "Ophthalmology",
        "vitreous hemorrhage": "Ophthalmology",
        "subconjunctival hemorrhage": "Ophthalmology",
        "central retinal artery or vein occlusion": "Ophthalmology",
        "eye alignment disorder": "Ophthalmology",
        "myopia": "Ophthalmology",
        "hyperopia": "Ophthalmology",
        "astigmatism": "Ophthalmology",
        "presbyopia": "Ophthalmology",
        "amblyopia": "Ophthalmology",
        "floaters": "Ophthalmology",
        "foreign body in the eye": "Ophthalmology",
        "open wound of the eye": "Ophthalmology",
        "endophthalmitis": "Ophthalmology",
        "chorioretinitis": "Ophthalmology",
        "stenosis of the tear duct": "Ophthalmology",
        "pterygium": "Ophthalmology",
        "pinguecula": "Ophthalmology",
        "ectropion": "Ophthalmology",
        "trichiasis": "Ophthalmology",
        "blepharospasm": "Ophthalmology",
        "cyst of the eyelid": "Ophthalmology",
        "mass on eyelid": "Ophthalmology",
        "optic neuritis": "Ophthalmology",
        "aphakia": "Ophthalmology",

        # Urology
        "kidney stone": "Urology",
        "urinary tract infection": "Urology",
        "benign prostatic hyperplasia (bph)": "Urology",
        "prostatitis": "Urology",
        "urethritis": "Urology",
        "urethral stricture": "Urology",
        "urethral disorder": "Urology",
        "urethral valves": "Urology",
        "bladder disorder": "Urology",
        "bladder obstruction": "Urology",
        "bladder cancer": "Oncology",
        "bladder mass": "Urology",
        "urinary tract obstruction": "Urology",
        "temporary or benign blood in urine": "Urology",
        "stress incontinence": "Urology",
        "urge incontinence": "Urology",
        "overflow incontinence": "Urology",
        "atonic bladder": "Urology",
        "vesicoureteral reflux": "Urology",
        "hydronephrosis": "Urology",
        "pyelonephritis": "Nephrology",
        "polycystic kidney disease": "Nephrology",
        "kidney failure": "Nephrology",
        "acute kidney injury": "Nephrology",
        "chronic kidney disease": "Nephrology",
        "anemia due to chronic kidney disease": "Nephrology",
        "kidney disease due to longstanding hypertension": "Nephrology",
        "primary kidney disease": "Nephrology",
        "benign kidney cyst": "Nephrology",
        "kidney cancer": "Oncology",
        "kidney mass": "Nephrology",
        "diabetic kidney disease": "Nephrology",
        "rhabdomyolysis": "Nephrology",
        "electrolyte disorder": "Nephrology",

        # Gynecology / Obstetrics
        "polycystic ovarian syndrome (pcos)": "Gynecology / Obstetrics",
        "endometriosis": "Gynecology / Obstetrics",
        "uterine fibroids": "Gynecology / Obstetrics",
        "vaginitis": "Gynecology / Obstetrics",
        "vaginal yeast infection": "Gynecology / Obstetrics",
        "benign vaginal discharge (leukorrhea)": "Gynecology / Obstetrics",
        "cervicitis": "Gynecology / Obstetrics",
        "pelvic inflammatory disease": "Gynecology / Obstetrics",
        "ovarian cyst": "Gynecology / Obstetrics",
        "ovarian torsion": "Gynecology / Obstetrics",
        "ovarian cancer": "Oncology",
        "cervical cancer": "Oncology",
        "endometrial cancer": "Oncology",
        "uterine cancer": "Oncology",
        "vulvar cancer": "Oncology",
        "pelvic organ prolapse": "Gynecology / Obstetrics",
        "problem during pregnancy": "Gynecology / Obstetrics",
        "threatened pregnancy": "Gynecology / Obstetrics",
        "ectopic pregnancy": "Gynecology / Obstetrics",
        "missed abortion": "Gynecology / Obstetrics",
        "spontaneous abortion": "Gynecology / Obstetrics",
        "induced abortion": "Gynecology / Obstetrics",
        "hyperemesis gravidarum": "Gynecology / Obstetrics",
        "preeclampsia": "Gynecology / Obstetrics",
        "hypertension of pregnancy": "Gynecology / Obstetrics",
        "gestational diabetes": "Gynecology / Obstetrics",
        "uterine atony": "Gynecology / Obstetrics",
        "placental abruption": "Gynecology / Obstetrics",
        "placenta previa": "Gynecology / Obstetrics",
        "premature rupture of amniotic membrane": "Gynecology / Obstetrics",
        "acute fatty liver of pregnancy (aflp)": "Gynecology / Obstetrics",
        "postpartum depression": "Gynecology / Obstetrics",
        "breast infection (mastitis)": "Gynecology / Obstetrics",
        "fibroadenoma": "Gynecology / Obstetrics",
        "breast cyst": "Gynecology / Obstetrics",
        "breast cancer": "Oncology",
        "galactorrhea of unknown cause": "Gynecology / Obstetrics",
        "fibrocystic breast disease": "Gynecology / Obstetrics",
        "atrophic vaginitis": "Gynecology / Obstetrics",
        "vulvodynia": "Gynecology / Obstetrics",
        "vulvar disorder": "Gynecology / Obstetrics",
        "vaginismus": "Gynecology / Obstetrics",
        "trichomonas infection": "Gynecology / Obstetrics",
        "female genitalia infection": "Gynecology / Obstetrics",
        "female infertility of unknown cause": "Gynecology / Obstetrics",
        "idiopathic absence of menstruation": "Gynecology / Obstetrics",
        "idiopathic excessive menstruation": "Gynecology / Obstetrics",
        "idiopathic painful menstruation": "Gynecology / Obstetrics",
        "idiopathic irregular menstrual cycle": "Gynecology / Obstetrics",
        "idiopathic nonmenstrual bleeding": "Gynecology / Obstetrics",
        "idiopathic infrequent menstruation": "Gynecology / Obstetrics",
        "premenstrual tension syndrome": "Gynecology / Obstetrics",
        "menopause": "Gynecology / Obstetrics",
        "premature ovarian failure": "Gynecology / Obstetrics",
        "pelvic fistula": "Gynecology / Obstetrics",
        "hydatidiform mole": "Gynecology / Obstetrics",
        "mastectomy": "Oncology",
        "pregnancy": "Gynecology / Obstetrics",

        # Endocrinology
        "diabetes": "Endocrinology",
        "hypoglycemia": "Endocrinology",
        "diabetic ketoacidosis": "Endocrinology",
        "hypothyroidism": "Endocrinology",
        "hyperthyroidism": "Endocrinology",
        "graves disease": "Endocrinology",
        "goiter": "Endocrinology",
        "thyroid nodule": "Endocrinology",
        "toxic multinodular goiter": "Endocrinology",
        "hashimoto thyroiditis": "Endocrinology",
        "subacute thyroiditis": "Endocrinology",
        "thyroid cancer": "Oncology",
        "thyroid disease": "Endocrinology",
        "obesity": "Endocrinology",
        "hyperlipidemia": "Endocrinology",
        "hypercholesterolemia": "Endocrinology",
        "cushing syndrome": "Endocrinology",
        "adrenal adenoma": "Endocrinology",
        "adrenal cancer": "Oncology",
        "glucocorticoid deficiency": "Endocrinology",
        "pituitary disorder": "Endocrinology",
        "pituitary adenoma": "Endocrinology",
        "parathyroid adenoma": "Endocrinology",
        "hypercalcemia": "Endocrinology",
        "hypocalcemia": "Endocrinology",
        "hyperkalemia": "Endocrinology",
        "hypokalemia": "Endocrinology",
        "hyponatremia": "Endocrinology",
        "hypernatremia": "Endocrinology",
        "magnesium deficiency": "Endocrinology",
        "carcinoid syndrome": "Endocrinology",
        "diabetes insipidus": "Endocrinology",
        "pseudohypoparathyroidism": "Endocrinology",
        "hormone disorder": "Endocrinology",
        "metabolic disorder": "Endocrinology",
        "hyperosmotic hyperketotic state": "Endocrinology",
        "syndrome of inappropriate secretion of adh (siadh)": "Endocrinology",

        # Psychiatry / Mental Health
        "anxiety": "Psychiatry / Mental Health",
        "depression": "Psychiatry / Mental Health",
        "bipolar disorder": "Psychiatry / Mental Health",
        "schizophrenia": "Psychiatry / Mental Health",
        "psychotic disorder": "Psychiatry / Mental Health",
        "panic disorder": "Psychiatry / Mental Health",
        "panic attack": "Psychiatry / Mental Health",
        "post-traumatic stress disorder (ptsd)": "Psychiatry / Mental Health",
        "obsessive compulsive disorder (ocd)": "Psychiatry / Mental Health",
        "attention deficit hyperactivity disorder (adhd)": "Psychiatry / Mental Health",
        "autism": "Psychiatry / Mental Health",
        "asperger syndrome": "Psychiatry / Mental Health",
        "eating disorder": "Psychiatry / Mental Health",
        "primary insomnia": "Psychiatry / Mental Health",
        "social phobia": "Psychiatry / Mental Health",
        "neurosis": "Psychiatry / Mental Health",
        "personality disorder": "Psychiatry / Mental Health",
        "dysthymic disorder": "Psychiatry / Mental Health",
        "adjustment reaction": "Psychiatry / Mental Health",
        "acute stress reaction": "Psychiatry / Mental Health",
        "conduct disorder": "Psychiatry / Mental Health",
        "oppositional disorder": "Psychiatry / Mental Health",
        "impulse control disorder": "Psychiatry / Mental Health",
        "dissociative disorder": "Psychiatry / Mental Health",
        "somatization disorder": "Psychiatry / Mental Health",
        "substance-related mental disorder": "Psychiatry / Mental Health",
        "drug abuse": "Psychiatry / Mental Health",
        "drug abuse (opioids)": "Psychiatry / Mental Health",
        "drug abuse (cocaine)": "Psychiatry / Mental Health",
        "drug abuse (methamphetamine)": "Psychiatry / Mental Health",
        "drug abuse (barbiturates)": "Psychiatry / Mental Health",
        "alcohol abuse": "Psychiatry / Mental Health",
        "alcohol intoxication": "Psychiatry / Mental Health",
        "alcohol withdrawal": "Psychiatry / Mental Health",
        "marijuana abuse": "Psychiatry / Mental Health",
        "smoking or tobacco addiction": "Psychiatry / Mental Health",
        "delirium": "Psychiatry / Mental Health",
        "factitious disorder": "Psychiatry / Mental Health",
        "psychosexual disorder": "Psychiatry / Mental Health",
        "conversion disorder": "Psychiatry / Mental Health",
        "hysterical behavior": "Psychiatry / Mental Health",
        "developmental disability": "Psychiatry / Mental Health",
        "down syndrome": "Psychiatry / Mental Health",
        "fetal alcohol syndrome": "Psychiatry / Mental Health",
        "wernicke korsakoff syndrome": "Psychiatry / Mental Health",

        # Oncology
        "multiple myeloma": "Oncology",
        "leukemia": "Hematology",
        "lymphoma": "Hematology",
        "prostate cancer": "Oncology",
        "kidney cancer": "Oncology",
        "brain cancer": "Oncology",
        "soft tissue sarcoma": "Oncology",
        "metastatic cancer": "Oncology",
        "mucositis": "Oncology",

        # Hematology
        "anemia": "Hematology",
        "iron deficiency anemia": "Hematology",
        "sickle cell anemia": "Hematology",
        "sickle cell crisis": "Hematology",
        "aplastic anemia": "Hematology",
        "hemolytic anemia": "Hematology",
        "anemia of chronic disease": "Hematology",
        "anemia due to malignancy": "Hematology",
        "white blood cell disease": "Hematology",
        "lymphedema": "Hematology",
        "lymphadenitis": "Hematology",
        "thrombocytopenia": "Hematology",
        "coagulation (bleeding) disorder": "Hematology",
        "hemophilia": "Hematology",
        "von willebrand disease": "Hematology",
        "thalassemia": "Hematology",
        "polycythemia vera": "Hematology",
        "primary thrombocythemia": "Hematology",
        "g6pd enzyme deficiency": "Hematology",
        "spherocytosis": "Hematology",
        "myelodysplastic syndrome": "Hematology",
        "amyloidosis": "Hematology",
        "hemochromatosis": "Hematology",
        "fluid overload": "Nephrology",
        "hypovolemia": "Emergency Medicine",

        # Infectious Disease
        "malaria": "Infectious Disease",
        "dengue fever": "Infectious Disease",
        "typhoid fever": "Infectious Disease",
        "lyme disease": "Infectious Disease",
        "human immunodeficiency virus infection (hiv)": "Infectious Disease",
        "toxoplasmosis": "Infectious Disease",
        "cryptococcosis": "Infectious Disease",
        "aspergillosis": "Infectious Disease",
        "histoplasmosis": "Infectious Disease",
        "valley fever": "Infectious Disease",
        "sporotrichosis": "Infectious Disease",
        "cat scratch disease": "Infectious Disease",
        "cysticercosis": "Infectious Disease",
        "acariasis": "Infectious Disease",
        "trichinosis": "Infectious Disease",
        "pinworm infection": "Infectious Disease",
        "parasitic disease": "Infectious Disease",
        "sepsis": "Infectious Disease",
        "rocky mountain spotted fever": "Infectious Disease",
        "mumps": "Infectious Disease",
        "lymphogranuloma venereum": "Infectious Disease",
        "granuloma inguinale": "Infectious Disease",
        "gonorrhea": "Infectious Disease",
        "chlamydia": "Infectious Disease",
        "genital herpes": "Infectious Disease",
        "hpv": "Infectious Disease",
        "syphilis": "Infectious Disease",
        "infection of open wound": "Infectious Disease",
        "postoperative infection": "Infectious Disease",

        # Dentistry
        "dental caries": "Dentistry",
        "gum disease": "Dentistry",
        "tooth abscess": "Dentistry",
        "tooth disorder": "Dentistry",
        "broken tooth": "Dentistry",
        "aphthous ulcer": "Dentistry",
        "oral thrush (yeast infection)": "Dentistry",
        "oral mucosal lesion": "Dentistry",
        "oral leukoplakia": "Dentistry",
        "cellulitis or abscess of mouth": "Dentistry",
        "teething syndrome": "Dentistry",
        "open wound of the mouth": "Dentistry",

        # Pediatrics
        "croup": "Pediatrics",
        "diaper rash": "Pediatrics",
        "herpangina": "Pediatrics",
        "teething syndrome": "Pediatrics",
        "scarlet fever": "Pediatrics",
        "chickenpox": "Pediatrics",
        "mumps": "Pediatrics",
        "whooping cough": "Pediatrics",
        "birth trauma": "Pediatrics",
        "neonatal jaundice": "Pediatrics",
        "down syndrome": "Pediatrics",
        "cerebral palsy": "Pediatrics",
        "spina bifida": "Pediatrics",
        "vacterl syndrome": "Pediatrics",
        "hirschsprung disease": "Pediatrics",
        "congenital malformation syndrome": "Pediatrics",
        "congenital heart defect": "Pediatrics",
        "tuberous sclerosis": "Pediatrics",
        "edward syndrome": "Pediatrics",
        "cryptorchidism": "Pediatrics",
        "pyloric stenosis": "Pediatrics",
        "omphalitis": "Pediatrics",
        "febrile seizures": "Pediatrics",

        # General Surgery
        "appendicitis": "General Surgery",
        "hernia": "General Surgery",
        "abdominal hernia": "General Surgery",
        "inguinal hernia": "General Surgery",
        "peritonitis": "General Surgery",
        "volvulus": "General Surgery",
        "intussusception": "General Surgery",
        "pilonidal cyst": "General Surgery",
        "injury to internal organ": "General Surgery",
        "hematoma": "General Surgery",
        "lymphangitis": "General Surgery",
        "orbital cellulitis": "General Surgery",
        "necrotizing fasciitis": "General Surgery",
        "gas gangrene": "General Surgery",
        "postoperative infection": "General Surgery",
        "pain after an operation": "General Surgery",
        "open wound from surgical incision": "General Surgery",

        # Emergency Medicine
        "burn": "Emergency Medicine",
        "hypothermia": "Emergency Medicine",
        "frostbite": "Emergency Medicine",
        "heat stroke": "Emergency Medicine",
        "heat exhaustion": "Emergency Medicine",
        "poisoning due to gas": "Emergency Medicine",
        "carbon monoxide poisoning": "Emergency Medicine",
        "drug poisoning due to medication": "Emergency Medicine",
        "drug reaction": "Emergency Medicine",
        "drug withdrawal": "Emergency Medicine",
        "poisoning due to sedatives": "Emergency Medicine",
        "poisoning due to analgesics": "Emergency Medicine",
        "poisoning due to antidepressants": "Emergency Medicine",
        "poisoning due to anticonvulsants": "Emergency Medicine",
        "poisoning due to antipsychotics": "Emergency Medicine",
        "poisoning due to antihypertensives": "Emergency Medicine",
        "poisoning due to opioids": "Emergency Medicine",
        "poisoning due to antimicrobial drugs": "Emergency Medicine",
        "poisoning due to ethylene glycol": "Emergency Medicine",
        "insulin overdose": "Emergency Medicine",
        "envenomation from spider or animal bite": "Emergency Medicine",
        "crushing injury": "Emergency Medicine",
        "allergy": "Allergy & Immunology",
        "food allergy": "Allergy & Immunology",
        "seasonal allergies (hay fever)": "Allergy & Immunology",
        "allergy to animals": "Allergy & Immunology",
        "primary immunodeficiency": "Allergy & Immunology",
        "drug reaction": "Allergy & Immunology",

        # General Physician (fallback)
        "common cold": "General Physician",
        "flu": "General Physician",
        "chronic pain disorder": "General Physician",
        "orthostatic hypotension": "General Physician",
        "dehydration": "General Physician",
        "protein deficiency": "General Physician",
        "vitamin b12 deficiency": "General Physician",
        "vitamin d deficiency": "General Physician",
        "folate deficiency": "General Physician",
        "vitamin a deficiency": "General Physician",
        "scurvy": "General Physician",
        "pain disorder affecting the neck": "General Physician",
        "pain after an operation": "General Physician",
        "jaundice": "General Physician",
        "insect bite": "General Physician",
        "primary insomnia": "Psychiatry / Mental Health",
        "hyperhidrosis": "Dermatology",
        "snoring": "ENT (Ear, Nose, Throat)",
        "lyme disease": "Infectious Disease",
        "raynaud disease": "Rheumatology",
    }
    return overrides

# ──────────────────────────────────────────────
# KEYWORD RULES  (fallback if not in overrides)
# ──────────────────────────────────────────────
KEYWORD_DEPT_RULES = [
    (["heart", "cardiac", "cardio", "coronary", "atrial", "ventricular", "aortic", "angina", "arrhythmia", "pericardi"], "Cardiology"),
    (["lung", "pulmon", "bronch", "asthma", "copd", "pneumon", "pleural", "respir", "emphysema", "trache"], "Pulmonology"),
    (["brain", "neuro", "stroke", "epilepsy", "seizure", "parkinson", "alzheimer", "migraine", "headache", "cerebell", "cerebral", "meningi"], "Neurology"),
    (["gastro", "stomach", "intestin", "colon", "bowel", "liver", "pancrea", "gallbla", "esophag", "rectal", "hepat", "cholecyst", "appen", "gastr"], "Gastroenterology"),
    (["bone", "joint", "fracture", "arthrit", "ortho", "tendon", "ligament", "sprain", "muscle", "spondyl", "lumber", "vertebra", "spinal"], "Orthopedics"),
    (["skin", "dermat", "acne", "eczema", "rash", "psoria", "fungal hair", "alopecia", "seborrh", "melanom", "wound", "scar"], "Dermatology"),
    (["ear", "nose", "throat", "tonsil", "sinusit", "nasal", "otitis", "laryngit", "pharyngit", "vocal cord", "hearing"], "ENT (Ear, Nose, Throat)"),
    (["eye", "vision", "cataract", "glaucoma", "retina", "cornea", "conjunctiv", "optic", "ocular", "eyelid", "blephar"], "Ophthalmology"),
    (["kidney", "renal", "nephro", "dialysis", "uremia", "glomerul", "polycystic kidney"], "Nephrology"),
    (["urinary", "urology", "bladder", "prostat", "urethr", "kidney stone", "ureth"], "Urology"),
    (["pregnancy", "obstetric", "gynecol", "uterine", "ovarian", "menstrual", "vaginal", "cervical disorder", "endometri", "pelvic inflam"], "Gynecology / Obstetrics"),
    (["thyroid", "diabet", "endocrin", "adrenal", "pituit", "hormone", "hypoglycemia", "insulin", "metabolic", "cushing", "goiter"], "Endocrinology"),
    (["anxiety", "depression", "psychi", "mental", "schizo", "bipolar", "ptsd", "ocd", "adhd", "autism", "phobia", "panic", "personality disorder", "drug abuse", "alcohol abuse"], "Psychiatry / Mental Health"),
    (["cancer", "tumor", "oncol", "malignant", "carcinoma", "sarcoma", "lymphoma", "leukemia", "myeloma", "metastatic"], "Oncology"),
    (["anemia", "blood disorder", "hemophilia", "sickle cell", "platelet", "coagulation", "hemolytic", "thalassemia", "polycythemia", "myelodysplas"], "Hematology"),
    (["rheumat", "lupus", "gout", "scleroderma", "vasculit", "polymyalgia", "fibromyalgia", "ankylosing"], "Rheumatology"),
    (["infect", "malaria", "dengue", "typhoid", "hiv", "aids", "tuberculosis", "sepsis", "hepatitis", "parasit", "gonorrhea", "chlamydia", "syphilis"], "Infectious Disease"),
    (["dental", "tooth", "gum", "oral", "mouth", "jaw"], "Dentistry"),
    (["pediatric", "child", "infant", "neonatal", "congenital", "teething", "diaper"], "Pediatrics"),
    (["surgery", "appendicitis", "hernia", "peritonitis"], "General Surgery"),
    (["emergency", "poison", "burn", "trauma", "heat stroke", "overdose", "fracture of the skull"], "Emergency Medicine"),
    (["allergy", "immunodeficiency", "immunology", "hay fever"], "Allergy & Immunology"),
]

def get_department(disease_name, overrides):
    key = disease_name.lower().strip()
    if key in overrides:
        return overrides[key]
    for keywords, dept in KEYWORD_DEPT_RULES:
        for kw in keywords:
            if kw in key:
                return dept
    return "General Physician"

# ──────────────────────────────────────────────
# BASE RESOURCES PER DEPARTMENT
# ──────────────────────────────────────────────
DEPT_BASE_RESOURCES = {
    "Cardiology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "ECG Machine", "Cardiac Monitor", "Defibrillator", "BP Monitor", "Stethoscope",
        "Pulse Oximeter", "IV Line", "Oxygen Cylinder",
    ],
    "Pulmonology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Oxygen Cylinder", "Nebulizer", "Pulse Oximeter", "Spirometer",
        "Chest X-Ray", "Stethoscope", "IV Line",
    ],
    "Neurology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "MRI Scanner", "CT Scanner", "EEG Machine", "Neurological Assessment Kit",
        "BP Monitor", "Stethoscope", "IV Line", "Pulse Oximeter",
    ],
    "Gastroenterology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Endoscope", "Ultrasound Machine", "IV Line", "Stethoscope",
        "Nasogastric Tube", "BP Monitor",
    ],
    "Orthopedics": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "X-Ray Machine", "Orthopedic Splint", "Cast Material", "Stethoscope",
        "IV Line", "Crutches", "BP Monitor",
    ],
    "Dermatology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Dermatoscope", "Topical Treatments", "Stethoscope", "UV Light Therapy",
    ],
    "ENT (Ear, Nose, Throat)": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Otoscope", "Laryngoscope", "Endoscope", "Audiometer",
        "Stethoscope", "Nasal Speculum", "Suction Device",
    ],
    "Ophthalmology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Slit Lamp", "Ophthalmoscope", "Tonometer", "Visual Acuity Chart",
        "Eye Drops", "Stethoscope",
    ],
    "Urology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Cystoscope", "Ultrasound Machine", "Catheter", "IV Line",
        "Stethoscope", "BP Monitor", "Urine Analysis Kit",
    ],
    "Nephrology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Dialysis Machine", "Ultrasound Machine", "IV Line", "Catheter",
        "BP Monitor", "Stethoscope", "Electrolyte Monitor",
    ],
    "Gynecology / Obstetrics": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Ultrasound Machine", "Fetal Monitor", "Delivery Kit",
        "IV Line", "BP Monitor", "Stethoscope", "Specula",
    ],
    "Endocrinology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Glucometer", "Insulin Delivery Kit", "IV Line",
        "BP Monitor", "Stethoscope", "Lab Test Kit",
    ],
    "Psychiatry / Mental Health": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Psychiatric Assessment Tools", "Counseling Room", "Stethoscope",
        "BP Monitor",
    ],
    "Oncology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Chemotherapy Equipment", "IV Line", "Blood Bank Access",
        "Stethoscope", "BP Monitor", "Pulse Oximeter", "Biopsy Kit",
    ],
    "Hematology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Blood Bank Access", "Transfusion Set", "IV Line",
        "Stethoscope", "BP Monitor", "Complete Blood Count (CBC) Kit",
    ],
    "Rheumatology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Joint Assessment Kit", "X-Ray Machine", "IV Line",
        "Stethoscope", "BP Monitor", "Physiotherapy Equipment",
    ],
    "Infectious Disease": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Isolation Ward", "IV Line", "Stethoscope", "BP Monitor",
        "Pulse Oximeter", "Blood Culture Kit", "Rapid Diagnostic Test Kit",
    ],
    "Dentistry": [
        "Dental Chair", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Dental Drill", "Dental X-Ray", "Forceps", "Scaler",
        "Suction Device", "Local Anesthetic", "Mirror & Probe",
    ],
    "Pediatrics": [
        "Pediatric Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Incubator", "Pediatric IV Line", "Pulse Oximeter",
        "Nebulizer", "Stethoscope", "BP Monitor", "Weigh Scale",
    ],
    "General Surgery": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Surgical Kit", "Operating Theater", "IV Line", "Anesthesia Machine",
        "Stethoscope", "BP Monitor", "Suction Device",
    ],
    "Emergency Medicine": [
        "Emergency Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Defibrillator", "Oxygen Cylinder", "IV Line", "Cardiac Monitor",
        "Pulse Oximeter", "BP Monitor", "Suction Device", "Ambulance Stretcher",
    ],
    "Allergy & Immunology": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Epinephrine Auto-Injector", "IV Line", "Pulse Oximeter",
        "Stethoscope", "BP Monitor", "Allergy Test Kit",
    ],
    "General Physician": [
        "Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines",
        "Stethoscope", "BP Monitor", "IV Line", "Pulse Oximeter",
    ],
}

# ──────────────────────────────────────────────
# SYMPTOM → EXTRA RESOURCES  (frequency threshold)
# ──────────────────────────────────────────────
SYMPTOM_EXTRAS = [
    # symptom column, min_fraction, extra resources
    ("shortness of breath",         0.25, ["Oxygen Cylinder", "Nebulizer", "Pulse Oximeter"]),
    ("difficulty breathing",        0.20, ["Oxygen Cylinder", "Nebulizer", "Pulse Oximeter"]),
    ("breathing fast",              0.20, ["Oxygen Cylinder", "Pulse Oximeter"]),
    ("wheezing",                    0.20, ["Nebulizer", "Oxygen Cylinder", "Pulse Oximeter"]),
    ("apnea",                       0.15, ["Ventilator", "Oxygen Cylinder", "Pulse Oximeter"]),
    ("abnormal breathing sounds",   0.20, ["Oxygen Cylinder", "Stethoscope"]),
    ("chest tightness",             0.25, ["ECG Machine", "Oxygen Cylinder", "Pulse Oximeter"]),
    ("sharp chest pain",            0.20, ["ECG Machine", "Cardiac Monitor", "Oxygen Cylinder"]),
    ("palpitations",                0.25, ["ECG Machine", "Cardiac Monitor", "Holter Monitor"]),
    ("irregular heartbeat",         0.20, ["ECG Machine", "Cardiac Monitor", "Defibrillator"]),
    ("decreased heart rate",        0.15, ["ECG Machine", "Cardiac Monitor", "Defibrillator"]),
    ("increased heart rate",        0.20, ["ECG Machine", "Cardiac Monitor"]),
    ("vomiting",                    0.30, ["IV Fluids", "Anti-emetic Drugs", "Nasogastric Tube"]),
    ("vomiting blood",              0.15, ["IV Fluids", "Blood Transfusion Kit", "Endoscope"]),
    ("nausea",                      0.35, ["IV Fluids", "Anti-emetic Drugs"]),
    ("diarrhea",                    0.25, ["IV Fluids", "ORS", "Stool Analysis Kit"]),
    ("blood in stool",              0.15, ["Blood Transfusion Kit", "Endoscope", "IV Fluids"]),
    ("rectal bleeding",             0.15, ["Blood Transfusion Kit", "Endoscope", "IV Fluids"]),
    ("melena",                      0.10, ["Blood Transfusion Kit", "IV Fluids", "Endoscope"]),
    ("hemoptysis",                  0.10, ["Blood Transfusion Kit", "Bronchoscope", "Oxygen Cylinder"]),
    ("bleeding from eye",           0.08, ["Ophthalmic Emergency Kit"]),
    ("bleeding in mouth",           0.08, ["Suction Device", "IV Fluids"]),
    ("nosebleed",                   0.10, ["Nasal Packing Kit", "Suction Device"]),
    ("bleeding gums",               0.10, ["Dental Emergency Kit"]),
    ("blood in urine",              0.15, ["Urine Analysis Kit", "Cystoscope", "IV Fluids"]),
    ("seizures",                    0.15, ["Anti-seizure Drugs", "Oxygen Cylinder", "IV Line", "Padded Bed Rails"]),
    ("fainting",                    0.12, ["IV Fluids", "ECG Machine", "Oxygen Cylinder"]),
    ("fever",                       0.50, ["Cooling Blanket", "Thermometer", "IV Fluids"]),
    ("high fever",                  0.30, ["Cooling Blanket", "IV Fluids"]),
    ("chills",                      0.25, ["Warming Blanket", "IV Fluids"]),
    ("jaundice",                    0.15, ["Liver Function Test Kit", "IV Fluids"]),
    ("peripheral edema",            0.20, ["Diuretics", "IV Fluids", "Compression Bandage"]),
    ("swollen abdomen",             0.15, ["Ultrasound Machine", "IV Fluids", "Nasogastric Tube"]),
    ("abdominal distention",        0.15, ["Ultrasound Machine", "Nasogastric Tube"]),
    ("painful urination",           0.25, ["Urine Analysis Kit", "Catheter"]),
    ("retention of urine",          0.15, ["Catheter", "Urine Analysis Kit"]),
    ("low urine output",            0.12, ["Catheter", "IV Fluids", "Dialysis Machine"]),
    ("delirium",                    0.10, ["Padded Bed Rails", "Oxygen Cylinder", "IV Fluids"]),
    ("focal weakness",              0.10, ["Physiotherapy Equipment", "MRI Scanner"]),
    ("slurring words",              0.08, ["Speech Therapy Kit", "MRI Scanner"]),
    ("paresthesia",                 0.15, ["Neurological Assessment Kit"]),
    ("depression",                  0.20, ["Psychiatric Assessment Tools", "Counseling Room"]),
    ("anxiety and nervousness",     0.20, ["Psychiatric Assessment Tools", "Counseling Room"]),
    ("weight gain",                 0.15, ["Glucometer", "Lab Test Kit"]),
    ("recent weight loss",          0.20, ["Nutritional Supplement Kit", "IV Fluids"]),
    ("fatigue",                     0.30, ["Lab Test Kit", "IV Fluids"]),
    ("pallor",                      0.15, ["Blood Transfusion Kit", "Complete Blood Count (CBC) Kit"]),
    ("swollen lymph nodes",         0.15, ["Biopsy Kit", "Blood Culture Kit"]),
    ("joint pain",                  0.25, ["X-Ray Machine", "Physiotherapy Equipment"]),
    ("back pain",                   0.30, ["X-Ray Machine", "Physiotherapy Equipment", "MRI Scanner"]),
    ("neck stiffness or tightness", 0.15, ["MRI Scanner", "Lumbar Puncture Kit"]),
    ("skin rash",                   0.20, ["Dermatoscope", "Topical Treatments"]),
]

# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────
def main():
    print(f"Reading CSV: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: CSV not found at {CSV_PATH}")
        sys.exit(1)

    overrides = load_department_map()

    # ── Step 1: read CSV, collect symptom totals per disease ──
    disease_symptoms = defaultdict(lambda: defaultdict(int))  # disease → {symptom: count}
    disease_totals   = defaultdict(int)                       # disease → row count
    symptom_cols     = None

    print("Parsing CSV (this may take 30–60 sec for a large file)...")
    with open(CSV_PATH, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        symptom_cols = [c for c in reader.fieldnames if c != "diseases"]
        for row in reader:
            disease = str(row.get("diseases", "") or "").strip().lower()
            if not disease or disease == "diseases":
                continue
            disease_totals[disease] += 1
            for sym in symptom_cols:
                val = str(row.get(sym, "0") or "0").strip()
                if val in ("1", "1.0", "True", "true"):
                    disease_symptoms[disease][sym] += 1

    all_diseases = sorted(disease_totals.keys())
    # Remove the header row artifact
    all_diseases = [d for d in all_diseases if d != "diseases"]
    print(f"Found {len(all_diseases)} unique diseases.")

    # ── Step 2: build resource list per disease ──
    results = []
    for disease in all_diseases:
        dept = get_department(disease, overrides)
        base = list(dict.fromkeys(DEPT_BASE_RESOURCES.get(dept, DEPT_BASE_RESOURCES["General Physician"])))
        extras = []

        total = disease_totals[disease]
        sym_counts = disease_symptoms[disease]

        for symptom, threshold, extra_resources in SYMPTOM_EXTRAS:
            if symptom in sym_counts:
                frac = sym_counts[symptom] / total
                if frac >= threshold:
                    for r in extra_resources:
                        if r not in base and r not in extras:
                            extras.append(r)

        resources = base + extras
        results.append({
            "disease": disease,
            "department": dept,
            "resources": resources,
        })

    # ── Step 3: Write JSON ──
    print(f"Writing JSON -> {OUT_JSON}")
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    # ── Step 4: Write CSV ──
    print(f"Writing CSV  -> {OUT_CSV}")
    # collect all unique resource names
    all_resources = []
    for r in results:
        for res in r["resources"]:
            if res not in all_resources:
                all_resources.append(res)

    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        header = ["disease", "department"] + all_resources
        writer.writerow(header)
        for r in results:
            resource_set = set(r["resources"])
            row = [r["disease"], r["department"]] + [
                1 if res in resource_set else 0 for res in all_resources
            ]
            writer.writerow(row)

    # ── Step 5: Write JS module ──
    print(f"Writing JS   -> {OUT_JS}")
    js_data_str = json.dumps(results, indent=2, ensure_ascii=False)
    js_content = f"""\
/**
 * diseaseResourcesComplete.js
 * Auto-generated from generate_disease_resources.py
 * Covers all {len(results)} diseases from the HealthNet CSV dataset.
 *
 * Usage:
 *   const {{ getResourceInfo, getAllDiseases }} = require('./diseaseResourcesComplete');
 *   const info = getResourceInfo('dengue fever');
 *   // => {{ disease: 'dengue fever', department: 'Infectious Disease', resources: [...] }}
 */

"use strict";

const DISEASE_RESOURCE_DATA = {js_data_str};

/**
 * Look up a disease by name (case-insensitive, trims whitespace).
 * @param {{string}} name
 * @returns {{{{ disease: string, department: string, resources: string[] }}|null}}
 */
function getResourceInfo(name) {{
  const key = String(name || "").trim().toLowerCase();
  return DISEASE_RESOURCE_DATA.find((d) => d.disease === key) || null;
}}

/**
 * Returns the department for a disease name.
 * @param {{string}} name
 * @returns {{string}}
 */
function getDepartmentForDisease(name) {{
  const info = getResourceInfo(name);
  return info ? info.department : "General Physician";
}}

/**
 * Returns the resources list for a disease name.
 * @param {{string}} name
 * @returns {{string[]}}
 */
function getResourcesForDisease(name) {{
  const info = getResourceInfo(name);
  return info ? info.resources : ["Hospital Bed", "Thermometer", "Gloves", "Surgical Mask", "Basic Medicines"];
}}

/**
 * Returns all disease names as an array.
 * @returns {{string[]}}
 */
function getAllDiseases() {{
  return DISEASE_RESOURCE_DATA.map((d) => d.disease);
}}

module.exports = {{ DISEASE_RESOURCE_DATA, getResourceInfo, getDepartmentForDisease, getResourcesForDisease, getAllDiseases }};
"""
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write(js_content)

    print("\n=== All 3 files generated successfully ===")
    print(f"   JSON: {OUT_JSON}")
    print(f"   CSV:  {OUT_CSV}")
    print(f"   JS:   {OUT_JS}")
    print(f"\nTotal diseases: {len(results)}")
    dept_counts = defaultdict(int)
    for r in results:
        dept_counts[r["department"]] += 1
    print("\nDiseases per department:")
    for dept, cnt in sorted(dept_counts.items(), key=lambda x: -x[1]):
        print(f"  {dept:40s} {cnt:4d}")

if __name__ == "__main__":
    main()
