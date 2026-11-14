# NASA Space Apps agriculture prototype

Open this folder in VS Code. It includes the NASA POWER pipeline, climate data,
crop recommendations and model results for Settat and Doukkala. The frontend
is a separate project maintained by the Field Shift app developer.

## Connect to Field Shift

The two reviewed CSVs in `handoff/review/` document inputs for
`data/pipeline/crops.mjs` and `data/pipeline/rotations.mjs` in the Field Shift
repository. Apply the agreed edits in those files and run `npm run all` from
Field Shift's `data/` folder to rebuild the JSON its app already reads.

The cereal rows propose a November 1 to December 15 rainfed planting window
for the demo. Keep the input numbers as provisional until you have local
evidence. Test barley at 450 mm alongside the existing 350 mm input before
changing the default. The rotation ratings are qualitative assumptions. In
`build.mjs`, label the 75% effective-rainfall factor, the heat penalty and the
500 MAD/ha nitrogen credit as assumptions. Report profit and losses as
simulation outputs. Use a field water balance for irrigation advice.

To make the Python results available in Field Shift as additional data, run this
command from this folder after regenerating any outputs:

```powershell
python .\src\export_app_data.py
```

Give the app developer `handoff/field-shift/` to copy into the Field Shift repo
as `app/public/data/field-shift/`. The Vite app keeps its existing
`app/public/data/<region_id>/` files for climate, crop scenarios and rotations.
The additional files use the same region IDs in their URLs. Their payloads
keep the original Python site IDs for provenance.

| Field Shift region ID | Python site ID | Reference point |
| --- | --- | --- |
| `chaouia` | `settat` | Settat |
| `doukkala` | `doukkala` | Sidi Bennour |

In `app/src/lib/data.js` your teammate can reuse the existing `getJson` helper:

```javascript
export const loadCropScreening = (regionId) =>
  getJson(`field-shift/${regionId}/recommendations.json`);

export const loadRainfallReplay = (regionId) =>
  getJson(`field-shift/${regionId}/planting_ml.json`);
```

Call these from the panels that display the new results using the selected
`regionId`. Match screening entries to Field Shift crops by `crop_id` and
`id`. For the crop cards use `suitability_score`,
`planting_window.start_mm_dd`, `planting_window.end_mm_dd` and
`crop_water_demand_mm` under a historical rainfed screening label.
For rainfall replay use `replay[].forecasts[]` and show the probability
selected by `primary_probability_field` first. Show unavailable supplemental
data inside the relevant panel and keep existing regional data on screen.

| Served file | Content |
| --- | --- |
| `/data/field-shift/pilot_points.geojson` | Map points for both Python sites |
| `/data/field-shift/<region_id>/recommendations.json` | Rainfed wheat and barley screening and a historical climate summary |
| `/data/field-shift/<region_id>/planting_ml.json` | Historical rainfall replay and evaluation |
| `/data/field-shift/<region_id>/planting_outlook.json` | Counts of autumn rainfall onset by month |
| `/data/field-shift/<region_id>/climate_point.geojson` | Site climate metrics for GIS |
| `/data/field-shift/doukkala/irrigation_demo.json` | Simulated dry and wet soil scenarios |

After deployment, open `/data/field-shift/chaouia/recommendations.json` and
`/data/field-shift/doukkala/recommendations.json`. Expect `site_id` values
`settat` and `doukkala` respectively and wheat and barley in both files.
Check that switching regions updates the supplemental results.

## Run the data and model scripts

```powershell
python -m pip install -r requirements.txt
python .\planting_ml.py --site settat
python .\planting_ml.py --site doukkala
python .\src\planting_analysis.py --site settat
python .\src\planting_analysis.py --site doukkala
python .\src\crop_recommendations.py --site settat
python .\src\crop_recommendations.py --site doukkala
python .\simulation\irrigation.py
```

- Settat (Chaouia) uses the site ID `settat`. See `outputs/settat/` for its
  2006–2025 climate data and historical rainfall replay.
- Sidi Bennour (Doukkala) uses the site ID `doukkala`. Its 2006–2025 weather and
  its own ML replay are included in `outputs/doukkala/`. Refresh the weather with
  `python .\src\nasa_power.py --site doukkala --core-only`. Both sites use the
  same rainfall event definition. Validate its relevance to your Doukkala crop
  and irrigation scenario before applying it to planting decisions.
- See `README-ML.md` for the evaluation method. `simulation/` provides example
  irrigation data for the simulation teammate.

This prototype compares crops, estimates potential seasonal crop water demand,
and exports historical rainfall analysis. It uses daily NASA POWER data for
2006-2025. Settat and Sidi Bennour are regional reference points for gridded
climate data.

## Start here

1. Give the app developer `handoff/field-shift/` and the two CSVs in `handoff/review/`.
2. Give the simulation teammate `contracts/soil_reading.example.json`. Set `site_id` to `doukkala` for a Sidi Bennour scenario. Agree on UTC timestamps, calibrated moisture units and the visible simulated-data badge. Use a manual replay of dry and wet readings for the first demo.
3. Run the climate extractor below. It uses Python 3.10+ and the standard library.

```powershell
python .\src\nasa_power.py
```

For a smaller query that fetches temperature and precipitation, use `--core-only`. If the runtime cannot reach NASA, save the daily response as `nasa_power_settat.json` in your current directory and run the extractor with that input. [Download Settat daily JSON](https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M%2CT2M_MIN%2CT2M_MAX%2CPRECTOTCORR&community=AG&longitude=-7.61662&latitude=33.00103&start=20060101&end=20251231&format=JSON&time-standard=UTC)

```powershell
python .\src\nasa_power.py --input-json .\nasa_power_settat.json
```

The command expects the project directory as its working directory. It defaults to `outputs/<site>/`. Fetch the Doukkala comparison with `python .\src\nasa_power.py --site doukkala --core-only`. `--start` and `--end` take inclusive ISO dates. Match those dates and the site to the downloaded JSON when using `--input-json`.

| Output | Use |
| --- | --- |
| `nasa_power_raw.json` | Keep the original API data for reproducibility. |
| `climate_daily.csv` | One row per date. Temperature is in °C and daily rainfall depth in mm. The full query also captures variables for estimating reference evapotranspiration, including solar radiation normalized to MJ/m²/day. |
| `climate_summary.json` | Merge the `climate` object into the app response by `site_id`. |
| `climate_point.geojson` | Map-ready point with period averages, descriptive trends and the number of complete years used. |
| `recommendations.json` | Per-site rainfed wheat and barley crop cards with a historical screening score, regional sowing window and potential seasonal water demand. |

The full 2006–2025 period contains 7,305 days. The extractor converts the NASA fill value to a blank CSV field and counts missing values. An annual or seasonal metric is `null` if that metric is missing any day within the period. Incomplete edge seasons are skipped. December–February is labeled by its January/February year. Annual trend slopes are ordinary least-squares fits over complete calendar years, in °C/decade and mm/decade. Treat them as descriptive estimates. Compare mapped data at the source grid scale. [NASA POWER daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/)

## Shared JSON contract v1.0

Exchange these files using `site_id` as the join key. GeoJSON point coordinates use `[longitude, latitude]` in decimal degrees. Fields with unavailable values stay `null`. Each crop should include short `reasons` explaining its score or why it is unavailable.

### Wheat and barley results

- Both reference points use a November 1 to December 15 regional planning window for rainfed cereals. The outputs count the seasons in which a trailing 10-day window ending during those dates received at least 25 mm of rain. The window is for the rainfed scenario in both sites. Sowing on irrigated plots in Doukkala may follow a different calendar.
- The screening score is the mean of yearly values across 19 complete crop seasons (sowing years 2006–2024). A year gets 0 when there is no rain signal in the sowing window. Otherwise, it gets `100 × min(gross seasonal rain / modeled potential crop ET, 1)`. This proxy cannot account for runoff, stored soil moisture, or when rain fell during the crop cycle.
- The water estimate uses a fixed November 15 sowing date and generic FAO-56 stage lengths of 240 days for wheat and 200 days for barley. Daily potential crop evapotranspiration is `Hargreaves ETo × Kc`. The main value is the historical median and the JSON includes the 10th and 90th percentiles. These are modeled crop water needs under standard conditions. Field irrigation and yield values remain `null`.

### Validation and field handoff

- The Moroccan cereal guide supports the regional rainfed planning window. Its separate survey of the irrigated Sidi Bennour perimeter reports earlier sowing for soft wheat, so keep the rainfed crop cards and the irrigation simulation labeled as distinct scenarios. [Cereal guide, page 24](https://ardna.org/admincockpit/files/contenus_files/ticket_file6203d542ba195-N891Guide-fran%C3%A7ais_C%C3%A9r%C3%A9ales_30bis_Mai_2016_MO.pdf#page=25)
- Barley ranked higher at both sites with rainfall thresholds of 20, 25 and 30 mm in 10 days. With the 25 mm threshold and both crops set to the same 200-day stage durations for a sensitivity check, the barley lead fell from 15.2 to 2.9 points at Settat and from 15.6 to 3.5 points at Doukkala. Keep the scores labeled as a historical climate screen until locally observed variety dates and outcomes can validate them.
- To estimate applied irrigation, collect soil field capacity, wilting point, representative root-zone moisture, effective root depth, effective rainfall and irrigation efficiency for the actual plot. The included dry/wet demo uses synthetic moisture and an illustrative threshold. [FAO-56 root-zone water balance](https://www.fao.org/4/x0490e/x0490e0e.htm)

| Field | Type and meaning |
| --- | --- |
| `soil_reading` | A reading shaped like `soil_reading.example.json`, or `null`. `source` is `sensor` or `simulated`. `status` is `ok`, `stale`, or `error`. `measured_at` is ISO 8601 UTC. `volumetric_water_content_m3_m3` is a calibrated fraction from 0 to 1, with depth in `depth_cm`. Keep that field `null` for an uncalibrated sensor index. |
| `crops[].suitability_score` | Number from 0 to 100, or `null`. Describe the inputs used in `reasons`. Compare crops under the same water-access scenario. |
| `crops[].planting_window` | `{"start_mm_dd":"11-01","end_mm_dd":"12-31","basis":"historical_climatology"}` or `null`. Dates here illustrate the shape only. The window can cross New Year. Once sourced, olive establishment and annual sowing/transplanting are labeled separately in `basis` and `reasons`. |
| `crops[].crop_water_demand_mm` | Crop evapotranspiration summed over the modeled growing period. Define that period and crop stage in `reasons`. |
| `crops[].net_irrigation_requirement_mm` | Rainfall-adjusted planning estimate over the same modeled period, pending adequate effective-rainfall assumptions. |
| `crops[].yield_range_t_ha` | `{"low": number, "high": number, "basis": string}` or `null` when there is insufficient regional yield evidence. |
| `irrigation` | A separate simulation object or `null`. The initial handoff is `{"crop_id": string, "source": "simulated" or "sensor", "as_of": string, "action": "review" or "hold", "reason": string}`. `review` means show the irrigation advisory. |
| `satellite.smap` and `satellite.modis_ndvi` | Optional context objects with `dataset_id`, `observed_at`, `value`, `units`, and `grid_resolution_m`. Keep the two sources separate from the soil reading. |

## Build order for the team

| Priority | Data science | Simulation | App and GIS |
| --- | --- | --- | --- |
| First 30 minutes | Share the example contract and start the Settat download. | Produce dry and wet readings using the example shape. | Activate the GeoPortal account, import the pilot points and build the site/card UI against the example. |
| First integrated demo | Compute historical climate and start with sourced crop rules for wheat and barley. Add chickpea next. | Recompute the advisory when the sample reading changes and show the source and sample time. | Show an ArcGIS popup with source, period, annual rainfall/temperature and a link or panel with the crop cards. |
| After integration | Add seasonal crop water demand for the best-supported crops, then the conditional tomato scenario and a separate olive orchard card. Add verified satellite context if time allows. | Own sensor-informed scheduling and irrigation volume, with agreed area and efficiency inputs. | Compare site-level climate summaries and record the integrated Field Shift demo. |

### Agronomy and satellite sources

- Use rainfed wheat, barley and chickpea as the initial annual comparisons. Score open-field tomato under an explicit irrigation scenario and keep olive in a separate perennial orchard card. The Moroccan cereal reference includes wheat–legume rotations around Settat and describes the irrigated Doukkala area around Sidi Bennour. Use local sources and distinguish historical sowing patterns from a current forecast. [Moroccan cereal reference](https://ardna.org/admincockpit/files/contenus_files/ticket_file641196ed6f8cc-N891-R%C3%A9f%C3%A9rentiel-c%C3%A9r%C3%A9ales-MEP-HB-29_05_2017-%28final%29.pdf) · [INRA climate and sowing analysis](https://www.inra.org.ma/sites/default/files/sustainable_farming_system11.pdf)
- Compute reference evapotranspiration (ET₀) and then multiply by the appropriate crop-stage coefficient Kc to estimate crop water demand (ETc). Net irrigation also depends on effective rainfall and the assumed soil-water balance. Keep local sensor feedback in the short-term advisory. [FAO-56 ET₀](https://www.fao.org/4/x0490e/x0490e08.htm) · [FAO-56 Kc and ETc](https://www.fao.org/4/x0490e/x0490e0b.htm)
- Add [SMAP enhanced daily soil moisture](https://water.usgs.gov/catalog/datasets/b8605ef0-1be6-4556-8575-2d2778aa622a/) as broad surface moisture context. Its 9 km grid begins in 2015. Add [MODIS Terra MOD13Q1 v061](https://data.nasa.gov/dataset/modis-terra-vegetation-indices-16-day-l3-global-250m-sin-grid-v061-2eb0d) as a 250 m, 16-day vegetation index. Use quality filtering and the product's scale factor.
- Use the [Morocco GeoPortal](https://morocco.africageoportal.com/) to find basemaps and relevant boundaries. [ArcGIS GeoJSON support](https://doc.arcgis.com/en/arcgis-online/reference/geojson.htm) describes importing the generated points. Label the map at the coverage of its inputs. A parcel sensor represents only its measurement location and depth.

## Status

Implemented NASA POWER extraction, climate aggregation, GeoJSON export, historical rainfall onset analysis, rainfall model replay, and rainfed wheat and barley screening for both sites. Site-specific crop varieties, soil water budgets, and applied irrigation estimates need field validation.
