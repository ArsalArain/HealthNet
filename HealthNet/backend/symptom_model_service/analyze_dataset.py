import os
import pandas as pd

SRC = os.path.join(os.path.dirname(__file__), '..', 'src', 'Final_Augmented_dataset_Diseases_and_Symptoms.csv')
OUT = os.path.join(os.path.dirname(__file__), 'train_dataset_compact.csv')

print('Reading dataset from', SRC)
# Read with low_memory False to avoid dtype warnings
try:
    df = pd.read_csv(SRC, low_memory=False)
except Exception as e:
    print('ERROR reading CSV:', e)
    raise

print('Shape:', df.shape)
cols = list(df.columns)
print('Total columns:', len(cols))
print('First columns sample:', cols[:10])

# Identify disease column (first col usually)
first_col = cols[0]
print('Assuming disease column is', first_col)

# Symptom columns are all others (binary flags) - ensure numeric
symptom_cols = cols[1:]
print('Symptom columns count:', len(symptom_cols))

# Count unique diseases
vc = df[first_col].value_counts()
print('Unique diseases:', vc.shape[0])
print('Top 20 diseases (count):')
print(vc.head(20).to_string())

# Build a compact Symptoms text per row: join symptom column names where value==1
# First, coerce symptom columns to numeric (0/1). If the file already has textual symptom lists, this will change behavior.
# We'll treat any nonzero/True as presence.
for c in symptom_cols:
    # Convert to numeric where possible
    df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0).astype(int)

# Create symptoms text

def row_symptoms(row):
    active = [c for c in symptom_cols if row[c] and row[c] != 0]
    return ' '.join(active)

print('Constructing SymptomsText column (this may take a moment)...')
# use apply with axis=1 but for speed use vectorized approach
symptom_matrix = df[symptom_cols]

symptoms_text = symptom_matrix.apply(lambda r: ' '.join([symptom_cols[i] for i,v in enumerate(r) if v]), axis=1)

df_compact = pd.DataFrame({
    'Disease': df[first_col].astype(str),
    'SymptomsText': symptoms_text
})

print('Compact dataset shape:', df_compact.shape)

# Save a compact CSV
print('Saving compact train CSV to', OUT)
df_compact.to_csv(OUT, index=False)

# Show some sample rows per top diseases
print('\nSample entries for top diseases:')
for disease in vc.head(10).index:
    sample = df_compact[df_compact['Disease'] == disease].head(3)
    print('\n---', disease, '---')
    for _,r in sample.iterrows():
        s = r['SymptomsText']
        if len(s) > 300:
            s = s[:300] + '...'
        print('-', s)

print('\nDone.')
