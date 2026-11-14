// Downloads daily NASA POWER data for every region into data/raw/<region>.json
// (daily, so we can compute the mean daily max temperature and count hot days)
// Usage: node pipeline/fetch_power.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGIONS, FIRST_SEASON, LAST_SEASON, POWER_PARAMETERS } from './config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = join(ROOT, 'raw');

async function fetchRegion(region) {
  const url = new URL('https://power.larc.nasa.gov/api/temporal/daily/point');
  url.search = new URLSearchParams({
    parameters: POWER_PARAMETERS.join(','),
    community: 'AG',
    latitude: String(region.lat),
    longitude: String(region.lon),
    start: `${FIRST_SEASON - 1}1001`, // season 1991 starts on 1 Oct 1990
    end: `${LAST_SEASON}0930`,
    format: 'JSON',
  }).toString();

  const res = await fetch(url);
  if (!res.ok) throw new Error(`NASA POWER ${res.status} for ${region.id}: ${await res.text()}`);
  const json = await res.json();
  const file = join(RAW_DIR, `${region.id}.json`);
  await writeFile(file, JSON.stringify(json));
  console.log(`saved ${file}`);
}

await mkdir(RAW_DIR, { recursive: true });
for (const region of REGIONS) {
  await fetchRegion(region);
}
