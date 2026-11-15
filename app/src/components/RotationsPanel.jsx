import { useMemo, useState } from 'react';
import SeasonCalendar from './SeasonCalendar';
import { rotationMetrics } from '../lib/model';
import CropIcon from './CropIcon';
import { fmt } from '../lib/data';
import { useLang } from '../lib/i18n';

const PRIORITIES = [
  { id: 'income', label: 'Income', label_fr: 'Revenu' },
  { id: 'safety', label: 'Safe in dry years', label_fr: 'Sûr en année sèche' },
  { id: 'water', label: 'Save water', label_fr: 'Économiser l’eau' },
  { id: 'soil', label: 'Soil health', label_fr: 'Santé du sol' },
];

const LEVELS = ['Not important', 'A little', 'Important', 'Very important'];
const LEVELS_FR = ['Pas important', 'Un peu', 'Important', 'Très important'];

// 0-1 position of v between the worst and best value across rotations
function norm(values, v, higherIsBetter = true) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (hi === lo) return 1;
  const x = (v - lo) / (hi - lo);
  return higherIsBetter ? x : 1 - x;
}

function soilTotal(r) {
  return Object.values(r.soil).reduce((a, b) => a + b, 0);
}

function Dots({ n }) {
  const { L } = useLang();
  return (
    <span className="dots" aria-label={L(`${n} out of 3`, `${n} sur 3`)}>
      {[1, 2, 3].map((i) => <span key={i} className={i <= n ? 'dot on' : 'dot'} />)}
    </span>
  );
}

function RotationCard({ r, match, best, cropNames, soilLabels, base, open, onToggle, whatIfLabel }) {
  const { L, pick } = useLang();
  const m = r.metrics;
  const profitDiff = m.avg_profit_mad_ha - base.metrics.avg_profit_mad_ha;
  return (
    <article className={`rot ${best ? 'best' : ''}`}>
      <div className="rot-head">
        <div>
          <div className="rot-tags">
            {r.current && <span className="tag">{L('Current practice', 'Pratique actuelle')}</span>}
            {best && <span className="tag tag-best">{L('Best match for your priorities', 'La plus adaptée à vos priorités')}</span>}
          </div>
          <h3>{pick(r, 'name')}</h3>
          <div className="chips">
            {r.sequence.map((id, i) => (
              <span key={i} className="chip"><CropIcon id={id} size={16} /> {L(`Year ${i + 1}`, `Année ${i + 1}`)}{L(':', ' :')} {cropNames[id]}</span>
            ))}
            <span className="chip ghost">{L('then repeat', 'puis on recommence')}</span>
          </div>
        </div>
        <div className="match" aria-label={L(`${match}% match with your priorities`, `${match} % de correspondance avec vos priorités`)}>
          <svg className="match-ring" viewBox="0 0 66 66" aria-hidden="true">
            <circle cx="33" cy="33" r="28" fill="none" stroke="#e7efe9" strokeWidth="6" />
            <circle
              cx="33" cy="33" r="28" fill="none" stroke={best ? '#2f7a4b' : '#7aa98a'} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(match / 100) * 175.9} 175.9`} transform="rotate(-90 33 33)"
              style={{ transition: 'stroke-dasharray .5s ease' }}
            />
          </svg>
          <span className="match-num">{match}%</span>
          <span className="match-label">{L('match', 'adapté')}</span>
        </div>
      </div>

      <div className="rot-metrics">
        <div><span className="k">{L('Climate fit today', 'Adaptation au climat actuel')}</span><span className="v">{m.score}/100</span></div>
        <div>
          <span className="k">{L('Simulated profit per ha per year', 'Profit simulé par ha et par an')}</span>
          <span className={`v ${m.avg_profit_mad_ha < 0 ? 'bad' : ''}`}>{fmt(m.avg_profit_mad_ha)} MAD</span>
          {!r.current && <span className={`d ${profitDiff >= 0 ? 'good' : 'bad'}`}>{profitDiff >= 0 ? '+' : ''}{fmt(profitDiff)} {L('vs current', 'vs actuel')}</span>}
        </div>
        <div><span className="k">{L('Simulated seasons at a loss', 'Saisons à perte simulées')}{whatIfLabel ? L(' (what-if)', ' (scénario)') : ', 2011-2025'}</span><span className="v">{fmt(m.failed_seasons, m.failed_seasons % 1 ? 1 : 0)} {L('of', 'sur')} {m.seasons}</span></div>
        <div><span className="k">{L('Fit in the driest year', 'Adaptation l’année la plus sèche')}</span><span className="v">{m.dry_year_score}/100</span></div>
        <div><span className="k">{L('Extra water for full yield', 'Eau en plus pour un plein rendement')}</span><span className="v">{fmt(m.extra_water_mm)} mm</span></div>
      </div>

      <div className="soil">
        {Object.entries(r.soil).map(([k, n]) => (
          <div key={k} className="soil-row"><span>{soilLabels[k]}</span><Dots n={n} /></div>
        ))}
      </div>

      <button className="btn-link" onClick={onToggle} aria-expanded={open}>
        {open ? L('Hide details', 'Masquer les détails') : L('Why, evidence, risks →', 'Pourquoi, preuves, risques →')}
      </button>
      {open && (
        <div className="rot-details">
          <h4>{L('Why it is suggested', 'Pourquoi cette rotation')}</h4>
          <p>{pick(r, 'why')}</p>
          <h4>{L('Simulation results on NASA data', 'Résultats de la simulation sur les données NASA')}</h4>
          <ul>{pick(r, 'evidence').map((e, i) => <li key={i}>{e}</li>)}</ul>
          <h4>{L('Benefits', 'Avantages')}</h4>
          <ul>{pick(r, 'benefits').map((e, i) => <li key={i}>{e}</li>)}</ul>
          <h4>{L('Risks to review locally', 'Risques à vérifier sur place')}</h4>
          <ul>{pick(r, 'risks').map((e, i) => <li key={i}>{e}</li>)}</ul>
          <h4>{L('What we don’t know yet', 'Ce qu’on ne sait pas encore')}</h4>
          <ul>{pick(r, 'gaps').map((e, i) => <li key={i}>{e}</li>)}</ul>
          {r.sources?.length > 0 && (
            <>
              <h4>Sources</h4>
              <ul className="sources">
                {r.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </article>
  );
}

export default function RotationsPanel({ recommendations, climate }) {
  const { L, pick, lang } = useLang();
  const [rainPct, setRainPct] = useState(0);
  const [heat, setHeat] = useState(0);
  const whatIf = rainPct !== 0 || heat !== 0;
  const rotations = useMemo(
    () =>
      recommendations.rotations.map((r) =>
        whatIf ? { ...r, metrics: rotationMetrics(recommendations.model, r, 1 + rainPct / 100, heat) } : r,
      ),
    [recommendations, rainPct, heat, whatIf],
  );
  const soilLabels = (lang === 'fr' && recommendations.soil_labels_fr) || recommendations.soil_labels;
  const cropNames = Object.fromEntries(recommendations.crops.map((c) => [c.id, pick(c, 'name')]));
  const base = rotations.find((r) => r.current);
  const [weights, setWeights] = useState({ income: 2, safety: 2, water: 1, soil: 1 });
  const [open, setOpen] = useState(null);
  const [calId, setCalId] = useState(null);

  const ranked = useMemo(() => {
    const vals = {
      income: rotations.map((r) => r.metrics.avg_profit_mad_ha),
      safety: rotations.map((r) => r.metrics.dry_year_score - 3 * r.metrics.failed_seasons),
      water: rotations.map((r) => r.metrics.extra_water_mm),
      soil: rotations.map(soilTotal),
    };
    const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
    return rotations
      .map((r) => {
        const parts = {
          income: norm(vals.income, r.metrics.avg_profit_mad_ha),
          safety: norm(vals.safety, r.metrics.dry_year_score - 3 * r.metrics.failed_seasons),
          water: norm(vals.water, r.metrics.extra_water_mm, false),
          soil: norm(vals.soil, soilTotal(r)),
        };
        const match = Object.keys(parts).reduce((s, k) => s + parts[k] * weights[k], 0) / total;
        return { r, match: Math.round(40 + 60 * match) };
      })
      .sort((a, b) => b.match - a.match);
  }, [rotations, weights]);

  const calRotation = rotations.find((r) => r.id === (calId || ranked[0].r.id));

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{L('Compare crop rotations', 'Comparer les rotations de cultures')}</h2>
        <p className="muted">
          {L('Each rotation is replayed on the real seasons measured by NASA, so you can see how it would have done. Tell us what matters most on your farm.',
            'Chaque rotation est rejouée sur les vraies saisons mesurées par la NASA, pour voir comment elle aurait marché. Dites-nous ce qui compte le plus sur votre ferme.')}
        </p>
      </header>

      <div className="priorities">
        {PRIORITIES.map((p) => (
          <label key={p.id} className="prio">
            <span className="prio-top"><b>{pick(p, 'label')}</b><span className="muted small">{L(LEVELS[weights[p.id]], LEVELS_FR[weights[p.id]])}</span></span>
            <input
              type="range" min="0" max="3" step="1" value={weights[p.id]}
              onChange={(e) => setWeights((w) => ({ ...w, [p.id]: Number(e.target.value) }))}
              aria-valuetext={L(LEVELS[weights[p.id]], LEVELS_FR[weights[p.id]])}
            />
          </label>
        ))}
      </div>

      <div className={`whatif ${whatIf ? 'active' : ''}`}>
        <div className="whatif-head">
          <b>{L('What if the climate gets worse?', 'Et si le climat empire ?')}</b>
          {whatIf ? (
            <button className="btn-link" onClick={() => { setRainPct(0); setHeat(0); }}>{L('Back to real data', 'Revenir aux vraies données')}</button>
          ) : (
            <span className="muted small">{L('Replays the same 15 seasons with less rain or more heat', 'Rejoue les mêmes 15 saisons avec moins de pluie ou plus de chaleur')}</span>
          )}
        </div>
        <label className="prio">
          <span className="prio-top"><span>{L('Rainfall', 'Pluie')}</span><b>{rainPct === 0 ? L('as measured', 'telle que mesurée') : `${rainPct} %`}</b></span>
          <input type="range" min="-40" max="10" step="5" value={rainPct} onChange={(e) => setRainPct(Number(e.target.value))} />
        </label>
        <label className="prio">
          <span className="prio-top"><span>{L('Spring heat', 'Chaleur au printemps')}</span><b>{heat === 0 ? L('as measured', 'telle que mesurée') : `+${fmt(heat, heat % 1 ? 1 : 0)} °C`}</b></span>
          <input type="range" min="0" max="3" step="0.5" value={heat} onChange={(e) => setHeat(Number(e.target.value))} />
        </label>
      </div>

      <div className="rots">
        {ranked.map(({ r, match }, i) => (
          <RotationCard
            key={r.id} r={r} match={match} best={i === 0} base={base}
            cropNames={cropNames} soilLabels={soilLabels}
            open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} whatIfLabel={whatIf}
          />
        ))}
      </div>

      <h3>{L('Season calendar', 'Calendrier de la saison')}</h3>
      <p className="muted small">
        {L('When the field is planted, when it is bare, and when heat hits the crops. Rain and hot days are the 2011-2025 averages from NASA POWER.',
          'Quand le champ est cultivé, quand il est nu, et quand la chaleur frappe les cultures. La pluie et les jours chauds sont les moyennes 2011-2025 de NASA POWER.')}
      </p>
      <div className="segmented">
        {rotations.map((r) => (
          <button key={r.id} className={calRotation.id === r.id ? 'on' : ''} onClick={() => setCalId(r.id)}>{pick(r, 'name')}</button>
        ))}
      </div>
      <SeasonCalendar rotation={calRotation} crops={recommendations.crops} monthly={climate.monthly} />

      {recommendations.assumptions && (
        <details className="assume">
          <summary>{L('Model assumptions', 'Hypothèses du modèle')}</summary>
          <ul className="assumptions">{pick(recommendations, 'assumptions').map((a) => <li key={a}>{a}</li>)}</ul>
        </details>
      )}

      <div className="callout mid">
        {L('SeasonReplay helps you explore options. It does not replace your own experience or the advice of a local agronomist: check soil type, seed and market access, and pest pressure on your farm before changing a rotation.',
          'SeasonReplay vous aide à explorer des options. Il ne remplace ni votre expérience ni les conseils d’un agronome local : vérifiez le type de sol, l’accès aux semences et au marché, et la pression des ravageurs sur votre ferme avant de changer de rotation.')}
      </div>
    </section>
  );
}
