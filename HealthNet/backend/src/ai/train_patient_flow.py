import json
import os
import sys
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder

REQUIRED_COLUMNS = ["hospital_id", "date", "department", "disease", "gender", "patient_count"]

COLUMN_ALIASES = {
    "hospital_id": ["hospital_id", "hospitalid"],
    "date": ["date", "admission_date", "visit_date", "created_at", "encounter_date"],
    "department": ["department", "depatrment", "dept", "department_name"],
    "disease": ["disease", "diagnosis", "condition", "illness", "issue"],
    "gender": ["gender", "sex"],
    "patient_count": ["patient_count", "count", "patients", "total_patients"],
}


def fail(message: str) -> None:
    print(json.dumps({"success": False, "message": message}))
    sys.exit(1)


def normalize_column_name(name: str) -> str:
    text = str(name or "").replace("\ufeff", "").strip().lower()
    return "_".join(part for part in text.replace("-", " ").split() if part)


def align_columns_to_schema(df: pd.DataFrame) -> pd.DataFrame:
    normalized_to_original = {}
    for original in df.columns:
        normalized = normalize_column_name(original)
        if normalized and normalized not in normalized_to_original:
            normalized_to_original[normalized] = original

    rename_map = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            normalized_alias = normalize_column_name(alias)
            if normalized_alias in normalized_to_original:
                rename_map[normalized_to_original[normalized_alias]] = canonical
                break

    aligned = df.rename(columns=rename_map).copy()

    # Ensure final canonical names are clean and consistent.
    aligned.columns = [normalize_column_name(col) for col in aligned.columns]
    return aligned


def add_time_features(df: pd.DataFrame, date_origin: pd.Timestamp) -> pd.DataFrame:
    out = df.copy()
    out["day"] = out["date"].dt.day
    out["month"] = out["date"].dt.month
    out["weekday"] = out["date"].dt.weekday
    out["day_of_year"] = out["date"].dt.dayofyear
    out["week_of_year"] = out["date"].dt.isocalendar().week.astype(int)
    out["is_weekend"] = (out["weekday"] >= 5).astype(int)
    out["days_since_start"] = (out["date"] - date_origin).dt.days.astype(int)
    return out


def build_time_split(df: pd.DataFrame):
    unique_days = sorted(df["date"].dropna().unique())
    if len(unique_days) < 10:
        return df, pd.DataFrame(columns=df.columns)

    split_idx = max(1, int(len(unique_days) * 0.8))
    split_day = unique_days[split_idx - 1]
    train_df = df[df["date"] <= split_day].copy()
    val_df = df[df["date"] > split_day].copy()
    return train_df, val_df


def compute_metrics(y_true, y_pred):
    if len(y_true) == 0:
        return None
    return {
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(mean_squared_error(y_true, y_pred) ** 0.5),
        "r2": float(r2_score(y_true, y_pred)),
    }


def train_and_select_model(train_df, val_df, feature_cols):
    sample_weight = train_df["is_synthetic"].apply(lambda v: 0.1 if int(v) == 1 else 1.0).astype(float)

    candidates = [
        (
            "random_forest",
            RandomForestRegressor(
                n_estimators=800,
                random_state=42,
                min_samples_leaf=2,
                n_jobs=-1,
            ),
        ),
        (
            "extra_trees",
            ExtraTreesRegressor(
                n_estimators=700,
                random_state=42,
                min_samples_leaf=2,
                n_jobs=-1,
            ),
        ),
        (
            "gradient_boosting",
            GradientBoostingRegressor(
                random_state=42,
                n_estimators=350,
                learning_rate=0.04,
                max_depth=3,
                subsample=0.9,
            ),
        ),
    ]

    best_name = None
    best_model = None
    best_rmse = float("inf")

    X_train = train_df[feature_cols]
    y_train = train_df["patient_count"]

    X_val = val_df[feature_cols] if not val_df.empty else pd.DataFrame(columns=feature_cols)
    y_val = val_df["patient_count"] if not val_df.empty else pd.Series(dtype=float)

    for name, model in candidates:
        try:
            model.fit(X_train, y_train, sample_weight=sample_weight)
            if not val_df.empty:
                y_pred_val = model.predict(X_val)
                metrics = compute_metrics(y_val, y_pred_val)
                rmse = float(metrics["rmse"]) if metrics is not None else float("inf")
            else:
                y_pred_train = model.predict(X_train)
                metrics = compute_metrics(y_train, y_pred_train)
                rmse = float(metrics["rmse"]) if metrics is not None else float("inf")

            if rmse < best_rmse:
                best_rmse = rmse
                best_name = name
                best_model = model
        except Exception:
            continue

    if best_model is None:
        fail("Failed to train any candidate model")

    return best_name, best_model


def build_baseline_lookup(data: pd.DataFrame):
    key_cols = ["hospital_id", "department", "disease", "gender", "weekday"]
    baseline = {}
    grouped = data.groupby(key_cols, as_index=False)["patient_count"].mean()
    for row in grouped.itertuples(index=False):
        key = "|".join(
            [
                str(row.hospital_id),
                str(row.department),
                str(row.disease),
                str(row.gender),
                str(row.weekday),
            ]
        )
        baseline[key] = float(row.patient_count)
    return baseline


def build_range_lookup(data: pd.DataFrame):
    key_cols = ["hospital_id", "department", "disease", "gender"]
    lookup = {}
    grouped = data.groupby(key_cols)["patient_count"]
    for key, series in grouped:
        values = series.astype(float)
        k = "|".join([str(v) for v in key])
        lookup[k] = {
            "p10": float(values.quantile(0.10)),
            "p90": float(values.quantile(0.90)),
            "mean": float(values.mean()),
            "std": float(values.std(ddof=0)) if len(values) > 1 else 0.0,
            "min": float(values.min()),
            "max": float(values.max()),
        }
    return lookup


def build_trend_profiles(data: pd.DataFrame):
    profiles = {}
    key_cols = ["hospital_id", "department", "disease", "gender"]

    grouped = data.groupby(key_cols, as_index=False)
    for key, frame in grouped:
        daily = (
            frame.groupby("date", as_index=False)["patient_count"]
            .mean()
            .sort_values("date")
            .reset_index(drop=True)
        )
        if daily.empty:
            continue

        y = daily["patient_count"].astype(float).values
        x = np.arange(len(y), dtype=float)
        slope = float(np.polyfit(x, y, 1)[0]) if len(y) >= 2 else 0.0
        recent_window = y[-7:] if len(y) >= 7 else y

        k = "|".join([str(v) for v in key])
        profiles[k] = {
            "slope_per_day": slope,
            "recent_mean_7": float(np.mean(recent_window)),
            "overall_mean": float(np.mean(y)),
            "recent_std_7": float(np.std(recent_window, ddof=0)) if len(recent_window) > 1 else 0.0,
            "last_value": float(y[-1]),
            "last_date": daily["date"].max().strftime("%Y-%m-%d"),
        }

    return profiles


def main() -> None:
    if len(sys.argv) < 5:
        fail("Usage: train_patient_flow.py <dataset_path> <model_bundle_path> <metadata_path> <department_id>")

    dataset_path = sys.argv[1]
    model_bundle_path = sys.argv[2]
    metadata_path = sys.argv[3]
    department_id = sys.argv[4]

    if not os.path.exists(dataset_path):
        fail("Dataset file not found")

    try:
        data = pd.read_csv(dataset_path)
    except Exception as exc:
        fail(f"Unable to read CSV file: {exc}")

    data = align_columns_to_schema(data)

    missing_columns = [c for c in REQUIRED_COLUMNS if c not in data.columns]
    if missing_columns:
        fail(f"Missing required columns: {', '.join(missing_columns)}")

    data = data.copy()
    for c in REQUIRED_COLUMNS:
        if c != "patient_count":
            data[c] = data[c].astype(str).str.strip()

    # Normalize common categorical fields for stable model classes.
    data["disease"] = data["disease"].astype(str).str.strip()
    data["gender"] = data["gender"].astype(str).str.strip().str.lower()

    data["patient_count"] = pd.to_numeric(data["patient_count"], errors="coerce")
    data = data.dropna(subset=["patient_count"])

    if data.empty:
        fail("No valid patient_count rows found after parsing")

    try:
        data["date"] = pd.to_datetime(data["date"], errors="coerce")
    except Exception as exc:
        fail(f"Invalid date values: {exc}")

    data = data.dropna(subset=["date"])
    if data.empty:
        fail("No valid rows found after date parsing")

    source_rows = int(len(data))

    # Add explicit aggregate classes so prediction for disease=all and/or gender=all
    # uses learned totals instead of summing many independent class predictions.
    with_gender_all = (
        data.groupby(["hospital_id", "date", "department", "disease"], as_index=False)["patient_count"]
        .sum()
        .assign(gender="all")
    )
    with_disease_all = (
        data.groupby(["hospital_id", "date", "department", "gender"], as_index=False)["patient_count"]
        .sum()
        .assign(disease="__all__")
    )
    with_both_all = (
        data.groupby(["hospital_id", "date", "department"], as_index=False)["patient_count"]
        .sum()
        .assign(disease="__all__", gender="all")
    )

    data["is_synthetic"] = 0
    with_gender_all["is_synthetic"] = 1
    with_disease_all["is_synthetic"] = 1
    with_both_all["is_synthetic"] = 1

    data = pd.concat([data, with_gender_all, with_disease_all, with_both_all], ignore_index=True)
    training_rows = int(len(data))

    dept_encoder = LabelEncoder()
    gender_encoder = LabelEncoder()
    disease_encoder = LabelEncoder()
    hospital_encoder = LabelEncoder()

    data["department_encoded"] = dept_encoder.fit_transform(data["department"])
    data["disease_encoded"] = disease_encoder.fit_transform(data["disease"])
    data["gender_encoded"] = gender_encoder.fit_transform(data["gender"])
    data["hospital_encoded"] = hospital_encoder.fit_transform(data["hospital_id"])

    date_origin = data["date"].min()
    data = add_time_features(data, date_origin)

    feature_cols = [
        "hospital_encoded",
        "department_encoded",
        "disease_encoded",
        "gender_encoded",
        "day",
        "month",
        "weekday",
        "day_of_year",
        "week_of_year",
        "is_weekend",
        "days_since_start",
    ]

    train_df, val_df = build_time_split(data)
    if train_df.empty:
        fail("No valid rows available for model training")

    selected_model_name, model = train_and_select_model(train_df, val_df, feature_cols)

    train_pred = model.predict(train_df[feature_cols])
    train_metrics = compute_metrics(train_df["patient_count"], train_pred)

    val_metrics = None
    if not val_df.empty:
        val_pred = model.predict(val_df[feature_cols])
        val_metrics = compute_metrics(val_df["patient_count"], val_pred)

    baseline_weekday_means = build_baseline_lookup(data)
    value_ranges = build_range_lookup(data)
    trend_profiles = build_trend_profiles(data)

    bundle = {
        "model": model,
        "selected_model": selected_model_name,
        "hospital_classes": [str(v) for v in hospital_encoder.classes_],
        "department_classes": [str(v) for v in dept_encoder.classes_],
        "disease_classes": [str(v) for v in disease_encoder.classes_],
        "gender_classes": [str(v) for v in gender_encoder.classes_],
        "features": feature_cols,
        "date_origin_ymd": date_origin.strftime("%Y-%m-%d"),
        "baseline_weekday_means": baseline_weekday_means,
        "value_ranges": value_ranges,
        "trend_profiles": trend_profiles,
        "training_summary": {
            "validation_r2": float(val_metrics["r2"]) if val_metrics else None,
            "validation_rmse": float(val_metrics["rmse"]) if val_metrics else None,
            "validation_mae": float(val_metrics["mae"]) if val_metrics else None,
        },
    }

    os.makedirs(os.path.dirname(model_bundle_path), exist_ok=True)
    os.makedirs(os.path.dirname(metadata_path), exist_ok=True)

    joblib.dump(bundle, model_bundle_path)

    metadata = {
        "success": True,
        "department_id": department_id,
        "rows_trained": training_rows,
        "source_rows": source_rows,
        "augmented_rows": int(max(0, training_rows - source_rows)),
        "date_min": data["date"].min().strftime("%Y-%m-%d"),
        "date_max": data["date"].max().strftime("%Y-%m-%d"),
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "model_version": f"{selected_model_name}_v5_temporal_auto",
        "metrics": {
            "mae": round(float(train_metrics["mae"]), 4),
            "rmse": round(float(train_metrics["rmse"]), 4),
            "r2": round(float(train_metrics["r2"]), 6),
            "validation_mae": round(float(val_metrics["mae"]), 4) if val_metrics else None,
            "validation_rmse": round(float(val_metrics["rmse"]), 4) if val_metrics else None,
            "validation_r2": round(float(val_metrics["r2"]), 6) if val_metrics else None,
            "validation_rows": int(len(val_df)),
            "training_rows_effective": int(len(train_df)),
            "selected_model": selected_model_name,
        },
        "hospital_values": bundle["hospital_classes"],
        "department_values": bundle["department_classes"],
        "disease_values": bundle["disease_classes"],
        "gender_values": bundle["gender_classes"],
    }

    with open(metadata_path, "w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)

    print(json.dumps(metadata))


if __name__ == "__main__":
    main()
