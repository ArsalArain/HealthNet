"""
train_model.py
==============
Trains a RandomForest classifier on
Final_Augmented_dataset_Diseases_and_Symptoms.csv and saves:
  - model.pkl           (RandomForestClassifier, 150 trees, balanced weights)
  - label_encoder.pkl   (LabelEncoder — classes_ = disease names in training order)
  - feature_columns.pkl (list of 377 symptom column names, exact training order)

Run:
    python src/train_model.py

Notes:
  - class_weight='balanced' compensates for 754-class imbalance
  - max_samples=0.6 keeps peak RAM usage manageable on 246K rows
  - predict_proba() from 150 trees gives reliable top-3 ranking without calibration
"""

import os
import time
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import top_k_accuracy_score
import warnings
warnings.filterwarnings("ignore")

# ── paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
CSV_PATH   = os.path.join(BASE_DIR, "Final_Augmented_dataset_Diseases_and_Symptoms.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
LE_PATH    = os.path.join(BASE_DIR, "label_encoder.pkl")
FEAT_PATH  = os.path.join(BASE_DIR, "feature_columns.pkl")

# ── load data ─────────────────────────────────────────────────────────────────
print(f"Loading CSV: {CSV_PATH}")
df = pd.read_csv(CSV_PATH)
print(f"  Rows: {len(df):,} | Columns: {df.shape[1]}")

TARGET_COL   = "diseases"
feature_cols = [c for c in df.columns if c != TARGET_COL]
print(f"  Features : {len(feature_cols)} symptom columns")
print(f"  Diseases : {df[TARGET_COL].nunique()} unique classes")

# ── encode labels ─────────────────────────────────────────────────────────────
le = LabelEncoder()
y  = le.fit_transform(df[TARGET_COL])
X  = df[feature_cols].values.astype(np.float32)

counts = np.bincount(y)
print(f"\nClass distribution: min={counts.min()} | max={counts.max()} | mean={counts.mean():.1f}")

# ── drop ultra-rare classes (< 2 samples) — can't meaningfully train on them ──
rare = np.where(counts < 2)[0]
if len(rare):
    print(f"  Dropping {len(rare)} ultra-rare diseases (< 2 samples) ...")
    mask = ~np.isin(y, rare)
    X, y = X[mask], y[mask]
    # re-encode labels to be contiguous
    uniq   = np.unique(y)
    remap  = {old: new for new, old in enumerate(uniq)}
    y      = np.array([remap[v] for v in y], dtype=np.int32)
    le.classes_ = le.classes_[uniq]
    print(f"  Remaining: {len(uniq)} diseases | {len(X):,} rows")

# ── train / test split ────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42
)
print(f"\nTrain: {len(X_train):,} | Test: {len(X_test):,}")

# ── train RandomForest ────────────────────────────────────────────────────────
# class_weight='balanced' → up-weights rare diseases so they're not drowned out
# max_samples=0.6        → row sub-sampling keeps peak RAM under control
# 150 trees              → enough for stable predict_proba() without calibration
print("\nTraining RandomForestClassifier (class_weight='balanced') ...")
t0 = time.time()

model = RandomForestClassifier(
    n_estimators=150,
    max_depth=30,
    min_samples_leaf=3,
    max_features="sqrt",
    max_samples=0.6,
    class_weight="balanced",
    n_jobs=4,
    random_state=42,
    verbose=1,
)
model.fit(X_train, y_train)
print(f"Training done in {time.time() - t0:.1f}s")

# ── evaluate ──────────────────────────────────────────────────────────────────
print("\nEvaluating on test set ...")
test_proba = model.predict_proba(X_test)
all_labels = np.arange(len(le.classes_))
top1 = top_k_accuracy_score(y_test, test_proba, k=1, labels=all_labels)
top3 = top_k_accuracy_score(y_test, test_proba, k=3, labels=all_labels)
print(f"  Top-1 accuracy : {top1 * 100:.2f}%")
print(f"  Top-3 accuracy : {top3 * 100:.2f}%")

# ── sanity tests ──────────────────────────────────────────────────────────────
def _infer(symptoms):
    feat_idx = {c: i for i, c in enumerate(feature_cols)}
    x = np.zeros((1, len(feature_cols)), dtype=np.float32)
    for s in symptoms:
        if s in feat_idx:
            x[0, feat_idx[s]] = 1.0
    proba = model.predict_proba(x)[0]
    top   = np.argsort(proba)[::-1][:3]
    return [(le.classes_[i], round(proba[i] * 100, 2)) for i in top]

print("\n-- Sanity: ['fever'] --")
for rank, (d, p) in enumerate(_infer(["fever"]), 1):
    print(f"  #{rank}: {d:<45} {p}%")

print("\n-- Sanity: ['fever', 'flu-like syndrome', 'coryza'] --")
for rank, (d, p) in enumerate(_infer(["fever", "flu-like syndrome", "coryza"]), 1):
    print(f"  #{rank}: {d:<45} {p}%")

print("\n-- Sanity: chest pain + palpitations --")
for rank, (d, p) in enumerate(_infer(["sharp chest pain", "palpitations", "decreased heart rate", "irregular heartbeat"]), 1):
    print(f"  #{rank}: {d:<45} {p}%")

print("\n-- Sanity: ascending cholangitis full set --")
for rank, (d, p) in enumerate(_infer(["fever", "jaundice", "upper abdominal pain", "shortness of breath", "retention of urine"]), 1):
    print(f"  #{rank}: {d:<45} {p}%")

# ── save ──────────────────────────────────────────────────────────────────────
print("\nSaving model artifacts ...")
with open(MODEL_PATH, "wb") as f:
    pickle.dump(model, f, protocol=4)
with open(LE_PATH, "wb") as f:
    pickle.dump(le, f, protocol=4)
with open(FEAT_PATH, "wb") as f:
    pickle.dump(feature_cols, f, protocol=4)

print(f"  ✔ {MODEL_PATH}")
print(f"  ✔ {LE_PATH}")
print(f"  ✔ {FEAT_PATH}")
print("\n[DONE] Training complete! Restart Flask to activate ML predictions.")
