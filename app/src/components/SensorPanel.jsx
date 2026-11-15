import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { loadSensorSample, fmt } from '../lib/data';
import { useLang } from '../lib/i18n';

// Soil porosity used to turn volumetric water content (%) into a 0-1 wetness comparable
// with the satellite root zone soil wetness. TODO engineer: calibrate for the real soil.
const POROSITY_PCT = 45;
const POLL_MS = 10000;

// Parts of the field unit (component models used in the 3D concept assembly)
const PARTS = [
  { en: ['IP67 junction box', 'Off-the-shelf box (Gratury): opaque hinged lid, rubber seal, steel latches, internal mounting plate for the boards'],
    fr: ['Boîtier de dérivation IP67', 'Boîtier du commerce (Gratury) : couvercle opaque à charnière, joint caoutchouc, grenouillères en acier, plaque de montage interne'] },
  { en: ['ESP32-WROOM, 30 pins, USB-C', 'Reads the probe, sends readings over Wi-Fi, sleeps between readings'],
    fr: ['ESP32-WROOM, 30 broches, USB-C', 'Lit la sonde, envoie les mesures en Wi-Fi, dort entre deux mesures'] },
  { en: ['LiPo battery, 500 mAh', '3.7 V nominal, charged by the solar panel through a charge module'],
    fr: ['Batterie LiPo, 500 mAh', '3,7 V nominal, chargée par le panneau solaire via un module de charge'] },
  { img: '/images/part_solar-cell.jpg', en: ['5 V mini solar panel', '53 × 30 mm cell in the 3D model'],
    fr: ['Mini panneau solaire 5 V', 'Cellule de 53 × 30 mm dans le modèle 3D'] },
  { img: '/images/part_probe.jpg', en: ['Capacitive soil moisture probe v1.2', 'No exposed metal in the soil, so it does not corrode like resistive probes'],
    fr: ['Sonde capacitive d’humidité v1.2', 'Pas de métal exposé dans le sol, elle ne se corrode pas comme les sondes résistives'] },
];

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
        {L('3D concept assembly and render by our mechatronics engineer (SolidWorks), built from standard component models: solar powered, sealed against rain and dust, with the probe in the root zone.',
          'Assemblage 3D de concept et rendu par notre ingénieur en mécatronique (SolidWorks), à partir de modèles de composants standards : alimenté par le soleil, étanche à la pluie et à la poussière, avec la sonde dans la zone des racines.')}
      </p>
      <img className="enclosure" src={`/images/enclosure_${lang === 'fr' ? 'fr' : 'en'}.jpg`} width="1600" height="893" loading="lazy"
        alt={L('Exploded 3D view of the sensor box: solar panel, translucent lid, sealing gasket, ESP32 board and battery, IP65 enclosure with a cable gland, and the soil moisture probe',
          'Vue 3D éclatée du boîtier : panneau solaire, capot translucide, joint d’étanchéité, carte ESP32 et batterie, boîtier IP65 avec presse-étoupe, et sonde d’humidité du sol')} />
      <h4 className="enc-title">{L('Parts chosen for the prototype', 'Pièces choisies pour le prototype')}</h4>
      <div className="parts">
        {PARTS.map((p) => (
          <div className="part" key={p.en[0]}>
            {p.img && <img src={p.img} alt="" loading="lazy" width="1024" height="768" />}
            <div><b>{L(p.en[0], p.fr[0])}</b><p className="muted small">{L(p.en[1], p.fr[1])}</p></div>
          </div>
        ))}
      </div>

      <div className="callout mid">
        <b>{L('Design choices and what the next version adds', 'Choix de conception et ajouts de la prochaine version')}</b>
        <ul className="enc-notes">
          <li>{L('Heat: a clear lid in the Moroccan sun can push the inside above 60 °C, too hot for a LiPo battery. That is why the prototype box has an opaque lid; a LiFePO4 cell would add margin.',
            'Chaleur : sous un capot transparent, au soleil marocain, l’intérieur peut dépasser 60 °C, trop chaud pour une batterie LiPo. C’est pourquoi le boîtier du prototype a un couvercle opaque ; une cellule LiFePO4 ajouterait de la marge.')}</li>
          <li>{L('Two cable glands, one for the probe and one for the solar lead, so the box keeps its seal.', 'Deux presse-étoupes, un pour la sonde et un pour le câble solaire, pour que le boîtier reste étanche.')}</li>
          <li>{L('A small solar LiPo charge module: the panel cannot charge the battery directly and the ESP32 board has no charger.', 'Un petit module de charge solaire LiPo : le panneau ne peut pas charger la batterie directement et la carte ESP32 n’a pas de chargeur.')}</li>
          <li>{L('Probe: its electronics are not waterproof, so they are sealed in the head and only the sensing blade goes in the soil.', 'Sonde : son électronique n’est pas étanche, elle est donc scellée dans la tête et seule la lame de mesure va dans le sol.')}</li>
          <li>{L('Battery life: a small panel only works with deep sleep between readings, one reading every 30 minutes.', 'Autonomie : un petit panneau ne suffit qu’avec la veille profonde entre deux mesures, une mesure toutes les 30 minutes.')}</li>
          <li>{L('Range: Wi-Fi rarely reaches the middle of a field, so a LoRa radio would send the readings to the farm.', 'Portée : le Wi-Fi atteint rarement le milieu d’un champ, une radio LoRa enverrait les mesures jusqu’à la ferme.')}</li>
        </ul>
      </div>
    </section>
  );
}
