// Reproduces sensor/simulink/simulation_du_projet.m (same equations and parameters) with a seeded noise source.
const fs = require('fs');
let seed = 110450; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
const dt = 0.1, T = 240, ETc = 0.22 * 1.15, k = 100 / 300, sd = Math.sqrt(0.05 / 0.1);
let theta = 28, irr = 5; // relay starts in its "off" state, so the valve is open at t = 0 (as in the Scope plot)
const t = [], m = [], u = [];
let applied = 0, onT = 0;
for (let i = 0; i <= T / dt + 1e-9; i++) {
  const reading = theta + sd * gauss();
  if (reading >= 35) irr = 0; else if (reading <= 22) irr = 5;
  t.push(+(i * dt).toFixed(1)); m.push(+reading.toFixed(3)); u.push(irr);
  if (i < T / dt) { theta = Math.min(45, Math.max(10, theta + k * (irr - ETc) * dt)); applied += irr * dt; if (irr > 0) onT += dt; }
}
const out = {
  metadata: { model: 'Smart_Irrigation_Model', stop_time_h: 240, n_samples: t.length,
    source: 'Summary values from the engineer\'s MATLAB/Simulink run (simulation_du_projet.m). Time series regenerated from the same model equations and parameters with seeded sensor noise, for display.',
    controller: { on_below_pct: 22, off_above_pct: 35, valve_mm_h: 5 }, crop: { kc: 1.15, et0_mm_h: 0.22, root_depth_mm: 300 } },
  summary: { moisture_min_pct: 21.99, moisture_max_pct: 35.63, moisture_final_pct: 23.81, irrigation_total_mm: 49.32, irrigation_on_time_h: 9.86,
    crop_water_use_mm: +(ETc * T).toFixed(1) },
  reproduced_check: { irrigation_total_mm: +applied.toFixed(2), irrigation_on_time_h: +onT.toFixed(2), min: Math.min(...m), max: Math.max(...m), final: m[m.length - 1] },
  time_h: t, sensor_soil_moisture_pct: m, irrigation_cmd_mm_h: u,
};
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log(JSON.stringify(out.reproduced_check), out.summary.crop_water_use_mm);
