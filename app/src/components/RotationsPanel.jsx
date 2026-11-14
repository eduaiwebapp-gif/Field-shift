import { useMemo, useState } from 'react';
import SeasonCalendar from './SeasonCalendar';
import { rotationMetrics } from '../lib/model';
import { fmt } from '../lib/data';

const PRIORITIES = [
  { id: 'income', label: 'Income' },
  { id: 'safety', label: 'Safe in dry years' },
  { id: 'water', label: 'Save water' },
  { id: 'soil', label: 'Soil health' },
];

const LEVELS = ['Not important', 'A little', 'Important', 'Very important'];

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
  return (
    <span className="dots" aria-label={`${n} out of 3`}>
      {[1, 2, 3].map((i) => <span key={i} className={i <= n ? 'dot on' : 'dot'} />)}
    </span>
  );
}

function RotationCard({ r, match, best, cropNames, soilLabels, base, open, onToggle, whatIfLabel }) {
  const m = r.metrics;
  const profitDiff = m.avg_profit_mad_ha - base.metrics.avg_profit_mad_ha;
  return (
    <article className={`rot ${best ? 'best' : ''}`}>
      <div className="rot-head">
        <div>
          <div className="rot-tags">
            {r.current && <span className="tag">Current practice</span>}
            {best && <span className="tag tag-best">Best match for your priorities</span>}
          </div>
          <h3>{r.name}</h3>
          <div className="chips">
            {r.sequence.map((id, i) => (
              <span key={i} className="chip">Year {i + 1}: {cropNames[id]}</span>
            ))}
            <span className="chip ghost">then repeat</span>
          </div>
        </div>
        <div className="match" aria-label={`${match}% match with your priorities`}>
          <svg className="match-ring" viewBox="0 0 66 66" aria-hidden="true">
            <circle cx="33" cy="33" r="28" fill="none" stroke="#e7efe9" strokeWidth="6" />
            <circle
              cx="33" cy="33" r="28" fill="none" stroke={best ? '#2f7a4b' : '#7aa98a'} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(match / 100) * 175.9} 175.9`} transform="rotate(-90 33 33)"
              style={{ transition: 'stroke-dasharray .5s ease' }}
            />
          </svg>
          <span className="match-num">{match}%</span>
          <span className="match-label">match</span>
        </div>
      </div>

      <div className="rot-metrics">
        <div><span className="k">Climate fit today</span><span className="v">{m.score}/100</span></div>
        <div>
          <span className="k">Simulated profit per ha per year</span>
          <span className={`v ${m.avg_profit_mad_ha < 0 ? 'bad' : ''}`}>{fmt(m.avg_profit_mad_ha)} MAD</span>
          {!r.current && <span className={`d ${profitDiff >= 0 ? 'good' : 'bad'}`}>{profitDiff >= 0 ? '+' : ''}{fmt(profitDiff)} vs current</span>}
        </div>
        <div><span className="k">Simulated seasons at a loss{whatIfLabel ? ' (what-if)' : ', 2011-2025'}</span><span className="v">{fmt(m.failed_seasons, m.failed_seasons % 1 ? 1 : 0)} of {m.seasons}</span></div>
        <div><span className="k">Fit in the driest year</span><span className="v">{m.dry_year_score}/100</span></div>
        <div><span className="k">Extra water for full yield</span><span className="v">{fmt(m.extra_water_mm)} mm</span></div>
      </div>

      <div className="soil">
        {Object.entries(r.soil).map(([k, n]) => (
          <div key={k} className="soil-row"><span>{soilLabels[k]}</span><Dots n={n} /></div>
        ))}
      </div>

      <button className="btn-link" onClick={onToggle} aria-expanded={open}>
        {open ? 'Hide details' : 'Why, evidence, risks →'}
      </button>
      {open && (
        <div className="rot-details">
          <h4>Why it is suggested</h4>
          <p>{r.why}</p>
          <h4>Simulation results on NASA data</h4>
          <ul>{r.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>
          <h4>Benefits</h4>
          <ul>{r.benefits.map((e, i) => <li key={i}>{e}</li>)}</ul>
          <h4>Risks to review locally</h4>
          <ul>{r.risks.map((e, i) => <li key={i}>{e}</li>)}</ul>
          <h4>What we don't know yet</h4>
          <ul>{r.gaps.map((e, i) => <li key={i}>{e}</li>)}</ul>
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
  const soilLabels = recommendations.soil_labels;
  const cropNames = Object.fromEntries(recommendations.crops.map((c) => [c.id, c.name]));
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
        <h2>Compare crop rotations</h2>
        <p className="muted">
          Each rotation is replayed on the real seasons measured by NASA, so you can see how it would have done.
          Tell us what matters most on your farm.
        </p>
      </header>

      <div className="priorities">
        {PRIORITIES.map((p) => (
          <label key={p.id} className="prio">
            <span className="prio-top"><b>{p.label}</b><span className="muted small">{LEVELS[weights[p.id]]}</span></span>
            <input
              type="range" min="0" max="3" step="1" value={weights[p.id]}
              onChange={(e) => setWeights((w) => ({ ...w, [p.id]: Number(e.target.value) }))}
              aria-valuetext={LEVELS[weights[p.id]]}
            />
          </label>
        ))}
      </div>

      <div className={`whatif ${whatIf ? 'active' : ''}`}>
        <div className="whatif-head">
          <b>What if the climate gets worse?</b>
          {whatIf ? (
            <button className="btn-link" onClick={() => { setRainPct(0); setHeat(0); }}>Back to real data</button>
          ) : (
            <span className="muted small">Replays the same 15 seasons with less rain or more heat</span>
          )}
        </div>
        <label className="prio">
          <span className="prio-top"><span>Rainfall</span><b>{rainPct === 0 ? 'as measured' : `${rainPct} %`}</b></span>
          <input type="range" min="-40" max="10" step="5" value={rainPct} onChange={(e) => setRainPct(Number(e.target.value))} />
        </label>
        <label className="prio">
          <span className="prio-top"><span>Spring heat</span><b>{heat === 0 ? 'as measured' : `+${heat} °C`}</b></span>
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

      <h3>Season calendar</h3>
      <p className="muted small">
        When the field is planted, when it is bare, and when heat hits the crops. Rain and hot days are the
        2011-2025 averages from NASA POWER.
      </p>
      <div className="segmented">
        {rotations.map((r) => (
          <button key={r.id} className={calRotation.id === r.id ? 'on' : ''} onClick={() => setCalId(r.id)}>{r.name}</button>
        ))}
      </div>
      <SeasonCalendar rotation={calRotation} crops={recommendations.crops} monthly={climate.monthly} />

      {recommendations.assumptions && (
        <details className="assume">
          <summary>Model assumptions</summary>
          <ul className="assumptions">{recommendations.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
        </details>
      )}

      <div className="callout mid">
        Field Shift helps you explore options. It does not replace your own experience or the advice of a local
        agronomist: check soil type, seed and market access, and pest pressure on your farm before changing a rotation.
      </div>
    </section>
  );
}
