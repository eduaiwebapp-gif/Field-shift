// Loads the JSON files described in docs/data-format.md from /public/data.
const BASE = `${import.meta.env.BASE_URL}data`;

async function getJson(path) {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return res.json();
}

export const loadRegions = () => getJson('regions.json');

export async function loadRegionData(regionId) {
  const [climate, recommendations] = await Promise.all([
    getJson(`${regionId}/climate_history.json`),
    getJson(`${regionId}/recommendations.json`),
  ]);
  return { climate, recommendations };
}

export const loadSensorSample = () => getJson('sensor_sample.json');

// Data science outputs (Python pipeline in data-science/), served from /data/field-shift/<region>/
export async function loadPlantingData(regionId) {
  const [screening, replay, outlook] = await Promise.all([
    getJson(`field-shift/${regionId}/recommendations.json`),
    getJson(`field-shift/${regionId}/planting_ml.json`),
    getJson(`field-shift/${regionId}/planting_outlook.json`),
  ]);
  return { screening, replay, outlook };
}

export const SCENARIOS = [
  { id: 'recent', label: 'Next season', hint: 'Expected conditions, based on the last 15 seasons' },
  { id: 'dry_year', label: 'Dry year', hint: 'If next season is as dry as the driest recent one' },
  { id: 'baseline', label: '1990s climate', hint: 'How it looked in 1991-2005, before the shift' },
];

export const fmt = (n, d = 0) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export function scoreLabel(score) {
  if (score >= 70) return { text: 'Good fit', tone: 'good' };
  if (score >= 55) return { text: 'Possible', tone: 'mid' };
  return { text: 'Risky', tone: 'bad' };
}
