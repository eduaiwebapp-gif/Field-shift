import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';
import { fmt } from '../lib/data';
import CountUp from './CountUp';
import Icon from './Icon';

const BASE = `${import.meta.env.BASE_URL}data`;

// Smart irrigation simulation built by our mechatronics engineer in MATLAB/Simulink.
export default function SimulationCard() {
  const [sim, setSim] = useState(null);
  const [demo, setDemo] = useState(null);
  const [scenario, setScenario] = useState(0);

  useEffect(() => {
    fetch(`${BASE}/simulation/irrigation_240h.json`).then((r) => r.json()).then(setSim).catch(() => {});
    fetch(`${BASE}/field-shift/doukkala/irrigation_demo.json`).then((r) => r.json()).then(setDemo).catch(() => {});
  }, []);

  const series = useMemo(() => {
    if (!sim) return [];
    const out = [];
    for (let i = 0; i < sim.time_h.length; i += 3) {
      out.push({ t: sim.time_h[i], m: sim.sensor_soil_moisture_pct[i], irr: sim.irrigation_cmd_mm_h[i] });
    }
    return out;
  }, [sim]);

  if (!sim) return null;
  const s = sim.summary;
  const days = sim.metadata.stop_time_h / 24;
  const sc = demo?.scenarios[scenario];

  return (
    <section className="panel sim">
      <div className="sim-badge">MATLAB / Simulink</div>
      <header className="panel-head">
        <h2>Smart irrigation, simulated</h2>
        <p className="muted">
          Our mechatronics engineer modelled a tomato field in Doukkala with the FAO-56 root zone water balance. The
          ESP32 sensor reading (with real measurement noise) drives an on/off irrigation controller.
        </p>
      </header>

      <div className="formula" aria-label="Water balance equation">
        <span className="f-lhs">dθ/dt</span>
        <span className="f-eq">=</span>
        <span className="f-frac"><span>100</span><span>Z<sub>r</sub></span></span>
        <span className="f-eq">×</span>
        <span className="f-par">( I + P − K<sub>c</sub> · ET<sub>0</sub> )</span>
      </div>
      <div className="formula-legend">
        <span><b>θ</b> soil moisture (%)</span>
        <span><b>I</b> irrigation</span>
        <span><b>P</b> rain</span>
        <span><b>K<sub>c</sub></b> 1.15 tomato</span>
        <span><b>ET<sub>0</sub></b> 0.22 mm/h (NASA)</span>
        <span><b>Z<sub>r</sub></b> 300 mm roots</span>
      </div>

      <div className="tiles">
        <div className="tile"><span className="tile-k">Water applied</span><span className="tile-v"><CountUp value={s.irrigation_total_mm} decimals={1} /> mm</span><span className="tile-s">over {days} days</span></div>
        <div className="tile"><span className="tile-k">Per day</span><span className="tile-v"><CountUp value={s.irrigation_total_mm / days} decimals={1} /> mm</span><span className="tile-s">tomato needs ≈ 6.0 mm/day</span></div>
        <div className="tile"><span className="tile-k">Valve open</span><span className="tile-v"><CountUp value={s.irrigation_on_time_h} decimals={1} /> h</span><span className="tile-s">out of {sim.metadata.stop_time_h} h</span></div>
        <div className="tile"><span className="tile-k">Moisture kept between</span><span className="tile-v">{fmt(s.moisture_min_pct, 0)}–{fmt(s.moisture_max_pct, 0)} %</span><span className="tile-s">target band 22–35 %</span></div>
      </div>

      <div className="legend-row">
        <span><i className="sw moist" /> Soil moisture from the sensor</span>
        <span><i className="sw irr" /> Irrigation (mm/h)</span>
        <span><i className="sw band" /> Valve opens below 22 %, closes above 35 %</span>
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
            <XAxis dataKey="t" type="number" domain={[0, sim.metadata.stop_time_h]} ticks={Array.from({ length: days + 1 }, (_, i) => i * 24).filter((v, i) => days <= 4 || i % 2 === 0)} tickFormatter={(v) => `${v} h`} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="m" domain={[18, 40]} tick={{ fontSize: 11 }} unit="%" width={48} />
            <YAxis yAxisId="i" orientation="right" domain={[0, 20]} hide />
            <Tooltip
              labelFormatter={(v) => `${Number(v).toFixed(1)} h`}
              formatter={(v, n) => (n === 'm' ? [`${Number(v).toFixed(1)} %`, 'Soil moisture'] : [`${v} mm/h`, 'Irrigation'])}
            />
            <ReferenceLine yAxisId="m" y={22} stroke="#b8432c" strokeDasharray="5 4" />
            <ReferenceLine yAxisId="m" y={35} stroke="#215a39" strokeDasharray="5 4" />
            <Area yAxisId="i" dataKey="irr" type="stepAfter" stroke="#1baf7a" fill="#1baf7a" fillOpacity={0.25} strokeWidth={2} isAnimationActive />
            <Area yAxisId="m" dataKey="m" type="monotone" stroke="#2f6dae" fill="url(#gMoist)" strokeWidth={2} dot={false} isAnimationActive />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="muted small">
        Over {days} days without rain the tomato uses about {fmt(s.crop_water_use_mm, 0)} mm of water. The valve opened only twice,
        {fmt(s.irrigation_on_time_h, 1)} h in total, and applied {fmt(s.irrigation_total_mm, 0)} mm: the rest came from water already
        stored in the soil. Moisture never came close to saturation (45 %), so no water drained away below the roots.
        Figures from the engineer's MATLAB/Simulink run; the curve is regenerated from the same model for display.
      </p>

      {demo && (
        <div className="scenario">
          <div className="scenario-head">
            <b>What the app tells the farmer</b>
            <div className="segmented small">
              {demo.scenarios.map((x, i) => (
                <button key={x.name} className={i === scenario ? 'on' : ''} onClick={() => setScenario(i)}>{x.name}</button>
              ))}
            </div>
          </div>
          <div className={`advice ${sc.irrigation.action === 'review' ? 'go' : 'hold'}`}>
            <div className="advice-icon" aria-hidden><Icon name={sc.irrigation.action === 'review' ? 'drop' : 'sprout'} size={22} /></div>
            <div>
              <div className="advice-title">{sc.irrigation.action === 'review' ? 'Irrigation advised' : 'No irrigation needed'}</div>
              <div className="muted small">
                Sensor: {fmt(sc.soil_reading.volumetric_water_content_m3_m3 * 100, 0)} % soil water at {sc.soil_reading.depth_cm} cm,
                threshold {fmt(demo.demo_threshold_m3_m3 * 100, 0)} %. {sc.irrigation.reason} (simulated reading, data science contract)
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
