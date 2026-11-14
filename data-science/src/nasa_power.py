"""Download NASA POWER daily data and summarize a pilot site's climate."""

import argparse
import csv
import json
import math
import sys
from calendar import monthrange
from collections.abc import Iterator
from datetime import date, timedelta
from pathlib import Path
from statistics import fmean, linear_regression
from tempfile import NamedTemporaryFile
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen


API_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
POINTS_FILE = Path(__file__).resolve().parents[1] / "contracts" / "pilot_points.geojson"
PARAMETERS = {
    "T2M": ("temperature_mean_c", {"c": 1, "degc": 1, "°c": 1}),
    "T2M_MIN": ("temperature_min_c", {"c": 1, "degc": 1, "°c": 1}),
    "T2M_MAX": ("temperature_max_c", {"c": 1, "degc": 1, "°c": 1}),
    "PRECTOTCORR": ("precipitation_mm", {"mm/day": 1, "mm/d": 1}),
    "RH2M": ("relative_humidity_pct", {"%": 1}),
    "T2MDEW": ("dewpoint_c", {"c": 1, "degc": 1, "°c": 1}),
    "ALLSKY_SFC_SW_DWN": (
        "solar_radiation_mj_m2_day",
        {"mj/m^2/day": 1, "mj/m^2/d": 1, "kw-hr/m^2/day": 3.6, "kwh/m^2/day": 3.6},
    ),
    "WS2M": ("wind_speed_2m_m_s", {"m/s": 1, "m/sec": 1}),
    "PS": ("surface_pressure_kpa", {"kpa": 1}),
}
CORE_PARAMETERS = ("T2M", "T2M_MIN", "T2M_MAX", "PRECTOTCORR")
SEASON_MONTHS = {
    "DJF": (12, 2),
    "MAM": (3, 5),
    "JJA": (6, 8),
    "SON": (9, 11),
}


def calendar_days(start: date, end: date) -> Iterator[date]:
    for offset in range((end - start).days + 1):
        yield start + timedelta(days=offset)


def fetch_power(longitude, latitude, start, end, parameters):
    query = urlencode({
        "parameters": ",".join(parameters),
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start.strftime("%Y%m%d"),
        "end": end.strftime("%Y%m%d"),
        "format": "JSON",
        "time-standard": "UTC",
    })
    url = f"{API_URL}?{query}"
    with urlopen(url, timeout=40) as response:
        return json.load(response)


def normalize_power(payload, longitude, latitude, dates, parameters):
    if payload["geometry"]["type"] != "Point":
        raise ValueError("NASA POWER input must be a daily point response.")
    response_longitude, response_latitude, *_ = payload["geometry"]["coordinates"]
    if not (
        math.isclose(response_longitude, longitude, abs_tol=0.01)
        and math.isclose(response_latitude, latitude, abs_tol=0.01)
    ):
        raise ValueError("NASA POWER coordinates do not match the selected pilot point.")

    header = payload["header"]
    time_standard = header["time_standard"]
    if time_standard != "UTC":
        raise ValueError("Use a NASA POWER response downloaded with time-standard=UTC.")
    fill_value = float(header["fill_value"])
    series = payload["properties"]["parameter"]
    keys = [day.strftime("%Y%m%d") for day in dates]
    if header["start"] > keys[0] or header["end"] < keys[-1]:
        raise ValueError("NASA POWER input does not cover the requested dates. Check --start and --end.")
    rows = [{"date": day.isoformat()} for day in dates]
    metadata = {}
    for parameter in parameters:
        column, conversions = PARAMETERS[parameter]
        units = payload["parameters"][parameter]["units"]
        canonical_units = units.casefold().replace(" ", "").replace("²", "^2")
        if canonical_units not in conversions:
            raise ValueError(f"Unexpected NASA POWER unit for {parameter}: {units!r}")
        factor = conversions[canonical_units]
        values = series[parameter]
        valid_count = 0
        for key, row in zip(keys, rows):
            value = values.get(key)
            if value is None or value == fill_value:
                row[column] = None
                continue
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError(f"Invalid {parameter} reading on {key}: {value!r}")
            if not math.isfinite(value):
                raise ValueError(f"Non-finite {parameter} reading on {key}.")
            if parameter == "PRECTOTCORR" and value < 0:
                raise ValueError(f"Negative daily precipitation on {key}.")
            row[column] = round(value * factor, 6)
            valid_count += 1
        metadata[parameter] = {"source_units": units, "valid_days": valid_count}
        if parameter in ("T2M", "PRECTOTCORR") and valid_count == 0:
            raise ValueError(f"No usable {parameter} values in the requested date range.")

    for row in rows:
        minimum, maximum = row["temperature_min_c"], row["temperature_max_c"]
        if minimum is not None and maximum is not None and minimum > maximum:
            raise ValueError(f"Minimum temperature exceeds maximum on {row['date']}.")

    return rows, {
        "time_standard": time_standard,
        "parameters": metadata,
        "source_datasets": header.get("sources", []),
        "response_coordinates_lon_lat": [response_longitude, response_latitude],
    }


def period_stats(rows):
    temperatures = [row["temperature_mean_c"] for row in rows]
    precipitation = [row["precipitation_mm"] for row in rows]
    temperature_days = sum(value is not None for value in temperatures)
    precipitation_days = sum(value is not None for value in precipitation)
    return {
        "expected_days": len(rows),
        "valid_temperature_days": temperature_days,
        "valid_precipitation_days": precipitation_days,
        "mean_temperature_c": fmean(temperatures) if temperature_days == len(rows) else None,
        "total_precipitation_mm": math.fsum(precipitation) if precipitation_days == len(rows) else None,
    }


def yearly_trend(annual, metric):
    complete = [(record["year"], record[metric]) for record in annual if record[metric] is not None]
    if len(complete) < 3:
        return {"slope_per_decade": None, "years_used": len(complete)}
    years, values = zip(*complete)
    slope, _ = linear_regression(years, values)
    return {"slope_per_decade": round(slope * 10, 3), "years_used": len(complete)}


def summarize(rows, start, end):
    by_date = {date.fromisoformat(row["date"]): row for row in rows}
    annual = []
    seasonal = []
    for year in range(start.year, end.year + 1):
        year_start, year_end = date(year, 1, 1), date(year, 12, 31)
        if start <= year_start and year_end <= end:
            values = [by_date[day] for day in calendar_days(year_start, year_end)]
            annual.append({"year": year, **period_stats(values)})

        for season, (first_month, last_month) in SEASON_MONTHS.items():
            first_year = year - 1 if season == "DJF" else year
            season_start = date(first_year, first_month, 1)
            season_end = date(year, last_month, monthrange(year, last_month)[1])
            if start <= season_start and season_end <= end:
                values = [by_date[day] for day in calendar_days(season_start, season_end)]
                seasonal.append({"season": season, "year": year, **period_stats(values)})

    trends = {
        "method": "ordinary_least_squares_complete_calendar_years",
        "temperature_c": yearly_trend(annual, "mean_temperature_c"),
        "precipitation_mm": yearly_trend(annual, "total_precipitation_mm"),
    }
    return {"annual": annual, "seasonal": seasonal, "trends_per_decade": trends}


def write_output(path, write):
    temporary_path = None
    try:
        with NamedTemporaryFile(mode="w", encoding="utf-8", newline="", dir=path.parent, delete=False) as stream:
            temporary_path = Path(stream.name)
            write(stream)
        temporary_path.replace(path)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def write_csv(stream, rows):
    writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows(rows)


def climate_point(feature, climate):
    annual = climate["annual"]
    temperatures = [r["mean_temperature_c"] for r in annual if r["mean_temperature_c"] is not None]
    rainfall = [r["total_precipitation_mm"] for r in annual if r["total_precipitation_mm"] is not None]
    trends = climate["trends_per_decade"]
    properties = {
        **feature["properties"],
        "climate_source": climate["source"],
        "spatial_support": climate["spatial_support"],
        "period_start": climate["period_start"],
        "period_end": climate["period_end"],
        "mean_annual_temperature_c": round(fmean(temperatures), 2) if temperatures else None,
        "mean_annual_precipitation_mm": round(fmean(rainfall), 1) if rainfall else None,
        "temperature_trend_c_decade": trends["temperature_c"]["slope_per_decade"],
        "precipitation_trend_mm_decade": trends["precipitation_mm"]["slope_per_decade"],
        "temperature_years_used": len(temperatures),
        "precipitation_years_used": len(rainfall),
    }
    point = {**feature, "properties": properties}
    return {"type": "FeatureCollection", "features": [point]}


def run(args, feature):
    longitude, latitude = feature["geometry"]["coordinates"]
    if args.input_json:
        payload = json.loads(args.input_json.read_text(encoding="utf-8-sig"))
        available = payload["properties"]["parameter"]
        parameters = [parameter for parameter in PARAMETERS if parameter in available]
        missing = set(CORE_PARAMETERS).difference(parameters)
        if missing:
            raise ValueError(f"Input lacks the required series: {', '.join(sorted(missing))}")
    else:
        parameters = CORE_PARAMETERS if args.core_only else list(PARAMETERS)
        payload = fetch_power(longitude, latitude, args.start, args.end, parameters)

    dates = list(calendar_days(args.start, args.end))
    rows, metadata = normalize_power(payload, longitude, latitude, dates, parameters)
    climate = {
        "source": "NASA POWER",
        "source_url": API_URL,
        "input_mode": "saved_api_response" if args.input_json else "api",
        "spatial_support": "gridded_point_reference",
        "period_start": args.start.isoformat(),
        "period_end": args.end.isoformat(),
        "expected_days": len(dates),
        **metadata,
        **summarize(rows, args.start, args.end),
    }
    summary = {"schema_version": "1.0", "site_id": args.site, "climate": climate}
    args.output_dir.mkdir(parents=True, exist_ok=True)
    write_output(args.output_dir / "nasa_power_raw.json", lambda stream: json.dump(payload, stream))
    write_output(args.output_dir / "climate_daily.csv", lambda stream: write_csv(stream, rows))
    write_output(
        args.output_dir / "climate_summary.json",
        lambda stream: json.dump(summary, stream, indent=2, allow_nan=False),
    )
    write_output(
        args.output_dir / "climate_point.geojson",
        lambda stream: json.dump(climate_point(feature, climate), stream, indent=2, allow_nan=False),
    )
    print(f"{args.site}: {len(dates):,} calendar days processed. Output: {args.output_dir.resolve()}")


def main():
    features = json.loads(POINTS_FILE.read_text(encoding="utf-8"))["features"]
    sites = {feature["properties"]["site_id"]: feature for feature in features}
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", choices=sites, default="settat")
    parser.add_argument("--start", type=date.fromisoformat, default=date(2006, 1, 1))
    parser.add_argument("--end", type=date.fromisoformat, default=date(2025, 12, 31))
    parser.add_argument("--output-dir", type=Path, help="Output directory. Defaults to outputs/<site>.")
    inputs = parser.add_mutually_exclusive_group()
    inputs.add_argument("--input-json", type=Path, help="Use a saved NASA POWER daily point response.")
    inputs.add_argument("--core-only", action="store_true", help="Fetch temperature and precipitation only.")
    args = parser.parse_args()
    if args.start < date(1981, 1, 1):
        parser.error("NASA POWER daily meteorology begins in 1981")
    if args.end < args.start:
        parser.error("--end must be on or after --start")
    if args.output_dir is None:
        args.output_dir = Path("outputs") / args.site

    try:
        run(args, sites[args.site])
    except (URLError, TimeoutError) as error:
        print(f"NASA POWER request failed: {error}. Use --input-json with a saved response.", file=sys.stderr)
        return 1
    except (OSError, KeyError, TypeError, ValueError) as error:
        print(f"Could not build the climate outputs: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
