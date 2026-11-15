import { SCENARIOS, fmt, scoreLabel } from '../lib/data';
import CropIcon from './CropIcon';
import { useLang } from '../lib/i18n';

const SYSTEM_LABEL = { rainfed: 'Rainfed', irrigated: 'Needs irrigation', perennial: 'Tree crop' };
const SYSTEM_LABEL_FR = { rainfed: 'Pluvial', irrigated: 'Irrigation nécessaire', perennial: 'Arbre' };

function CropCard({ crop, scenario, rank, onSimulate }) {
  const { L, pick } = useLang();
  const s = crop.scenarios[scenario];
  const label = scoreLabel(s.score);
  const unit = crop.yield_t_ha_unit || 't/ha';
  return (
    <article className={`crop ${rank === 0 ? 'top' : ''}`}>
      <div className="crop-head">
        <div className="crop-title">
          <span className="crop-badge"><CropIcon id={crop.id} size={30} /></span>
          <div>
            <h3>{pick(crop, 'name')}</h3>
            <span className="tag">{L(SYSTEM_LABEL[crop.system], SYSTEM_LABEL_FR[crop.system])}</span>
          </div>
        </div>
        <div className={`score ${label.tone}`}>
          <span className="score-num">{s.score}</span>
          <span className="score-label">{pick(label, 'text')}</span>
        </div>
      </div>

      <div className="bar"><div className={`bar-fill ${label.tone}`} style={{ width: `${s.score}%` }} /></div>

      <dl className="facts">
        <div><dt>{L('Expected yield', 'Rendement attendu')}</dt><dd>{fmt(s.yield_t_ha.low, 1)} - {fmt(s.yield_t_ha.high, 1)} {unit}</dd></div>
        <div><dt>{L('Plant', 'Semis')}</dt><dd>{pick(crop, 'planting_window')}</dd></div>
        <div><dt>{L('Harvest', 'Récolte')}</dt><dd>{pick(crop, 'harvest_window')}</dd></div>
        <div>
          <dt>{L('Extra water for full yield', 'Eau en plus pour un plein rendement')}</dt>
          <dd>{s.irrigation_mm > 0 ? `${fmt(s.irrigation_mm)} mm (${fmt(s.irrigation_mm * 10)} m³/ha)` : L('None', 'Aucune')}</dd>
        </div>
      </dl>

      {scenario === 'recent' && crop.score_change !== 0 && (
        <p className={`change ${crop.score_change < 0 ? 'bad' : 'good'}`}>
          {crop.score_change < 0 ? '▼' : '▲'} {Math.abs(crop.score_change)} {L('points since the 1990s', 'points depuis les années 1990')}
        </p>
      )}
      <p className="muted small">{pick(crop, 'notes')}</p>
      {crop.sources?.length > 0 && (
        <p className="muted small crop-src">
          {L('Sources:', 'Sources :')}{' '}
          {crop.sources.map((s, i) => (
            <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>
          ))}
        </p>
      )}
      <button className="btn-link" onClick={() => onSimulate(crop.id)}>{L('Simulate income →', 'Simuler le revenu →')}</button>
    </article>
  );
}

export default function CropList({ recommendations, scenario, setScenario, onSimulate }) {
  const { L, pick } = useLang();
  const crops = [...recommendations.crops].sort(
    (a, b) => b.scenarios[scenario].score - a.scenarios[scenario].score,
  );
  const active = SCENARIOS.find((s) => s.id === scenario);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{L('What to plant', 'Quoi planter')}</h2>
        <p className="muted">{L('Crops ranked by how well they fit the climate.', 'Cultures classées selon leur adaptation au climat.')} {pick(active, 'hint')}.</p>
      </header>

      <div className="segmented" role="tablist">
        {SCENARIOS.map((s) => (
          <button key={s.id} role="tab" aria-selected={s.id === scenario} className={s.id === scenario ? 'on' : ''} onClick={() => setScenario(s.id)}>
            {pick(s, 'label')}
          </button>
        ))}
      </div>

      <div className="crops">
        {crops.map((c, i) => (
          <CropCard key={c.id} crop={c} scenario={scenario} rank={i} onSimulate={onSimulate} />
        ))}
      </div>
      <p className="muted small">
        {L('Method:', 'Méthode :')} {pick(recommendations, 'method')}.{' '}
        {L('Scores combine rainfall vs. crop water needs, heat during flowering, and root zone soil moisture. Crop parameters are first estimates to be checked with an agronomist.',
          'Les scores combinent la pluie face aux besoins en eau de la culture, la chaleur pendant la floraison et l’humidité du sol dans la zone des racines. Les paramètres des cultures sont des premières estimations à faire vérifier par un agronome.')}
      </p>
    </section>
  );
}
