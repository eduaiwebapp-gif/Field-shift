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
import HeroBackdrop from './components/HeroBackdrop';
import Icon from './components/Icon';
import { loadRegions, loadRegionData, loadClimatePoint, scoreLabel, fmt } from './lib/data';
import { useLang, LangSwitch } from './lib/i18n';

const TABS = [
  { id: 'rotations', label: 'Rotations', label_fr: 'Rotations', icon: 'rotate' },
  { id: 'planting', label: 'Planting time', label_fr: 'Date de semis', icon: 'drop' },
  { id: 'climate', label: 'What changed', label_fr: 'Ce qui a changé', icon: 'chart' },
  { id: 'plant', label: 'Crops', label_fr: 'Cultures', icon: 'sprout' },
  { id: 'income', label: 'Income', label_fr: 'Revenu', icon: 'coins' },
  { id: 'sensor', label: 'Field sensor', label_fr: 'Capteur', icon: 'sensor' },
  { id: 'learn', label: 'How it works', label_fr: 'Comment ça marche', icon: 'book' },
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

const QS = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const initialTab = () => (TABS.some((t) => t.id === QS.get('tab')) ? QS.get('tab') : 'rotations');

export default function App() {
  const { L, pick } = useLang();
  const [regions, setRegions] = useState(null);
  const [regionId, setRegionId] = useState(QS.get('region') === 'doukkala' ? 'doukkala' : 'chaouia');
  const [data, setData] = useState(null);
  const [point, setPoint] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(initialTab);
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

  // deep link: ?tab=planting&region=doukkala opens that tab and scrolls to it
  useEffect(() => {
    if (data && QS.get('tab')) setTimeout(() => document.getElementById('tabs')?.scrollIntoView({ block: 'start' }), 300);
  }, [data]);

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
                <div className="brand-sub">{L('Adapting Moroccan farms with NASA data', 'Adapter les fermes marocaines grâce aux données NASA')}</div>
              </div>
            </div>
            {regions && (
              <div className="region-switch" role="radiogroup" aria-label={L('Region', 'Région')}>
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
            <LangSwitch />
            <a className="gh" href="https://github.com/eduaiwebapp-gif/Field-shift" aria-label={L('Source code on GitHub', 'Code source sur GitHub')}>
              <Icon name="github" size={20} />
            </a>
          </div>
        </header>

        <div className="page">
          {error && <p className="error page-error">{error}</p>}

          {data && region && current && safest ? (
            <section className="hero" aria-label={L('Key finding', 'Résultat clé')} key={regionId}>
              <HeroBackdrop regions={regions} regionId={regionId} />
              <div className="hero-glow" aria-hidden />
              <div className="hero-main">
                <motion.p className="hero-eyebrow" variants={rise} custom={0} initial="hidden" animate="show">
                  <span className="live-dot" aria-hidden /> {L('35 years of NASA data', '35 ans de données NASA')} · {region.name}
                </motion.p>
                <motion.h1 className="hero-title" variants={rise} custom={1} initial="hidden" animate="show">
                  {L('Wheat after wheat would have lost money in', 'Le blé sur blé aurait perdu de l’argent')}{' '}
                  <em>{L(`${fmt(current.metrics.failed_seasons, dec(current.metrics.failed_seasons))} of the last ${current.metrics.seasons} seasons`, `${fmt(current.metrics.failed_seasons, dec(current.metrics.failed_seasons))} saisons sur les ${current.metrics.seasons} dernières`)}</em>.
                  <br />
                  <span className="hero-accent">{pick(safest, 'name')}{L(':', ' :')} {fmt(safest.metrics.failed_seasons, dec(safest.metrics.failed_seasons))}.</span>
                </motion.h1>
                <motion.p className="hero-sub" variants={rise} custom={2} initial="hidden" animate="show">
                  {L(`The climate of ${shortName} has shifted. Field Shift replays crop rotations on the real seasons measured by NASA, so farmers can explore the ones that protect their soil and their income.`,
                    `Le climat de la ${shortName} a changé. Field Shift rejoue les rotations de cultures sur les vraies saisons mesurées par la NASA, pour que les agriculteurs trouvent celles qui protègent leur sol et leur revenu.`)}
                  <span className="hero-note"> {L('Simulation on NASA climate data with provisional, sourced crop inputs.', 'Simulation sur les données climatiques de la NASA, avec des paramètres de cultures sourcés mais provisoires.')}</span>
                </motion.p>
                <motion.div className="hero-actions" variants={rise} custom={3} initial="hidden" animate="show">
                  <motion.button
                    className="hero-cta" whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setTab('rotations'); document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' }); }}
                  >
                    {L('Compare rotations', 'Comparer les rotations')} <span aria-hidden>→</span>
                  </motion.button>
                  <button className="hero-ghost" onClick={() => { setTab('sensor'); document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' }); }}>
                    {L('See the smart irrigation', 'Voir l’irrigation intelligente')}
                  </button>
                </motion.div>
              </div>
              <div className="hero-stats">
                <HeroStat i={1} icon="alert" label={L('Dry seasons per 15 years', 'Saisons sèches sur 15 ans')} before={summary.baseline.dry_seasons} after={summary.recent.dry_seasons} tone="bad" />
                <HeroStat i={2} icon="sun" label={L('Hot spring days (≥ 30 °C)', 'Jours chauds au printemps (≥ 30 °C)')} before={summary.baseline.hot_days_spring} after={summary.recent.hot_days_spring} decimals={1} unit={L('/ yr', '/ an')} tone="heat" />
                <HeroStat i={3} icon="drop" label={L('Simulated profit, best rotation vs today', 'Profit simulé, meilleure rotation vs aujourd’hui')} before={current.metrics.avg_profit_mad_ha} after={safest.metrics.avg_profit_mad_ha} unit="MAD/ha" tone="good" />
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
                  <div className="summary-row"><span className="muted small">{L('Climate trend', 'Tendance du climat')}, {point.period_start.slice(0, 4)}-{point.period_end.slice(0, 4)}</span><span className="tag">NASA POWER</span></div>
                  <div className="trend-grid">
                    <div><span className="trend-v warm">+<CountUp value={point.temperature_trend_c_decade} decimals={2} /> °C</span><span className="trend-k">{L('per decade', 'par décennie')}</span></div>
                    <div><span className="trend-v dry"><CountUp value={point.precipitation_trend_mm_decade} decimals={0} /> mm</span><span className="trend-k">{L('rain per decade', 'de pluie par décennie')}</span></div>
                    <div><span className="trend-v"><CountUp value={point.mean_annual_temperature_c} decimals={1} /> °C</span><span className="trend-k">{L('mean temperature', 'température moyenne')}</span></div>
                    <div><span className="trend-v"><CountUp value={point.mean_annual_precipitation_mm} decimals={0} /> mm</span><span className="trend-k">{L('rain per year', 'de pluie par an')}</span></div>
                  </div>
                  <p className="muted small">{L(`Linear trends over ${point.temperature_years_used} complete years at ${point.site_name}. Descriptive estimates.`, `Tendances linéaires sur ${point.temperature_years_used} années complètes à ${point.site_name}. Estimations descriptives.`)}</p>
                </motion.div>
              )}

              {data && region && top && (
                <motion.div className="summary card" variants={rise} custom={2} initial="hidden" animate="show" key={`top-${regionId}`}>
                  <div className="summary-row">
                    <span className="muted small">{L('Best single crop next season', 'Meilleure culture seule la saison prochaine')}</span>
                    <span className={`pill ${scoreLabel(top.scenarios.recent.score).tone}`}>{top.scenarios.recent.score}/100</span>
                  </div>
                  <div className="best-name">{pick(top, 'name')}</div>
                  <p className="muted small">{pick(top, 'notes')}</p>
                </motion.div>
              )}
            </aside>

            <div className="content">
              <nav className="tabs" role="tablist" id="tabs">
                {TABS.map((t) => (
                  <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
                    {tab === t.id && <motion.span layoutId="tabPill" className="tab-bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span className="tab-inner"><Icon name={t.icon} size={16} /><span>{pick(t, 'label')}</span></span>
                  </button>
                ))}
              </nav>

              {!data ? (
                <div className="panel loading"><div className="spinner" aria-hidden /> {L('Loading NASA data…', 'Chargement des données NASA…')}</div>
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
              {L('Built for NASA Space Apps Challenge 2026, Casablanca', 'Conçu pour le NASA Space Apps Challenge 2026, Casablanca')} ·{' '}
              <a href="https://github.com/eduaiwebapp-gif/Field-shift">{L('Source code', 'Code source')}</a> ·{' '}
              {L('Supports, never replaces, the farmer’s judgment.', 'Aide l’agriculteur à décider, sans jamais remplacer son jugement.')}
            </p>
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}
