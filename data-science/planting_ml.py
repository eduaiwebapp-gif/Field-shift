"""Train an autumn rainfall-onset model for one NASA POWER site at a time."""

import argparse
import csv
import json
import math
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path

import numpy as np


RAIN_WINDOW_DAYS = 10
RAIN_THRESHOLD_MM = 25.0
FORECAST_DAYS = 14
TEST_START_YEAR = 2021
EXPECTED_YEARS = range(2006, 2026)
SITE_CONFIG = Path(__file__).resolve().parent / "contracts" / "pilot_points.geojson"


@dataclass(frozen=True)
class Sample:
    as_of: date
    autumn_day: int
    recent_rain_mm: float
    recent_temperature_c: float
    event_within_horizon: bool


def read_weather(path):
    weather = {}
    with path.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            day = date.fromisoformat(row["date"])
            if day.year not in EXPECTED_YEARS or day.month < 10:
                continue
            if day in weather:
                raise ValueError(f"Duplicate weather date: {day}")
            rain = float(row["precipitation_mm"])
            temperature = float(row["temperature_mean_c"])
            if rain < 0 or not (math.isfinite(rain) and math.isfinite(temperature)):
                raise ValueError(f"Invalid weather values on {day}")
            weather[day] = (rain, temperature)
    return weather


def prepare_seasons(weather):
    samples, onset_dates = [], {}
    window = np.ones(RAIN_WINDOW_DAYS)
    for year in EXPECTED_YEARS:
        start = date(year, 10, 1)
        end = date(year, 12, 31)
        dates = [start + timedelta(days=offset) for offset in range((end - start).days + 1)]
        readings = [weather[day] for day in dates]
        rainfall, temperature = np.asarray(readings).T
        rain_sums = np.convolve(rainfall, window, mode="valid").round(6)
        temperature_means = np.convolve(temperature, window / RAIN_WINDOW_DAYS, mode="valid")
        window_end_dates = dates[RAIN_WINDOW_DAYS - 1 :]
        hits = np.flatnonzero(rain_sums >= RAIN_THRESHOLD_MM)
        onset_dates[year] = window_end_dates[hits[0]] if hits.size else None

        for index, as_of in enumerate(window_end_dates):
            forecast_end = as_of + timedelta(days=FORECAST_DAYS)
            onset = onset_dates[year]
            if forecast_end > end or (onset is not None and onset <= as_of):
                break
            samples.append(Sample(
                as_of=as_of,
                autumn_day=(as_of - start).days + 1,
                recent_rain_mm=float(rain_sums[index]),
                recent_temperature_c=float(temperature_means[index]),
                event_within_horizon=onset is not None and onset <= forecast_end,
            ))
    return samples, onset_dates


def feature_matrix(samples):
    return np.array([
        (sample.autumn_day, math.log1p(sample.recent_rain_mm), sample.recent_temperature_c)
        for sample in samples
    ])


def sigmoid(logits):
    return 1 / (1 + np.exp(-np.clip(logits, -60, 60)))


def fit_and_predict(train, holdout):
    """Fit L2-regularized logistic regression with a train-only scaler."""
    features = feature_matrix(train)
    target = np.asarray([sample.event_within_horizon for sample in train], dtype=float)
    if np.unique(target).size < 2:
        raise ValueError("Training requires both positive and negative rainfall outcomes.")
    mean = features.mean(axis=0)
    std = features.std(axis=0)
    std[std == 0] = 1
    design = np.column_stack((np.ones(len(train)), (features - mean) / std))
    penalty = np.diag([0, 0.02, 0.02, 0.02])
    weights = np.zeros(design.shape[1])
    for _ in range(50):
        probability = sigmoid(design @ weights)
        gradient = design.T @ (probability - target) / len(train) + penalty @ weights
        variance = probability * (1 - probability)
        curvature = (design.T * variance) @ design / len(train) + penalty
        step = np.linalg.solve(curvature, gradient)
        weights -= step
        if np.max(np.abs(step)) < 1e-8:
            break
    else:
        raise ValueError("Logistic model did not converge.")

    test_design = np.column_stack((np.ones(len(holdout)), (feature_matrix(holdout) - mean) / std))
    return sigmoid(test_design @ weights)


def historical_probabilities(train, holdout):
    """Estimate the same-date historical event rate among eligible seasons."""
    counts = {}
    for sample in train:
        events, eligible = counts.get(sample.autumn_day, (0, 0))
        counts[sample.autumn_day] = (events + int(sample.event_within_horizon), eligible + 1)
    probabilities = []
    for sample in holdout:
        events, eligible = counts.get(sample.autumn_day, (0, 0))
        probabilities.append((events + 1) / (eligible + 2))
    return np.asarray(probabilities)


def evaluate(samples, onset_dates, site_id):
    train = [sample for sample in samples if sample.as_of.year < TEST_START_YEAR]
    holdout = [sample for sample in samples if sample.as_of.year >= TEST_START_YEAR]
    predictions = fit_and_predict(train, holdout)
    baseline = historical_probabilities(train, holdout)
    forecasts = {year: [] for year in EXPECTED_YEARS if year >= TEST_START_YEAR}
    errors = {year: [] for year in forecasts}
    for sample, ml, historical in zip(holdout, predictions, baseline):
        actual = sample.event_within_horizon
        year = sample.as_of.year
        errors[year].append(((float(ml) - actual) ** 2, (float(historical) - actual) ** 2))
        forecasts[year].append({
            "as_of": sample.as_of.isoformat(),
            "forecast_through": (sample.as_of + timedelta(days=FORECAST_DAYS)).isoformat(),
            "past_10_day_rainfall_mm": round(sample.recent_rain_mm, 2),
            "past_10_day_mean_temperature_c": round(sample.recent_temperature_c, 2),
            "ml_probability": round(float(ml), 4),
            "historical_probability": round(float(historical), 4),
            "observed_event": actual,
        })

    per_season = [np.mean(season_errors, axis=0) for season_errors in errors.values() if season_errors]
    ml_brier, historical_brier = np.mean(per_season, axis=0)
    primary_field = "ml_probability" if ml_brier < historical_brier else "historical_probability"
    return {
        "schema_version": "1.0",
        "site_id": site_id,
        "source": "NASA POWER",
        "mode": "historical_replay",
        "time_standard": "UTC",
        "as_of_timing": "End of the given day. The next 14 days start on the following day.",
        "target": "First autumn 10-day rainfall total at or above 25 mm within the next 14 days",
        "threshold_source": "https://www.inra.org.ma/sites/default/files/publications/ouvrages/prediction1212.pdf",
        "autumn_period": "October 1 through December 31",
        "rain_window_days": RAIN_WINDOW_DAYS,
        "rain_threshold_mm": RAIN_THRESHOLD_MM,
        "forecast_horizon_days": FORECAST_DAYS,
        "model": "L2-regularized logistic regression",
        "features": ["day_of_autumn", "log1p_past_10_day_rainfall_mm", "past_10_day_mean_temperature_c"],
        "baseline": "Same-date historical event rates with Laplace smoothing",
        "primary_probability_field": primary_field,
        "evaluation": {
            "training_years": [EXPECTED_YEARS.start, TEST_START_YEAR - 1],
            "holdout_years": [TEST_START_YEAR, EXPECTED_YEARS.stop - 1],
            "training_rows": len(train),
            "holdout_rows": len(holdout),
            "holdout_seasons_scored": len(per_season),
            "brier_score_aggregation": "Mean of season-level Brier scores. Lower is better.",
            "ml_brier_score": round(float(ml_brier), 5),
            "historical_brier_score": round(float(historical_brier), 5),
        },
        "replay": [
            {
                "year": year,
                "observed_first_rain_date": onset_dates[year].isoformat() if onset_dates[year] else None,
                "forecasts": rows,
            }
            for year, rows in forecasts.items()
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    points = json.loads(SITE_CONFIG.read_text(encoding="utf-8"))["features"]
    sites = [feature["properties"]["site_id"] for feature in points]
    parser.add_argument("--site", choices=sites, default="settat")
    parser.add_argument("--daily-csv", type=Path, help="Defaults to outputs/<site>/climate_daily.csv.")
    parser.add_argument("--output", type=Path, help="Defaults to outputs/<site>/planting_ml.json.")
    args = parser.parse_args()
    site_dir = Path("outputs") / args.site
    args.daily_csv = args.daily_csv or site_dir / "climate_daily.csv"
    args.output = args.output or site_dir / "planting_ml.json"
    if args.daily_csv.resolve() == args.output.resolve():
        parser.error("Choose an output path that is different from the weather CSV.")

    try:
        samples, onset_dates = prepare_seasons(read_weather(args.daily_csv))
        report = evaluate(samples, onset_dates, args.site)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    except KeyError as error:
        parser.exit(1, f"Missing weather date or CSV column: {error}\n")
    except (OSError, ValueError) as error:
        parser.exit(1, f"Could not evaluate the {args.site} rain model: {error}\n")

    evaluation = report["evaluation"]
    print(f"{args.site} historical rainfall outlook written to {args.output}")
    print(f"Brier score: ML {evaluation['ml_brier_score']:.3f}, historical baseline "
          f"{evaluation['historical_brier_score']:.3f} (lower is better).")


if __name__ == "__main__":
    main()
