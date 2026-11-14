# Space Apps submission: Field Shift

Copy each section into the matching field of the submission page. Check the field names and character limits on the page, and fill in the team names.

---

## Project name

Field Shift

## High-level summary (short version)

Morocco's climate has shifted, but most farmers still grow wheat after wheat as they did 30 years ago. Field Shift is a decision-support tool that uses 35 years of NASA POWER data to help farmers in the Casablanca-Settat region explore crop rotations that protect their soil and hold up in dry years. It compares four rotations, including the current one, by replaying each of them on the real seasons measured by NASA, and explains for each one why it is suggested, the evidence, its benefits for soil (nitrogen, erosion, pests), its risks and what still needs local checking. Farmers set their own priorities (income, dry-year safety, water, soil health) and the ranking adapts. In Chaouia, wheat after wheat would have lost money in 9 of the last 15 seasons, while a barley and faba bean rotation would have lost money only once. A low cost soil sensor (about 150 MAD) checks the satellite estimate in the farmer's own field.

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

   | Rotation | Seasons at a loss 2011-2025, Chaouia | Doukkala |
   |---|---|---|
   | Wheat after wheat (current) | 9 of 15 | 10 of 15 |
   | Wheat → Chickpea | 5.5 of 15 | 8 of 15 |
   | Wheat → Lentil → Barley | 4.7 of 15 | 7.7 of 15 |
   | Barley → Faba bean | 1 of 15 | 5 of 15 |
   **What if**: two sliders replay the same seasons with less rain (down to -40 %) or more spring heat (up to +3 °C), and all rotation numbers update live. With 20 % less rain and +1 °C, wheat after wheat in Chaouia would lose money in 11 of 15 seasons, barley → faba bean in 7.5.
2. **See it from space**: NASA MODIS vegetation (NDVI) and SMAP root zone soil moisture layers on the ArcGIS map, comparing the wet spring of 2018 with the dry spring of 2023, with a plain-language explanation of each layer.
3. **What changed**: shows the farmer how the climate of their region evolved over 35 seasons (rainfall per season, hot days in spring, dry seasons).
4. **Crops**: ranks 7 local crops (wheat, barley, lentil, chickpea, faba bean, olive, open-field tomato) with a score from 0 to 100, expected yield range, planting and harvest windows, and the extra water needed for full yield. It can show three scenarios: next season (based on recent climate), a dry year, and the 1990s climate for comparison.
5. **Income simulator**: for a given crop, area and selling price, estimates the profit in a bad, typical and good year, and compares all crops on the same area.
6. **Field sensor**: an ESP32 with a capacitive soil moisture probe and a temperature probe measures the real soil moisture in the field. The app compares it with the satellite root zone soil wetness for the region and tells the farmer whether to irrigate earlier, or whether they can save water.
7. **How it works**: explains the terms used (evapotranspiration, root zone soil moisture, heat stress, nitrogen fixation, bare soil periods), the difference between satellite and field measurements, and the limits of the model.
8. **Map**: an Esri ArcGIS map of the regions.

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

- Data: NASA POWER API, NASA GIBS (MODIS NDVI, SMAP), Node.js data pipeline
- App: React, Vite, Recharts, Esri ArcGIS Maps SDK for JavaScript, hosted on Vercel
- Hardware: ESP32, capacitive soil moisture sensor, DS18B20 temperature probe, Arduino
- Design and simulation: _add if used: SOLIDWORKS (sensor enclosure), MATLAB / Simulink (irrigation model)_
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

- _Name_: software, app, presentation
- _Name_: data science, NASA data and crop model
- _Name_: mechatronics, soil sensor
