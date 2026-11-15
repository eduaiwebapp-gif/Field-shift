import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { loadSensorSample, fmt } from '../lib/data';
import { useLang } from '../lib/i18n';

// Soil porosity used to turn volumetric water content (%) into a 0-1 wetness comparable
// with the satellite root zone soil wetness. TODO engineer: calibrate for the real soil.
const POROSITY_PCT = 45;
const POLL_MS = 10000;

export default function SensorPanel({ climate }) {
  const { L, lang } = useLang();
  const dateLocale = lang === 'fr' ? 'fr-FR' : 'en-GB';
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
        if (!stop) setError(`${L('Cannot reach the sensor', 'Capteur injoignable')}: ${e.message}`);
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
    if (gap < -0.15) advice = { tone: 'bad', text: L('Your field is much drier than the satellite estimate for the region. Irrigate earlier than planned, or favour drought tolerant crops (barley, olive).', 'Votre champ est beaucoup plus sec que l’estimation satellite pour la région. Irriguez plus tôt que prévu, ou privilégiez des cultures résistantes à la sécheresse (orge, olivier).') };
    else if (gap > 0.15) advice = { tone: 'good', text: L('Your field holds more water than the regional estimate. You can delay irrigation and save water.', 'Votre champ garde plus d’eau que l’estimation régionale. Vous pouvez retarder l’irrigation et économiser de l’eau.') };
    else advice = { tone: 'mid', text: L('Your field is close to the satellite estimate, so the recommendations for the region apply to it.', 'Votre champ est proche de l’estimation satellite : les recommandations pour la région s’appliquent à lui.') };
  }

  const chartData = readings.map((r) => ({
    t: new Date(r.timestamp).toLocaleString(dateLocale, { day: '2-digit', month: 'short', hour: '2-digit' }),
    moisture: r.soil_moisture_pct,
    temp: r.temperature_c,
  }));

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{L('Field sensor', 'Capteur au champ')}</h2>
        <p className="muted">
          {L('Satellites see soil moisture in pixels of about 10 km or more. A low cost sensor in the field checks what is really happening in your plot.',
            'Les satellites voient l’humidité du sol par pixels d’environ 10 km ou plus. Un capteur bon marché dans le champ vérifie ce qui se passe vraiment dans votre parcelle.')}
        </p>
      </header>

      {last && (
        <div className="stats">
          <div className="stat">
            <div className="stat-label">{L('Soil moisture in the field', 'Humidité du sol au champ')}</div>
            <div className="stat-values"><span className="stat-after">{fmt(last.soil_moisture_pct, 1)}</span><span className="stat-unit">%</span></div>
            <div className="muted small">≈ {fmt(fieldWetness * 100)} % {L('of saturation', 'de la saturation')}</div>
          </div>
          <div className="stat">
            <div className="stat-label">{L('Satellite estimate (region)', 'Estimation satellite (région)')}</div>
            <div className="stat-values"><span className="stat-after">{fmt(satellite * 100)}</span><span className="stat-unit">% {L('of saturation', 'de la saturation')}</span></div>
            <div className="muted small">{L('NASA POWER root zone soil wetness', 'Humidité de la zone racinaire, NASA POWER')}</div>
          </div>
          <div className="stat">
            <div className="stat-label">{L('Soil temperature', 'Température du sol')}</div>
            <div className="stat-values"><span className="stat-after">{fmt(last.temperature_c, 1)}</span><span className="stat-unit">°C</span></div>
            <div className="muted small">{last.device_id} · {new Date(last.timestamp).toLocaleString(dateLocale)}</div>
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
              <ReferenceLine y={satellite * POROSITY_PCT} stroke="var(--muted)" strokeDasharray="4 4" label={{ value: L('satellite', 'satellite'), fontSize: 11, position: 'insideTopRight' }} />
              <Line dataKey="moisture" name={L('Soil moisture (%)', 'Humidité du sol (%)')} stroke="var(--water)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="live">
        <label>
          {L('Live sensor URL (ESP32)', 'Adresse du capteur en direct (ESP32)')}
          <input placeholder="http://192.168.1.50/reading" value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
        <button className="btn" onClick={() => setLive((v) => !v)} disabled={!url}>
          {live ? L('Stop live', 'Arrêter le direct') : L('Connect', 'Connecter')}
        </button>
      </div>
      <p className="muted small">
        {live ? L('Live data, refreshed every 10 seconds.', 'Données en direct, actualisées toutes les 10 secondes.') : L('Showing simulated readings until a sensor is connected.', 'Mesures simulées affichées tant qu’aucun capteur n’est connecté.')}
      </p>
      {error && <p className="error">{error}</p>}

      <h3 className="enc-title">{L('The field unit', 'Le boîtier au champ')}</h3>
      <p className="muted">
        {L('3D model of the sensor box by our mechatronics engineer: solar powered, sealed against rain and dust, with the probe in the root zone.',
          'Modèle 3D du boîtier par notre ingénieur en mécatronique : alimenté par le soleil, étanche à la pluie et à la poussière, avec la sonde dans la zone des racines.')}
      </p>
      <img className="enclosure" src={`/images/enclosure_${lang === 'fr' ? 'fr' : 'en'}.jpg`} width="1600" height="893" loading="lazy"
        alt={L('Exploded 3D view of the sensor box: solar panel, translucent lid, sealing gasket, ESP32 board and battery, IP65 enclosure with a cable gland, and the soil moisture probe',
          'Vue 3D éclatée du boîtier : panneau solaire, capot translucide, joint d’étanchéité, carte ESP32 et batterie, boîtier IP65 avec presse-étoupe, et sonde d’humidité du sol')} />
      <div className="callout mid">
        <b>{L('What we will change in the next version', 'Ce que nous changerons dans la prochaine version')}</b>
        <ul className="enc-notes">
          <li>{L('A second cable gland for the solar panel lead, so the box stays IP65.', 'Un deuxième presse-étoupe pour le câble du panneau solaire, pour que le boîtier reste IP65.')}</li>
          <li>{L('Heat: under a translucent lid in the Moroccan sun the inside can pass 60 °C, too hot for a LiPo battery. We will use an opaque UV-resistant lid or a LiFePO4 cell.',
            'Chaleur : sous un capot translucide, au soleil marocain, l’intérieur peut dépasser 60 °C, trop chaud pour une batterie LiPo. Nous prendrons un capot opaque résistant aux UV ou une cellule LiFePO4.')}</li>
          <li>{L('Battery life: deep sleep between readings, one reading every 30 minutes.', 'Autonomie : veille profonde entre deux mesures, une mesure toutes les 30 minutes.')}</li>
          <li>{L('Range: Wi-Fi rarely reaches the middle of a field, so a LoRa radio would send the readings to the farm.', 'Portée : le Wi-Fi atteint rarement le milieu d’un champ, une radio LoRa enverrait les mesures jusqu’à la ferme.')}</li>
        </ul>
      </div>
    </section>
  );
}
