// Same model as the engineer's Simulink file (sensor/simulink/simulation_du_projet.m),
// run in the browser with crop values from FAO-56 (Kc mid-season: Table 12, max effective root depth: Table 22, midpoint).
export const FAO56 = 'https://www.fao.org/4/x0490e/x0490e0b.htm';

export const IRR_CROPS = [
  { id: 'tomato_sim', crop: 'tomato', name: 'Tomato', kc: 1.15, zr: 300, simulink: true, note: 'engineer\'s Simulink run, 300 mm sensor layer' },
  { id: 'wheat', crop: 'wheat', name: 'Wheat', kc: 1.15, zr: 1250, range: '1.0-1.5 m' },
  { id: 'barley', crop: 'barley', name: 'Barley', kc: 1.15, zr: 1250, range: '1.0-1.5 m' },
  { id: 'chickpea', crop: 'chickpea', name: 'Chickpea', kc: 1.0, zr: 800, range: '0.6-1.0 m' },
  { id: 'lentil', crop: 'lentil', name: 'Lentil', kc: 1.1, zr: 700, range: '0.6-0.8 m' },
  { id: 'faba', crop: 'faba', name: 'Faba bean', kc: 1.15, zr: 600, range: '0.5-0.7 m' },
  { id: 'olive', crop: 'olive', name: 'Olive', kc: 0.7, zr: 1450, range: '1.2-1.7 m' },
  { id: 'tomato', crop: 'tomato', name: 'Tomato (full roots)', kc: 1.15, zr: 1100, range: '0.7-1.5 m' },
];

export const MODEL = { et0: 0.22, on: 22, off: 35, valve: 5, theta0: 28, min: 10, max: 45 };

// Closed-loop run: dθ/dt = 100/Zr × (I + P − Kc·ET0), relay on the noisy sensor reading.
export function simulate({ kc, zr }, days = 30) {
  let seed = 23341;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const dt = 0.1;
  const steps = Math.round((days * 24) / dt);
  const etc = kc * MODEL.et0;
  const k = 100 / zr;
  const sd = Math.sqrt(0.05 / 0.1);
  let theta = MODEL.theta0;
  let irr = 0; // starts closed: the field begins at 28 %, above the 22 % switch-on point
  let applied = 0; let onTime = 0; let openings = 0; let first = null; let lo = 99; let hi = 0;
  const series = [];
  const every = Math.max(1, Math.round(steps / 800));
  for (let i = 0; i <= steps; i += 1) {
    const reading = theta + sd * gauss();
    const prev = irr;
    if (reading >= MODEL.off) irr = 0; else if (reading <= MODEL.on) irr = MODEL.valve;
    if (irr > 0 && prev === 0) { openings += 1; if (first === null) first = i * dt; }
    lo = Math.min(lo, reading); hi = Math.max(hi, reading);
    if (i % every === 0) series.push({ t: +(i * dt).toFixed(1), m: +reading.toFixed(2), irr });
    if (i < steps) {
      theta = Math.min(MODEL.max, Math.max(MODEL.min, theta + k * (irr - etc) * dt));
      applied += irr * dt; if (irr > 0) onTime += dt;
    }
  }
  // days of soil reserve from 28 % down to the 22 % switch-on point, without noise
  const reserveDays = ((MODEL.theta0 - MODEL.on) / (k * etc)) / 24;
  return {
    series, days, applied, onTime, openings, first, lo, hi, reserveDays,
    cropUse: etc * days * 24, etcDay: etc * 24, storeMm: ((MODEL.off - MODEL.on) / 100) * zr,
  };
}
