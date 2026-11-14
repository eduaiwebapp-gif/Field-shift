// Turns raw NASA POWER data into the JSON files the app reads (see docs/data-format.md).
// Usage: node pipeline/build.mjs   (run fetch_power.mjs first)
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGIONS, FIRST_SEASON, LAST_SEASON, BASELINE_PERIOD, RECENT_PERIOD, HOT_DAY_C } from './config.mjs';
import { CROPS } from './crops.mjs';
import { ROTATIONS, SOIL_LABELS } from './rotations.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = join(ROOT, 'raw');
const OUT_DIR = join(ROOT, 'output');
const APP_DATA_DIR = join(ROOT, '..', 'app', 'public', 'data');

// Share of rainfall the crop can actually use (rest runs off or evaporates).
const EFFECTIVE_RAIN = 0.75;

// ---------- helpers ----------
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const quantile = (xs, q) => {
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
};
const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Months Oct-Dec belong to the previous calendar year of the season.
const calendarYear = (season, month) => (month >= 10 ? season - 1 : season);

// Daily NASA POWER -> one record per month:
// { rain (mm total), t2m (mean), tmax (mean daily max), hot (days >= HOT_DAY_C), wet (mean) }
// A month with any missing day (-999) or incomplete is dropped.
function aggregateMonths(raw) {
  const p = raw.properties.parameter;
  const acc = new Map();
  for (const day of Object.keys(p.T2M)) {
    const key = day.slice(0, 6);
    const vals = [p.T2M[day], p.T2M_MAX[day], p.PRECTOTCORR[day], p.GWETROOT[day]];
    if (!acc.has(key)) acc.set(key, { n: 0, bad: false, rain: 0, t2m: 0, tmax: 0, hot: 0, wet: 0 });
    const a = acc.get(key);
    if (vals.some((v) => v === undefined || v === -999)) { a.bad = true; continue; }
    const [t2m, tmax, rain, wet] = vals;
    a.n += 1; a.rain += rain; a.t2m += t2m; a.tmax += tmax; a.wet += wet;
    if (tmax >= HOT_DAY_C) a.hot += 1;
  }
  const months = new Map();
  for (const [key, a] of acc) {
    const days = daysInMonth(Number(key.slice(0, 4)), Number(key.slice(4)));
    if (a.bad || a.n !== days) continue;
    months.set(key, { rain: a.rain, t2m: a.t2m / a.n, tmax: a.tmax / a.n, hot: a.hot, wet: a.wet / a.n });
  }
  return months;
}

function monthly(months, field, season, month) {
  const key = `${calendarYear(season, month)}${String(month).padStart(2, '0')}`;
  const rec = months.get(key);
  return rec ? rec[field] : null;
}

function monthlySum(months, field, season, list) {
  let total = 0;
  for (const m of list) {
    const v = monthly(months, field, season, m);
    if (v === null) return null;
    total += v;
  }
  return total;
}

function monthlyMean(months, field, season, list) {
  const s = monthlySum(months, field, season, list);
  return s === null ? null : s / list.length;
}

const rainTotal = (months, season, list) => monthlySum(months, 'rain', season, list);

// ---------- climate history ----------
const OCT_TO_MAY = [10, 11, 12, 1, 2, 3, 4, 5];
const OCT_TO_SEP = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function climateSeason(months, season) {
  const s = {
    year: season,
    rain_season_mm: rainTotal(months, season, OCT_TO_MAY),
    t_mean_c: monthlyMean(months, 't2m', season, OCT_TO_SEP),
    t_max_spring_c: monthlyMean(months, 'tmax', season, [3, 4, 5]),
    hot_days_spring: monthlySum(months, 'hot', season, [3, 4, 5]),
    soil_wetness: monthlyMean(months, 'wet', season, OCT_TO_MAY),
  };
  if (Object.values(s).some((v) => v === null)) return null;
  return {
    year: season,
    rain_season_mm: round(s.rain_season_mm),
    t_mean_c: round(s.t_mean_c, 2),
    t_max_spring_c: round(s.t_max_spring_c, 2),
    hot_days_spring: s.hot_days_spring,
    soil_wetness: round(s.soil_wetness, 3),
  };
}

function periodSummary(seasons, [a, b]) {
  const sel = seasons.filter((s) => s.year >= a && s.year <= b);
  return {
    rain_season_mm: round(mean(sel.map((s) => s.rain_season_mm))),
    t_mean_c: round(mean(sel.map((s) => s.t_mean_c)), 2),
    t_max_spring_c: round(mean(sel.map((s) => s.t_max_spring_c)), 2),
    hot_days_spring: round(mean(sel.map((s) => s.hot_days_spring))),
    soil_wetness: round(mean(sel.map((s) => s.soil_wetness)), 3),
    dry_seasons: sel.filter((s) => s.rain_season_mm < 250).length,
  };
}

// ---------- crop model (rule-based v1) ----------
function cropInputs(raw, crop, season) {
  const rain = rainTotal(raw, season, crop.months);
  const tmax = monthlyMean(raw, 'tmax', season, crop.critical_months);
  const wet = monthlyMean(raw, 'wet', season, crop.months);
  if (rain === null || tmax === null || wet === null) return null;
  return { rain, tmax, wet };
}

function evaluate(crop, { rain, tmax, wet }) {
  const need = crop.water_need_mm;
  const effRain = EFFECTIVE_RAIN * rain;
  const irrigation = Math.max(0, need - effRain);

  // every °C above the limit costs 12.5 % of yield, floor at 20 %
  const heat = clamp(1 - Math.max(0, tmax - crop.heat_limit_c) / 8, 0.2, 1);
  // root zone wetness 0.3 -> 0, 0.6 -> 1
  const soil = clamp((wet - 0.3) / 0.3, 0, 1);

  let water;
  if (crop.system === 'rainfed') water = clamp(effRain / need, 0, 1);
  else if (crop.system === 'perennial') water = clamp(0.3 + (0.7 * effRain) / need, 0, 1);
  else water = 1; // irrigated: assumes the farmer has water access

  const [ymin, ymax] = crop.yield_t_ha;
  const yieldT = ymin + (ymax - ymin) * water * heat;

  let score;
  if (crop.system === 'irrigated') {
    // the more irrigation it needs, the riskier it is in a dry region
    const dependence = 1 - 0.6 * (irrigation / need);
    score = 100 * (0.6 * dependence + 0.25 * heat + 0.15 * soil);
  } else {
    score = 100 * (0.6 * water + 0.25 * heat + 0.15 * soil);
  }
  return { score, yieldT, irrigation };
}

function periodScenario(raw, crop, [a, b]) {
  const results = range(a, b)
    .map((y) => cropInputs(raw, crop, y))
    .filter(Boolean)
    .map((inp) => evaluate(crop, inp));
  const yields = results.map((r) => r.yieldT);
  return {
    score: Math.round(quantile(results.map((r) => r.score), 0.5)),
    yield_t_ha: {
      low: round(quantile(yields, 0.2), 2),
      mid: round(quantile(yields, 0.5), 2),
      high: round(quantile(yields, 0.8), 2),
    },
    irrigation_mm: Math.round(quantile(results.map((r) => r.irrigation), 0.5)),
  };
}

function singleSeasonScenario(raw, crop, season) {
  const inp = cropInputs(raw, crop, season);
  const r = evaluate(crop, inp);
  return {
    season,
    score: Math.round(r.score),
    yield_t_ha: { low: round(r.yieldT * 0.8, 2), mid: round(r.yieldT, 2), high: round(r.yieldT * 1.15, 2) },
    irrigation_mm: Math.round(r.irrigation),
  };
}

// ---------- rotations ----------
const CROP_BY_ID = Object.fromEntries(CROPS.map((c) => [c.id, c]));
const LEGUMES = new Set(['chickpea', 'lentil', 'faba']);
const CEREALS = new Set(['wheat', 'barley']);
// A cereal after a legume needs roughly 30 kg/ha less nitrogen fertiliser (~500 MAD/ha). First estimate.
const N_CREDIT_MAD = 500;

function cropSeason(raw, crop, season, previousId = null) {
  const inp = cropInputs(raw, crop, season);
  if (!inp) return null;
  const r = evaluate(crop, inp);
  const credit = previousId && LEGUMES.has(previousId) && CEREALS.has(crop.id) ? N_CREDIT_MAD : 0;
  const profit = r.yieldT * 1000 * crop.price_mad_per_kg - (crop.cost_mad_per_ha - credit);
  return { ...r, profit };
}

// Replays a rotation over real seasons, for every possible starting crop, and averages.
function replayRotation(raw, rot, [a, b]) {
  const years = range(a, b);
  const L = rot.sequence.length;
  const runs = rot.sequence.map((_, offset) =>
    years
      .map((y, i) =>
        cropSeason(raw, CROP_BY_ID[rot.sequence[(i + offset) % L]], y, rot.sequence[(i + offset - 1 + L) % L]),
      )
      .filter(Boolean),
  );
  const all = runs.flat();
  return {
    seasons: years.length,
    score: Math.round(mean(all.map((r) => r.score))),
    profit: Math.round(mean(all.map((r) => r.profit)) / 100) * 100,
    failed: round(mean(runs.map((run) => run.filter((r) => r.profit < 0).length)), 1),
    water: Math.round(mean(all.map((r) => r.irrigation))),
  };
}

function buildRotations(raw, driestYear) {
  const out = ROTATIONS.map((rot) => {
    const recent = replayRotation(raw, rot, RECENT_PERIOD);
    const baseline = replayRotation(raw, rot, BASELINE_PERIOD);
    const dry = rot.sequence.map((id) => cropSeason(raw, CROP_BY_ID[id], driestYear));
    return {
      id: rot.id,
      name: rot.name,
      current: !!rot.current,
      sequence: rot.sequence,
      metrics: {
        score: recent.score,
        baseline_score: baseline.score,
        avg_profit_mad_ha: recent.profit,
        failed_seasons: recent.failed,
        seasons: recent.seasons,
        dry_year: driestYear,
        dry_year_score: Math.round(mean(dry.map((r) => r.score))),
        extra_water_mm: recent.water,
      },
      soil: rot.soil,
      why: rot.why,
      benefits: rot.benefits,
      risks: rot.risks,
      gaps: rot.gaps,
    };
  });
  const base = out.find((r) => r.current);
  for (const r of out) {
    const m = r.metrics;
    const [a, b] = RECENT_PERIOD;
    r.evidence = [
      `Replayed on the real ${a}-${b} seasons, it would have lost money in ${m.failed_seasons} of ${m.seasons} seasons` +
        (r.current ? '.' : ` (wheat after wheat: ${base.metrics.failed_seasons}).`),
      `Climate fit ${m.score}/100 today, ${m.baseline_score}/100 with the 1991-2005 climate.`,
      `In the driest recent season (${m.dry_year - 1}-${m.dry_year}), its crops score ${m.dry_year_score}/100` +
        (r.current ? '.' : ` (wheat after wheat: ${base.metrics.dry_year_score}).`),
      `Needs about ${m.extra_water_mm} mm of extra water per season to reach full yield (${m.extra_water_mm * 10} m³/ha).`,
    ];
    if (r.sequence.some((id) => LEGUMES.has(id))) {
      r.evidence.push(`Income includes about ${N_CREDIT_MAD} MAD/ha saved on nitrogen fertiliser for the cereal that follows the legume (estimate).`);
    }
  }
  return out;
}

// Average month of the recent period: rain, heat, hot days. Used for the season calendar.
function monthlyProfile(raw, [a, b]) {
  return range(1, 12).map((m) => {
    const recs = range(a, b).map((y) => raw.get(`${y}${String(m).padStart(2, '0')}`)).filter(Boolean);
    return {
      month: m,
      rain_mm: round(mean(recs.map((r) => r.rain))),
      t_max_c: round(mean(recs.map((r) => r.tmax)), 1),
      hot_days: round(mean(recs.map((r) => r.hot)), 1),
    };
  });
}

// ---------- main ----------
async function buildRegion(region) {
  const raw = aggregateMonths(JSON.parse(await readFile(join(RAW_DIR, `${region.id}.json`), 'utf8')));

  const seasons = range(FIRST_SEASON, LAST_SEASON).map((y) => climateSeason(raw, y)).filter(Boolean);
  const climate = {
    region_id: region.id,
    source: 'NASA POWER daily (MERRA-2 / GEOS), community AG, aggregated by month',
    baseline_period: BASELINE_PERIOD,
    recent_period: RECENT_PERIOD,
    seasons,
    summary: {
      baseline: periodSummary(seasons, BASELINE_PERIOD),
      recent: periodSummary(seasons, RECENT_PERIOD),
    },
    monthly: monthlyProfile(raw, RECENT_PERIOD),
  };

  const recent = seasons.filter((s) => s.year >= RECENT_PERIOD[0] && s.year <= RECENT_PERIOD[1]);
  const driest = recent.reduce((a, b) => (b.rain_season_mm < a.rain_season_mm ? b : a));

  const crops = CROPS.map((crop) => {
    const baseline = periodScenario(raw, crop, BASELINE_PERIOD);
    const recentS = periodScenario(raw, crop, RECENT_PERIOD);
    return {
      id: crop.id,
      name: crop.name,
      system: crop.system,
      planting_window: crop.planting_window,
      harvest_window: crop.harvest_window,
      water_need_mm: crop.water_need_mm,
      months: crop.months,
      critical_months: crop.critical_months,
      price_mad_per_kg: crop.price_mad_per_kg,
      cost_mad_per_ha: crop.cost_mad_per_ha,
      scenarios: { baseline, recent: recentS, dry_year: singleSeasonScenario(raw, crop, driest.year) },
      score_change: recentS.score - baseline.score,
      notes: crop.notes,
    };
  }).sort((a, b) => b.scenarios.recent.score - a.scenarios.recent.score);

  const recommendations = {
    region_id: region.id,
    generated_at: new Date().toISOString(),
    method: 'rule-based v1 (water balance + heat stress + root zone soil wetness)',
    crops,
    rotations: buildRotations(raw, driest.year),
    soil_labels: SOIL_LABELS,
  };

  const dir = join(OUT_DIR, region.id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'climate_history.json'), JSON.stringify(climate, null, 2));
  await writeFile(join(dir, 'recommendations.json'), JSON.stringify(recommendations, null, 2));

  const b = climate.summary.baseline;
  const r = climate.summary.recent;
  console.log(
    `${region.id}: ${seasons.length} seasons | rain ${b.rain_season_mm} -> ${r.rain_season_mm} mm | ` +
      `spring Tmax ${b.t_max_spring_c} -> ${r.t_max_spring_c} °C | hot spring days ${b.hot_days_spring} -> ${r.hot_days_spring} | ` +
      `dry seasons ${b.dry_seasons} -> ${r.dry_seasons} | driest recent season ${driest.year}`,
  );
  for (const c of crops) {
    console.log(`   ${c.name.padEnd(20)} score ${c.scenarios.baseline.score} -> ${c.scenarios.recent.score}`);
  }
  for (const r of recommendations.rotations) {
    const m = r.metrics;
    console.log(
      `   ROT ${r.name.padEnd(24)} score ${m.baseline_score} -> ${m.score} | dry ${m.dry_year_score} | ` +
        `profit ${m.avg_profit_mad_ha} MAD/ha | lost money ${m.failed_seasons}/${m.seasons} | water ${m.extra_water_mm} mm`,
    );
  }
}

await mkdir(OUT_DIR, { recursive: true });
for (const region of REGIONS) await buildRegion(region);
await writeFile(join(OUT_DIR, 'regions.json'), JSON.stringify(REGIONS, null, 2));

// copy to the app so it can serve the files
await mkdir(APP_DATA_DIR, { recursive: true });
await cp(OUT_DIR, APP_DATA_DIR, { recursive: true });
console.log(`copied output to ${APP_DATA_DIR}`);
