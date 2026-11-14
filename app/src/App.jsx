import { useCallback, useEffect, useState } from 'react';
import MapView from './components/MapView';
import ClimatePanel from './components/ClimatePanel';
import CropList from './components/CropList';
import IncomeSimulator from './components/IncomeSimulator';
import SensorPanel from './components/SensorPanel';
import RotationsPanel from './components/RotationsPanel';
import LearnPanel from './components/LearnPanel';
import LayerControl from './components/LayerControl';
import { loadRegions, loadRegionData, scoreLabel } from './lib/data';

const TABS = [
  { id: 'rotations', label: 'Rotations' },
  { id: 'climate', label: 'What changed' },
  { id: 'plant', label: 'Crops' },
  { id: 'income', label: 'Income' },
  { id: 'sensor', label: 'Field sensor' },
  { id: 'learn', label: 'How it works' },
];

export default function App() {
  const [regions, setRegions] = useState(null);
  const [regionId, setRegionId] = useState('chaouia');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('rotations');
  const [scenario, setScenario] = useState('recent');
  const [cropId, setCropId] = useState(null);
  const [nasa, setNasa] = useState(null);

  useEffect(() => {
    loadRegions().then(setRegions).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setData(null);
    loadRegionData(regionId).then(setData).catch((e) => setError(e.message));
  }, [regionId]);

  const selectRegion = useCallback((id) => setRegionId(id), []);
  const simulate = (id) => { setCropId(id); setTab('income'); };

  const region = regions?.find((r) => r.id === regionId);
  const top = data?.recommendations.crops
    .slice()
    .sort((a, b) => b.scenarios.recent.score - a.scenarios.recent.score)[0];
  const summary = data?.climate.summary;
  const rots = data?.recommendations.rotations || [];
  const current = rots.find((r) => r.current);
  const safest = rots.slice().sort((a, b) => a.metrics.failed_seasons - b.metrics.failed_seasons)[0];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img className="logo" src="/favicon.svg" alt="" width="40" height="40" />
          <div>
            <div className="brand-name">Field Shift</div>
            <div className="brand-sub">Farm decisions from NASA satellite data</div>
          </div>
        </div>
        {regions && (
          <label className="region-select">
            <span>Region</span>
            <select value={regionId} onChange={(e) => setRegionId(e.target.value)}>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
        )}
      </header>

      {error && <p className="error page-error">{error}</p>}

      {data && region && current && safest && (
        <section className="hero" aria-label="Key finding">
          <div className="hero-text">
            <p className="hero-eyebrow">What NASA data says about {region.name.split(' (')[0]}</p>
            <h1 className="hero-title">
              Dry seasons went from {summary.baseline.dry_seasons} to {summary.recent.dry_seasons} per 15 years.
              Wheat after wheat lost money in {current.metrics.failed_seasons} of the last {current.metrics.seasons} seasons.{' '}
              <span className="hero-accent">{safest.name}: {safest.metrics.failed_seasons}.</span>
            </h1>
          </div>
          <ol className="hero-steps">
            <li><b>Set your priorities</b><span>income, dry years, water, soil</span></li>
            <li><b>Compare rotations</b><span>replayed on real NASA seasons</span></li>
            <li><b>Check the evidence</b><span>why, risks, what to verify locally</span></li>
          </ol>
        </section>
      )}

      <main className="layout">
        <aside className="side">
          <div className="map-card">
            <MapView regions={regions} regionId={regionId} onSelect={selectRegion} nasa={nasa} />
            <LayerControl nasa={nasa} setNasa={setNasa} />
          </div>
          {data && region && (
            <div className="summary">
              <h1>{region.name}</h1>
              <p>
                Since the 1990s, spring heat waves went from <b>{summary.baseline.hot_days_spring}</b> to{' '}
                <b>{summary.recent.hot_days_spring}</b> days a year, and dry seasons went from{' '}
                <b>{summary.baseline.dry_seasons}</b> to <b>{summary.recent.dry_seasons}</b> per 15 years.
              </p>
              {safest && current && (
                <div className="best">
                  <span className="muted small">Most resilient rotation, 2011-2025</span>
                  <div className="best-row">
                    <span className="best-name">{safest.name}</span>
                  </div>
                  <p className="muted small" style={{ margin: '4px 0 0' }}>
                    At a loss in {safest.metrics.failed_seasons} of {safest.metrics.seasons} seasons, vs{' '}
                    {current.metrics.failed_seasons} for {current.name.toLowerCase()}.
                  </p>
                </div>
              )}
              {top && (
                <div className="best">
                  <span className="muted small">Best single crop for next season</span>
                  <div className="best-row">
                    <span className="best-name">{top.name}</span>
                    <span className={`pill ${scoreLabel(top.scenarios.recent.score).tone}`}>
                      {top.scenarios.recent.score}/100
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        <div className="content">
          <nav className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>

          {!data ? (
            <div className="panel loading">Loading NASA data…</div>
          ) : (
            <>
              {tab === 'rotations' && <RotationsPanel recommendations={data.recommendations} climate={data.climate} />}
              {tab === 'learn' && <LearnPanel />}
              {tab === 'plant' && (
                <CropList recommendations={data.recommendations} scenario={scenario} setScenario={setScenario} onSimulate={simulate} />
              )}
              {tab === 'climate' && <ClimatePanel climate={data.climate} />}
              {tab === 'income' && (
                <IncomeSimulator
                  recommendations={data.recommendations}
                  cropId={cropId || top?.id}
                  setCropId={setCropId}
                  scenario={scenario}
                />
              )}
              {tab === 'sensor' && <SensorPanel climate={data.climate} />}
            </>
          )}
        </div>
      </main>

      <footer className="foot muted small">
        Data: NASA POWER daily 1990-2025, NASA MODIS NDVI and SMAP soil moisture via NASA GIBS. Map: Esri ArcGIS.
        Built for NASA Space Apps Casablanca 2026 ·{' '}
        <a href="https://github.com/eduaiwebapp-gif/Field-shift">Source code</a>
      </footer>
    </div>
  );
}
