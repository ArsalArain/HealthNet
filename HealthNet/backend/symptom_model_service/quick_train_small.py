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

print('Loading dataset from', CSV_PATH)
df = pd.read_csv(CSV_PATH)
if 'diseases' in df.columns:
    disease_col = 'diseases'
    symptom_cols = [c for c in df.columns if c != disease_col]
    X_binary = df[symptom_cols].astype(bool)
    symptoms_text = []
    for row in X_binary.itertuples(index=False):
        active = [symptom_cols[i] for i, v in enumerate(row) if v]
        symptoms_text.append(' '.join(active))
    df_proc = pd.DataFrame({'Disease': df[disease_col].astype(str), 'Symptoms': symptoms_text})
else:
    if 'Disease' in df.columns and 'Symptoms' in df.columns:
        df_proc = df[['Disease', 'Symptoms']].dropna()
    else:
        raise SystemExit('Unrecognized dataset format')

counts = df_proc['Disease'].value_counts()
valid_classes = counts[counts >= 2].index
sampled = df_proc[df_proc['Disease'].isin(valid_classes)].copy()

# cap per class to 50 samples
samples = []
for cls in valid_classes:
    cls_rows = sampled[sampled['Disease'] == cls]
    n = min(len(cls_rows), 50)
    samples.append(cls_rows.sample(n=n, random_state=42))

sample_df = pd.concat(samples).sample(frac=1, random_state=42).reset_index(drop=True)
print('Sampled dataset size:', len(sample_df))

X = sample_df['Symptoms'].values
y = sample_df['Disease'].values

le = LabelEncoder()
y_enc = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=0.15, random_state=42)

pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1,2), max_features=3000)),
    ('clf', LogisticRegression(max_iter=200))
])

print('Training small classifier...')
pipeline.fit(X_train, y_train)
acc = pipeline.score(X_test, y_test)
print('Validation accuracy (small sample):', acc)

joblib.dump({'pipeline': pipeline, 'label_encoder': le}, MODEL_OUT)
print('Saved small model to', MODEL_OUT)
