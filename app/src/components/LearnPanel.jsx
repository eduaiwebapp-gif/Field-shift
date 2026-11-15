import { useLang } from '../lib/i18n';

const TERMS = [
  {
    term: 'Evapotranspiration',
    term_fr: 'Évapotranspiration',
    text: 'The water that leaves a field as vapour: evaporation from the soil plus the water the plants release through their leaves. On hot, windy days it goes up, so crops need more water even if it did not rain less.',
    text_fr: 'L’eau qui quitte un champ sous forme de vapeur : l’évaporation du sol plus l’eau que les plantes rejettent par leurs feuilles. Les jours chauds et venteux, elle augmente, donc les cultures ont besoin de plus d’eau même s’il n’a pas moins plu.',
  },
  {
    term: 'Root zone soil moisture',
    term_fr: 'Humidité du sol dans la zone racinaire',
    text: 'How wet the soil is where the roots are (roughly the top metre), from 0 (dry) to 1 (saturated). It is what the plant can actually drink, unlike rain that runs off or evaporates.',
    text_fr: 'L’humidité du sol là où se trouvent les racines (environ le premier mètre), de 0 (sec) à 1 (saturé). C’est l’eau que la plante peut vraiment boire, contrairement à la pluie qui ruisselle ou s’évapore.',
  },
  {
    term: 'Effective rainfall',
    term_fr: 'Pluie efficace',
    text: 'The part of the rain that stays in the soil for the crop. We count 75 % of the rain that falls during the growing months.',
    text_fr: 'La part de la pluie qui reste dans le sol pour la culture. Nous comptons 75 % de la pluie tombée pendant les mois de culture.',
  },
  {
    term: 'Heat stress',
    term_fr: 'Stress thermique',
    text: 'When the daily maximum temperature goes above what a crop tolerates during flowering or grain filling, the grains stay small or empty. We count hot days (30 °C or more) from March to May.',
    text_fr: 'Quand la température maximale dépasse ce que la culture supporte pendant la floraison ou le remplissage du grain, les grains restent petits ou vides. Nous comptons les jours chauds (30 °C ou plus) de mars à mai.',
  },
  {
    term: 'Nitrogen-fixing crops (legumes)',
    term_fr: 'Cultures qui fixent l’azote (légumineuses)',
    text: 'Chickpea, lentil and faba bean host bacteria in their roots that take nitrogen from the air and leave part of it in the soil. The next cereal then needs less fertiliser.',
    text_fr: 'Le pois chiche, la lentille et la fève abritent dans leurs racines des bactéries qui prennent l’azote de l’air et en laissent une partie dans le sol. La céréale suivante a alors besoin de moins d’engrais.',
  },
  {
    term: 'Crop rotation',
    term_fr: 'Rotation des cultures',
    text: 'Changing the crop grown on a field from one season to the next. It breaks pest and disease cycles, balances soil nutrients and spreads the risk of a bad year.',
    text_fr: 'Changer de culture sur un champ d’une saison à l’autre. Cela casse les cycles des ravageurs et des maladies, équilibre les nutriments du sol et répartit le risque d’une mauvaise année.',
  },
  {
    term: 'Bare soil period',
    term_fr: 'Période de sol nu',
    text: 'Months when nothing grows on the field. Bare soil loses water to evaporation and soil to wind and heavy rain (erosion).',
    text_fr: 'Les mois où rien ne pousse sur le champ. Un sol nu perd de l’eau par évaporation, et de la terre à cause du vent et des fortes pluies (érosion).',
  },
];

const SOURCES = [
  { label: 'NASA POWER daily API', url: 'https://power.larc.nasa.gov/docs/services/api/temporal/daily/' },
  { label: 'NASA GIBS (MODIS NDVI, SMAP soil moisture)', url: 'https://gibs.earthdata.nasa.gov' },
  { label: 'FAO-56: crop evapotranspiration and root zone water balance', url: 'https://www.fao.org/4/x0490e/x0490e0b.htm' },
  { label: 'FAO: crop water needs', url: 'https://www.fao.org/4/s2022e/s2022e02.htm' },
  { label: 'UCSB CHIRPS v2 rainfall (cross-check)', url: 'https://www.chc.ucsb.edu/data/chirps' },
  { label: 'Morocco cereal guide (sowing calendar, rotations)', url: 'https://admin.ardna.org/files/contenus_files/ticket_file641196ed6f8cc-N891-R%C3%A9f%C3%A9rentiel-c%C3%A9r%C3%A9ales-MEP-HB-29_05_2017-%28final%29.pdf' },
  { label: 'Morocco legume guide', url: 'https://www.ardna.org/fr/articles/detail?id=84' },
  { label: 'INRA Morocco: farming systems', url: 'https://www.inra.org.ma/sites/default/files/sustainable_farming_system11.pdf' },
  { label: 'INRA Morocco: rainfall onset threshold for sowing', url: 'https://www.inra.org.ma/sites/default/files/publications/ouvrages/prediction1212.pdf' },
  { label: 'INRA Morocco: olive guide', url: 'https://www.inra.org.ma/sites/default/files/publications/ouvrages/olivierkafacifr.pdf' },
];

export default function LearnPanel() {
  const { L, pick } = useLang();
  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{L('How to read Field Shift', 'Comment lire Field Shift')}</h2>
        <p className="muted">{L('The data behind the advice, and its limits.', 'Les données derrière les conseils, et leurs limites.')}</p>
      </header>

      <h3>{L('Where the data comes from', 'D’où viennent les données')}</h3>
      <p>
        {L(
          'All climate numbers come from NASA POWER, which combines satellite observations with NASA’s MERRA-2 and GEOS models to give daily temperature, rainfall and soil moisture for any point on Earth since the 1980s. We use 35 seasons (1990-2025) for each region and compare 1991-2005 with 2011-2025.',
          'Tous les chiffres du climat viennent de NASA POWER, qui combine des observations satellites avec les modèles MERRA-2 et GEOS de la NASA pour donner la température, la pluie et l’humidité du sol chaque jour, partout sur Terre, depuis les années 1980. Nous utilisons 35 saisons (1990-2025) pour chaque région et comparons 1991-2005 avec 2011-2025.',
        )}
      </p>

      <h3>{L('Satellite vs. field measurements', 'Satellite ou mesures au champ')}</h3>
      <div className="compare">
        <div className="compare-col">
          <h4>{L('Satellite / NASA POWER', 'Satellite / NASA POWER')}</h4>
          <ul>
            <li>{L('Covers every farm, for free, back to the 1980s', 'Couvre toutes les fermes, gratuitement, depuis les années 1980')}</li>
            <li>{L('One value for an area of tens of kilometres', 'Une seule valeur pour une zone de plusieurs dizaines de kilomètres')}</li>
            <li>{L('Good for long-term trends and comparing regions', 'Idéal pour les tendances à long terme et pour comparer les régions')}</li>
          </ul>
        </div>
        <div className="compare-col">
          <h4>{L('Field sensor', 'Capteur au champ')}</h4>
          <ul>
            <li>{L('Measures your own plot, right now', 'Mesure votre propre parcelle, en ce moment')}</li>
            <li>{L('Shows differences the satellite cannot see (slope, soil type, irrigation)', 'Montre des différences que le satellite ne voit pas (pente, type de sol, irrigation)')}</li>
            <li>{L('Only covers one spot and has no history', 'Ne couvre qu’un point et n’a pas d’historique')}</li>
          </ul>
        </div>
      </div>
      <p className="muted small">
        {L('Using both is more accurate: the satellite gives the long-term picture, the sensor checks it on the ground.',
          'Utiliser les deux est plus précis : le satellite donne la vue d’ensemble sur le long terme, le capteur la vérifie sur le terrain.')}
      </p>

      <h3>{L('Words used in the app', 'Les mots utilisés dans l’application')}</h3>
      <dl className="glossary">
        {TERMS.map((t) => (
          <div key={t.term}><dt>{pick(t, 'term')}</dt><dd>{pick(t, 'text')}</dd></div>
        ))}
      </dl>

      <h3>{L('How the team built it', 'Comment l’équipe l’a construit')}</h3>
      <ul className="limits">
        <li>
          <b>{L('Rotation model (JavaScript):', 'Modèle de rotations (JavaScript) :')}</b>{' '}
          {L('replays each rotation on the real 2011-2025 seasons with a water balance, heat stress at flowering and root zone soil wetness.',
            'rejoue chaque rotation sur les vraies saisons 2011-2025 avec un bilan hydrique, le stress thermique à la floraison et l’humidité de la zone racinaire.')}
        </li>
        <li>
          <b>{L('Data science (Python):', 'Data science (Python) :')}</b>{' '}
          {L('NASA POWER daily data 2006-2025, rainfed cereal screening with Hargreaves reference ET × FAO-56 crop coefficients, a logistic regression for the arrival of autumn rains tested on 5 unseen seasons, and a rainfall cross-check against UCSB CHIRPS.',
            'données journalières NASA POWER 2006-2025, sélection des céréales pluviales avec l’ET de référence de Hargreaves × les coefficients culturaux FAO-56, une régression logistique sur l’arrivée des pluies d’automne testée sur 5 saisons jamais vues, et une vérification de la pluie avec UCSB CHIRPS.')}
        </li>
        <li>
          <b>{L('Field irrigation (MATLAB/Simulink):', 'Irrigation au champ (MATLAB/Simulink) :')}</b>{' '}
          {L('a root zone water balance, dθ/dt = 100/Zr × (I + P − Kc × ET0), with a sensor and an on/off irrigation controller, run for each crop with its FAO-56 Kc and root depth.',
            'un bilan hydrique de la zone racinaire, dθ/dt = 100/Zr × (I + P − Kc × ET0), avec un capteur et un contrôleur d’irrigation tout-ou-rien, calculé pour chaque culture avec son Kc et sa profondeur de racines FAO-56.')}
        </li>
      </ul>

      <h3>Sources</h3>
      <ul className="sources">
        {SOURCES.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}
      </ul>

      <h3>{L('Limits of the model', 'Limites du modèle')}</h3>
      <ul className="limits">
        <li>{L('Crop water needs, heat limits, yields, prices and costs are first estimates and must be checked with agronomists.', 'Les besoins en eau, les limites de chaleur, les rendements, les prix et les coûts sont des premières estimations à faire vérifier par des agronomes.')}</li>
        <li>{L('Soil benefits of each rotation (nitrogen, erosion, pests) come from agronomy knowledge, not from satellite data.', 'Les bénéfices pour le sol de chaque rotation (azote, érosion, ravageurs) viennent des connaissances agronomiques, pas des données satellites.')}</li>
        <li>{L('Recommendations use recent climate, not a forecast of next season.', 'Les recommandations utilisent le climat récent, pas une prévision de la saison prochaine.')}</li>
        <li>{L('It does not know the farmer’s soil type, equipment, water access or buyers.', 'Il ne connaît ni le type de sol de l’agriculteur, ni son matériel, ni son accès à l’eau, ni ses acheteurs.')}</li>
      </ul>
      <div className="callout mid">
        {L('Field Shift supports farmers’ decisions. It does not replace their experience or the advice of local agricultural experts.',
          'Field Shift aide les agriculteurs à décider. Il ne remplace ni leur expérience ni les conseils des experts agricoles locaux.')}
      </div>
    </section>
  );
}
