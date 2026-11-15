# Rainfall cross-check for Settat and Sidi Bennour

Results from the data scientist's Python pipeline. The script below runs inside that pipeline (it imports its `crop_recommendations` and `nasa_power` modules), so it is kept here for reference with its inputs and outputs.

```powershell
python -m pip install -r requirements.txt pandas matplotlib
python .\src\validate_rainfall.py
```

The script writes `rainfall_comparison.csv` and `rainfall_comparison.png` to
`outputs/rainfall_validation/`. Use `--output-dir` to choose another destination.

## Daily rainfall inputs

| Source | File | Data |
| --- | --- | --- |
| NASA POWER | `outputs/<site_id>/climate_daily.csv` | `PRECTOTCORR` in mm per UTC day from the existing pipeline |
| UCSB CHIRPS v2 | `validation/chirps_daily.csv` | Daily precipitation in mm from ClimateSERV, keyed by site ID and date |

ClimateSERV returned 1,704 values per site from October 1, 2020, to May 31,
2025. The export was retrieved on November 15, 2026. It uses dataset 0
(UCSB CHIRPS Rainfall), interval 0 (daily), and operation 5 (average).
Each query used a 0.01° square inside the CHIRPS 0.05° grid cell containing
the site in `contracts/pilot_points.geojson`.

| Site | Request bounding box (west, south, east, north) |
| --- | --- |
| Settat | `-7.630, 33.020, -7.620, 33.030` |
| Sidi Bennour | `-8.430, 32.670, -8.420, 32.680` |

[NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) ·
[UCSB CHIRPS v2](https://www.chc.ucsb.edu/data/chirps) ·
[ClimateSERV API](https://climateserv.servirglobal.net/develop-api)

## Comparison method

- Match daily values by site and calendar date. A season labeled 2024/25
  covers October 1, 2024, to May 31, 2025. The CSV records expected, valid,
  and paired day counts. A seasonal total requires a value for every day.
- Find the first 10-day window ending in October–December with at least 25 mm
  of rain. Report the ending date. A separate yes/no field checks for a
  qualifying 10-day window ending from November 1 to December 15.
- Signed differences are NASA POWER minus CHIRPS. The chart shows the mean
  absolute gap between complete seasonal totals and the number of matching
  sowing signals among seasons with a result from both sources.
- This check measures agreement between two gridded products for the selected
  sites and seasons. Different grid footprints and daily time conventions can
  affect the comparison, particularly first-rain dates.
