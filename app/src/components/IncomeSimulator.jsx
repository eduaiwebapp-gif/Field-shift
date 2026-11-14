import { useEffect, useState } from 'react';
import { SCENARIOS, fmt } from '../lib/data';

// Simple estimate: revenue = yield x price x area, minus production costs and irrigation water.
export default function IncomeSimulator({ recommendations, cropId, setCropId, scenario }) {
  const crops = recommendations.crops;
  const crop = crops.find((c) => c.id === cropId) || crops[0];
  const [area, setArea] = useState(5);
  const [price, setPrice] = useState(crop.price_mad_per_kg);
  const [waterPrice, setWaterPrice] = useState(1);
  const [sc, setSc] = useState(scenario);

  useEffect(() => setPrice(crop.price_mad_per_kg), [crop.id, crop.price_mad_per_kg]);
  useEffect(() => setSc(scenario), [scenario]);

  const s = crop.scenarios[sc];
  const irrigated = crop.system === 'irrigated';
  const waterM3 = s.irrigation_mm * 10 * area;
  const waterCost = irrigated ? waterM3 * waterPrice : 0;
  const costs = crop.cost_mad_per_ha * area + waterCost;
  const revenue = (y) => y * 1000 * price * area;
  const rows = [
    { key: 'low', label: 'Bad year', y: s.yield_t_ha.low },
    { key: 'mid', label: 'Typical year', y: s.yield_t_ha.mid },
    { key: 'high', label: 'Good year', y: s.yield_t_ha.high },
  ].map((r) => ({ ...r, revenue: revenue(r.y), profit: revenue(r.y) - costs }));

  // compare all crops on the typical year, same area
  const ranking = crops
    .map((c) => {
      const cs = c.scenarios[sc];
      const cost = c.cost_mad_per_ha * area + (c.system === 'irrigated' ? cs.irrigation_mm * 10 * area * waterPrice : 0);
      const p = c.id === crop.id ? price : c.price_mad_per_kg;
      return { id: c.id, name: c.name, profit: cs.yield_t_ha.mid * 1000 * p * area - cost };
    })
    .sort((a, b) => b.profit - a.profit);
  const maxAbs = Math.max(...ranking.map((r) => Math.abs(r.profit)), 1);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Income simulator</h2>
        <p className="muted">Estimate what a crop could bring in before you invest in it.</p>
      </header>

      <div className="form">
        <label>
          Crop
          <select value={crop.id} onChange={(e) => setCropId(e.target.value)}>
            {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>
          Area (hectares)
          <input type="number" min="0.5" step="0.5" value={area} onChange={(e) => setArea(Math.max(0, Number(e.target.value)))} />
        </label>
        <label>
          Selling price (MAD/kg)
          <input type="number" min="0" step="0.1" value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))} />
        </label>
        <label>
          Climate
          <select value={sc} onChange={(e) => setSc(e.target.value)}>
            {SCENARIOS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </label>
        {irrigated && (
          <label>
            Water price (MAD/m³)
            <input type="number" min="0" step="0.1" value={waterPrice} onChange={(e) => setWaterPrice(Math.max(0, Number(e.target.value)))} />
          </label>
        )}
      </div>

      <div className="results">
        {rows.map((r) => (
          <div key={r.key} className={`result ${r.key === 'mid' ? 'main' : ''}`}>
            <div className="result-label">{r.label}</div>
            <div className={`result-profit ${r.profit < 0 ? 'bad' : 'good'}`}>
              {r.profit < 0 ? '-' : ''}{fmt(Math.abs(r.profit))} MAD
            </div>
            <div className="muted small">
              {fmt(r.y * area, 1)} t harvested · revenue {fmt(r.revenue)} MAD
            </div>
          </div>
        ))}
      </div>

      <p className="muted small">
        Costs: {fmt(crop.cost_mad_per_ha * area)} MAD production
        {irrigated && <> + {fmt(waterCost)} MAD for {fmt(waterM3)} m³ of irrigation water</>}.
        {!irrigated && s.irrigation_mm > 0 && (
          <> Reaching full yield would need about {fmt(waterM3)} m³ of extra water on {fmt(area, 1)} ha.</>
        )}
      </p>

      <h3>Which crop pays best on {fmt(area, 1)} ha? (typical year)</h3>
      <div className="hbars">
        {ranking.map((r) => (
          <div key={r.id} className={`hbar ${r.id === crop.id ? 'sel' : ''}`}>
            <span className="hbar-name">{r.name}</span>
            <span className="hbar-track">
              <span className={`hbar-fill ${r.profit < 0 ? 'bad' : 'good'}`} style={{ width: `${(Math.abs(r.profit) / maxAbs) * 100}%` }} />
            </span>
            <span className="hbar-val">{r.profit < 0 ? '-' : ''}{fmt(Math.abs(r.profit))}</span>
          </div>
        ))}
      </div>
      <p className="muted small">
        Prices and costs are average estimates. Olive trees take 3 to 5 years to reach full yield, and
        tomato needs reliable access to irrigation water.
      </p>
    </section>
  );
}
