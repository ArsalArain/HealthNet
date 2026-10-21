"""
Quick verification: does fever alone still return Ascending Cholangitis?
Run: python src/test_fix.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from symptom_matcher import init_matcher, init_ml_model, match_symptoms, predict_diseases

CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "Final_Augmented_dataset_Diseases_and_Symptoms.csv")

print("Loading CSV...")
init_matcher(CSV)
init_ml_model(os.path.dirname(os.path.abspath(__file__)))
print("Ready.\n")

TESTS = [
    ("fever alone",                        ["fever"]),
    ("flu alone",                          ["flu"]),
    ("fever + flu + coryza",               ["fever", "flu", "coryza"]),
    ("fever + chills + headache + body pain", ["fever", "chills", "headache", "body pain"]),
    ("heart attack",                       ["heart attack"]),
    ("chest pain + palpitations",          ["chest pain", "palpitations"]),
    ("fever + rash + itching",             ["fever", "rash", "itching"]),
    ("fever + jaundice + abdominal pain + shortness of breath",
                                           ["fever", "jaundice", "abdominal pain", "shortness of breath"]),
]

for label, syms in TESTS:
    matched = match_symptoms(syms)
    results = predict_diseases(matched)
    print(f"[{label}]")
    print(f"  Matched cols : {matched}")
    if results:
        for r in results:
            lc = r.get("low_confidence", False)
            print(f"  => {r['name']} ({r['score']}%)  low_conf={lc}")
    else:
        print("  => (no results above threshold)")
    print()
