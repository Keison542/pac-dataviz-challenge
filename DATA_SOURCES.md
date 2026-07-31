# Data sources and provenance

This file lists the processed datasets currently present in the repository (in `src/climatedata/`). It is intended as a single place to add original data source URLs, license, and processing notes so the site is fully reproducible and trustworthy.

Files present in `src/climatedata` (please add original sources and licenses below each entry):

- climate_drivers/
  - surface_temp_anomalies.ts
  - rainfall_anomalies.ts
  - sea_level_anomalies.ts
  - sea_surface_temp_anomalies.ts
  - buildMultiLineData.ts (helper)

- economic_consequence/
  - direct_disaster_economic_loss.ts
  - tourist_arrival.ts

- human_consequence/
  - number_of_persons_affected.ts
  - population_growth.ts

- environmental_impact/
  - crop_yield.ts
  - climate_altering_land.ts
  - lifestock_yield.ts

- pacificGeoData.ts (geo features for the Pacific map)

How to add provenance

1. Edit this file and add the original URL, title, license, and the processing steps (any unit conversions, aggregation, filtering, or cleaning) under each bullet point above.
2. If you have the raw CSV or NetCDF files, add the original filenames and a brief command or a script that converts them into the processed TS arrays (the repo already includes `convert-csv-to-ts.js`).

Example entry (replace with real URLs):

- `climate_drivers/surface_temp_anomalies.ts`
  - Source: [insert URL]
  - License: [insert license]
  - Notes: aggregated to country-level annual averages, anomalies computed vs 1951-1980 baseline, values stored as degrees C anomaly.

Why this matters

Judges and reviewers expect clear provenance: where the numbers came from, how you processed them, and that the data license allows public reuse. Adding provenance is a high-impact, low-effort improvement.
