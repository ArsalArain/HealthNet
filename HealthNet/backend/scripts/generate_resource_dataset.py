import argparse
import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

RESOURCES = [
    "Beds", "ICU Beds", "Ventilators", "Oxygen Cylinders",
    "ECG Machine", "Incubators", "MRI", "CT Scan",
    "X-Ray Machine", "Dialysis Machine", "Ultrasound",
    "Chemotherapy Equipment", "Brain Scanner",
    "Surgical Tools", "Skin Equipment", "ENT Equipment",
    "Basic Equipment",
]

DEPARTMENTS = [
    "Hospital Shared Pool",
    "Emergency",
    "OPD",
    "Pediatrics",
]

CAPACITY_RANGE = {
    "Beds": (50, 200),
    "ICU Beds": (5, 40),
    "Ventilators": (5, 30),
    "Oxygen Cylinders": (20, 100),
    "ECG Machine": (2, 15),
    "Incubators": (2, 20),
    "MRI": (1, 5),
    "CT Scan": (1, 5),
    "X-Ray Machine": (2, 10),
    "Dialysis Machine": (2, 20),
    "Ultrasound": (2, 10),
    "Chemotherapy Equipment": (1, 10),
    "Brain Scanner": (1, 5),
    "Surgical Tools": (10, 50),
    "Skin Equipment": (5, 30),
    "ENT Equipment": (5, 30),
    "Basic Equipment": (20, 100),
}


def get_status(total: int, available: int, force_maintenance: bool = False) -> str:
    if force_maintenance:
        return "Maintenance"
    if available <= 0:
        return "Out of Stock"

    percent = (available / total) * 100 if total > 0 else 0
    if percent < 20:
        return "Critical"
    if percent < 50:
        return "Low Stock"
    if percent < 80:
        return "Moderate"
    return "Available"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate realistic hospital resource dataset without department split."
    )
    parser.add_argument("--start-date", default="2026-01-01", help="Start date (YYYY-MM-DD)")
    parser.add_argument("--days", type=int, default=60, help="Number of days to simulate")
    parser.add_argument("--hospitals", type=int, default=5, help="Number of hospitals (H001..)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducible output")
    parser.add_argument(
        "--output",
        default="storage/resource_dataset_no_department.csv",
        help="Output CSV path relative to backend/",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    random.seed(args.seed)

    try:
        start_date = datetime.strptime(args.start_date, "%Y-%m-%d")
    except ValueError as exc:
        raise SystemExit(f"Invalid --start-date. Use YYYY-MM-DD. ({exc})")

    if args.days <= 0:
        raise SystemExit("--days must be greater than 0")
    if args.hospitals <= 0:
        raise SystemExit("--hospitals must be greater than 0")

    backend_root = Path(__file__).resolve().parent.parent
    output_path = (backend_root / args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    total_rows = 0

    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "hospital_id",
            "date",
            "department",
            "resource_type",
            "total",
            "available",
            "used",
            "status",
        ])

        for h in range(1, args.hospitals + 1):
            hospital_id = f"H{str(h).zfill(3)}"

            stock_state = {}
            for resource in RESOURCES:
                total = random.randint(*CAPACITY_RANGE.get(resource, (20, 100)))
                stock_state[resource] = {
                    "total": total,
                    "available": int(total * random.uniform(0.5, 0.9)),
                }

            for d in range(args.days):
                current_date = start_date + timedelta(days=d)
                for resource in RESOURCES:
                    state = stock_state[resource]
                    total = state["total"]

                    change = random.randint(-8, 8)
                    available = state["available"] + change
                    available = max(0, min(total, available))
                    used = total - available

                    state["available"] = available

                    maintenance = random.random() < 0.03
                    status = get_status(total, available, force_maintenance=maintenance)
                    
                    # Randomly assign to a department (50% in Hospital Shared Pool, rest distributed)
                    if random.random() < 0.5:
                        department = "Hospital Shared Pool"
                    else:
                        department = random.choice(DEPARTMENTS[1:])  # Pick from Emergency, OPD, Pediatrics

                    writer.writerow([
                        hospital_id,
                        current_date.strftime("%Y-%m-%d"),
                        department,
                        resource,
                        total,
                        available,
                        used,
                        status,
                    ])
                    total_rows += 1

    print("Generated resource dataset successfully")
    print(f"Output: {output_path}")
    print(f"Rows: {total_rows}")
    print(f"Hospitals: {args.hospitals}, Days: {args.days}, Resources/day: {len(RESOURCES)}")


if __name__ == "__main__":
    main()
