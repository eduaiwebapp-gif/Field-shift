# Planting rainfall · ML prototype

Run from the nasa_app folder. The script uses the NASA POWER daily CSV under
outputs/<site>/climate_daily.csv. NumPy is the only external dependency.

    python -m pip install -r requirements.txt
    python .\planting_ml.py --site settat

The command writes `outputs/settat/planting_ml.json`. Run it with `--site doukkala`
to train the separate Sidi Bennour model and write `outputs/doukkala/planting_ml.json`.
Both datasets and evaluation outputs are included.

## What the model learns

For a date in October, November or December before the first significant rain,
the model estimates the chance that an autumn 10-day rainfall total first reaches
25 mm during the following 14 days. The inputs are the date in the autumn season,
rain in the preceding ten days including that day, and their mean temperature.
The as_of date represents the end of that day in UTC.

The rainfall threshold is from Moroccan cereal research. It is an indicator
of rainfall onset. Use field moisture, local agronomy and current weather for
actual planting decisions.

Source: https://www.inra.org.ma/sites/default/files/publications/ouvrages/prediction1212.pdf

## Evaluation

The logistic regression and its scaler use 2006–2020. The comparison baseline
uses the historical rate for the same day of autumn among years still waiting
for the first significant rain, with Laplace smoothing. Holding each season
together keeps adjacent dates and their overlapping windows in one split.
The scores are computed first within each of the five held-out seasons and then
averaged across 2021–2025. This gives each season equal weight. Lower Brier scores
indicate lower probability error. This backtest has five independent seasons.

| Site | Logistic regression | Historical baseline |
| --- | ---: | ---: |
| Settat | 0.25932 | 0.25274 |
| Sidi Bennour (Doukkala) | 0.25309 | 0.23534 |

## App handoff

Run `python .\src\export_app_data.py` to refresh `handoff/data/<site>/planting_ml.json`
for Field Shift. The file is keyed by site_id
and replay year. Use the primary_probability_field for the main probability
and display both the historical baseline and the experimental ML result in
the demo. For as_of and forecast_through, display the dates next to the
probabilities. The replay includes observed_event and observed_first_rain_date
for showing what later happened in those years.

Label the panel Historical replay. The five test seasons contain archived
data, and probabilities are specific to each reference point. The Doukkala
soil simulation uses separate data from the Doukkala climate model.
