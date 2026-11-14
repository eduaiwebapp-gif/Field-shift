import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import MapView from './components/MapView';
import ClimatePanel from './components/ClimatePanel';
import CropList from './components/CropList';
import IncomeSimulator from './components/IncomeSimulator';
import SensorPanel from './components/SensorPanel';
import RotationsPanel from './components/RotationsPanel';
import LearnPanel from './components/LearnPanel';
import LayerControl from './components/LayerControl';
import PlantingPanel from './components/PlantingPanel';
import SimulationCard from './components/SimulationCard';
import CountUp from './components/CountUp';
import Icon from './components/Icon';
import { loadRegions, loadRegionData, loadClimatePoint, scoreLabel, fmt } from './lib/data';

const TABS = [
  { id: 'rotations', label: 'Rotations', icon: 'rotate' },
  { id: 'planting', label: 'Planting time', icon: 'drop' },
  { id: 'climate', label: 'What changed', icon: 'chart' },
  { id: 'plant', label: 'Crops', icon: 'sprout' },
  { id: 'income', label: 'Income', icon: 'coins' },
  { id: 'sensor', label: 'Field sensor', icon: 'sensor' },
  { id: 'learn', label: 'How it works', icon: 'book' },
];

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] } }),
};

function HeroStat({ icon, label, before, after, decimals = 0, unit, tone, i }) {
  return (
    <motion.div className={`hstat ${tone}`} variants={rise} custom={i} initial="hidden" animate="show" whileHover={{ y: -3 }}>
      <div className="hstat-label"><Icon name={icon} size={16} />{label}</div>
      <div className="hstat-values">
        <span className="hstat-before">{fmt(before, decimals)}</span>
        <span className="hstat-arrow">→</span>
        <span className="hstat-after"><CountUp value={after} decimals={decimals} /></span>
        {unit && <span className="hstat-unit">{unit}</span>}
      </div>
    </motion.div>
  );
}

function Orbit() {
  return (
    <svg className="orbit" viewBox="0 0 400 400" aria-hidden="true">
      <defs>
        <radialGradient id="earth" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#4f9b67" />
          <stop offset="60%" stopColor="#1d5a37" />
          <stop offset="100%" stopColor="#0c2a19" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="92" fill="url(#earth)" opacity="0.9" />
      <circle cx="200" cy="200" r="92" fill="none" stroke="rgba(245,215,110,.35)" strokeWidth="1.5" />
      <ellipse cx="200" cy="200" rx="170" ry="62" fill="none" stroke="rgba(255,255,255,.18)" strokeDasharray="3 7" transform="rotate(-18 200 200)" />
      <g className="sat" transform="rotate(-18 200 200)">
        <g>
          <rect x="-7" y="-5" width="14" height="10" rx="2" fill="#f5d76e" />
          <rect x="-24" y="-3" width="14" height="6" fill="#9cc1e6" />
          <rect x="10" y="-3" width="14" height="6" fill="#9cc1e6" />
          <animateMotion dur="14s" repeatCount="indefinite" path="M370,200 A170,62 0 1,1 30,200 A170,62 0 1,1 370,200" rotate="auto" />
        </g>
      </g>
    </svg>
  );
}

export default function App() {
  const [regions, setRegions] = useState(null);
  const [regionId, setRegionId] = useState('chaouia');
  const [data, setData] = useState(null);
  const [point, setPoint] = useState(null);
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
    setPoint(null);
    loadRegionData(regionId).then(setData).catch((e) => setError(e.message));
    loadClimatePoint(regionId).then(setPoint).catch(() => {});
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
  const dec = (n) => (n % 1 ? 1 : 0);

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <div className="bg-blobs" aria-hidden="true"><span /><span /><span /></div>

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
                    {r.id === regionId && <motion.span layoutId="regionPill" className="pill-bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span className="pill-text">{r.name.split(' (')[0]}</span>
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
              <Orbit />
              <div className="hero-main">
                <motion.p className="hero-eyebrow" variants={rise} custom={0} initial="hidden" animate="show">
                  <span className="live-dot" aria-hidden /> 35 years of NASA data · {region.name}
                </motion.p>
                <motion.h1 className="hero-title" variants={rise} custom={1} initial="hidden" animate="show">
                  Wheat after wheat would have lost money in{' '}
                  <em>{fmt(current.metrics.failed_seasons, dec(current.metrics.failed_seasons))} of the last {current.metrics.seasons} seasons</em>.
                  <br />
                  <span className="hero-accent">{safest.name}: {fmt(safest.metrics.failed_seasons, dec(safest.metrics.failed_seasons))}.</span>
                </motion.h1>
                <motion.p className="hero-sub" variants={rise} custom={2} initial="hidden" animate="show">
                  The climate of {shortName} has shifted. Field Shift replays crop rotations on the real seasons measured by
                  NASA, so farmers can explore the ones that protect their soil and their income.
                  <span className="hero-note"> Simulation on NASA climate data with provisional, sourced crop inputs.</span>
                </motion.p>
                <motion.div className="hero-actions" variants={rise} custom={3} initial="hidden" animate="show">
                  <motion.button
                    className="hero-cta" whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setTab('rotations'); document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' }); }}
                  >
                    Compare rotations <span aria-hidden>→</span>
                  </motion.button>
                  <button className="hero-ghost" onClick={() => { setTab('sensor'); document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' }); }}>
                    See the smart irrigation
                  </button>
                </motion.div>
              </div>
              <div className="hero-stats">
                <HeroStat i={1} icon="alert" label="Dry seasons per 15 years" before={summary.baseline.dry_seasons} after={summary.recent.dry_seasons} tone="bad" />
                <HeroStat i={2} icon="sun" label="Hot spring days (≥ 30 °C)" before={summary.baseline.hot_days_spring} after={summary.recent.hot_days_spring} decimals={1} unit="/ yr" tone="heat" />
                <HeroStat i={3} icon="drop" label="Simulated profit, best rotation vs today" before={current.metrics.avg_profit_mad_ha} after={safest.metrics.avg_profit_mad_ha} unit="MAD/ha" tone="good" />
                <p className="hero-period">1991-2005 → 2011-2025</p>
              </div>
            </section>
          ) : (
            <section className="hero hero-skeleton" aria-busy="true"><div className="sk sk-1" /><div className="sk sk-2" /><div className="sk sk-3" /></section>
          )}

          <main className="layout">
            <aside className="side">
              <motion.div className="map-card card" variants={rise} initial="hidden" animate="show">
                <MapView regions={regions} regionId={regionId} onSelect={selectRegion} nasa={nasa} />
                <LayerControl nasa={nasa} setNasa={setNasa} />
              </motion.div>

              {point && (
                <motion.div className="summary card trend" variants={rise} custom={1} initial="hidden" animate="show" key={`pt-${regionId}`}>
                  <div className="summary-row"><span className="muted small">Climate trend, {point.period_start.slice(0, 4)}-{point.period_end.slice(0, 4)}</span><span className="tag">NASA POWER</span></div>
                  <div className="trend-grid">
                    <div><span className="trend-v warm">+<CountUp value={point.temperature_trend_c_decade} decimals={2} /> °C</span><span className="trend-k">per decade</span></div>
                    <div><span className="trend-v dry"><CountUp value={point.precipitation_trend_mm_decade} decimals={0} /> mm</span><span className="trend-k">rain per decade</span></div>
                    <div><span className="trend-v"><CountUp value={point.mean_annual_temperature_c} decimals={1} /> °C</span><span className="trend-k">mean temperature</span></div>
                    <div><span className="trend-v"><CountUp value={point.mean_annual_precipitation_mm} decimals={0} /> mm</span><span className="trend-k">rain per year</span></div>
                  </div>
                  <p className="muted small">Linear trends over {point.temperature_years_used} complete years at {point.site_name}. Descriptive estimates.</p>
                </motion.div>
              )}

              {data && region && top && (
                <motion.div className="summary card" variants={rise} custom={2} initial="hidden" animate="show" key={`top-${regionId}`}>
                  <div className="summary-row">
                    <span className="muted small">Best single crop next season</span>
                    <span className={`pill ${scoreLabel(top.scenarios.recent.score).tone}`}>{top.scenarios.recent.score}/100</span>
                  </div>
                  <div className="best-name">{top.name}</div>
                  <p className="muted small">{top.notes}</p>
                </motion.div>
              )}
            </aside>

            <div className="content">
              <nav className="tabs" role="tablist" id="tabs">
                {TABS.map((t) => (
                  <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                    {tab === t.id && <motion.span layoutId="tabPill" className="tab-bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span className="tab-inner"><Icon name={t.icon} size={16} /><span>{t.label}</span></span>
                  </button>
                ))}
              </nav>

              {!data ? (
                <div className="panel loading"><div className="spinner" aria-hidden /> Loading NASA data…</div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    className="tab-body" key={`${tab}-${regionId}`}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {tab === 'rotations' && <RotationsPanel recommendations={data.recommendations} climate={data.climate} />}
                    {tab === 'planting' && <PlantingPanel regionId={regionId} />}
                    {tab === 'learn' && <LearnPanel />}
                    {tab === 'plant' && (
                      <CropList recommendations={data.recommendations} scenario={scenario} setScenario={setScenario} onSimulate={simulate} />
                    )}
                    {tab === 'climate' && <ClimatePanel climate={data.climate} />}
                    {tab === 'income' && (
                      <IncomeSimulator recommendations={data.recommendations} cropId={cropId || top?.id} setCropId={setCropId} scenario={scenario} />
                    )}
                    {tab === 'sensor' && (
                      <div className="stack">
                        <SimulationCard />
                        <SensorPanel climate={data.climate} />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </main>

          <footer className="foot">
            <div className="foot-sources">
              {['NASA POWER', 'MODIS NDVI', 'SMAP', 'Esri ArcGIS', 'FAO-56', 'INRA Morocco', 'MATLAB/Simulink', 'Python'].map((s) => (
                <span key={s} className="chip-src">{s}</span>
              ))}
            </div>
            <p className="muted small">
              Built for NASA Space Apps Challenge 2026, Casablanca ·{' '}
              <a href="https://github.com/eduaiwebapp-gif/Field-shift">Source code</a> · Supports, never replaces, the
              farmer’s judgment.
            </p>
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}
