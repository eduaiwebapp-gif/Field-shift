// Regions and periods used by the whole pipeline.
// To add a region: add an entry here, then run `npm run all` in /data.

export const REGIONS = [
  { id: 'chaouia', name: 'Chaouia (Settat)', lat: 33.0, lon: -7.62, radius_km: 40 },
  { id: 'doukkala', name: 'Doukkala (Sidi Bennour)', lat: 32.65, lon: -8.43, radius_km: 40 },
];

// Agricultural season = Oct (year - 1) -> Sep (year), labelled by harvest year.
export const FIRST_SEASON = 1991;
export const LAST_SEASON = 2025;

export const BASELINE_PERIOD = [1991, 2005];
export const RECENT_PERIOD = [2011, 2025];

// A day counts as a "hot day" when its max temperature reaches this value.
export const HOT_DAY_C = 30;

// NASA POWER daily point API (no key needed)
export const POWER_PARAMETERS = [
  'T2M',          // daily mean air temperature at 2 m (°C)
  'T2M_MAX',      // daily max temperature (°C)
  'PRECTOTCORR',  // precipitation, bias corrected (mm/day)
  'GWETROOT',     // root zone soil wetness (0-1)
];
