// Loads the JSON files described in docs/data-format.md from /public/data.
const BASE = `${import.meta.env.BASE_URL}data`;

export async function getJson(path) {
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

export async function loadClimatePoint(regionId) {
  const g = await getJson(`seasonreplay/${regionId}/climate_point.geojson`);
  return g.features[0]?.properties || null;
}

// Data science outputs (Python pipeline in data-science/), served from /data/seasonreplay/<region>/
export async function loadPlantingData(regionId) {
  const [screening, replay, outlook] = await Promise.all([
    getJson(`seasonreplay/${regionId}/recommendations.json`),
    getJson(`seasonreplay/${regionId}/planting_ml.json`),
    getJson(`seasonreplay/${regionId}/planting_outlook.json`),
  ]);
  return { screening, replay, outlook };
}

export const SCENARIOS = [
  { id: 'recent', label: 'Next season', label_fr: 'Saison prochaine', hint: 'Expected conditions, based on the last 15 seasons', hint_fr: 'Conditions attendues, d’après les 15 dernières saisons' },
  { id: 'dry_year', label: 'Dry year', label_fr: 'Année sèche', hint: 'If next season is as dry as the driest recent one', hint_fr: 'Si la saison prochaine est aussi sèche que la plus sèche des dernières années' },
  { id: 'baseline', label: '1990s climate', label_fr: 'Climat des années 1990', hint: 'How it looked in 1991-2005, before the shift', hint_fr: 'Le climat de 1991-2005, avant le changement' },
];

// Number format follows the language chosen in i18n.jsx (1,700.5 in English, 1 700,5 in French).
let LOCALE = 'en-US';
export const setFmtLocale = (lang) => { LOCALE = lang === 'fr' ? 'fr-FR' : 'en-US'; };
export const dateLocale = () => (LOCALE === 'fr-FR' ? 'fr-FR' : 'en-GB');
export const fmt = (n, d = 0) =>
  Number(n).toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });

export function scoreLabel(score) {
  if (score >= 70) return { text: 'Good fit', text_fr: 'Bien adapté', tone: 'good' };
  if (score >= 55) return { text: 'Possible', text_fr: 'Possible', tone: 'mid' };
  return { text: 'Risky', text_fr: 'Risqué', tone: 'bad' };
}
