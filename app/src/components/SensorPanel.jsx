import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { loadSensorSample, fmt } from '../lib/data';

// Soil porosity used to turn volumetric water content (%) into a 0-1 wetness comparable
// with the satellite root zone soil wetness. TODO engineer: calibrate for the real soil.
const POROSITY_PCT = 45;
const POLL_MS = 10000;

export default function SensorPanel({ climate }) {
  const [readings, setReadings] = useState([]);
  const [url, setUrl] = useState('');
  const [live, setLive] = useState(false);
  const [error, setError] = useState('');

  // simulated data by default
  useEffect(() => {
    loadSensorSample().then((d) => setReadings(Array.isArray(d) ? d : [d])).catch((e) => setError(e.message));
  }, []);

  // live mode: poll the ESP32 endpoint
  useEffect(() => {
    if (!live || !url) return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(url);
        const d = await res.json();
        const list = Array.isArray(d) ? d : [d];
        if (!stop) { setReadings((prev) => [...prev, ...list].slice(-200)); setError(''); }
      } catch (e) {
        if (!stop) setError(`Cannot reach the sensor: ${e.message}`);
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { stop = true; clearInterval(id); };
  }, [live, url]);

  const last = readings[readings.length - 1];
  const satellite = climate.summary.recent.soil_wetness; // 0-1
  const fieldWetness = last ? last.soil_moisture_pct / POROSITY_PCT : null;
  const gap = fieldWetness !== null ? fieldWetness - satellite : 0;

  let advice = null;
  if (last) {
    if (gap < -0.15) advice = { tone: 'bad', text: 'Your field is much drier than the satellite estimate for the region. Irrigate earlier than planned, or favour drought tolerant crops (barley, olive).' };
    else if (gap > 0.15) advice = { tone: 'good', text: 'Your field holds more water than the regional estimate. You can delay irrigation and save water.' };
    else advice = { tone: 'mid', text: 'Your field is close to the satellite estimate, so the recommendations for the region apply to it.' };
  }

  const chartData = readings.map((r) => ({
    t: new Date(r.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit' }),
    moisture: r.soil_moisture_pct,
    temp: r.temperature_c,
  }));

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Field sensor</h2>
        <p className="muted">
          Satellites see soil moisture in pixels of about 10 km or more. A low cost sensor in the field
          checks what is really happening in your plot.
        </p>
      </header>

      {last && (
        <div className="stats">
          <div className="stat">
            <div className="stat-label">Soil moisture in the field</div>
            <div className="stat-values"><span className="stat-after">{fmt(last.soil_moisture_pct, 1)}</span><span className="stat-unit">%</span></div>
            <div className="muted small">≈ {fmt(fieldWetness * 100)}% of saturation</div>
          </div>
          <div className="stat">
            <div className="stat-label">Satellite estimate (region)</div>
            <div className="stat-values"><span className="stat-after">{fmt(satellite * 100)}</span><span className="stat-unit">% of saturation</span></div>
            <div className="muted small">NASA POWER root zone soil wetness</div>
          </div>
          <div className="stat">
            <div className="stat-label">Soil temperature</div>
            <div className="stat-values"><span className="stat-after">{fmt(last.temperature_c, 1)}</span><span className="stat-unit">°C</span></div>
            <div className="muted small">{last.device_id} · {new Date(last.timestamp).toLocaleString('en-GB')}</div>
          </div>
        </div>
      )}

      {advice && <div className={`callout ${advice.tone}`}>{advice.text}</div>}

      {chartData.length > 1 && (
        <div className="chart">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={40} />
              <YAxis tick={{ fontSize: 11 }} unit="%" width={56} domain={[0, 50]} />
              <Tooltip />
              <ReferenceLine y={satellite * POROSITY_PCT} stroke="var(--muted)" strokeDasharray="4 4" label={{ value: 'satellite', fontSize: 11, position: 'insideTopRight' }} />
              <Line dataKey="moisture" name="Soil moisture (%)" stroke="var(--water)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="live">
        <label>
          Live sensor URL (ESP32)
          <input placeholder="http://192.168.1.50/reading" value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
        <button className="btn" onClick={() => setLive((v) => !v)} disabled={!url}>
          {live ? 'Stop live' : 'Connect'}
        </button>
      </div>
      <p className="muted small">
        {live ? 'Live data, refreshed every 10 seconds.' : 'Showing simulated readings until a sensor is connected.'}
      </p>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
