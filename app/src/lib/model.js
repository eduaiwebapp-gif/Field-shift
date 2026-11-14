// Same rule-based model as data/pipeline/build.mjs, run in the browser for what-if scenarios.
// rainFactor: 1 = observed rain, 0.8 = 20 % less. heatDelta: °C added to max temperatures.
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function evaluate(crop, { rain, tmax, wet }, effRainShare) {
  const need = crop.water_need_mm;
  const effRain = effRainShare * rain;
  const irrigation = Math.max(0, need - effRain);
  const heat = clamp(1 - Math.max(0, tmax - crop.heat_limit_c) / 8, 0.2, 1);
  const soil = clamp((wet - 0.3) / 0.3, 0, 1);
  let water;
  if (crop.system === 'rainfed') water = clamp(effRain / need, 0, 1);
  else if (crop.system === 'perennial') water = clamp(0.3 + (0.7 * effRain) / need, 0, 1);
  else water = 1;
  const [ymin, ymax] = crop.yield_t_ha;
  const yieldT = ymin + (ymax - ymin) * water * heat;
  const score =
    crop.system === 'irrigated'
      ? 100 * (0.6 * (1 - 0.6 * (irrigation / need)) + 0.25 * heat + 0.15 * soil)
      : 100 * (0.6 * water + 0.25 * heat + 0.15 * soil);
  return { score, yieldT, irrigation };
}

function season(model, id, s, prevId, rainFactor, heatDelta) {
  const crop = model.crops[id];
  // drier soil when it rains less: scale the wetness above the 0.3 floor
  const wet = 0.3 + (s.wet - 0.3) * rainFactor;
  const r = evaluate(crop, { rain: s.rain * rainFactor, tmax: s.tmax + heatDelta, wet }, model.effective_rain);
  const credit = prevId && model.legumes.includes(prevId) && model.cereals.includes(id) ? model.n_credit_mad : 0;
  const profit = r.yieldT * 1000 * crop.price_mad_per_kg - (crop.cost_mad_per_ha - credit);
  return { ...r, profit };
}

export function rotationMetrics(model, rot, rainFactor = 1, heatDelta = 0) {
  const L = rot.sequence.length;
  const years = model.crops[rot.sequence[0]].seasons.map((s) => s.year);
  const tables = Object.fromEntries(
    rot.sequence.map((id) => [id, Object.fromEntries(model.crops[id].seasons.map((s) => [s.year, s]))]),
  );
  const runs = rot.sequence.map((_, offset) =>
    years
      .map((y, i) => {
        const id = rot.sequence[(i + offset) % L];
        const s = tables[id][y];
        return s && season(model, id, s, rot.sequence[(i + offset - 1 + L) % L], rainFactor, heatDelta);
      })
      .filter(Boolean),
  );
  const all = runs.flat();
  const dry = rot.sequence.map((id) => season(model, id, tables[id][model.dry_year], null, rainFactor, heatDelta));
  return {
    ...rot.metrics,
    score: Math.round(mean(all.map((r) => r.score))),
    avg_profit_mad_ha: Math.round(mean(all.map((r) => r.profit)) / 100) * 100,
    failed_seasons: Math.round(mean(runs.map((run) => run.filter((r) => r.profit < 0).length)) * 10) / 10,
    dry_year_score: Math.round(mean(dry.map((r) => r.score))),
    extra_water_mm: Math.round(mean(all.map((r) => r.irrigation))),
  };
}
