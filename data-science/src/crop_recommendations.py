"""Build historical rainfed wheat and barley recommendations for a pilot site."""

import argparse
import csv
import json
import math
from datetime import date, timedelta
from pathlib import Path
from statistics import fmean, median, quantiles

from nasa_power import POINTS_FILE, calendar_days, write_output


PROJECT = Path(__file__).resolve().parents[1]
WINDOW_START = (11, 1)
WINDOW_END = (12, 15)
REFERENCE_SOWING = (11, 15)
ONSET_THRESHOLD_MM = 25
ONSET_DAYS = 10
# A November 2025 sowing needs 2026 inputs to finish the modeled season.
SEASON_YEARS = range(2006, 2025)
# FAO-56 tables 11–12. Mediterranean winter wheat with non-frozen soil,
# and the generic 200-day November barley/oats/wheat profile for barley.
PROFILES = {
    "wheat": ((30, 140, 40, 30), (0.70, 1.15, 0.25)),
    "barley": ((40, 60, 60, 40), (0.30, 1.15, 0.25)),
}
SOURCES = {
    "sowing_calendar": "https://admin.ardna.org/files/contenus_files/ticket_file641196ed6f8cc-N891-R%C3%A9f%C3%A9rentiel-c%C3%A9r%C3%A9ales-MEP-HB-29_05_2017-%28final%29.pdf",
    "rainfall_threshold": "https://www.inra.org.ma/sites/default/files/publications/ouvrages/prediction1212.pdf",
    "reference_evapotranspiration": "https://www.fao.org/4/x0490e/x0490e07.htm",
    "crop_coefficients_and_stages": "https://www.fao.org/4/x0490e/x0490e0b.htm",
}


def reference_et(day, latitude_rad, low, high):
    """Daily Hargreaves ETo in mm, using FAO-56 equations 20–25 and 52."""
    angle = 2 * math.pi * day.timetuple().tm_yday / 365
    relative_distance = 1 + 0.033 * math.cos(angle)
    declination = 0.409 * math.sin(angle - 1.39)
    cosine = -math.tan(latitude_rad) * math.tan(declination)
    sunset_angle = math.acos(max(-1, min(1, cosine)))
    solar_energy = (24 * 60 / math.pi) * 0.0820 * relative_distance * (
        sunset_angle * math.sin(latitude_rad) * math.sin(declination)
        + math.cos(latitude_rad) * math.cos(declination) * math.sin(sunset_angle)
    )
    mean_temperature = (high + low) / 2
    return max(0.0, 0.0023 * (mean_temperature + 17.8) * math.sqrt(high - low) * 0.408 * solar_energy)


def load_weather(path, latitude):
    weather = {}
    latitude_rad = math.radians(latitude)
    with path.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            day = date.fromisoformat(row["date"])
            low = float(row["temperature_min_c"])
            high = float(row["temperature_max_c"])
            rain = float(row["precipitation_mm"])
            if day in weather or not all(math.isfinite(value) for value in (low, high, rain)):
                raise ValueError(f"Duplicate date or invalid reading on {day}.")
            if high < low or rain < 0:
                raise ValueError(f"Invalid temperature bounds or rainfall on {day}.")
            weather[day] = (rain, reference_et(day, latitude_rad, low, high))
    return weather


def first_planting_signal(weather, year):
    for day in calendar_days(date(year, *WINDOW_START), date(year, *WINDOW_END)):
        if math.fsum(weather[day - timedelta(days=i)][0] for i in range(ONSET_DAYS)) >= ONSET_THRESHOLD_MM:
            return day
    return None


def daily_crop_coefficients(stage_lengths, coefficients):
    initial, development, mid, late = stage_lengths
    kc_initial, kc_mid, kc_end = coefficients
    return (
        [kc_initial] * initial
        + [kc_initial + (kc_mid - kc_initial) * (i + 0.5) / development for i in range(development)]
        + [kc_mid] * mid
        + [kc_mid + (kc_end - kc_mid) * (i + 0.5) / late for i in range(late)]
    )


def summarize_crop(template, weather, signals):
    stage_lengths, coefficients = PROFILES[template["crop_id"]]
    daily_kc = daily_crop_coefficients(stage_lengths, coefficients)
    season_demands, season_rains, season_scores = [], [], []
    for year, signal in signals.items():
        start = date(year, *REFERENCE_SOWING)
        days = [weather[start + timedelta(days=i)] for i in range(len(daily_kc))]
        demand = math.fsum(eto * kc for (_, eto), kc in zip(days, daily_kc))
        if demand <= 0:
            raise ValueError(f"Zero potential crop water demand for the {year} season.")
        rain = math.fsum(rain for rain, _ in days)
        season_demands.append(demand)
        season_rains.append(rain)
        season_scores.append(min(rain / demand, 1.0) if signal else 0.0)

    signal_offsets = [(day - date(day.year, *WINDOW_START)).days for day in signals.values() if day]
    median_signal = None
    if signal_offsets:
        typical_day = date(2000, *WINDOW_START) + timedelta(days=int(median(signal_offsets)))
        median_signal = typical_day.strftime("%m-%d")
    p10, *_, p90 = quantiles(season_demands, n=10, method="inclusive")
    return {
        **template,
        "suitability_score": round(100 * fmean(season_scores), 1),
        "planting_window": {
            "start_mm_dd": date(2000, *WINDOW_START).strftime("%m-%d"),
            "end_mm_dd": date(2000, *WINDOW_END).strftime("%m-%d"),
            "basis": "regional_rainfed_cereal_calendar_with_historical_rainfall_context",
            "seasons_with_rainfall_signal": len(signal_offsets),
            "seasons_evaluated": len(signals),
            "median_signal_mm_dd": median_signal,
        },
        "crop_water_demand_mm": round(median(season_demands), 1),
        "water_estimate": {
            "type": "potential_crop_evapotranspiration_mm_per_season",
            "median_gross_rainfall_mm": round(median(season_rains), 1),
            "historical_p10_mm": round(p10, 1),
            "historical_p90_mm": round(p90, 1),
            "reference_sowing_mm_dd": date(2000, *REFERENCE_SOWING).strftime("%m-%d"),
            "stage_days_initial_development_mid_late": list(stage_lengths),
            "kc_initial_mid_end": list(coefficients),
        },
        "reasons": [
            "Score measures historical rainfed climate suitability using a sowing rainfall signal and gross seasonal rainfall relative to crop water demand.",
            "Seasonal water demand uses temperature-based Hargreaves reference ET and FAO-56 crop coefficients under standard growing conditions.",
            "Net irrigation and yield estimates require field and soil data for the selected production system.",
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    points = json.loads(POINTS_FILE.read_text(encoding="utf-8"))["features"]
    sites = {point["properties"]["site_id"]: point for point in points}
    parser.add_argument("--site", choices=sites, required=True)
    args = parser.parse_args()
    site_dir = PROJECT / "outputs" / args.site
    site = sites[args.site]
    longitude, latitude = site["geometry"]["coordinates"]
    try:
        weather = load_weather(site_dir / "climate_daily.csv", latitude)
        climate = json.loads((site_dir / "climate_summary.json").read_text(encoding="utf-8"))
        if climate["site_id"] != args.site:
            raise ValueError("Climate summary does not match the selected site.")
        signals = {year: first_planting_signal(weather, year) for year in SEASON_YEARS}
        report = json.loads((PROJECT / "contracts" / "recommendations.example.json").read_text(encoding="utf-8"))
        report.update({
            "site_id": args.site,
            "site": {"name": site["properties"]["site_name"], "latitude": latitude, "longitude": longitude},
            "climate": climate["climate"],
            "crops": [summarize_crop(crop, weather, signals) for crop in report["crops"] if crop["crop_id"] in PROFILES],
            "methodology": {
                "scenario": "rainfed_annual_cereals",
                "score_basis": "Mean across seasons of 100 × min(gross seasonal rain / potential crop ET, 1) in seasons with a sowing signal. Otherwise 0.",
                "sowing_signal": {"threshold_mm": ONSET_THRESHOLD_MM, "consecutive_days": ONSET_DAYS},
                "sowing_years": [SEASON_YEARS.start, SEASON_YEARS.stop - 1],
                "sources": SOURCES,
            },
            "notes": [
                "The window represents a rainfed cereal scenario at the reference point. Use crop variety, field moisture, and current weather to choose a sowing date.",
                "The score uses gross rainfall as a proxy; soil storage, runoff and effective rainfall are unavailable. It is a screening score rather than a probability of crop success.",
                "Crop stage lengths and coefficients are generic FAO profiles. Hargreaves has not been calibrated locally for these pilots.",
            ],
        })
        output = site_dir / "recommendations.json"
        write_output(output, lambda stream: json.dump(report, stream, indent=2, ensure_ascii=False, allow_nan=False))
    except KeyError as error:
        parser.exit(1, f"Missing required weather date or input field for {args.site}: {error}\n")
    except (OSError, ValueError) as error:
        parser.exit(1, f"Could not build recommendations for {args.site}: {error}\n")
    print(f"Recommendations written to {output}")


if __name__ == "__main__":
    main()
