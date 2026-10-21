import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
from typing import List

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'storage', 'ai', 'symptom_model.joblib')

class PredictRequest(BaseModel):
    symptoms: str

class Prediction(BaseModel):
    disease: str
    confidence: float

app = FastAPI(title='Symptom Model Service')

model_bundle = None

def load_model():
    global model_bundle
    if model_bundle is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f'Model not found at {MODEL_PATH}. Run training first.')
        model_bundle = joblib.load(MODEL_PATH)
    return model_bundle

@app.post('/predict')
def predict(req: PredictRequest):
    if not req.symptoms or not isinstance(req.symptoms, str):
        raise HTTPException(status_code=400, detail='Invalid input')
    try:
        bundle = load_model()
        pipeline = bundle['pipeline']
        le = bundle['label_encoder']
        probs = pipeline.predict_proba([req.symptoms])[0]
        classes = pipeline.classes_ if hasattr(pipeline, 'classes_') else None
        # pipeline.classes_ are encoded ints (label encoded); map back
        # Predict top 5
        top_idx = probs.argsort()[::-1][:5]
        predictions = []
        for idx in top_idx:
            label_enc = pipeline.classes_[idx] if classes is not None else idx
            try:
                disease = le.inverse_transform([label_enc])[0]
            except Exception:
                # If label encoder mapping differs, fallback to string
                disease = str(label_enc)
            predictions.append({'disease': disease, 'confidence': float(round(probs[idx]*100, 2))})
        return {'success': True, 'predictions': predictions}
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/health')
def health():
    return {'success': True, 'status': 'ok'}
