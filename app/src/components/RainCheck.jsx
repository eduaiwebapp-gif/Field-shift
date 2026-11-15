import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { getJson } from '../lib/data';

// Cross-check of NASA POWER rainfall against UCSB CHIRPS v2 (data scientist, Python).
export default function RainCheck({ regionId }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    setD(null);
    getJson(`field-shift/${regionId}/rainfall_check.json`).then(setD).catch(() => {});
  }, [regionId]);
  if (!d) return null;
  const rows = d.seasons.map((s) => ({ season: s.season, nasa: Math.round(s.nasa_mm), chirps: Math.round(s.chirps_mm) }));
  const big = d.seasons.reduce((a, s) => (Math.abs(s.gap_mm) > Math.abs(a.gap_mm) ? s : a));
  return (
    <div className="raincheck">
      <h3>Can we trust NASA rainfall here? A cross-check</h3>
      <p className="muted small">
        We compared NASA POWER with a second, independent rainfall product (UCSB CHIRPS v2, which blends satellite
        data with rain gauges) at {d.site_name}, October to May, for the last five seasons.
      </p>
      <div className="trend-grid rc-stats">
        <div><span className="trend-v">{d.within_50mm} of 5</span><span className="trend-k">seasons within 50 mm of each other</span></div>
        <div><span className="trend-v">{d.sowing_agreement} of 5</span><span className="trend-k">seasons with the same sowing-rain answer</span></div>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="season" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={48} label={{ value: "mm", angle: -90, position: "insideLeft", offset: 18, fontSize: 11 }} />
            <Tooltip formatter={(v, n) => [`${v} mm`, n === 'nasa' ? 'NASA POWER' : 'CHIRPS v2']} />
            <Legend formatter={(n) => (n === 'nasa' ? 'NASA POWER' : 'CHIRPS v2')} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="nasa" fill="#126764" radius={[4, 4, 0, 0]} />
            <Bar dataKey="chirps" fill="#c76a2d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="callout mid">
        What it means: in most seasons the two products are close, with NASA POWER usually a little wetter. The big
        exception is {big.season} ({Math.round(big.nasa_mm)} mm vs {Math.round(big.chirps_mm)} mm). If the real rain is closer to CHIRPS, dry
        years were even drier than our simulation assumes, so the losses we show for wheat after wheat are more likely
        too low than too high. A local rain gauge check is the next step.
      </div>
      <p className="muted small">
        Data: <a href="https://www.chc.ucsb.edu/data/chirps" target="_blank" rel="noreferrer">UCSB CHIRPS v2</a> via ClimateSERV
        and NASA POWER daily. Method and files in{' '}
        <a href="https://github.com/eduaiwebapp-gif/Field-shift/tree/main/data-science/validation" target="_blank" rel="noreferrer">data-science/validation</a>.
      </p>
    </div>
  );
}
