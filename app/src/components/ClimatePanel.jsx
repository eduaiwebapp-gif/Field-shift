import {
  ResponsiveContainer, ComposedChart, Bar, Cell, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Area,
} from 'recharts';
import { fmt } from '../lib/data';
import { useLang } from '../lib/i18n';

const DRY_MM = 250;

function Stat({ label, before, after, unit, decimals = 0, worseIfUp }) {
  const { L } = useLang();
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
        {diff > 0 ? '+' : ''}{pct} % {worse ? L('worse for crops', 'plus dur pour les cultures') : L('better for crops', 'meilleur pour les cultures')}
      </div>
    </div>
  );
}

export default function ClimatePanel({ climate }) {
  const { L } = useLang();
  const { baseline, recent } = climate.summary;
  const [b0, b1] = climate.baseline_period;
  const [r0, r1] = climate.recent_period;
  const data = climate.seasons;
  const last4 = data.slice(-4);
  const lastDry = last4.filter((s) => s.rain_season_mm < DRY_MM).length;

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{L('What changed in this region', 'Ce qui a changé dans cette région')}</h2>
        <p className="muted">
          {L(`Comparing ${b0}-${b1} with ${r0}-${r1}, from NASA POWER satellite-based data.`, `Comparaison de ${b0}-${b1} avec ${r0}-${r1}, d’après les données satellitaires NASA POWER.`)}
        </p>
      </header>

      <div className="stats">
        <Stat label={L('Hot spring days (≥30 °C, Mar-May)', 'Jours chauds au printemps (≥30 °C, mars-mai)')} before={baseline.hot_days_spring} after={recent.hot_days_spring} unit={L('days', 'jours')} worseIfUp />
        <Stat label={L(`Dry seasons (< ${DRY_MM} mm) per 15 years`, `Saisons sèches (< ${DRY_MM} mm) sur 15 ans`)} before={baseline.dry_seasons} after={recent.dry_seasons} unit="" worseIfUp />
        <Stat label={L('Spring max temperature', 'Température max au printemps')} before={baseline.t_max_spring_c} after={recent.t_max_spring_c} unit="°C" decimals={1} worseIfUp />
        <Stat label={L('Season rainfall (Oct-May)', 'Pluie de la saison (oct-mai)')} before={baseline.rain_season_mm} after={recent.rain_season_mm} unit="mm" />
      </div>

      {lastDry >= 3 && (
        <div className="callout bad">
          {L(`${lastDry} of the last 4 seasons were dry. Average rainfall hides it: a few very wet years pull the average up, while dry years are becoming more frequent.`,
            `${lastDry} des 4 dernières saisons ont été sèches. La pluie moyenne le cache : quelques années très humides tirent la moyenne vers le haut, alors que les années sèches deviennent plus fréquentes.`)}
        </div>
      )}

      <h3>{L('Rainfall per season', 'Pluie par saison')}</h3>
      <div className="chart">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={3} />
            <YAxis tick={{ fontSize: 11 }} unit=" mm" width={64} />
            <Tooltip formatter={(v) => [`${fmt(v)} mm`, L('Rain Oct-May', 'Pluie oct-mai')]} labelFormatter={(y) => `${L('Season', 'Saison')} ${y - 1}-${y}`} />
            <ReferenceLine y={DRY_MM} stroke="var(--bad)" strokeDasharray="4 4" label={{ value: L('dry', 'sec'), fontSize: 11, fill: 'var(--bad)', position: 'insideTopLeft' }} />
            <Bar dataKey="rain_season_mm" radius={[3, 3, 0, 0]}>
              {data.map((s) => (
                <Cell key={s.year} fill={s.rain_season_mm < DRY_MM ? '#c2462f' : '#3a7bbf'} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <h3>{L('Hot days in spring (max ≥ 30 °C, March to May)', 'Jours chauds au printemps (max ≥ 30 °C, de mars à mai)')}</h3>
      <div className="chart">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={3} />
            <YAxis tick={{ fontSize: 11 }} width={64} />
            <Tooltip formatter={(v) => [`${v} ${L('days', 'jours')}`, L('Hot days', 'Jours chauds')]} labelFormatter={(y) => `${L('Spring', 'Printemps')} ${y}`} />
            <ReferenceLine y={baseline.hot_days_spring} stroke="var(--muted)" strokeDasharray="4 4" label={{ value: L(`${b0}-${b1} avg`, `moy. ${b0}-${b1}`), fontSize: 11, position: 'insideTopLeft' }} />
            <defs>
              <linearGradient id="gHeat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d9622b" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#d9622b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area dataKey="hot_days_spring" type="monotone" stroke="#d9622b" fill="url(#gHeat)" strokeWidth={2.5} dot={{ r: 2, fill: '#d9622b' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
