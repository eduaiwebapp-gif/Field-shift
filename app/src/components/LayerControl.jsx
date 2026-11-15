import { NASA_LAYERS, SEASONS } from '../lib/nasaLayers';
import { useLang } from '../lib/i18n';

// Pick a NASA satellite layer and compare a wet spring with a dry spring.
export default function LayerControl({ nasa, setNasa }) {
  const { L, pick } = useLang();
  const def = nasa && NASA_LAYERS.find((l) => l.id === nasa.id);
  return (
    <div className="layers">
      <div className="layers-head">
        <span className="layers-title">{L('See it from space', 'Vu de l’espace')}</span>
        <span className="muted small">{L('NASA satellite layers', 'Couches satellite NASA')}</span>
      </div>
      <div className="layer-btns">
        <button className={!nasa ? 'on' : ''} onClick={() => setNasa(null)}>{L('Photo', 'Photo')}</button>
        {NASA_LAYERS.map((l) => (
          <button key={l.id} className={nasa?.id === l.id ? 'on' : ''} onClick={() => setNasa({ id: l.id, season: nasa?.season || 'dry' })}>
            {pick(l, 'label')}
          </button>
        ))}
      </div>
      {def && (
        <>
          <div className="layer-btns season">
            {SEASONS.map((s) => (
              <button key={s.id} className={nasa.season === s.id ? 'on' : ''} onClick={() => setNasa({ ...nasa, season: s.id })}>
                {pick(s, 'label')}
              </button>
            ))}
          </div>
          <div className="legend">
            <div className="legend-bar" style={{ background: def.legend.gradient }} />
            <div className="legend-labels"><span>{pick(def.legend, 'low')}</span><span>{pick(def.legend, 'high')}</span></div>
          </div>
          <p className="muted small layer-explain">{pick(def, 'explain')} {L('Switch between 2018 and 2023 to see the difference.', 'Passez de 2018 à 2023 pour voir la différence.')}</p>
          <p className="muted small">{L('Source:', 'Source :')} {pick(def, 'source')}, via NASA GIBS.</p>
        </>
      )}
    </div>
  );
}
