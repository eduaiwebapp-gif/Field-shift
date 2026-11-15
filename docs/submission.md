# Space Apps submission: Field Shift

Copy each section into the matching field of the submission page. Check the field names and character limits on the page.

---

## Project name

Field Shift

## High-level summary (short version)

Morocco's climate has shifted, but most farmers still grow wheat after wheat as they did 30 years ago. Field Shift is a decision-support tool that uses 35 years of NASA POWER data to help farmers in the Casablanca-Settat region explore crop rotations that protect their soil and hold up in dry years. It compares four rotations, including the current one, by replaying each of them on the real seasons measured by NASA, and explains for each one why it is suggested, the evidence, its benefits for soil (nitrogen, erosion, pests), its risks and what still needs local checking. Farmers set their own priorities (income, dry-year safety, water, soil health) and the ranking adapts. In our simulation for Chaouia, wheat after wheat would have lost money in 9 of the last 15 seasons, while a barley and faba bean rotation would have lost money only once. A Python machine learning pipeline shows when the autumn sowing rains usually arrive, and a MATLAB/Simulink model with a low cost soil sensor (about 150 MAD) turns field moisture into irrigation advice. Crop inputs are sourced from FAO, INRA Morocco and Moroccan crop guides and are clearly labelled as provisional.

## Links

- Live app: https://field-shift-self.vercel.app
- Code: https://github.com/eduaiwebapp-gif/Field-shift (make the repository public before submitting)
- Demo video: _add link_
- Slides: _add link_

## Project details

### The problem

Rainfed cereals cover most of the farmland in the Casablanca-Settat region. Farmers decide what to plant from experience, but the climate that experience was built on has changed. Dry years are more frequent and spring heat waves now hit crops during flowering and grain filling. A wrong choice in November means a failed harvest in May, lost seeds and fertilizer, and lost income.

Satellite data could help, but it is not usable by a farmer: it comes as global grids, scientific units and files that need programming to open.

### What the NASA data shows

We compared 1991-2005 with 2011-2025 using NASA POWER daily data:

| | Chaouia (Settat) | Doukkala (Sidi Bennour) |
|---|---|---|
| Hot spring days (max ≥ 30 °C, March-May) | 13.5 → 18.4 per year (+36 %) | 16.3 → 20.3 per year (+25 %) |
| Dry seasons (< 250 mm, Oct-May) per 15 years | 1 → 3 | 4 → 7 |
| Recent seasons | 3 of the last 4 were dry | the last 4 were all dry |

Average rainfall barely changed, because a few very wet years (like 2021) pull it up. That is exactly why farmers can miss the shift: what changed is the frequency of dry years and the heat during the most sensitive weeks of the crop cycle.

### What Field Shift does

1. **Compare rotations** (main feature): four strategies for the region, including the current one:
   - Wheat after wheat (current practice)
   - Wheat → Chickpea
   - Barley → Faba bean
   - Wheat → Lentil → Barley

   Each rotation is replayed on the real 2011-2025 seasons (for every starting crop) to count the seasons at a loss, the average profit per hectare, the fit in the driest year and the extra water needed. Each one also shows its soil benefits (nitrogen fixation, soil cover, organic matter, pest break, forage), why it is suggested, the evidence from NASA data, benefits, risks and information gaps. The farmer sets four priorities (income, safety in dry years, saving water, soil health) and the ranking adapts. A season calendar shows when the field is growing, when crops are sensitive to heat and when the soil is bare, next to monthly rain and hot days.

   | Rotation | Simulated seasons at a loss 2011-2025, Chaouia | Doukkala |
   |---|---|---|
   | Wheat after wheat (current) | 9 of 15 | 10 of 15 |
   | Wheat → Chickpea | 5.5 of 15 | 8 of 15 |
   | Wheat → Lentil → Barley | 4.7 of 15 | 7.7 of 15 |
   | Barley → Faba bean | 1 of 15 | 5 of 15 |
   **What if**: two sliders replay the same seasons with less rain (down to -40 %) or more spring heat (up to +3 °C), and all rotation numbers update live. With 20 % less rain and +1 °C, wheat after wheat in Chaouia would lose money in 11 of 15 seasons, barley → faba bean in 7.5.
   These are simulation outputs on NASA climate data with provisional, sourced crop inputs, not observed farm results. The model assumptions (75 % effective rainfall, heat penalty, 500 MAD/ha nitrogen credit after a legume) are listed in the app.
2. **Planting time** (data science, Python): when do the autumn sowing rains arrive, and which rainfed cereal fits best?
   - *Data*: 20 years of NASA POWER daily rainfall and temperature (2006-2025) for Settat (Chaouia) and Sidi Bennour (Doukkala), 7,305 daily records per site.
   - *Sowing signal*: at least 25 mm of rain over 10 consecutive days (INRA Morocco threshold). Both sites had a qualifying window during the recommended sowing period (Nov 1 - Dec 15) in 15 of 19 complete seasons.
   - *Crop screening*: combines the sowing signal with seasonal rain relative to estimated crop water demand (Hargreaves ET0 × FAO-56 Kc). Barley ranked above wheat at both sites.
   - *Machine learning*: one logistic regression per site, trained on 2006-2020, uses the day of autumn and the last 10 days of rainfall and temperature to estimate the chance of the first qualifying rain spell in the next 14 days.
   - *Evaluation*: both the model and a historical baseline (past event frequencies for the same site and time of year) were scored on the same daily forecast dates over five held-out autumns (2021-2025), with the Brier score (each autumn weighted equally, lower is better).

   | Site | Daily test forecasts | Logistic regression | Historical baseline |
   |---|---:|---:|---:|
   | Settat | 219 | 0.259 | **0.253** |
   | Sidi Bennour | 211 | 0.253 | **0.235** |

   - *Rainfall cross-check*: NASA POWER rainfall was compared with an independent product, UCSB CHIRPS v2 (satellite + rain gauges, via ClimateSERV), for the five seasons 2020/21-2024/25 at both sites. In 4 of 5 seasons the October-May totals are within 50 mm (NASA POWER slightly wetter); 2020/21 is the outlier (848 vs 337 mm at Settat). The 25 mm sowing-rain answer matched in 4 of 5 seasons at Settat and 3 of 5 at Sidi Bennour. If real rain is closer to CHIRPS, dry years were drier than simulated, so the losses shown for wheat after wheat are more likely underestimated. Files: data-science/validation.

   The model did not beat the baseline at either site, so the app shows the historical rate as the main indicator and the model as an experiment.
3. **See it from space**: NASA MODIS vegetation (NDVI) and SMAP root zone soil moisture layers on the ArcGIS map, comparing the wet spring of 2018 with the dry spring of 2023, with a plain-language explanation of each layer.
4. **What changed**: shows the farmer how the climate of their region evolved over 35 seasons (rainfall per season, hot days in spring, dry seasons).
5. **Crops**: ranks 7 local crops (wheat, barley, lentil, chickpea, faba bean, olive, open-field tomato) with a score from 0 to 100, expected yield range, planting and harvest windows, and the extra water needed for full yield. It can show three scenarios: next season (based on recent climate), a dry year, and the 1990s climate for comparison.
6. **Income simulator**: for a given crop, area and selling price, estimates the profit in a bad, typical and good year, and compares all crops on the same area.
7. **Field sensor**: an ESP32 with a capacitive soil moisture probe and a temperature probe measures the real soil moisture in the field. The app compares it with the satellite root zone soil wetness for the region and tells the farmer whether to irrigate earlier, or whether they can save water.
   **Smart irrigation, simulated** (MATLAB/Simulink): the engineer built a closed-loop model of a tomato plot in Doukkala using the FAO-56 root-zone water balance, dθ/dt = 100/Zr × (I + P − Kc·ET0), with Kc 1.15, ET0 0.22 mm/h, Zr 300 mm, and the ESP32 sensor reading including ADC noise. A hysteresis controller opens a 5 mm/h valve below 22 % soil moisture and closes it above 35 %. Over 10 days without rain the crop uses about 61 mm; the valve opened twice (9.9 h in total) and applied 49 mm, the rest coming from water stored in the soil, and moisture never approached saturation (45 %), so no water drains below the roots. In the app the same model runs in the browser for every crop of the rotations, with FAO-56 mid-season Kc (Table 12) and real root depths (Table 22): deeper roots store more water (wheat 1.25 m holds 163 mm in the 22-35 % band, faba bean 0.6 m only 78 mm), so they need fewer, longer irrigations. It also shows that ESP32 sensor noise opens the valve days early (wheat: day 7.9 instead of 12.4), which argues for averaging readings. Model script: sensor/simulink.
   **Field unit (3D concept)**: Amine built a 3D concept assembly and render in SolidWorks from standard component models (ESP32-WROOM 30-pin board, 500 mAh LiPo, 5 V mini solar panel, capacitive probe v1.2). For the prototype we chose an off-the-shelf IP67 junction box with an opaque hinged lid and an internal mounting plate: the opaque lid keeps the battery cooler than a clear one in the Moroccan sun. Still to add: a second cable gland for the solar lead, a solar LiPo charge module, the probe electronics sealed in its head, and deep sleep so a small panel is enough. Details: sensor/enclosure.
8. **How it works**: explains the terms used (evapotranspiration, root zone soil moisture, heat stress, nitrogen fixation, bare soil periods), the difference between satellite and field measurements, and the limits of the model.
9. **Map**: an Esri ArcGIS map of the regions.

The tool is designed to support farmers and agronomists, not to replace their judgment: every rotation lists what must be checked locally (soil type, seed and market access, pest pressure).

### How it works

- A data pipeline downloads NASA POWER daily point data (1990-2025) for each region: air temperature, daily maximum temperature, bias-corrected precipitation and root zone soil wetness. It aggregates the data by month and by agricultural season (October to September).
- A rule-based crop model scores each crop for each season:
  - water balance: effective rainfall over the crop's growing months compared with its water needs (60 % of the score)
  - heat stress: mean daily maximum temperature during flowering compared with the crop's limit (25 %)
  - root zone soil wetness (15 %)
- Rotations are replayed season by season on the real data, starting from each crop of the sequence, and averaged. A cereal grown after a legume gets a fertiliser saving of about 500 MAD/ha (first estimate). Soil benefits are rated from agronomy knowledge and clearly separated from what the satellite data measures.
- Yield ranges come from the spread between bad and good years in each period. The model is deliberately simple and transparent, so a farmer or an extension agent can understand why a crop is recommended.
- Satellite soil moisture is estimated over pixels of tens of kilometres. The field sensor brings the measurement down to the scale of a single plot.

### Benefits

- Fewer failed harvests, by moving away from crops that no longer fit the climate.
- Less water wasted, by knowing how much irrigation each crop needs and when the field really needs it.
- Better income decisions, by comparing crops before investing in seeds and inputs.
- Cheap enough for small farms: the app is free and the sensor costs about 150 MAD.

### Next steps

- Validate the crop parameters with agronomists (INRA Morocco, IAV Hassan II) and with farmers in the region.
- Use the real region boundaries from the Africa GeoPortal and extend to more regions.
- Add seasonal forecasts so recommendations look ahead, not only at recent climate.
- French and Darija interface, and SMS alerts for farmers without smartphones.
- Field test of the sensor on a real plot.

### Tools and technologies

- Data: NASA POWER API, NASA GIBS (MODIS NDVI, SMAP), UCSB CHIRPS v2 via ClimateSERV (rainfall cross-check), Node.js data pipeline, Python data science pipeline (NumPy, logistic regression)
- App: React, Vite, Recharts, Esri ArcGIS Maps SDK for JavaScript, hosted on Vercel
- Hardware: ESP32, capacitive soil moisture sensor, DS18B20 temperature probe, Arduino
- Design and simulation: MATLAB / Simulink (root zone water balance and irrigation controller), SolidWorks (3D concept assembly of the field unit)
- Collaboration: GitHub

## Use of artificial intelligence

We used Claude (Anthropic), an AI assistant, to help write parts of the code (data pipeline, web app, sensor sketch) and to draft texts (this description, the slides and the video script). The team chose the problem, the region and the approach, reviewed the outputs, and is responsible for the results. The crop recommendations are computed by a transparent rule-based model, not by a generative AI model.

_Edit this section so it describes exactly how your team used AI. Space Apps asks teams to be transparent about it._

## Space agency data

- NASA POWER (Prediction Of Worldwide Energy Resources), daily point data, community AG: https://power.larc.nasa.gov
  - T2M (temperature at 2 m), T2M_MAX (daily maximum temperature), PRECTOTCORR (bias-corrected precipitation), GWETROOT (root zone soil wetness)
  - POWER is based on NASA's MERRA-2 reanalysis and GEOS models.
- NASA MODIS Terra monthly NDVI (MODIS_Terra_L3_NDVI_Monthly), April 2018 and April 2023, via NASA GIBS: https://gibs.earthdata.nasa.gov
- NASA SMAP Level 4 root zone soil moisture (SMAP_L4_Analyzed_Root_Zone_Soil_Moisture), early April 2018 and 2023, via NASA GIBS

## References and other resources

- Esri ArcGIS Maps SDK for JavaScript, World Imagery basemap
- FAO crop water requirements (FAO Irrigation and Drainage Paper 56) for the order of magnitude of crop water needs
- Yields, prices and costs: first estimates for Morocco, to be checked with official sources
- Open source libraries: React, Vite, Recharts

## Team

- Mohamed Amjad Eddaniaoui: software, web app, team lead
- Abdelbari Benouarrak: data science (Python pipeline, sowing rain model, crop data review)
- Amine Morine: mechatronics (Simulink irrigation simulation, ESP32 soil sensor, 3D concept of the field unit)
