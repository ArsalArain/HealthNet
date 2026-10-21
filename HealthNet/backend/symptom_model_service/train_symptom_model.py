import os
import pandas as pd
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'Final_Augmented_dataset_Diseases_and_Symptoms.csv')
MODEL_OUT = os.path.join(os.path.dirname(__file__), '..', 'storage', 'ai', 'symptom_model.joblib')

os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)

print(f"Loading dataset from {CSV_PATH}...")
# Read only first few rows to check columns
df_head = pd.read_csv(CSV_PATH, nrows=5)

if "diseases" in df_head.columns:
    disease_col = "diseases"
    print("Detected 'diseases' column. Assuming rest are binary symptoms.")
    # Read entire dataset
    df = pd.read_csv(CSV_PATH)
    symptom_names = df.columns[df.columns != disease_col]
    X_binary = df[symptom_names].values.astype(bool)
    
    print("Converting binary symptoms to text strings...")
    # Efficient conversion to space-separated strings
    symptoms_text = [" ".join(symptom_names[row]) for row in X_binary]
    
    processed_df = pd.DataFrame({
        "Disease": df[disease_col],
        "Symptoms": symptoms_text
    })
    df = processed_df.dropna()
elif "Disease" in df_head.columns and "Symptoms" in df_head.columns:
    df = pd.read_csv(CSV_PATH)[["Disease", "Symptoms"]].dropna()
else:
    print(f"Columns found: {df_head.columns.tolist()}")
    raise SystemExit("Dataset format not recognized")

print(f"Dataset size: {len(df)}")
X = df["Symptoms"].values
y = df["Disease"].astype(str).values

print("Encoding labels...")
le = LabelEncoder()
y_enc = le.fit_transform(y)

print("Splitting dataset...")
X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.1, random_state=42, )

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1,2), max_features=10000)),
    ("clf", LogisticRegression(max_iter=500, n_jobs=-1))
])

print("Training classifier (this may take a few minutes)...")
pipeline.fit(X_train, y_train)

acc = pipeline.score(X_test, y_test)
print(f"Validation accuracy: {acc:.4f}")

print(f"Saving model to {MODEL_OUT}...")
joblib.dump({"pipeline": pipeline, "label_encoder": le}, MODEL_OUT)
print("Done!")
