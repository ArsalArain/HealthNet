import os
import argparse
import pandas as pd
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, top_k_accuracy_score
from sklearn.linear_model import LogisticRegression

DEFAULT_SRC = os.path.join(os.path.dirname(__file__), 'train_dataset_compact.csv')
DEFAULT_OUT = os.path.join(os.path.dirname(__file__), '..', 'storage', 'ai', 'symptom_model.joblib')

parser = argparse.ArgumentParser(description='Train symptom model from compact CSV')
parser.add_argument('--src', default=DEFAULT_SRC, help='Compact CSV path')
parser.add_argument('--out', default=DEFAULT_OUT, help='Output model path')
parser.add_argument('--top-n', type=int, default=200, help='Train on top N most frequent diseases')
parser.add_argument('--cap', type=int, default=1000, help='Max samples per class (None for no cap)')
parser.add_argument('--test-size', type=float, default=0.15, help='Test split fraction')
parser.add_argument('--max-features', type=int, default=20000, help='TF-IDF max features')
parser.add_argument('--random-state', type=int, default=42)
args = parser.parse_args()

print('Loading compact CSV from', args.src)
df = pd.read_csv(args.src)
print('Total rows in compact CSV:', len(df))

# filter top-n diseases
vc = df['Disease'].value_counts()
print('Unique diseases total:', len(vc))

top_n = args.top_n
if top_n is not None and top_n > 0:
    top_classes = vc.head(top_n).index.tolist()
    df = df[df['Disease'].isin(top_classes)].copy()
    print(f'Filtered to top {top_n} diseases, rows now:', len(df))
else:
    top_classes = vc.index.tolist()

# cap per class
if args.cap and args.cap > 0:
    print('Applying per-class cap:', args.cap)
    parts = []
    for cls, group in df.groupby('Disease'):
        if len(group) > args.cap:
            parts.append(group.sample(n=args.cap, random_state=args.random_state))
        else:
            parts.append(group)
    df = pd.concat(parts).sample(frac=1, random_state=args.random_state).reset_index(drop=True)
    print('After cap, rows:', len(df))

# Prepare X/y
X = df['SymptomsText'].astype(str).values
y = df['Disease'].astype(str).values

le = LabelEncoder()
y_enc = le.fit_transform(y)

# train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y_enc, test_size=args.test_size, random_state=args.random_state, stratify=y_enc)
print('Train size:', len(X_train), 'Test size:', len(X_test))

pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=args.max_features,
        sublinear_tf=True,
        strip_accents='unicode',
        lowercase=True,
    )),
    ('clf', LogisticRegression(
        solver='lbfgs',
        max_iter=1000,
        class_weight='balanced',
        random_state=args.random_state
    ))
])

print('Training model... this can take some minutes')
pipeline.fit(X_train, y_train)

print('Predicting on test set...')
y_pred = pipeline.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print('Top-1 accuracy:', acc)

# top-3 accuracy
if hasattr(pipeline, 'predict_proba'):
    try:
        y_prob = pipeline.predict_proba(X_test)
        top3 = top_k_accuracy_score(y_test, y_prob, k=3, labels=pipeline.classes_)
        print('Top-3 accuracy:', top3)
    except Exception as ex:
        print('Could not compute top-k accuracy:', ex)

# Save model bundle
os.makedirs(os.path.dirname(args.out), exist_ok=True)
joblib.dump({'pipeline': pipeline, 'label_encoder': le}, args.out)
print('Saved model to', args.out)

# Show top classes and counts
print('\nTrained on classes (name:count):')
for cls, cnt in pd.Series(y).value_counts().head(20).items():
    print(cls, cnt)

print('\nDone.')
