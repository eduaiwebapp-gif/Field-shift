import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { loadPlantingData, fmt, dateLocale } from '../lib/data';
import { useLang } from '../lib/i18n';
import CropIcon from './CropIcon';
import RainCheck from './RainCheck';

const CROP_NAMES = { wheat: 'Wheat', barley: 'Barley' };
const CROP_NAMES_FR = { wheat: 'Blé', barley: 'Orge' };
const MONTHS = ['October', 'November', 'December', 'No qualifying window'];
const mmdd = (s) => {
  const [m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(2000, m - 1, d)).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });
};
const shortDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' });

// Results from the team's Python data science pipeline (data-science/ in the repo).
export default function PlantingPanel({ regionId }) {
  const { L, lang } = useLang();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [year, setYear] = useState(null);

  useEffect(() => {
    setData(null);
    setError('');
    loadPlantingData(regionId)
      .then((d) => { setData(d); setYear(d.replay.replay[0]?.year ?? null); })
      .catch(() => setError('nodata'));
  }, [regionId]);

  const season = data?.replay.replay.find((r) => r.year === year);
  const series = useMemo(
    () => (season?.forecasts || []).map((f) => ({
      date: f.as_of,
      label: shortDate(f.as_of),
      hist: Math.round(f.historical_probability * 100),
      ml: Math.round(f.ml_probability * 100),
    })),
    [season, lang],
  );

  if (error) return <section className="panel"><p className="muted">{L('Planting data is not available for this region.', 'Les données de semis ne sont pas disponibles pour cette région.')}</p></section>;
  if (!data) return <section className="panel loading"><div className="spinner" aria-hidden /> {L('Loading planting data…', 'Chargement des données de semis…')}</section>;

  const { screening, replay, outlook } = data;
  const counts = outlook.onset_counts;
  const maxCount = Math.max(...Object.values(counts), 1);
  const ev = replay.evaluation;
  const firstRainLabel = season?.observed_first_rain_date ? shortDate(season.observed_first_rain_date) : null;
  const firstRainInRange = season?.observed_first_rain_date && series.some((p) => p.date === season.observed_first_rain_date);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{L('When do the autumn rains arrive?', 'Quand arrivent les pluies d’automne ?')}</h2>
        <p className="muted">
          {L(`Rainfed wheat and barley need a first real rain before sowing. Following Moroccan research (INRA), we count it when 10 days of rain add up to at least ${replay.rain_threshold_mm} mm. Daily NASA POWER data, ${outlook.seasons} seasons (${screening.site?.name}).`,
            `Le blé et l’orge pluviaux ont besoin d’une première vraie pluie avant le semis. D’après la recherche marocaine (INRA), nous la comptons quand 10 jours de pluie font au moins ${replay.rain_threshold_mm} mm. Données journalières NASA POWER, ${outlook.seasons} saisons (${screening.site?.name}).`)}
        </p>
      </header>

      <h3>{L('Month of the first real autumn rain', 'Mois de la première vraie pluie d’automne')}</h3>
      <div className="onset">
        {MONTHS.map((m) => (
          <div key={m} className="onset-row">
            <span className="onset-name">{m === 'No qualifying window' ? L('Never (dry autumn)', 'Jamais (automne sec)') : L(m, { October: 'Octobre', November: 'Novembre', December: 'Décembre' }[m])}</span>
            <span className="onset-track"><span className={`onset-fill ${m === 'No qualifying window' ? 'bad' : ''}`} style={{ width: `${((counts[m] || 0) / maxCount) * 100}%` }} /></span>
            <span className="onset-val">{counts[m] || 0} {L('of', 'sur')} {outlook.seasons}</span>
          </div>
        ))}
      </div>

      <h3>{L('Rainfed cereal screening', 'Sélection des céréales pluviales')}</h3>
      <div className="screen-cards">
        {screening.crops.map((c) => {
          const w = c.water_estimate;
          const pw = c.planting_window;
          return (
            <article key={c.crop_id} className="screen-card">
              <div className="screen-head">
                <h3 className="crop-title"><span className="crop-badge"><CropIcon id={c.crop_id} size={26} /></span>{L(CROP_NAMES[c.crop_id], CROP_NAMES_FR[c.crop_id]) || c.crop_id}</h3>
                <span className="screen-score">{fmt(c.suitability_score)}<small>/100</small></span>
              </div>
              <dl className="facts">
                <div><dt>{L('Sowing window', 'Période de semis')}</dt><dd>{mmdd(pw.start_mm_dd)} - {mmdd(pw.end_mm_dd)}</dd></div>
                <div><dt>{L('Seasons with a sowing rain', 'Saisons avec une pluie de semis')}</dt><dd>{pw.seasons_with_rainfall_signal} {L('of', 'sur')} {pw.seasons_evaluated}</dd></div>
                <div><dt>{L('Typical first sowing rain', 'Première pluie de semis typique')}</dt><dd>{mmdd(pw.median_signal_mm_dd)}</dd></div>
                <div><dt>{L('Crop water demand (median)', 'Besoin en eau de la culture (médiane)')}</dt><dd>{fmt(c.crop_water_demand_mm)} mm</dd></div>
                <div><dt>{L('Season rainfall (median)', 'Pluie de la saison (médiane)')}</dt><dd>{fmt(w.median_gross_rainfall_mm)} mm</dd></div>
              </dl>
              <div className="demand-bar" aria-label={L(`Rain covers about ${Math.round((w.median_gross_rainfall_mm / c.crop_water_demand_mm) * 100)} percent of the crop water demand`, `La pluie couvre environ ${Math.round((w.median_gross_rainfall_mm / c.crop_water_demand_mm) * 100)} % du besoin en eau`)}>
                <span style={{ width: `${Math.min(100, (w.median_gross_rainfall_mm / c.crop_water_demand_mm) * 100)}%` }} />
              </div>
              <p className="muted small">{L(`Rain covers about ${Math.round((w.median_gross_rainfall_mm / c.crop_water_demand_mm) * 100)} % of the potential crop water demand.`, `La pluie couvre environ ${Math.round((w.median_gross_rainfall_mm / c.crop_water_demand_mm) * 100)} % du besoin en eau potentiel de la culture.`)}</p>
            </article>
          );
        })}
      </div>
      <p className="muted small">
        {L('Historical climate screen: score = share of crop water demand covered by seasonal rain, 0 when no sowing rain came (sowing years 2006-2024). Water demand uses Hargreaves reference ET × FAO-56 crop coefficients. It is not a probability of crop success.',
          'Filtre climatique historique : score = part du besoin en eau couverte par la pluie de la saison, 0 quand aucune pluie de semis n’est venue (années de semis 2006-2024). Le besoin en eau utilise l’ET de référence de Hargreaves × les coefficients culturaux FAO-56. Ce n’est pas une probabilité de réussite de la culture.')}
      </p>

      <h3>{L('Will it rain in the next 14 days? Historical replay', 'Va-t-il pleuvoir dans les 14 jours ? Rejeu historique')}</h3>
      <p className="muted small">
        {L('For each autumn day before the first real rain, the chance that it arrives in the next 14 days. The historical rate is shown first; the experimental machine learning model (logistic regression) is shown beside it. Replayed on test seasons the model never saw.',
          'Pour chaque jour d’automne avant la première vraie pluie, la probabilité qu’elle arrive dans les 14 jours. Le taux historique est montré en premier, le modèle expérimental de machine learning (régression logistique) à côté. Rejoué sur des saisons de test que le modèle n’a jamais vues.')}
      </p>
      <div className="segmented">
        {replay.replay.map((r) => (
          <button key={r.year} className={r.year === year ? 'on' : ''} onClick={() => setYear(r.year)}>{r.year}</button>
        ))}
      </div>
      <div className="legend-row">
        <span><i className="sw hist" /> {L('Historical rate', 'Taux historique')}</span>
        <span><i className="sw ml" /> {L('ML model (experimental)', 'Modèle ML (expérimental)')}</span>
        {firstRainLabel && <span><i className="sw rain" /> {L('First real rain:', 'Première vraie pluie :')} {firstRainLabel}</span>}
        {!season?.observed_first_rain_date && <span className="muted">{L('No real rain came this autumn', 'Aucune vraie pluie cet automne')}</span>}
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={30} />
            <YAxis tick={{ fontSize: 11 }} unit="%" width={52} domain={[0, 100]} />
            <Tooltip formatter={(v, n) => [`${v} %`, n === 'hist' ? L('Historical rate', 'Taux historique') : L('ML model', 'Modèle ML')]} />
            {firstRainInRange && (
              <ReferenceLine x={shortDate(season.observed_first_rain_date)} stroke="#2f6dae" strokeDasharray="4 4" />
            )}
            <Line dataKey="hist" stroke="#215a39" strokeWidth={2.5} dot={false} />
            <Line dataKey="ml" stroke="#d9622b" strokeWidth={2} strokeDasharray="5 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="callout mid">
        {L(`Honest result: on the ${ev.holdout_seasons_scored} test seasons (${ev.holdout_years[0]}-${ev.holdout_years[1]}, ${ev.holdout_rows} daily forecasts, model trained on ${ev.training_years[0]}-${ev.training_years[1]}), the ML model (Brier score ${fmt(ev.ml_brier_score, 3)}) did not beat the simple historical rate (${fmt(ev.historical_brier_score, 3)}); lower is better. With only ${ev.holdout_seasons_scored} test seasons, we keep the historical rate as the main indicator and the model as an experiment. Sowing decisions should also use field moisture and the current weather forecast.`,
          `Résultat honnête : sur les ${ev.holdout_seasons_scored} saisons de test (${ev.holdout_years[0]}-${ev.holdout_years[1]}, ${ev.holdout_rows} prévisions journalières, modèle entraîné sur ${ev.training_years[0]}-${ev.training_years[1]}), le modèle ML (score de Brier ${fmt(ev.ml_brier_score, 3)}) n’a pas battu le simple taux historique (${fmt(ev.historical_brier_score, 3)}) ; plus c’est bas, mieux c’est. Avec seulement ${ev.holdout_seasons_scored} saisons de test, nous gardons le taux historique comme indicateur principal et le modèle comme expérience. La décision de semer doit aussi tenir compte de l’humidité du champ et de la météo du moment.`)}
      </div>
      <RainCheck regionId={regionId} />
      <p className="muted small">
        {L('Built by our data scientist in Python from NASA POWER daily data. Rain threshold from', 'Réalisé par notre data scientist en Python à partir des données journalières NASA POWER. Seuil de pluie de l’')}{' '}
        <a href={replay.threshold_source} target="_blank" rel="noreferrer">{L('INRA Morocco', 'INRA Maroc')}</a>. {L('Result files in the', 'Fichiers de résultats dans le dossier')}{' '}
        <a href="https://github.com/eduaiwebapp-gif/SeasonReplay/tree/main/data-science/handoff" target="_blank" rel="noreferrer">data-science/handoff</a>{L(' folder.', '.')}
      </p>
    </section>
  );
}
