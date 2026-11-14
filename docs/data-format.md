# Data format (the contract between data, sensor and app)

Everyone codes against this file. If you need to change a field, say it in the group first and update this file in the same commit.

All files are JSON, UTF-8. The app reads them from `app/public/data/<region_id>/`.
The pipeline in `data/pipeline` writes them to `data/output/<region_id>/` and copies them there.

Units: rainfall and water in **mm**, temperature in **°C**, yield in **t/ha**, money in **MAD**.

---

## 1. `regions.json` (list of regions)

```json
[
  { "id": "chaouia", "name": "Chaouia (Settat)", "lat": 33.0, "lon": -7.62, "radius_km": 40 }
]
```

## 2. `<region_id>/climate_history.json`

One entry per **agricultural season**, labelled by its harvest year (season 2024 = Oct 2023 → Sep 2024).

```json
{
  "region_id": "chaouia",
  "source": "NASA POWER (MERRA-2 / GEOS), community AG, monthly",
  "baseline_period": [1991, 2005],
  "recent_period": [2010, 2024],
  "seasons": [
    {
      "year": 2024,
      "rain_season_mm": 310.5,     // Oct -> May rainfall
      "t_mean_c": 18.9,            // mean temperature over the season (Oct -> Sep)
      "t_max_spring_c": 24.1,      // mean daily max temperature Mar -> May (grain filling)
      "soil_wetness": 0.52         // root zone soil wetness, 0 = dry, 1 = saturated (Oct -> May)
    }
  ],
  "summary": {
    "baseline": { "rain_season_mm": 0, "t_mean_c": 0, "t_max_spring_c": 0, "soil_wetness": 0 },
    "recent":   { "rain_season_mm": 0, "t_mean_c": 0, "t_max_spring_c": 0, "soil_wetness": 0 }
  }
}
```

## 3. `<region_id>/recommendations.json`

```json
{
  "region_id": "chaouia",
  "generated_at": "2026-11-14T10:00:00Z",
  "method": "rule-based v1",
  "crops": [
    {
      "id": "wheat",
      "name": "Wheat",
      "system": "rainfed",                 // "rainfed" | "irrigated" | "perennial"
      "planting_window": "Nov - Dec",
      "harvest_window": "May - Jun",
      "water_need_mm": 450,
      "price_mad_per_kg": 3.0,
      "cost_mad_per_ha": 6000,
      "scenarios": {
        "baseline": { "score": 72, "yield_t_ha": { "low": 1.2, "mid": 1.8, "high": 2.4 }, "irrigation_mm": 120 },
        "recent":   { "score": 58, "yield_t_ha": { "low": 0.8, "mid": 1.3, "high": 1.9 }, "irrigation_mm": 190 },
        "dry_year": { "score": 31, "yield_t_ha": { "low": 0.3, "mid": 0.5, "high": 0.8 }, "irrigation_mm": 300 }
      },
      "score_change": -14,                 // recent.score - baseline.score
      "notes": "Sensitive to heat above 32 °C during grain filling (Apr - May)."
    }
  ]
}
```

- `score`: 0 to 100, how viable the crop is in that climate (higher = better).
- `yield_t_ha`: `low` / `high` = spread between bad and good years of the period, `mid` = typical year.
- `irrigation_mm`: extra water needed on top of rainfall to reach full yield (1 mm on 1 ha = 10 m³).
- `baseline` = 1991-2005 climate, `recent` = 2010-2024 climate (what to expect next season), `dry_year` = driest season of the recent period.

## 4. Sensor reading (`sensor_sample.json` or live endpoint)

What the ESP32 sends. The app accepts one object or an array of them.

```json
{
  "device_id": "field-01",
  "timestamp": "2026-11-14T10:00:00Z",
  "soil_moisture_pct": 23.5,   // volumetric water content, 0-100 %
  "temperature_c": 19.2,
  "battery_v": 3.9             // optional
}
```
