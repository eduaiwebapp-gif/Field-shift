import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { fmt } from '../lib/data';
import { IRR_CROPS, MODEL, FAO56, simulate } from '../lib/irrigation';
import CountUp from './CountUp';
import CropIcon from './CropIcon';
import Icon from './Icon';
import { useLang } from '../lib/i18n';

const BASE = `${import.meta.env.BASE_URL}data`;

// Smart irrigation: the engineer's MATLAB/Simulink model, plus the same model run per crop with FAO-56 values.
export default function SimulationCard() {
  const { L, pick, lang } = useLang();
  const [sim, setSim] = useState(null);
  const [demo, setDemo] = useState(null);
  const [scenario, setScenario] = useState(0);
  const [cropId, setCropId] = useState('tomato_sim');

  useEffect(() => {
    fetch(`${BASE}/simulation/irrigation_240h.json`).then((r) => r.json()).then(setSim).catch(() => {});
    fetch(`${BASE}/seasonreplay/doukkala/irrigation_demo.json`).then((r) => r.json()).then(setDemo).catch(() => {});
  }, []);

  const crop = IRR_CROPS.find((c) => c.id === cropId);
  const v = useMemo(() => {
    if (crop.simulink) {
      if (!sim) return null;
      const s = sim.summary;
      const series = [];
      for (let i = 0; i < sim.time_h.length; i += 3) {
        series.push({ t: sim.time_h[i], m: sim.sensor_soil_moisture_pct[i], irr: sim.irrigation_cmd_mm_h[i] });
      }
      const r = simulate(crop, 10);
      return {
        series, days: sim.metadata.stop_time_h / 24, applied: s.irrigation_total_mm, onTime: s.irrigation_on_time_h,
        openings: 2, cropUse: s.crop_water_use_mm, etcDay: r.etcDay, reserveDays: r.reserveDays, storeMm: r.storeMm, first: 0,
      };
    }
    return simulate(crop, 30);
  }, [crop, sim, lang]);

  if (!v) return null;
  const { days, series } = v;
  const hours = days * 24;
  const step = days <= 10 ? 24 : 120;
  const sc = demo?.scenarios[scenario];

  return (
    <section className="panel sim">
      <div className="sim-badge">MATLAB / Simulink</div>
      <header className="panel-head">
        <h2>{L('Smart irrigation, simulated', 'Irrigation intelligente, simulée')}</h2>
        <p className="muted">
          {L('Our mechatronics engineer modelled a field in Doukkala with the FAO-56 root zone water balance. The ESP32 sensor reading (with real measurement noise) drives an on/off irrigation controller. Pick a crop: each one has its own water use',
            'Notre ingénieur en mécatronique a modélisé un champ de la Doukkala avec le bilan hydrique FAO-56 de la zone racinaire. La mesure du capteur ESP32 (avec un vrai bruit de mesure) pilote un contrôleur d’irrigation tout-ou-rien. Choisissez une culture : chacune a sa propre consommation d’eau')}{' '}
          (K<sub>c</sub>) {L('and root depth', 'et sa profondeur de racines')} (Z<sub>r</sub>) {L('from FAO-56.', 'issues de la FAO-56.')}
        </p>
      </header>

      <div className="crop-picker" role="tablist" aria-label={L('Crop', 'Culture')}>
        {IRR_CROPS.map((c) => (
          <button key={c.id} role="tab" aria-selected={c.id === cropId} className={c.id === cropId ? 'on' : ''} onClick={() => setCropId(c.id)}>
            <CropIcon id={c.crop} size={20} />
            <span>{c.simulink ? L('Tomato · Simulink run', 'Tomate · run Simulink') : pick(c, 'name')}</span>
          </button>
        ))}
      </div>

      <div className="formula" aria-label={L('Water balance equation', 'Équation du bilan hydrique')}>
        <span className="f-lhs">dθ/dt</span>
        <span className="f-eq">=</span>
        <span className="f-frac"><span>100</span><span>Z<sub>r</sub></span></span>
        <span className="f-eq">×</span>
        <span className="f-par">( I + P − K<sub>c</sub> · ET<sub>0</sub> )</span>
      </div>
      <div className="formula-legend">
        <span><b>θ</b> {L('soil moisture (%)', 'humidité du sol (%)')}</span>
        <span><b>I</b> {L('irrigation', 'irrigation')}</span>
        <span><b>P</b> {L('rain (none here)', 'pluie (aucune ici)')}</span>
        <span><b>K<sub>c</sub></b> {fmt(crop.kc, 2)} {pick(crop, 'name').toLowerCase()}</span>
        <span><b>ET<sub>0</sub></b> {MODEL.et0} mm/h (NASA)</span>
        <span><b>Z<sub>r</sub></b> {crop.zr} mm {crop.simulink ? L('sensor layer', 'couche du capteur') : L(`roots (FAO-56: ${crop.range})`, `racines (FAO-56 : ${crop.range.replace(/\./g, ',')})`)}</span>
      </div>

      <div className="tiles">
        <div className="tile"><span className="tile-k">{L('Water applied', 'Eau apportée')}</span><span className="tile-v"><CountUp key={`a${cropId}`} value={v.applied} decimals={0} /> mm</span><span className="tile-s">{L(`over ${days} days · crop uses ${fmt(v.cropUse, 0)} mm`, `sur ${days} jours · la culture consomme ${fmt(v.cropUse, 0)} mm`)}</span></div>
        <div className="tile"><span className="tile-k">{L('Valve openings', 'Ouvertures de vanne')}</span><span className="tile-v"><CountUp key={`o${cropId}`} value={v.openings} decimals={0} /></span><span className="tile-s">{L(`${fmt(v.onTime, 1)} h open in total`, `${fmt(v.onTime, 1)} h ouverte au total`)}</span></div>
        <div className="tile"><span className="tile-k">{L('First irrigation', 'Première irrigation')}</span><span className="tile-v">{L('day', 'jour')} <CountUp key={`r${cropId}`} value={v.first === null ? days : v.first / 24} decimals={1} /></span><span className="tile-s">{crop.simulink ? L('valve open at the start of the run', 'vanne ouverte au début de la simulation') : L(`soil reserve alone: ${fmt(v.reserveDays, 1)} days`, `réserve du sol seule : ${fmt(v.reserveDays, 1)} jours`)}</span></div>
        <div className="tile"><span className="tile-k">{L('Crop water use', 'Consommation de la culture')}</span><span className="tile-v"><CountUp key={`e${cropId}`} value={v.etcDay} decimals={1} /> {L('mm/day', 'mm/jour')}</span><span className="tile-s">K<sub>c</sub> × ET<sub>0</sub>, {L('peak season', 'pic de saison')}</span></div>
      </div>

      <div className="legend-row">
        <span><i className="sw moist" /> {L('Soil moisture from the sensor', 'Humidité du sol mesurée par le capteur')}</span>
        <span><i className="sw irr" /> {L('Irrigation (mm/h)', 'Irrigation (mm/h)')}</span>
        <span><i className="sw band" /> {L('Valve opens below 22 %, closes above 35 %', 'La vanne s’ouvre sous 22 % et se ferme au-dessus de 35 %')}</span>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="gMoist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2f6dae" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2f6dae" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="t" type="number" domain={[0, hours]} ticks={Array.from({ length: hours / step + 1 }, (_, i) => i * step)} tickFormatter={(x) => `${L('day', 'j')} ${x / 24}`} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="m" domain={[20, 40]} ticks={[20, 25, 30, 35, 40]} tick={{ fontSize: 11 }} unit="%" width={48} allowDataOverflow />
            <YAxis yAxisId="i" orientation="right" domain={[0, 20]} hide />
            <Tooltip
              labelFormatter={(x) => `${L('day', 'jour')} ${fmt(Number(x) / 24, 1)}`}
              formatter={(val, n) => (n === 'm' ? [`${fmt(val, 1)} %`, L('Soil moisture', 'Humidité du sol')] : [`${val} mm/h`, 'Irrigation'])}
            />
            <ReferenceLine yAxisId="m" y={22} stroke="#b8432c" strokeDasharray="5 4" />
            <ReferenceLine yAxisId="m" y={35} stroke="#215a39" strokeDasharray="5 4" />
            <Area key={`i${cropId}`} yAxisId="i" dataKey="irr" type="stepAfter" stroke="#1baf7a" fill="#1baf7a" fillOpacity={0.25} strokeWidth={2} isAnimationActive />
            <Area key={`m${cropId}`} yAxisId="m" dataKey="m" type="monotone" stroke="#2f6dae" fill="url(#gMoist)" strokeWidth={2} dot={false} isAnimationActive />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {crop.simulink ? (
        <p className="muted small">
          {L(`Over ${days} days without rain the tomato uses about ${fmt(v.cropUse, 0)} mm of water. The valve opened only twice, ${fmt(v.onTime, 1)} h in total, and applied ${fmt(v.applied, 0)} mm: the rest came from water already stored in the soil. Moisture never came close to saturation (45 %), so no water drained away below the roots. Figures from the engineer’s MATLAB/Simulink run; the curve is regenerated from the same model for display.`,
            `Sur ${days} jours sans pluie, la tomate consomme environ ${fmt(v.cropUse, 0)} mm d’eau. La vanne ne s’est ouverte que deux fois, ${fmt(v.onTime, 1)} h au total, et a apporté ${fmt(v.applied, 0)} mm : le reste venait de l’eau déjà stockée dans le sol. L’humidité ne s’est jamais approchée de la saturation (45 %), donc aucune eau n’est perdue sous les racines. Chiffres issus du run MATLAB/Simulink de l’ingénieur ; la courbe est recalculée avec le même modèle pour l’affichage.`)}
        </p>
      ) : (
        <p className="muted small">
          {L(`${crop.name} roots reach about ${fmt(crop.zr / 1000, 2)} m, so the 22-35 % band holds ${fmt(v.storeMm, 0)} mm of water. Starting at 28 %, the soil alone would last ${fmt(v.reserveDays, 1)} days before reaching 22 %. The valve opens earlier${v.first !== null ? `, on day ${fmt(v.first / 24, 1)},` : ''} because the noisy ESP32 reading touches 22 % first: averaging readings would save that water. Over ${days} days the controller applied ${fmt(v.applied, 0)} mm in ${v.openings} opening${v.openings === 1 ? '' : 's'} for ${fmt(v.cropUse, 0)} mm of crop use; the gap is water stored in, or taken from, the soil. Deeper roots mean fewer, longer irrigations. Same model as the engineer’s Simulink file, run in the browser with`,
            `Les racines (${pick(crop, 'name').toLowerCase()}) descendent à environ ${fmt(crop.zr / 1000, 2)} m, donc la plage 22-35 % retient ${fmt(v.storeMm, 0)} mm d’eau. En partant de 28 %, le sol seul tiendrait ${fmt(v.reserveDays, 1)} jours avant d’atteindre 22 %. La vanne s’ouvre plus tôt${v.first !== null ? `, au jour ${fmt(v.first / 24, 1)},` : ''} parce que la mesure bruitée de l’ESP32 touche 22 % avant : faire la moyenne des mesures économiserait cette eau. Sur ${days} jours, le contrôleur a apporté ${fmt(v.applied, 0)} mm en ${v.openings} ouverture${v.openings === 1 ? '' : 's'} pour ${fmt(v.cropUse, 0)} mm consommés par la culture ; la différence est l’eau stockée dans le sol ou puisée dedans. Des racines plus profondes, c’est moins d’irrigations, mais plus longues. Même modèle que le fichier Simulink de l’ingénieur, calculé dans le navigateur avec`)}{' '}
          <a href={FAO56} target="_blank" rel="noreferrer">FAO-56</a>{' '}
          {L('mid-season Kc (Table 12) and root depth (Table 22, midpoint). Peak-season water use and no rain: a stress test, not a forecast.',
            'le Kc de mi-saison (tableau 12) et la profondeur des racines (tableau 22, valeur médiane). Consommation au pic de la saison et pas de pluie : un test de résistance, pas une prévision.')}
        </p>
      )}
      {demo && (
        <div className="scenario">
          <div className="scenario-head">
            <b>{L('What the app tells the farmer', 'Ce que l’application dit à l’agriculteur')}</b>
            <div className="segmented small">
              {demo.scenarios.map((x, i) => (
                <button key={x.name} className={i === scenario ? 'on' : ''} onClick={() => setScenario(i)}>{L(x.name, { 'Dry soil': 'Sol sec', 'Wet soil': 'Sol humide' }[x.name])}</button>
              ))}
            </div>
          </div>
          <div className={`advice ${sc.irrigation.action === 'review' ? 'go' : 'hold'}`}>
            <div className="advice-icon" aria-hidden><Icon name={sc.irrigation.action === 'review' ? 'drop' : 'sprout'} size={22} /></div>
            <div>
              <div className="advice-title">{sc.irrigation.action === 'review' ? L('Irrigation advised', 'Irrigation conseillée') : L('No irrigation needed', 'Pas besoin d’irriguer')}</div>
              <div className="muted small">
                {L(`Sensor: ${fmt(sc.soil_reading.volumetric_water_content_m3_m3 * 100, 0)} % soil water at ${sc.soil_reading.depth_cm} cm, threshold ${fmt(demo.demo_threshold_m3_m3 * 100, 0)} %. ${sc.irrigation.reason} (simulated reading, data science contract)`,
                  `Capteur : ${fmt(sc.soil_reading.volumetric_water_content_m3_m3 * 100, 0)} % d’eau dans le sol à ${sc.soil_reading.depth_cm} cm, seuil ${fmt(demo.demo_threshold_m3_m3 * 100, 0)} %. ${sc.irrigation.action === 'review' ? 'Sous le seuil d’humidité de démonstration.' : 'Au niveau ou au-dessus du seuil d’humidité de démonstration.'} (mesure simulée, format défini par la data science)`)}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
