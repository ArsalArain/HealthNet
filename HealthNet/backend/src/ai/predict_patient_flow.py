import json
import os
import sys
from datetime import datetime
from typing import Optional

import joblib
import pandas as pd


def fail(message: str) -> None:
    print(json.dumps({"success": False, "message": message}))
    sys.exit(1)


def find_label_index(classes, value):
    normalized_classes = [str(v).strip().lower() for v in classes]
    needle = str(value).strip().lower()
    if needle not in normalized_classes:
        return None
    return normalized_classes.index(needle)


def parse_input_date(day: int, month: int, date_ymd: Optional[str]):
    if date_ymd:
        try:
            return datetime.strptime(str(date_ymd), "%Y-%m-%d")
        except ValueError:
            return None

    year = datetime.utcnow().year
    try:
        return datetime(year=year, month=month, day=day)
    except ValueError:
        return None


def build_feature_row(features, hospital_idx, department_idx, disease_idx, gender_idx, day, month, weekday, parsed_date, date_origin):
    values = {
        "hospital_encoded": hospital_idx,
        "department_encoded": department_idx,
        "disease_encoded": disease_idx,
        "gender_encoded": gender_idx,
        "day": day,
        "month": month,
        "weekday": weekday,
    }

    if parsed_date is not None:
        values["day_of_year"] = int(parsed_date.strftime("%j"))
        values["week_of_year"] = int(parsed_date.isocalendar().week)
    else:
        values["day_of_year"] = 1
        values["week_of_year"] = 1

    values["is_weekend"] = 1 if int(weekday) >= 5 else 0

    if parsed_date is not None and date_origin is not None:
        values["days_since_start"] = int((parsed_date - date_origin).days)
    else:
        values["days_since_start"] = 0

    ordered = [values.get(feature, 0) for feature in features]
    return pd.DataFrame([ordered], columns=features)


def single_predict(model, features, hospital_idx, department_idx, disease_idx, gender_idx, day, month, weekday, parsed_date, date_origin):
    row = build_feature_row(
        features,
        hospital_idx,
        department_idx,
        disease_idx,
        gender_idx,
        day,
        month,
        weekday,
        parsed_date,
        date_origin,
    )
    pred = model.predict(row)
    return max(0, int(round(float(pred[0]))))


def single_predict_legacy(model, hospital_idx, department_idx, gender_idx, day, month, weekday):
    row = pd.DataFrame(
        [[hospital_idx, department_idx, gender_idx, day, month, weekday]],
        columns=["hospital_encoded", "department_encoded", "gender_encoded", "day", "month", "weekday"],
    )
    pred = model.predict(row)
    return max(0, int(round(float(pred[0]))))


def main() -> None:
    if len(sys.argv) < 9:
        fail("Usage: predict_patient_flow.py <model_bundle_path> <hospital_id> <department> <disease|all> <gender|all> <day> <month> <weekday> [date_ymd]")

    model_bundle_path = sys.argv[1]
    hospital_id = sys.argv[2]
    department = sys.argv[3]
    disease = sys.argv[4]
    gender = sys.argv[5]

    try:
        day = int(sys.argv[6])
        month = int(sys.argv[7])
        weekday = int(sys.argv[8])
    except ValueError:
        fail("day, month, weekday must be integers")

    if not os.path.exists(model_bundle_path):
        fail("Model bundle not found")

    date_ymd = sys.argv[9] if len(sys.argv) >= 10 else None

    bundle = joblib.load(model_bundle_path)
    model = bundle.get("model")
    features = [str(v) for v in bundle.get("features", [])]
    hospital_classes = bundle.get("hospital_classes", [])
    department_classes = bundle.get("department_classes", [])
    disease_classes = bundle.get("disease_classes", [])
    gender_classes = bundle.get("gender_classes", [])
    baseline_weekday_means = bundle.get("baseline_weekday_means", {}) or {}
    value_ranges = bundle.get("value_ranges", {}) or {}
    trend_profiles = bundle.get("trend_profiles", {}) or {}
    training_summary = bundle.get("training_summary", {}) or {}
    date_origin_ymd = bundle.get("date_origin_ymd")
    has_disease_feature = "disease_encoded" in features

    date_origin = None
    if date_origin_ymd:
        try:
            date_origin = datetime.strptime(str(date_origin_ymd), "%Y-%m-%d")
        except ValueError:
            date_origin = None

    parsed_date = parse_input_date(day, month, date_ymd)

    if model is None:
        fail("Invalid model bundle")

    hospital_idx = find_label_index(hospital_classes, hospital_id)
    if hospital_idx is None:
        fail("hospital_id is not present in trained model classes")

    department_idx = find_label_index(department_classes, department)
    if department_idx is None:
        fail("department is not present in trained model classes")

    disease_indices = []
    if has_disease_feature:
        if str(disease).strip().lower() == "all":
            disease_indices = list(range(len(disease_classes)))
        else:
            disease_idx = find_label_index(disease_classes, disease)
            if disease_idx is None:
                fail("disease is not present in trained model classes")
            disease_indices = [disease_idx]

        if not disease_indices:
            fail("No disease classes available in model")
    else:
        # Backward-compat for old model bundles that do not include disease feature.
        disease_indices = [None]

    gender_is_all = str(gender).strip().lower() == "all"
    disease_is_all = str(disease).strip().lower() == "all"

    prediction = 0
    if disease_is_all and gender_is_all:
        all_disease_idx = find_label_index(disease_classes, "__all__")
        all_gender_idx = find_label_index(gender_classes, "all")
        if has_disease_feature and all_disease_idx is not None and all_gender_idx is not None:
            prediction = single_predict(
                model,
                features,
                hospital_idx,
                department_idx,
                all_disease_idx,
                all_gender_idx,
                day,
                month,
                weekday,
                parsed_date,
                date_origin,
            )
        else:
            # Backward-compat fallback for models trained before aggregate classes existed.
            if not gender_classes:
                fail("No gender classes available in model")
            for disease_idx in disease_indices:
                for gender_idx in range(len(gender_classes)):
                    if has_disease_feature:
                        prediction += single_predict(
                            model,
                            features,
                            hospital_idx,
                            department_idx,
                            disease_idx,
                            gender_idx,
                            day,
                            month,
                            weekday,
                            parsed_date,
                            date_origin,
                        )
                    else:
                        prediction += single_predict_legacy(model, hospital_idx, department_idx, gender_idx, day, month, weekday)
    elif disease_is_all:
        all_disease_idx = find_label_index(disease_classes, "__all__")
        gender_idx = find_label_index(gender_classes, gender)
        if gender_idx is None:
            fail("gender is not present in trained model classes")
        if has_disease_feature and all_disease_idx is not None:
            prediction = single_predict(
                model,
                features,
                hospital_idx,
                department_idx,
                all_disease_idx,
                gender_idx,
                day,
                month,
                weekday,
                parsed_date,
                date_origin,
            )
        else:
            for disease_idx in disease_indices:
                if has_disease_feature:
                    prediction += single_predict(
                        model,
                        features,
                        hospital_idx,
                        department_idx,
                        disease_idx,
                        gender_idx,
                        day,
                        month,
                        weekday,
                        parsed_date,
                        date_origin,
                    )
                else:
                    prediction += single_predict_legacy(model, hospital_idx, department_idx, gender_idx, day, month, weekday)
    elif gender_is_all:
        all_gender_idx = find_label_index(gender_classes, "all")
        if all_gender_idx is not None:
            for disease_idx in disease_indices:
                if has_disease_feature:
                        prediction += single_predict(
                            model,
                            features,
                            hospital_idx,
                            department_idx,
                            disease_idx,
                            all_gender_idx,
                            day,
                            month,
                            weekday,
                            parsed_date,
                            date_origin,
                        )
                else:
                    prediction += single_predict_legacy(model, hospital_idx, department_idx, all_gender_idx, day, month, weekday)
        else:
            if not gender_classes:
                fail("No gender classes available in model")
            for disease_idx in disease_indices:
                for gender_idx in range(len(gender_classes)):
                    if has_disease_feature:
                        prediction += single_predict(
                            model,
                            features,
                            hospital_idx,
                            department_idx,
                            disease_idx,
                            gender_idx,
                            day,
                            month,
                            weekday,
                            parsed_date,
                            date_origin,
                        )
                    else:
                        prediction += single_predict_legacy(model, hospital_idx, department_idx, gender_idx, day, month, weekday)
    else:
        gender_idx = find_label_index(gender_classes, gender)
        if gender_idx is None:
            fail("gender is not present in trained model classes")
        for disease_idx in disease_indices:
            if has_disease_feature:
                prediction += single_predict(
                    model,
                    features,
                    hospital_idx,
                    department_idx,
                    disease_idx,
                    gender_idx,
                    day,
                    month,
                    weekday,
                    parsed_date,
                    date_origin,
                )
            else:
                prediction += single_predict_legacy(model, hospital_idx, department_idx, gender_idx, day, month, weekday)

    disease_key = "__all__" if disease_is_all else disease
    gender_key = "all" if gender_is_all else gender

    # Blend with weekday historical baseline for stability on future dates.
    baseline_key = "|".join([hospital_id, department, disease_key if disease_key else "__all__", gender_key if gender_key else "all", str(weekday)])
    baseline_value = baseline_weekday_means.get(baseline_key)
    if baseline_value is not None:
        prediction = int(round(0.9 * float(prediction) + 0.1 * float(baseline_value)))

    # Add horizon-aware trend blending for future/past dates relative to latest observed day.
    trend_key = "|".join([hospital_id, department, disease_key if disease_key else "__all__", gender_key if gender_key else "all"])
    trend_info = trend_profiles.get(trend_key)
    horizon_days = 0.0
    if trend_info and parsed_date is not None:
        try:
            last_date = datetime.strptime(str(trend_info.get("last_date", "")), "%Y-%m-%d")
            slope = float(trend_info.get("slope_per_day", 0.0))
            recent_mean = float(trend_info.get("recent_mean_7", trend_info.get("overall_mean", 0.0)))
            recent_std = float(trend_info.get("recent_std_7", 0.0))
            last_value = float(trend_info.get("last_value", recent_mean))
            overall_mean = float(trend_info.get("overall_mean", recent_mean))
            horizon_days = float((parsed_date - last_date).days)

            baseline_for_day = float(baseline_value) if baseline_value is not None else recent_mean
            seasonal_component = baseline_for_day - overall_mean
            trend_target = max(0.0, recent_mean + slope * horizon_days + seasonal_component)

            # For +1/+2/+3 days, rely more on recent observed level + trend than pure RF output.
            short_horizon_target = max(0.0, last_value + slope * horizon_days + 0.6 * seasonal_component)

            if horizon_days > 0:
                short_weight = min(0.55, (horizon_days / 3.0) * 0.55)
                prediction = (1.0 - short_weight) * float(prediction) + short_weight * short_horizon_target

                trend_weight = min(0.4, abs(horizon_days) / 14.0 * 0.4)
                prediction = (1.0 - trend_weight) * float(prediction) + trend_weight * trend_target

                # Keep near-term forecast within plausible band around recent behavior.
                band = max(2.0, 2.5 * recent_std)
                prediction = min(max(prediction, max(0.0, recent_mean - band)), recent_mean + band)
            else:
                trend_weight = min(0.2, abs(horizon_days) / 14.0 * 0.2)
                prediction = (1.0 - trend_weight) * float(prediction) + trend_weight * trend_target

            prediction = int(round(max(0.0, prediction)))
        except Exception:
            pass

    # Reduce RF dominance if time-split validation quality is weak.
    val_r2 = training_summary.get("validation_r2")
    if isinstance(val_r2, (int, float)) and val_r2 < 0.25 and baseline_value is not None:
        prediction = int(round(0.65 * float(prediction) + 0.35 * float(baseline_value)))

    # Clamp to observed range by (hospital, department, disease, gender) to reduce unrealistic spikes.
    range_key = "|".join([hospital_id, department, disease_key if disease_key else "__all__", gender_key if gender_key else "all"])
    range_info = value_ranges.get(range_key)
    if range_info:
        p10 = float(range_info.get("p10", 0.0))
        p90 = float(range_info.get("p90", 0.0))
        std = float(range_info.get("std", 0.0))
        min_value = float(range_info.get("min", 0.0))
        max_value = float(range_info.get("max", max(p90, 0.0)))

        lower = max(0.0, min(min_value * 0.7, p10 - 2.0 * std))
        upper = max(max_value * 2.2, p90 + 3.0 * std, p10 + 4.0)

        if horizon_days > 0:
            # Allow wider envelope for future horizons.
            widen = min(1.35, 1.0 + horizon_days / 30.0)
            upper *= widen

        prediction = int(round(min(max(float(prediction), lower), upper)))

    print(
        json.dumps(
            {
                "success": True,
                "prediction": int(max(0, prediction)),
                "inputs": {
                    "hospital_id": hospital_id,
                    "department": department,
                    "disease": disease,
                    "gender": gender,
                    "day": day,
                    "month": month,
                    "weekday": weekday,
                },
            }
        )
    )


if __name__ == "__main__":
    main()
