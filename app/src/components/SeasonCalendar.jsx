// Agricultural year from September to August.
const ORDER = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
import { useLang } from '../lib/i18n';

const NAMES_EN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NAMES_FR = ['', 'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

export default function SeasonCalendar({ rotation, crops, monthly }) {
  const { L, pick, lang } = useLang();
  const NAMES = lang === 'fr' ? NAMES_FR : NAMES_EN;
  const byId = Object.fromEntries(crops.map((c) => [c.id, c]));
  const byMonth = Object.fromEntries(monthly.map((m) => [m.month, m]));
  const maxRain = Math.max(...monthly.map((m) => m.rain_mm), 1);
  const maxHot = Math.max(...monthly.map((m) => m.hot_days), 1);

  return (
    <div className="cal" role="table" aria-label={L(`Season calendar for ${rotation.name}`, `Calendrier de la saison : ${pick(rotation, 'name')}`)}>
      <div className="cal-row" role="row">
        <div className="cal-label" role="rowheader" />
        {ORDER.map((m) => <div key={m} className="cal-month" role="columnheader">{NAMES[m]}</div>)}
      </div>

      <div className="cal-row" role="row">
        <div className="cal-label" role="rowheader">{L('Rain', 'Pluie')}</div>
        {ORDER.map((m) => (
          <div key={m} className="cal-cell" role="cell" title={`${byMonth[m].rain_mm} mm`}>
            <div className="cal-bar rain" style={{ height: `${(byMonth[m].rain_mm / maxRain) * 100}%` }} />
            <span className="cal-val">{Math.round(byMonth[m].rain_mm)}</span>
          </div>
        ))}
      </div>

      <div className="cal-row" role="row">
        <div className="cal-label" role="rowheader">{L('Hot days ≥30 °C', 'Jours chauds ≥30 °C')}</div>
        {ORDER.map((m) => (
          <div key={m} className="cal-cell" role="cell" title={`${byMonth[m].hot_days} ${L('days', 'jours')}`}>
            <div className="cal-bar heat" style={{ height: `${(byMonth[m].hot_days / maxHot) * 100}%` }} />
            <span className="cal-val">{Math.round(byMonth[m].hot_days)}</span>
          </div>
        ))}
      </div>

      {rotation.sequence.map((id, i) => {
        const crop = byId[id];
        return (
          <div key={i} className="cal-row" role="row">
            <div className="cal-label" role="rowheader">{L(`Year ${i + 1}`, `Année ${i + 1}`)}{L(':', ' :')} {pick(crop, 'name')}</div>
            {ORDER.map((m) => {
              const growing = crop.months.includes(m);
              const critical = crop.critical_months.includes(m);
              const cls = critical ? 'crit' : growing ? 'grow' : 'bare';
              const text = critical ? L('Sensitive to heat', 'Sensible à la chaleur') : growing ? L('Growing', 'En culture') : L('Bare soil', 'Sol nu');
              return <div key={m} className={`cal-slot ${cls}`} role="cell" title={text} aria-label={`${NAMES[m]}: ${text}`} />;
            })}
          </div>
        );
      })}

      <div className="cal-legend">
        <span><i className="cal-slot grow" /> {L('Growing', 'En culture')}</span>
        <span><i className="cal-slot crit" /> {L('Flowering, sensitive to heat', 'Floraison, sensible à la chaleur')}</span>
        <span><i className="cal-slot bare" /> {L('Bare soil (erosion risk)', 'Sol nu (risque d’érosion)')}</span>
      </div>
    </div>
  );
}
