const TERMS = [
  {
    term: 'Evapotranspiration',
    text: 'The water that leaves a field as vapour: evaporation from the soil plus the water the plants release through their leaves. On hot, windy days it goes up, so crops need more water even if it did not rain less.',
  },
  {
    term: 'Root zone soil moisture',
    text: 'How wet the soil is where the roots are (roughly the top metre), from 0 (dry) to 1 (saturated). It is what the plant can actually drink, unlike rain that runs off or evaporates.',
  },
  {
    term: 'Effective rainfall',
    text: 'The part of the rain that stays in the soil for the crop. We count 75 % of the rain that falls during the growing months.',
  },
  {
    term: 'Heat stress',
    text: 'When the daily maximum temperature goes above what a crop tolerates during flowering or grain filling, the grains stay small or empty. We count hot days (30 °C or more) from March to May.',
  },
  {
    term: 'Nitrogen-fixing crops (legumes)',
    text: 'Chickpea, lentil and faba bean host bacteria in their roots that take nitrogen from the air and leave part of it in the soil. The next cereal then needs less fertiliser.',
  },
  {
    term: 'Crop rotation',
    text: 'Changing the crop grown on a field from one season to the next. It breaks pest and disease cycles, balances soil nutrients and spreads the risk of a bad year.',
  },
  {
    term: 'Bare soil period',
    text: 'Months when nothing grows on the field. Bare soil loses water to evaporation and soil to wind and heavy rain (erosion).',
  },
];

export default function LearnPanel() {
  return (
    <section className="panel">
      <header className="panel-head">
        <h2>How to read Field Shift</h2>
        <p className="muted">The data behind the advice, and its limits.</p>
      </header>

      <h3>Where the data comes from</h3>
      <p>
        All climate numbers come from <b>NASA POWER</b>, which combines satellite observations with NASA’s MERRA-2
        and GEOS models to give daily temperature, rainfall and soil moisture for any point on Earth since the
        1980s. We use 35 seasons (1990-2025) for each region and compare 1991-2005 with 2011-2025.
      </p>

      <h3>Satellite vs. field measurements</h3>
      <div className="compare">
        <div className="compare-col">
          <h4>Satellite / NASA POWER</h4>
          <ul>
            <li>Covers every farm, for free, back to the 1980s</li>
            <li>One value for an area of tens of kilometres</li>
            <li>Good for long-term trends and comparing regions</li>
          </ul>
        </div>
        <div className="compare-col">
          <h4>Field sensor</h4>
          <ul>
            <li>Measures your own plot, right now</li>
            <li>Shows differences the satellite cannot see (slope, soil type, irrigation)</li>
            <li>Only covers one spot and has no history</li>
          </ul>
        </div>
      </div>
      <p className="muted small">Using both is more accurate: the satellite gives the long-term picture, the sensor checks it on the ground.</p>

      <h3>Words used in the app</h3>
      <dl className="glossary">
        {TERMS.map((t) => (
          <div key={t.term}><dt>{t.term}</dt><dd>{t.text}</dd></div>
        ))}
      </dl>

      <h3>Limits of the model</h3>
      <ul className="limits">
        <li>Crop water needs, heat limits, yields, prices and costs are first estimates and must be checked with agronomists.</li>
        <li>Soil benefits of each rotation (nitrogen, erosion, pests) come from agronomy knowledge, not from satellite data.</li>
        <li>Recommendations use recent climate, not a forecast of next season.</li>
        <li>It does not know the farmer’s soil type, equipment, water access or buyers.</li>
      </ul>
      <div className="callout mid">
        Field Shift supports farmers’ decisions. It does not replace their experience or the advice of local agricultural experts.
      </div>
    </section>
  );
}
