# Field Shift

**NASA Space Apps Challenge 2026, Casablanca: "Field Shift: Adapting Farms with NASA Data"**

Morocco's climate has shifted, but most farmers still plant what worked 20 years ago.
Field Shift uses NASA satellite data to show a farmer, for their region:

- **what changed**: rainfall, dry seasons and spring heat over the last 35 years
- **what to plant** next season: crops ranked by how well they fit the new climate, with expected yield, planting window and extra water needed
- **what it could earn**: an income simulator for bad, typical and good years
- **what is happening in their own field**: a low cost soil sensor that checks the satellite estimate at plot level

What the data shows for Chaouia (Settat), 1991-2005 compared with 2011-2025:
hot spring days (≥ 30 °C) went from 13.5 to 18.4 per year, dry seasons (< 250 mm) went from 1 to 3, and 3 of the last 4 seasons were dry.

## Repository

```
app/      web app (React + Vite + ArcGIS Maps SDK)            -> software
data/     NASA POWER download + crop recommendation model     -> data scientist
sensor/   ESP32 soil sensor code, wiring, parts list          -> engineer
docs/     data-format.md: the JSON contract between all three
```

## Run it

Requires Node 18+.

```bash
# 1. data (optional: the processed files are already in app/public/data)
cd data
npm run all        # downloads NASA POWER daily data, builds the JSON outputs, copies them to the app

# 2. app
cd ../app
npm install
npm run dev        # http://localhost:5173
```

## Data and method

- **NASA POWER** daily point data (power.larc.nasa.gov), 1990-2025: temperature, max temperature, bias-corrected precipitation, root zone soil wetness (GWETROOT).
- Daily values are aggregated by month and by agricultural season (Oct to Sep).
- **Crop model (rule-based v1)**: for each crop and season, a score from 0 to 100 combines
  - water: effective rainfall over the growing months vs. crop water needs (60 %)
  - heat: mean daily max temperature during flowering vs. the crop's limit (25 %)
  - soil: root zone soil wetness (15 %)
- Scenarios: `baseline` (1991-2005), `recent` (2011-2025, used as the expectation for next season), `dry_year` (driest recent season).
- Crop water needs, heat limits, yields, prices and costs are first estimates in `data/pipeline/crops.mjs` and should be checked with an agronomist.

## Team

- Software / app: _name_
- Data science: _name_
- Mechatronics / sensor: _name_

## Tools

NASA POWER · Esri ArcGIS Maps SDK for JavaScript · React · Vite · Recharts · ESP32 / Arduino
