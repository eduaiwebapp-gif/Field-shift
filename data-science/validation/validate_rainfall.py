"""Compare NASA POWER and CHIRPS daily rainfall at the SeasonReplay pilot sites."""

import argparse
import json
from datetime import date
from pathlib import Path

import matplotlib
import pandas as pd

from crop_recommendations import ONSET_DAYS, ONSET_THRESHOLD_MM, WINDOW_END, WINDOW_START
from nasa_power import POINTS_FILE, write_output

matplotlib.use("Agg")

from matplotlib import pyplot as plt


PROJECT = Path(__file__).resolve().parents[1]
SOWING_YEARS = range(2020, 2025)
SOURCES = {
    "nasa_power": ("NASA POWER", "#126764"),
    "chirps": ("CHIRPS v2", "#C76A2D"),
}


def daily_rainfall(frame, label):
    dates = pd.to_datetime(frame["date"], format="%Y-%m-%d", errors="raise")
    if dates.isna().any() or dates.duplicated().any():
        raise ValueError(f"{label} contains a blank or duplicate date.")
    rain = pd.to_numeric(frame["precipitation_mm"], errors="raise").astype(float)
    valid = rain.between(0, float("inf"), inclusive="left")
    return pd.Series(rain.where(valid).to_numpy(), index=dates)


def indicators(rainfall, year):
    autumn = rainfall.loc[:date(year, 12, 31).isoformat()]
    window_totals = autumn.rolling(ONSET_DAYS).sum().round(6)
    hits = window_totals[window_totals.ge(ONSET_THRESHOLD_MM)]
    onset = hits.index[0].date() if autumn.notna().all() and not hits.empty else None
    status = "incomplete" if autumn.isna().any() else "detected" if onset else "not_detected"
    sowing = window_totals.loc[date(year, *WINDOW_START).isoformat():date(year, *WINDOW_END).isoformat()]
    return {
        "rainfall_mm": rainfall.sum(min_count=len(rainfall)),
        "valid_days": int(rainfall.count()),
        "autumn_onset": onset,
        "autumn_onset_status": status,
        "sowing_signal": bool(sowing.ge(ONSET_THRESHOLD_MM).any()) if sowing.notna().all() else None,
    }


def compare_sites(chirps_csv):
    chirps = pd.read_csv(chirps_csv, usecols=["site_id", "date", "precipitation_mm"])
    sites = json.loads(POINTS_FILE.read_text(encoding="utf-8"))["features"]
    expected_sites = {site["properties"]["site_id"] for site in sites}
    if set(chirps["site_id"]) != expected_sites:
        raise ValueError("The CHIRPS CSV must contain the site IDs listed in pilot_points.geojson.")

    rows = []
    for site in sites:
        site_id = site["properties"]["site_id"]
        nasa_csv = PROJECT / "outputs" / site_id / "climate_daily.csv"
        daily = {
            "nasa_power": daily_rainfall(pd.read_csv(nasa_csv), str(nasa_csv)),
            "chirps": daily_rainfall(chirps.loc[chirps["site_id"].eq(site_id)], f"CHIRPS {site_id}"),
        }
        for year in SOWING_YEARS:
            dates = pd.date_range(date(year, 10, 1), date(year + 1, 5, 31), freq="D")
            aligned = pd.DataFrame(daily, index=dates)
            nasa = indicators(aligned["nasa_power"], year)
            reference = indicators(aligned["chirps"], year)
            onset_dates = (nasa["autumn_onset"], reference["autumn_onset"])
            signals = (nasa["sowing_signal"], reference["sowing_signal"])
            row = {
                "site_id": site_id,
                "site_name": site["properties"]["site_name"],
                "season": f"{year}/{(year + 1) % 100:02}",
                "period_start": dates[0].date(),
                "period_end": dates[-1].date(),
                "expected_days": len(dates),
                "paired_days": int(aligned.notna().all(axis=1).sum()),
            }
            for source, statistics in (("nasa_power", nasa), ("chirps", reference)):
                row.update({f"{source}_{key}": value for key, value in statistics.items()})
            row["nasa_minus_chirps_mm"] = nasa["rainfall_mm"] - reference["rainfall_mm"]
            row["nasa_minus_chirps_onset_days"] = (
                (onset_dates[0] - onset_dates[1]).days if all(onset_dates) else None
            )
            row["sowing_signal_agreement"] = signals[0] == signals[1] if None not in signals else None
            rows.append(row)
    return pd.DataFrame(rows)


def draw_chart(results, path):
    ink = "#1B332F"
    muted = "#4D615D"
    groups = list(results.groupby("site_name", sort=False))
    figure, axes = plt.subplots(1, len(groups), sharey=True, squeeze=False, figsize=(13.33, 7.5))
    figure.subplots_adjust(left=0.086, right=0.967, bottom=0.21, top=0.674, wspace=0.17)
    try:
        for ax, (site, readings) in zip(axes[0], groups):
            positions = list(range(len(readings)))
            for offset, (source, (label, color)) in zip((-0.18, 0.18), SOURCES.items()):
                values = readings[f"{source}_rainfall_mm"]
                bars = ax.bar([i + offset for i in positions], values, 0.34, label=label, color=color)
                labels = [f"{value:.0f}" if pd.notna(value) else "" for value in values]
                ax.bar_label(bars, labels=labels, padding=4, fontsize=10, color=ink)
            ax.set_xticks(positions, readings["season"], fontsize=11, color=ink)
            ax.tick_params(axis="both", length=0, colors=muted, labelsize=11)
            ax.grid(axis="y", color="#DCE5E1", linewidth=0.8)
            ax.set_axisbelow(True)
            ax.spines[["top", "right", "left"]].set_visible(False)
            ax.spines["bottom"].set_color("#B4C7C0")
            ax.margins(y=0.14)

            gaps = readings["nasa_minus_chirps_mm"].dropna()
            signals = readings["sowing_signal_agreement"].dropna()
            mean_gap = f"{gaps.abs().mean():.0f} mm" if len(gaps) else "unavailable"
            agreement = f"{signals.sum()}/{len(signals)}" if len(signals) else "unavailable"
            ax.text(0, 1.18, site, transform=ax.transAxes, fontsize=20, fontweight="bold", color=ink)
            ax.text(
                0, 1.075, f"Mean absolute gap {mean_gap}    /    Sowing signal agreement {agreement}",
                transform=ax.transAxes, fontsize=11, color=muted,
            )
            print(f"{site}: {len(gaps)} paired seasons, mean absolute gap {mean_gap}, sowing agreement {agreement}")

        axes[0][0].set_ylabel("Rainfall (mm)", fontsize=12, color=ink)
        axes[0][0].set_ylim(bottom=0)
        figure.text(0.086, 0.923, "NASA POWER and CHIRPS rainfall", fontsize=29, color=ink, fontweight="bold")
        figure.text(0.086, 0.874, "October–May totals for five crop seasons", fontsize=14, color=muted)
        handles, labels = axes[0][0].get_legend_handles_labels()
        figure.legend(handles, labels, loc="upper left", bbox_to_anchor=(0.08, 0.842),
                      ncol=2, frameon=False, fontsize=12, labelcolor=ink)
        figure.text(
            0.086, 0.105, "Sowing agreement counts seasons with the same result for the 25 mm in 10 days rule, November 1–December 15.",
            fontsize=10, color=muted,
        )
        figure.text(
            0.086, 0.062, "Daily rainfall from NASA POWER PRECTOTCORR and UCSB CHIRPS v2 via ClimateSERV.",
            fontsize=10, color=muted,
        )
        figure.savefig(path, dpi=225, facecolor="white")
    finally:
        plt.close(figure)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chirps-csv", type=Path, default=PROJECT / "validation" / "chirps_daily.csv")
    parser.add_argument("--output-dir", type=Path, default=PROJECT / "outputs" / "rainfall_validation")
    args = parser.parse_args()

    try:
        results = compare_sites(args.chirps_csv)
        args.output_dir.mkdir(parents=True, exist_ok=True)
        path = args.output_dir / "rainfall_comparison.csv"
        draw_chart(results, args.output_dir / "rainfall_comparison.png")
        write_output(path, lambda stream: results.to_csv(stream, index=False, float_format="%.2f"))
    except (OSError, KeyError, ValueError) as error:
        parser.exit(1, f"Could not compare rainfall: {error}\n")
    print(f"Comparison saved to {args.output_dir.resolve()}")


if __name__ == "__main__":
    main()
