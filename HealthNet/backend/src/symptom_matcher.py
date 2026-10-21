import pandas as pd
import numpy as np
from rapidfuzz import process, fuzz
import re
import os
import pickle

# heuristic engine state (CSV-based F1 scoring)
_disease_matrix = None
_disease_sizes  = None   # row count per disease (for frequency weighting)
_symptom_cols   = None
_disease_col    = None

# ── ML model state (RandomForest + LabelEncoder) ─────────────────────────────
_ml_model = None
_ml_label_encoder = None
_ml_feature_cols = None  # exact column order the model was trained on
_ml_available = False

# -----------------------------------------------------------------------
# MANUAL ALIAS MAP: maps user-friendly terms → exact CSV column name(s)
# This is the first-pass lookup BEFORE fuzzy matching, preventing bad matches
# like "flu" → "fluid in ear"
# -----------------------------------------------------------------------
SYMPTOM_ALIAS_MAP = {
    # Common user words → CSV column names
    "flu": ["flu-like syndrome", "coryza"],
    "influenza": ["flu-like syndrome", "coryza"],
    "cold": ["coryza", "nasal congestion"],
    "fever": ["fever"],
    "cough": ["cough"],
    "headache": ["headache", "frontal headache"],
    "migraine": ["headache", "frontal headache"],
    "fatigue": ["fatigue", "weakness"],
    "tired": ["fatigue", "weakness"],
    "weakness": ["weakness", "fatigue"],
    "nausea": ["nausea"],
    "vomiting": ["vomiting"],
    "diarrhea": ["diarrhea"],
    "stomach pain": ["sharp abdominal pain", "upper abdominal pain", "lower abdominal pain", "burning abdominal pain"],
    "abdominal pain": ["sharp abdominal pain", "upper abdominal pain", "lower abdominal pain"],
    "chest pain": ["sharp chest pain", "burning chest pain", "chest tightness"],
    "heart attack": ["sharp chest pain", "palpitations", "decreased heart rate", "irregular heartbeat"],
    "cardiac arrest": ["sharp chest pain", "palpitations", "decreased heart rate"],
    "heart pain": ["sharp chest pain", "palpitations", "chest tightness"],
    "palpitation": ["palpitations", "irregular heartbeat"],
    "palpitations": ["palpitations", "irregular heartbeat"],
    "shortness of breath": ["shortness of breath", "difficulty breathing"],
    "breathing difficulty": ["difficulty breathing", "shortness of breath"],
    "breathlessness": ["difficulty breathing", "shortness of breath"],
    "sore throat": ["sore throat", "throat swelling", "throat redness"],
    "throat pain": ["sore throat", "throat swelling"],
    "runny nose": ["nasal congestion", "coryza", "sinus congestion"],
    "nasal congestion": ["nasal congestion", "sinus congestion"],
    "sneezing": ["sneezing"],
    "back pain": ["back pain", "low back pain"],
    "lower back pain": ["low back pain", "back pain"],
    "joint pain": ["joint pain", "joint stiffness or tightness"],
    "knee pain": ["knee pain", "knee swelling"],
    "body pain": ["ache all over", "muscle pain", "joint pain"],
    "muscle pain": ["muscle pain", "muscle stiffness or tightness"],
    "rash": ["skin rash", "abnormal appearing skin", "skin lesion"],
    "skin rash": ["skin rash", "abnormal appearing skin"],
    "itching": ["itching of skin", "skin irritation"],
    "dizziness": ["dizziness", "fainting"],
    "vertigo": ["dizziness"],
    "blurred vision": ["diminished vision", "spots or clouds in vision"],
    "vision problem": ["diminished vision", "double vision"],
    "ear pain": ["ear pain", "pus draining from ear"],
    "ear infection": ["ear pain", "pus draining from ear", "plugged feeling in ear"],
    "eye pain": ["pain in eye", "eye redness"],
    "red eye": ["eye redness", "lacrimation"],
    "urinary pain": ["painful urination", "blood in urine"],
    "urination problem": ["painful urination", "frequent urination", "involuntary urination"],
    "frequent urination": ["frequent urination"],
    "blood in urine": ["blood in urine"],
    "swelling": ["peripheral edema", "skin swelling", "leg swelling"],
    "leg swelling": ["leg swelling", "peripheral edema"],
    "anxiety": ["anxiety and nervousness"],
    "depression": ["depression", "emotional symptoms"],
    "insomnia": ["insomnia"],
    "sleep problem": ["insomnia", "sleepiness"],
    "weight loss": ["recent weight loss"],
    "weight gain": ["weight gain"],
    "constipation": ["constipation"],
    "jaundice": ["jaundice"],
    "yellow skin": ["jaundice"],
    "yellow eyes": ["jaundice"],
    "seizures": ["seizures"],
    "numbness": ["paresthesia", "loss of sensation"],
    "tingling": ["paresthesia"],
    "memory loss": ["disturbance of memory"],
    "confusion": ["disturbance of memory", "delusions or hallucinations"],
    "sweating": ["sweating", "feeling hot and cold"],
    "chills": ["chills", "feeling cold"],
    "appetite loss": ["decreased appetite"],
    "loss of appetite": ["decreased appetite"],
    "thirst": ["thirst", "polyuria"],
    "blood in stool": ["blood in stool", "rectal bleeding", "melena"],
    "heartburn": ["heartburn", "burning abdominal pain"],
    "acid reflux": ["heartburn", "regurgitation"],
    "bloating": ["stomach bloating", "abdominal distention"],
    "gas": ["flatulence", "stomach bloating"],
    "nosebleed": ["nosebleed"],
    "bleeding": ["rectal bleeding", "blood in stool", "nosebleed"],
    "gum pain": ["gum pain", "bleeding gums"],
    "toothache": ["toothache"],
    "neck pain": ["neck pain", "neck stiffness or tightness"],
    "shoulder pain": ["shoulder pain", "shoulder stiffness or tightness"],
    "wheezing": ["wheezing", "abnormal breathing sounds"],
    "asthma": ["wheezing", "shortness of breath", "chest tightness"],
    "high blood pressure": ["increased heart rate", "palpitations"],
    "hypertension": ["increased heart rate", "palpitations"],
    "diabetes": ["thirst", "polyuria", "frequent urination", "weight loss"],
    "skin lesion": ["skin lesion", "abnormal appearing skin"],
    "acne": ["acne or pimples"],
    "eczema": ["skin rash", "itching of skin", "skin dryness, peeling, scaliness, or roughness"],
    "psoriasis": ["skin rash", "itching of skin", "abnormal appearing skin"],
    "hair loss": ["too little hair"],
    "mouth ulcer": ["mouth ulcer"],
    "vaginal discharge": ["vaginal discharge"],
    "menstrual pain": ["painful menstruation", "lower abdominal pain"],
    "irregular period": ["unpredictable menstruation", "scanty menstrual flow"],
    "malaria": ["fever", "chills", "sweating", "headache"],
    "typhoid": ["fever", "weakness", "nausea", "diarrhea"],
    "dengue": ["fever", "joint pain", "headache", "muscle pain"],
    "covid": ["fever", "cough", "shortness of breath", "fatigue"],
    "coronavirus": ["fever", "cough", "shortness of breath"],
    "stroke": ["focal weakness", "slurring words", "sudden headache"],
    "paralysis": ["focal weakness", "loss of sensation"],
    "tremor": ["abnormal involuntary movements", "problems with movement"],
    "seizure": ["seizures"],
    "lymph node": ["swollen lymph nodes"],
    "lymph nodes swollen": ["swollen lymph nodes", "neck mass"],
    "allergy": ["allergic reaction", "sneezing", "skin rash"],
    "allergic reaction": ["allergic reaction"],
    "snoring": ["apnea", "abnormal breathing sounds"],
    "sleep apnea": ["apnea"],
    "kidney pain": ["side pain", "symptoms of the kidneys"],
    "kidney stone": ["side pain", "painful urination", "blood in urine"],
}

def _normalize(text):
    """Lowercase and strip extra whitespace."""
    return re.sub(r'\s+', ' ', str(text).strip().lower())


def init_matcher(csv_path):
    """
    Initializes the symptom matcher by loading the dataset, grouping rows by
    disease name, and caching the mean probability vector for each disease in memory.
    """
    global _disease_matrix, _disease_sizes, _symptom_cols, _disease_col
    if _disease_matrix is not None:
        return

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV dataset not found at: {csv_path}")

    print(f"Loading CSV dataset from: {csv_path}...")
    df = pd.read_csv(csv_path)
    print("CSV loaded successfully.")

    # Identify the disease column (first column or one named 'disease'/'diseases')
    possible_disease_cols = ['diseases', 'disease', 'Disease', 'Diseases']
    found_col = None
    for c in df.columns:
        if c.strip().lower() in [x.lower() for x in possible_disease_cols]:
            found_col = c
            break
    if found_col is None:
        found_col = df.columns[0]

    _disease_col = found_col
    _symptom_cols = [c for c in df.columns if c != _disease_col]

    print("Grouping dataset by disease name and taking column averages...")
    _disease_matrix = df.groupby(_disease_col).mean(numeric_only=True)
    _disease_sizes  = df.groupby(_disease_col).size()   # row count per disease
    print(f"Dataset grouping complete. Unique diseases loaded: {len(_disease_matrix)}")


def get_symptom_columns():
    """Returns the list of symptom column names from the CSV."""
    return _symptom_cols


def init_ml_model(model_dir=None):
    """
    Load the trained scikit-learn ML model if available.
    Looks for: model.pkl, label_encoder.pkl, feature_columns.pkl
    in the same directory as this file (or model_dir if provided).
    """
    global _ml_model, _ml_label_encoder, _ml_feature_cols, _ml_available

    base = model_dir or os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base, "model.pkl")
    le_path    = os.path.join(base, "label_encoder.pkl")
    feat_path  = os.path.join(base, "feature_columns.pkl")

    if not (os.path.exists(model_path) and os.path.exists(le_path) and os.path.exists(feat_path)):
        print("[ML] Trained model not found — using F1-scoring fallback.")
        _ml_available = False
        return False

    try:
        print("[ML] Loading trained RandomForest model...")
        with open(model_path, "rb") as f:
            _ml_model = pickle.load(f)
        with open(le_path, "rb") as f:
            _ml_label_encoder = pickle.load(f)
        with open(feat_path, "rb") as f:
            _ml_feature_cols = pickle.load(f)
        _ml_available = True
        print(f"[ML] Model ready: {len(_ml_label_encoder.classes_)} disease classes, "
              f"{len(_ml_feature_cols)} features.")
        return True
    except Exception as e:
        print(f"[ML] Failed to load model: {e} — using F1-scoring fallback.")
        _ml_available = False
        return False


def _predict_ml(matched_symptoms, top_n=3):
    """
    ML inference path: builds an input vector in the EXACT feature order
    the model was trained on, calls predict_proba(), and returns top-N
    diseases with calibrated probability percentages.
    """
    if not _ml_available:
        return None

    # Build feature vector in training order
    n_feat = len(_ml_feature_cols)
    feat_index = {col: i for i, col in enumerate(_ml_feature_cols)}
    x = np.zeros((1, n_feat), dtype=np.float32)

    for col in matched_symptoms:
        idx = feat_index.get(col)
        if idx is not None:
            x[0, idx] = 1.0

    # If no features matched the model's columns, fall back
    if x.sum() == 0:
        return None

    # predict_proba returns shape (1, n_classes)
    proba = _ml_model.predict_proba(x)[0]          # shape: (n_classes,)
    top_indices = np.argsort(proba)[::-1][:top_n * 3]  # get extra for gap filtering

    results = []
    for idx in top_indices:
        disease = _ml_label_encoder.classes_[idx]
        score   = int(round(proba[idx] * 100))
        if score >= 5:  # ignore near-zero probabilities
            results.append({"name": disease, "score": score})

    if not results:
        return None

    # Apply gap filtering (same logic as F1 path)
    top_score = results[0]["score"]
    if top_score < 20:
        # Very low confidence even from ML — show 1
        filtered = results[:1]
    elif top_score < 40:
        filtered = [r for r in results if (top_score - r["score"]) <= 10]
        filtered = filtered[:top_n]
    else:
        filtered = [r for r in results if (top_score - r["score"]) <= 25]
        filtered = filtered[:top_n]

    return filtered


def match_symptoms(user_symptoms, threshold=75):
    """
    Matches user symptom strings against the CSV column names using:
    1. Alias lookup (exact match against SYMPTOM_ALIAS_MAP)
    2. Direct exact match against CSV columns
    3. Fuzzy matching with a high threshold (only for long phrases, not short words)

    Short words (< 5 chars) are ONLY matched via alias or exact match to prevent
    bad fuzzy matches like "flu" → "fluid in ear".
    """
    if _symptom_cols is None:
        raise ValueError("Symptom matcher not initialized. Call init_matcher(csv_path) first.")

    matched_columns = set()
    symptom_cols_lower = {col.lower(): col for col in _symptom_cols}

    for sym in user_symptoms:
        sym_clean = _normalize(sym)
        if not sym_clean:
            continue

        # 1. Check alias map first (most reliable)
        if sym_clean in SYMPTOM_ALIAS_MAP:
            for alias_col in SYMPTOM_ALIAS_MAP[sym_clean]:
                # Find exact or case-insensitive match in actual columns
                actual = symptom_cols_lower.get(alias_col.lower())
                if actual:
                    matched_columns.add(actual)
            continue  # alias resolved, skip fuzzy

        # 2. Check if any alias key is a substring of the user input
        # e.g. "i have fever and flu" → matches "fever" and "flu" via alias
        alias_matched = False
        for alias_key, alias_cols in SYMPTOM_ALIAS_MAP.items():
            # Only match if alias key appears as a whole word in the symptom text
            pattern = r'\b' + re.escape(alias_key) + r'\b'
            if re.search(pattern, sym_clean):
                for alias_col in alias_cols:
                    actual = symptom_cols_lower.get(alias_col.lower())
                    if actual:
                        matched_columns.add(actual)
                alias_matched = True

        if alias_matched:
            continue

        # 3. Check direct exact match against CSV column names
        exact = symptom_cols_lower.get(sym_clean)
        if exact:
            matched_columns.add(exact)
            continue

        # 4. Fuzzy match — but ONLY for longer phrases (>= 6 chars)
        # Short words like "flu", "ear" should NOT be fuzzy matched
        if len(sym_clean) >= 6:
            match = process.extractOne(
                sym_clean,
                _symptom_cols,
                scorer=fuzz.token_sort_ratio,  # Better than WRatio for medical terms
                score_cutoff=threshold
            )
            if match:
                matched_columns.add(match[0])

    return list(matched_columns)



def predict_diseases(matched_symptoms, top_n=3):
    """
    Predicts diseases from matched symptom columns.

    Strategy:
    - PRIMARY:  F1-scoring heuristic (always runs — works well for 1-10 symptoms)
    - SECONDARY: ML model boost only when >= 5 symptoms AND ML top-score > 2%
                 (ML model gives near-uniform ~0.21% for sparse inputs due to
                 754-class balanced training, so it's only reliable for dense inputs)

    Input validation:
      If fewer than 2 matched symptom columns, returns results with low_confidence=True
    """
    if not matched_symptoms:
        return []

    # ── ALWAYS: run F1-scoring heuristic first ────────────────────────────────
    # Diagnostic showed ML gives near-uniform ~0.21% for 1-4 symptoms regardless
    # of which symptoms. F1-scoring is far more reliable for sparse inputs.
    # ML is only used as override when >=5 symptoms AND top-score > 2%.
    if _disease_matrix is None or _symptom_cols is None:
        raise ValueError("Symptom matcher not initialized. Call init_matcher(csv_path) first.")

    # Build index map for fast lookup
    symptom_col_index = {col: i for i, col in enumerate(_symptom_cols)}

    # Build input and track matched indices
    input_vector = np.zeros(len(_symptom_cols))
    matched_indices = []
    for col in matched_symptoms:
        if col in symptom_col_index:
            idx = symptom_col_index[col]
            input_vector[idx] = 1.0
            matched_indices.append(idx)

    if not matched_indices:
        return []

    n_user_symptoms = len(matched_indices)

    if n_user_symptoms == 1:
        # If only 1 symptom is matched, F1 score is heavily penalized by precision.
        # We use a direct probability-based scoring logic instead.
        results = []
        for disease_name, row in _disease_matrix.iterrows():
            p = row.values[matched_indices[0]]
            if p > 0.05:
                row_count = int(_disease_sizes.get(disease_name, 1))
                freq_factor = 0.5 + 0.5 * min(1.0, row_count / 100.0)
                score_pct = int(round(p * 100 * freq_factor))
                if score_pct >= 10:
                    results.append({
                        "disease": disease_name,
                        "score": score_pct,
                        "recall_pct": 100,
                    })
        results.sort(key=lambda x: (-x["score"], -x["recall_pct"], str(x["disease"]).lower()))
        if results:
            top_score = results[0]["score"]
            filtered = [r for r in results if (top_score - r["score"]) <= 30]
            filtered = filtered[:top_n]
            if len(filtered) < top_n and len(results) >= top_n:
                filtered = results[:top_n]
            top_results = []
            for item in filtered:
                top_results.append({
                    "name": item["disease"],
                    "score": item["score"],
                    "match_detail": "",
                    "low_confidence": True,
                })
            return top_results
        return []

    # ── ADAPTIVE BETA (key fix for "fever → ascending cholangitis") ───────────
    # β controls recall vs precision weight in the F1 formula.
    #
    # Problem: with β=2 (recall-heavy) and n=1 symptom:
    #   ascending cholangitis (5 syms): recall=1.0, precision=0.20 → F1=55% → WRONG
    #
    # Fix: reduce β as user provides fewer symptoms, making precision more important.
    # This kills diseases that require many MORE symptoms than the user provided.
    #
    #   n=1: β=0.5 → precision-focused   → ascend.cholangitis → 19% (filtered)  ✓
    #   n=2: β=1.0 → balanced             → more selective
    #   n=3: β=1.5 → mildly recall-heavy  → sensible range
    #   n≥4: β=2.0 → recall-heavy         → reward high-coverage diseases
    if n_user_symptoms == 2:
        beta = 1.0
    elif n_user_symptoms == 3:
        beta = 1.5
    else:
        beta = 2.0
    beta_sq = beta ** 2

    # Minimum score threshold
    min_score = 30

    results = []

    for disease_name, row in _disease_matrix.iterrows():
        B = row.values
        disease_symptom_count = int((B > 0.05).sum())
        if disease_symptom_count == 0:
            continue

        matched_in_disease = sum(1 for idx in matched_indices if B[idx] > 0.05)
        recall = matched_in_disease / n_user_symptoms
        if recall == 0:
            continue

        precision = matched_in_disease / disease_symptom_count

        denom = (beta_sq * precision + recall)
        if denom == 0:
            continue
        f_score = (1 + beta_sq) * (precision * recall) / denom

        # Sparsity penalty: diseases with few CSV symptoms get penalized
        if disease_symptom_count <= 2:
            sparsity_factor = 0.3
        elif disease_symptom_count <= 4:
            sparsity_factor = 0.55
        elif disease_symptom_count <= 9:
            sparsity_factor = 0.80
        else:
            sparsity_factor = 1.0

        # Frequency weight: diseases with more training rows = more common
        # For sparse inputs (1-2 symptoms), common diseases should rank above rare ones.
        # Cap at 1.0 for diseases with 300+ rows.
        if n_user_symptoms <= 2 and _disease_sizes is not None:
            row_count = int(_disease_sizes.get(disease_name, 1))
            freq_weight = min(1.0, row_count / 300.0)
        else:
            freq_weight = 1.0

        final_score = f_score * sparsity_factor * freq_weight
        score_pct = int(round(final_score * 100))

        if score_pct >= min_score:
            results.append({
                "disease": disease_name,
                "score": score_pct,
                "recall_pct": int(round(recall * 100)),
            })

    results.sort(key=lambda x: (-x["score"], -x["recall_pct"], str(x["disease"]).lower()))

    if not results:
        # Fallback scoring for sparse inputs (e.g. when F1 filtering left nothing)
        # Select diseases where matched symptoms are most strongly present, weighted by popularity.
        for disease_name, row in _disease_matrix.iterrows():
            probs = [row.values[idx] for idx in matched_indices]
            avg_p = sum(probs) / len(probs)
            if avg_p > 0.05:
                row_count = int(_disease_sizes.get(disease_name, 1))
                freq_factor = 0.5 + 0.5 * min(1.0, row_count / 100.0)
                score_pct = int(round(avg_p * 100 * freq_factor))
                if score_pct >= 10:
                    results.append({
                        "disease": disease_name,
                        "score": score_pct,
                        "recall_pct": int(round((sum(1 for p in probs if p > 0.05) / n_user_symptoms) * 100)),
                    })
        results.sort(key=lambda x: (-x["score"], -x["recall_pct"], str(x["disease"]).lower()))
        if not results:
            return []

    top_score = results[0]["score"]
    low_conf = n_user_symptoms < 2

    # Always try to return top_n (3) diseases.
    # Only collapse to 1 result if confidence is very low (< 30%).
    # Use a 30-point gap so the user sees meaningful alternatives.
    if top_score < 30:
        # Very low confidence — single result with warning
        filtered = results[:1]
    else:
        # Show up to top_n results within a 30-point gap of the top score
        filtered = [r for r in results if (top_score - r["score"]) <= 30]
        filtered = filtered[:top_n]
        # If still only 1, relax gap further to always try filling up to top_n
        if len(filtered) < top_n and len(results) >= top_n:
            filtered = results[:top_n]


    # ── ML OVERRIDE: only when >= 5 symptoms AND ML is meaningfully confident ──
    # Diagnostic: ML gives near-uniform 0.21% for 1-4 symptoms regardless of input.
    # Only trust ML when top-proba > 2%, which only happens with 5+ specific symptoms.
    if _ml_available and n_user_symptoms >= 5:
        ml_results = _predict_ml(matched_symptoms, top_n=top_n)
        if ml_results and ml_results[0]["score"] >= 25:
            for r in ml_results:
                r["low_confidence"] = low_conf
                r.setdefault("match_detail", "")
            return ml_results

    top_results = []
    for item in filtered:
        top_results.append({
            "name": item["disease"],
            "score": item["score"],
            "match_detail": "",
            "low_confidence": low_conf,
        })
    return top_results

