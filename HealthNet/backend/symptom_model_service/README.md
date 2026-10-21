Symptom model service

- Train: `python train_symptom_model.py`
- Serve: `uvicorn app:app --host 127.0.0.1 --port 5001 --log-level info`

Model saved to `storage/ai/symptom_model.joblib` by default.
