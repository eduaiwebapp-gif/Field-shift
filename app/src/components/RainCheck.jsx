import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { getJson, fmt } from '../lib/data';
import { useLang } from '../lib/i18n';

// Cross-check of NASA POWER rainfall against UCSB CHIRPS v2 (data scientist, Python).
export default function RainCheck({ regionId }) {
  const { L } = useLang();
  const [d, setD] = useState(null);
  useEffect(() => {
    setD(null);
    getJson(`seasonreplay/${regionId}/rainfall_check.json`).then(setD).catch(() => {});
  }, [regionId]);
  if (!d) return null;
  const rows = d.seasons.map((s) => ({ season: s.season, nasa: Math.round(s.nasa_mm), chirps: Math.round(s.chirps_mm) }));
  const big = d.seasons.reduce((a, s) => (Math.abs(s.gap_mm) > Math.abs(a.gap_mm) ? s : a));
  return (
    <div className="raincheck">
      <h3>{L('Can we trust NASA rainfall here? A cross-check', 'Peut-on se fier à la pluie NASA ici ? Une vérification')}</h3>
      <p className="muted small">
        {L(`We compared NASA POWER with a second, independent rainfall product (UCSB CHIRPS v2, which blends satellite data with rain gauges) at ${d.site_name}, October to May, for the last five seasons.`,
          `Nous avons comparé NASA POWER avec une seconde source de pluie indépendante (UCSB CHIRPS v2, qui combine satellites et pluviomètres) à ${d.site_name}, d’octobre à mai, sur les cinq dernières saisons.`)}
      </p>
      <div className="trend-grid rc-stats">
        <div><span className="trend-v">{d.within_50mm} {L('of', 'sur')} 5</span><span className="trend-k">{L('seasons within 50 mm of each other', 'saisons avec moins de 50 mm d’écart')}</span></div>
        <div><span className="trend-v">{d.sowing_agreement} {L('of', 'sur')} 5</span><span className="trend-k">{L('seasons with the same sowing-rain answer', 'saisons avec la même réponse pour la pluie de semis')}</span></div>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="season" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={48} label={{ value: "mm", angle: -90, position: "insideLeft", offset: 18, fontSize: 11 }} />
            <Tooltip formatter={(v, n) => [`${fmt(v)} mm`, n === 'nasa' ? 'NASA POWER' : 'CHIRPS v2']} />
            <Legend formatter={(n) => (n === 'nasa' ? 'NASA POWER' : 'CHIRPS v2')} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="nasa" fill="#126764" radius={[4, 4, 0, 0]} />
            <Bar dataKey="chirps" fill="#c76a2d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="callout mid">
        {L(`What it means: in most seasons the two products are close, with NASA POWER usually a little wetter. The big exception is ${big.season} (${Math.round(big.nasa_mm)} mm vs ${Math.round(big.chirps_mm)} mm). If the real rain is closer to CHIRPS, dry years were even drier than our simulation assumes, so the losses we show for wheat after wheat are more likely too low than too high. A local rain gauge check is the next step.`,
          `Ce que ça veut dire : la plupart des saisons, les deux sources sont proches, NASA POWER étant en général un peu plus humide. La grande exception est ${big.season} (${Math.round(big.nasa_mm)} mm contre ${Math.round(big.chirps_mm)} mm). Si la vraie pluie est plus proche de CHIRPS, les années sèches l’étaient encore plus que dans notre simulation, donc les pertes que nous montrons pour le blé sur blé sont plutôt sous-estimées que gonflées. La prochaine étape est une vérification avec un pluviomètre local.`)}
      </div>
      <p className="muted small">
        {L('Data:', 'Données :')} <a href="https://www.chc.ucsb.edu/data/chirps" target="_blank" rel="noreferrer">UCSB CHIRPS v2</a> via ClimateSERV
        {L('and NASA POWER daily. Method and files in', 'et NASA POWER journalier. Méthode et fichiers dans')}{' '}
        <a href="https://github.com/eduaiwebapp-gif/SeasonReplay/tree/main/data-science/validation" target="_blank" rel="noreferrer">data-science/validation</a>.
      </p>
    </div>
  );
}
