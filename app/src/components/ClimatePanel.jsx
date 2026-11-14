import {
  ResponsiveContainer, ComposedChart, Bar, Cell, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Line,
} from 'recharts';
import { fmt } from '../lib/data';

const DRY_MM = 250;

function Stat({ label, before, after, unit, decimals = 0, worseIfUp }) {
  const diff = after - before;
  const worse = worseIfUp ? diff > 0 : diff < 0;
  const pct = before ? Math.round((diff / before) * 100) : 0;
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-values">
        <span className="stat-before">{fmt(before, decimals)}</span>
        <span className="arrow">→</span>
        <span className="stat-after">{fmt(after, decimals)}</span>
        <span className="stat-unit">{unit}</span>
      </div>
      <div className={`stat-change ${worse ? 'bad' : 'good'}`}>
        {diff > 0 ? '+' : ''}{pct}% {worse ? 'worse for crops' : 'better for crops'}
      </div>
    </div>
  );
}

export default function ClimatePanel({ climate }) {
  const { baseline, recent } = climate.summary;
  const [b0, b1] = climate.baseline_period;
  const [r0, r1] = climate.recent_period;
  const data = climate.seasons;
  const last4 = data.slice(-4);
  const lastDry = last4.filter((s) => s.rain_season_mm < DRY_MM).length;

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>What changed in this region</h2>
        <p className="muted">
          Comparing {b0}-{b1} with {r0}-{r1}, from NASA POWER satellite-based data.
        </p>
      </header>

      <div className="stats">
        <Stat label="Hot spring days (≥30 °C, Mar-May)" before={baseline.hot_days_spring} after={recent.hot_days_spring} unit="days" worseIfUp />
        <Stat label={`Dry seasons (< ${DRY_MM} mm) per 15 years`} before={baseline.dry_seasons} after={recent.dry_seasons} unit="" worseIfUp />
        <Stat label="Spring max temperature" before={baseline.t_max_spring_c} after={recent.t_max_spring_c} unit="°C" decimals={1} worseIfUp />
        <Stat label="Season rainfall (Oct-May)" before={baseline.rain_season_mm} after={recent.rain_season_mm} unit="mm" />
      </div>

      {lastDry >= 3 && (
        <div className="callout bad">
          {lastDry} of the last 4 seasons were dry. Average rainfall hides it: a few very wet years
          pull the average up, while dry years are becoming more frequent.
        </div>
      )}

      <h3>Rainfall per season</h3>
      <div className="chart">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={3} />
            <YAxis tick={{ fontSize: 11 }} unit=" mm" width={64} />
            <Tooltip formatter={(v) => [`${fmt(v)} mm`, 'Rain Oct-May']} labelFormatter={(y) => `Season ${y - 1}-${y}`} />
            <ReferenceLine y={DRY_MM} stroke="var(--bad)" strokeDasharray="4 4" label={{ value: 'dry', fontSize: 11, fill: 'var(--bad)', position: 'insideTopLeft' }} />
            <Bar dataKey="rain_season_mm" radius={[3, 3, 0, 0]}>
              {data.map((s) => (
                <Cell key={s.year} fill={s.rain_season_mm < DRY_MM ? 'var(--bad)' : 'var(--water)'} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <h3>Hot days in spring (max ≥ 30 °C, March to May)</h3>
      <div className="chart">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={3} />
            <YAxis tick={{ fontSize: 11 }} width={64} />
            <Tooltip formatter={(v) => [`${v} days`, 'Hot days']} labelFormatter={(y) => `Spring ${y}`} />
            <ReferenceLine y={baseline.hot_days_spring} stroke="var(--muted)" strokeDasharray="4 4" label={{ value: `${b0}-${b1} avg`, fontSize: 11, position: 'insideTopLeft' }} />
            <Line dataKey="hot_days_spring" stroke="var(--heat)" strokeWidth={2.5} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
