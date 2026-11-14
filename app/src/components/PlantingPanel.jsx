import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { loadPlantingData, fmt } from '../lib/data';

const CROP_NAMES = { wheat: 'Wheat', barley: 'Barley' };
const MONTHS = ['October', 'November', 'December', 'No qualifying window'];
const mmdd = (s) => {
  const [m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(2000, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};
const shortDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// Results from the team's Python data science pipeline (data-science/ in the repo).
export default function PlantingPanel({ regionId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [year, setYear] = useState(null);

  useEffect(() => {
    setData(null);
    setError('');
    loadPlantingData(regionId)
      .then((d) => { setData(d); setYear(d.replay.replay[0]?.year ?? null); })
      .catch(() => setError('Planting data is not available for this region.'));
  }, [regionId]);

  const season = data?.replay.replay.find((r) => r.year === year);
  const series = useMemo(
    () => (season?.forecasts || []).map((f) => ({
      date: f.as_of,
      label: shortDate(f.as_of),
      hist: Math.round(f.historical_probability * 100),
      ml: Math.round(f.ml_probability * 100),
    })),
    [season],
  );

  if (error) return <section className="panel"><p className="muted">{error}</p></section>;
  if (!data) return <section className="panel loading"><div className="spinner" aria-hidden /> Loading planting data…</section>;

  const { screening, replay, outlook } = data;
  const counts = outlook.onset_counts;
  const maxCount = Math.max(...Object.values(counts), 1);
  const ev = replay.evaluation;
  const firstRainLabel = season?.observed_first_rain_date ? shortDate(season.observed_first_rain_date) : null;
  const firstRainInRange = season?.observed_first_rain_date && series.some((p) => p.date === season.observed_first_rain_date);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>When do the autumn rains arrive?</h2>
        <p className="muted">
          Rainfed wheat and barley need a first real rain before sowing. Following Moroccan research (INRA), we count it
          when 10 days of rain add up to at least {replay.rain_threshold_mm} mm. Daily NASA POWER data, {outlook.seasons} seasons
          ({screening.site?.name}).
        </p>
      </header>

      <h3>Month of the first real autumn rain</h3>
      <div className="onset">
        {MONTHS.map((m) => (
          <div key={m} className="onset-row">
            <span className="onset-name">{m === 'No qualifying window' ? 'Never (dry autumn)' : m}</span>
            <span className="onset-track"><span className={`onset-fill ${m === 'No qualifying window' ? 'bad' : ''}`} style={{ width: `${((counts[m] || 0) / maxCount) * 100}%` }} /></span>
            <span className="onset-val">{counts[m] || 0} of {outlook.seasons}</span>
          </div>
        ))}
      </div>

      <h3>Rainfed cereal screening</h3>
      <div className="screen-cards">
        {screening.crops.map((c) => {
          const w = c.water_estimate;
          const pw = c.planting_window;
          return (
            <article key={c.crop_id} className="screen-card">
              <div className="screen-head">
                <h3>{CROP_NAMES[c.crop_id] || c.crop_id}</h3>
                <span className="screen-score">{fmt(c.suitability_score)}<small>/100</small></span>
              </div>
              <dl className="facts">
                <div><dt>Sowing window</dt><dd>{mmdd(pw.start_mm_dd)} - {mmdd(pw.end_mm_dd)}</dd></div>
                <div><dt>Seasons with a sowing rain</dt><dd>{pw.seasons_with_rainfall_signal} of {pw.seasons_evaluated}</dd></div>
                <div><dt>Typical first sowing rain</dt><dd>{mmdd(pw.median_signal_mm_dd)}</dd></div>
                <div><dt>Crop water demand (median)</dt><dd>{fmt(c.crop_water_demand_mm)} mm</dd></div>
                <div><dt>Season rainfall (median)</dt><dd>{fmt(w.median_gross_rainfall_mm)} mm</dd></div>
              </dl>
              <div className="demand-bar" aria-label={`Rain covers about ${Math.round((w.median_gross_rainfall_mm / c.crop_water_demand_mm) * 100)} percent of the crop water demand`}>
                <span style={{ width: `${Math.min(100, (w.median_gross_rainfall_mm / c.crop_water_demand_mm) * 100)}%` }} />
              </div>
              <p className="muted small">Rain covers about {Math.round((w.median_gross_rainfall_mm / c.crop_water_demand_mm) * 100)} % of the potential crop water demand.</p>
            </article>
          );
        })}
      </div>
      <p className="muted small">
        Historical climate screen: score = share of crop water demand covered by seasonal rain, 0 when no sowing rain
        came (sowing years 2006-2024). Water demand uses Hargreaves reference ET × FAO-56 crop coefficients. It is not a
        probability of crop success.
      </p>

      <h3>Will it rain in the next 14 days? Historical replay</h3>
      <p className="muted small">
        For each autumn day before the first real rain, the chance that it arrives in the next 14 days. The historical
        rate is shown first; the experimental machine learning model (logistic regression) is shown beside it.
        Replayed on test seasons the model never saw.
      </p>
      <div className="segmented">
        {replay.replay.map((r) => (
          <button key={r.year} className={r.year === year ? 'on' : ''} onClick={() => setYear(r.year)}>{r.year}</button>
        ))}
      </div>
      <div className="legend-row">
        <span><i className="sw hist" /> Historical rate</span>
        <span><i className="sw ml" /> ML model (experimental)</span>
        {firstRainLabel && <span><i className="sw rain" /> First real rain: {firstRainLabel}</span>}
        {!season?.observed_first_rain_date && <span className="muted">No real rain came this autumn</span>}
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={30} />
            <YAxis tick={{ fontSize: 11 }} unit="%" width={52} domain={[0, 100]} />
            <Tooltip formatter={(v, n) => [`${v} %`, n === 'hist' ? 'Historical rate' : 'ML model']} />
            {firstRainInRange && (
              <ReferenceLine x={shortDate(season.observed_first_rain_date)} stroke="#2f6dae" strokeDasharray="4 4" />
            )}
            <Line dataKey="hist" stroke="#215a39" strokeWidth={2.5} dot={false} />
            <Line dataKey="ml" stroke="#d9622b" strokeWidth={2} strokeDasharray="5 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="callout mid">
        Honest result: on the {ev.holdout_seasons_scored} test seasons ({ev.holdout_years[0]}-{ev.holdout_years[1]}), the ML model
        (Brier score {ev.ml_brier_score.toFixed(3)}) did not beat the simple historical rate ({ev.historical_brier_score.toFixed(3)});
        lower is better. With only {ev.holdout_seasons_scored} test seasons, we keep the historical rate as the main indicator and the
        model as an experiment. Sowing decisions should also use field moisture and the current weather forecast.
      </div>
      <p className="muted small">
        Built by our data scientist in Python from NASA POWER daily data. Rain threshold from{' '}
        <a href={replay.threshold_source} target="_blank" rel="noreferrer">INRA Morocco</a>. Code in the{' '}
        <a href="https://github.com/eduaiwebapp-gif/Field-shift/tree/main/data-science" target="_blank" rel="noreferrer">data-science</a> folder.
      </p>
    </section>
  );
}
