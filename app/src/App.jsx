import { useCallback, useEffect, useState } from 'react';
import MapView from './components/MapView';
import ClimatePanel from './components/ClimatePanel';
import CropList from './components/CropList';
import IncomeSimulator from './components/IncomeSimulator';
import SensorPanel from './components/SensorPanel';
import { loadRegions, loadRegionData, scoreLabel } from './lib/data';

const TABS = [
  { id: 'plant', label: 'What to plant' },
  { id: 'climate', label: 'What changed' },
  { id: 'income', label: 'Income' },
  { id: 'sensor', label: 'Field sensor' },
];

export default function App() {
  const [regions, setRegions] = useState(null);
  const [regionId, setRegionId] = useState('chaouia');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('plant');
  const [scenario, setScenario] = useState('recent');
  const [cropId, setCropId] = useState(null);

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

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>◐</span>
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

      <main className="layout">
        <aside className="side">
          <MapView regions={regions} regionId={regionId} onSelect={selectRegion} />
          {data && region && (
            <div className="summary">
              <h1>{region.name}</h1>
              <p>
                Since the 1990s, spring heat waves went from <b>{summary.baseline.hot_days_spring}</b> to{' '}
                <b>{summary.recent.hot_days_spring}</b> days a year, and dry seasons went from{' '}
                <b>{summary.baseline.dry_seasons}</b> to <b>{summary.recent.dry_seasons}</b> per 15 years.
              </p>
              {top && (
                <div className="best">
                  <span className="muted small">Best fit for next season</span>
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
        Data: NASA POWER (power.larc.nasa.gov), daily, 1990-2025. Map: Esri ArcGIS. Built for NASA Space Apps Casablanca 2026.
      </footer>
    </div>
  );
}
