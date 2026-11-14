import { SCENARIOS, fmt, scoreLabel } from '../lib/data';

const SYSTEM_LABEL = { rainfed: 'Rainfed', irrigated: 'Needs irrigation', perennial: 'Tree crop' };

function CropCard({ crop, scenario, rank, onSimulate }) {
  const s = crop.scenarios[scenario];
  const label = scoreLabel(s.score);
  const unit = crop.yield_t_ha_unit || 't/ha';
  return (
    <article className={`crop ${rank === 0 ? 'top' : ''}`}>
      <div className="crop-head">
        <div>
          <h3>{crop.name}</h3>
          <span className="tag">{SYSTEM_LABEL[crop.system]}</span>
        </div>
        <div className={`score ${label.tone}`}>
          <span className="score-num">{s.score}</span>
          <span className="score-label">{label.text}</span>
        </div>
      </div>

      <div className="bar"><div className={`bar-fill ${label.tone}`} style={{ width: `${s.score}%` }} /></div>

      <dl className="facts">
        <div><dt>Expected yield</dt><dd>{fmt(s.yield_t_ha.low, 1)} - {fmt(s.yield_t_ha.high, 1)} {unit}</dd></div>
        <div><dt>Plant</dt><dd>{crop.planting_window}</dd></div>
        <div><dt>Harvest</dt><dd>{crop.harvest_window}</dd></div>
        <div>
          <dt>Extra water for full yield</dt>
          <dd>{s.irrigation_mm > 0 ? `${fmt(s.irrigation_mm)} mm (${fmt(s.irrigation_mm * 10)} m³/ha)` : 'None'}</dd>
        </div>
      </dl>

      {scenario === 'recent' && crop.score_change !== 0 && (
        <p className={`change ${crop.score_change < 0 ? 'bad' : 'good'}`}>
          {crop.score_change < 0 ? '▼' : '▲'} {Math.abs(crop.score_change)} points since the 1990s
        </p>
      )}
      <p className="muted small">{crop.notes}</p>
      {crop.sources?.length > 0 && (
        <p className="muted small crop-src">
          Sources:{' '}
          {crop.sources.map((s, i) => (
            <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>
          ))}
        </p>
      )}
      <button className="btn-link" onClick={() => onSimulate(crop.id)}>Simulate income →</button>
    </article>
  );
}

export default function CropList({ recommendations, scenario, setScenario, onSimulate }) {
  const crops = [...recommendations.crops].sort(
    (a, b) => b.scenarios[scenario].score - a.scenarios[scenario].score,
  );
  const active = SCENARIOS.find((s) => s.id === scenario);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>What to plant</h2>
        <p className="muted">Crops ranked by how well they fit the climate. {active.hint}.</p>
      </header>

      <div className="segmented" role="tablist">
        {SCENARIOS.map((s) => (
          <button key={s.id} role="tab" aria-selected={s.id === scenario} className={s.id === scenario ? 'on' : ''} onClick={() => setScenario(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="crops">
        {crops.map((c, i) => (
          <CropCard key={c.id} crop={c} scenario={scenario} rank={i} onSimulate={onSimulate} />
        ))}
      </div>
      <p className="muted small">
        Method: {recommendations.method}. Scores combine rainfall vs. crop water needs, heat during
        flowering, and root zone soil moisture. Crop parameters are first estimates to be checked with an agronomist.
      </p>
    </section>
  );
}
