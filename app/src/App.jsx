import { useCallback, useEffect, useState } from 'react';
import MapView from './components/MapView';
import ClimatePanel from './components/ClimatePanel';
import CropList from './components/CropList';
import IncomeSimulator from './components/IncomeSimulator';
import SensorPanel from './components/SensorPanel';
import RotationsPanel from './components/RotationsPanel';
import LearnPanel from './components/LearnPanel';
import LayerControl from './components/LayerControl';
import Icon from './components/Icon';
import { loadRegions, loadRegionData, scoreLabel, fmt } from './lib/data';

const TABS = [
  { id: 'rotations', label: 'Rotations', icon: 'rotate' },
  { id: 'climate', label: 'What changed', icon: 'chart' },
  { id: 'plant', label: 'Crops', icon: 'sprout' },
  { id: 'income', label: 'Income', icon: 'coins' },
  { id: 'sensor', label: 'Field sensor', icon: 'sensor' },
  { id: 'learn', label: 'How it works', icon: 'book' },
];

function HeroStat({ icon, label, before, after, unit, tone }) {
  return (
    <div className={`hstat ${tone}`}>
      <div className="hstat-label"><Icon name={icon} size={16} />{label}</div>
      <div className="hstat-values">
        <span className="hstat-before">{before}</span>
        <span className="hstat-arrow">→</span>
        <span className="hstat-after">{after}</span>
        {unit && <span className="hstat-unit">{unit}</span>}
      </div>
    </div>
  );
}

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
  const shortName = region?.name.split(' (')[0];

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <img className="logo" src="/favicon.svg" alt="" width="38" height="38" />
            <div>
              <div className="brand-name">Field Shift</div>
              <div className="brand-sub">Adapting Moroccan farms with NASA data</div>
            </div>
          </div>
          {regions && (
            <div className="region-switch" role="radiogroup" aria-label="Region">
              {regions.map((r) => (
                <button
                  key={r.id} role="radio" aria-checked={r.id === regionId}
                  className={r.id === regionId ? 'on' : ''} onClick={() => setRegionId(r.id)}
                >
                  {r.name.split(' (')[0]}
                </button>
              ))}
            </div>
          )}
          <a className="gh" href="https://github.com/eduaiwebapp-gif/Field-shift" aria-label="Source code on GitHub">
            <Icon name="github" size={20} />
          </a>
        </div>
      </header>

      <div className="page">
        {error && <p className="error page-error">{error}</p>}

        {data && region && current && safest ? (
          <section className="hero" aria-label="Key finding" key={regionId}>
            <div className="hero-glow" aria-hidden />
            <div className="hero-main">
              <p className="hero-eyebrow"><Icon name="satellite" size={15} /> 35 years of NASA data · {region.name}</p>
              <h1 className="hero-title">
                Wheat after wheat lost money in <em>{fmt(current.metrics.failed_seasons, current.metrics.failed_seasons % 1 ? 1 : 0)} of the last {current.metrics.seasons} seasons</em>.
                <br />
                <span className="hero-accent">{safest.name}: {fmt(safest.metrics.failed_seasons, safest.metrics.failed_seasons % 1 ? 1 : 0)}.</span>
              </h1>
              <p className="hero-sub">
                The climate of {shortName} has shifted. Field Shift replays crop rotations on the real seasons measured
                by NASA, so farmers can pick the one that protects their soil and their income.
              </p>
              <button className="hero-cta" onClick={() => { setTab('rotations'); document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' }); }}>
                Compare rotations <span aria-hidden>→</span>
              </button>
            </div>
            <div className="hero-stats">
              <HeroStat icon="alert" label="Dry seasons per 15 years" before={summary.baseline.dry_seasons} after={summary.recent.dry_seasons} tone="bad" />
              <HeroStat icon="sun" label="Hot spring days (≥ 30 °C)" before={fmt(summary.baseline.hot_days_spring, 1)} after={fmt(summary.recent.hot_days_spring, 1)} unit="/ yr" tone="heat" />
              <HeroStat icon="drop" label="Profit, best rotation vs today" before={fmt(current.metrics.avg_profit_mad_ha)} after={fmt(safest.metrics.avg_profit_mad_ha)} unit="MAD/ha" tone="good" />
              <p className="hero-period">1991-2005 → 2011-2025</p>
            </div>
          </section>
        ) : (
          <section className="hero hero-skeleton" aria-busy="true"><div className="sk sk-1" /><div className="sk sk-2" /><div className="sk sk-3" /></section>
        )}

        <main className="layout">
          <aside className="side">
            <div className="map-card card">
              <MapView regions={regions} regionId={regionId} onSelect={selectRegion} nasa={nasa} />
              <LayerControl nasa={nasa} setNasa={setNasa} />
            </div>
            {data && region && top && (
              <div className="summary card">
                <div className="summary-row">
                  <span className="muted small">Best single crop next season</span>
                  <span className={`pill ${scoreLabel(top.scenarios.recent.score).tone}`}>{top.scenarios.recent.score}/100</span>
                </div>
                <div className="best-name">{top.name}</div>
                <p className="muted small">{top.notes}</p>
              </div>
            )}
          </aside>

          <div className="content">
            <nav className="tabs" role="tablist" id="tabs">
              {TABS.map((t) => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                  <Icon name={t.icon} size={16} />
                  <span>{t.label}</span>
                </button>
              ))}
            </nav>

            {!data ? (
              <div className="panel loading"><div className="spinner" aria-hidden /> Loading NASA data…</div>
            ) : (
              <div className="tab-body" key={`${tab}-${regionId}`}>
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
              </div>
            )}
          </div>
        </main>

        <footer className="foot">
          <div className="foot-sources">
            <span className="chip-src">NASA POWER</span>
            <span className="chip-src">MODIS NDVI</span>
            <span className="chip-src">SMAP</span>
            <span className="chip-src">Esri ArcGIS</span>
          </div>
          <p className="muted small">
            Built for NASA Space Apps Challenge 2026, Casablanca ·{' '}
            <a href="https://github.com/eduaiwebapp-gif/Field-shift">Source code</a> · Supports, never replaces, the
            farmer’s judgment.
          </p>
        </footer>
      </div>
    </div>
  );
}
