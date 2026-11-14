import { NASA_LAYERS, SEASONS } from '../lib/nasaLayers';

// Pick a NASA satellite layer and compare a wet spring with a dry spring.
export default function LayerControl({ nasa, setNasa }) {
  const def = nasa && NASA_LAYERS.find((l) => l.id === nasa.id);
  return (
    <div className="layers">
      <div className="layers-head">
        <span className="layers-title">See it from space</span>
        <span className="muted small">NASA satellite layers</span>
      </div>
      <div className="layer-btns">
        <button className={!nasa ? 'on' : ''} onClick={() => setNasa(null)}>Photo</button>
        {NASA_LAYERS.map((l) => (
          <button key={l.id} className={nasa?.id === l.id ? 'on' : ''} onClick={() => setNasa({ id: l.id, season: nasa?.season || 'dry' })}>
            {l.label}
          </button>
        ))}
      </div>
      {def && (
        <>
          <div className="layer-btns season">
            {SEASONS.map((s) => (
              <button key={s.id} className={nasa.season === s.id ? 'on' : ''} onClick={() => setNasa({ ...nasa, season: s.id })}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="legend">
            <div className="legend-bar" style={{ background: def.legend.gradient }} />
            <div className="legend-labels"><span>{def.legend.low}</span><span>{def.legend.high}</span></div>
          </div>
          <p className="muted small layer-explain">{def.explain} Switch between 2018 and 2023 to see the difference.</p>
          <p className="muted small">Source: {def.source}, via NASA GIBS.</p>
        </>
      )}
    </div>
  );
}
