"""Summarize historical autumn rainfall onset for rainfed wheat and barley."""

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT))

from planting_ml import EXPECTED_YEARS, RAIN_THRESHOLD_MM, RAIN_WINDOW_DAYS, prepare_seasons, read_weather


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", default="settat", choices=("settat", "doukkala"))
    args = parser.parse_args()
    site_dir = PROJECT / "outputs" / args.site
    try:
        _, onset_dates = prepare_seasons(read_weather(site_dir / "climate_daily.csv"))
    except (OSError, KeyError, ValueError) as error:
        parser.exit(1, f"Could not build the planting outlook: {error}\n")

    counts = Counter(day.month for day in onset_dates.values() if day is not None)
    report = {
        "schema_version": "1.0",
        "site_id": args.site,
        "source": "NASA POWER",
        "mode": "historical_rainfall_indicator",
        "crop_ids": ["wheat", "barley"],
        "production_system": "rainfed",
        "threshold_mm": RAIN_THRESHOLD_MM,
        "window_days": RAIN_WINDOW_DAYS,
        "seasons": len(EXPECTED_YEARS),
        "onset_counts": {
            "October": counts[10],
            "November": counts[11],
            "December": counts[12],
            "No qualifying window": len(onset_dates) - sum(counts.values()),
        },
        "interpretation": "First autumn rainfall window meeting the threshold. Soil and crop conditions still determine suitability.",
    }
    path = site_dir / "planting_outlook.json"
    path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Historical planting outlook written to {path}")


if __name__ == "__main__":
    main()
