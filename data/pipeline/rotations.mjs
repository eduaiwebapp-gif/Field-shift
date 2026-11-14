// Rotation strategies compared by the app.
// `sequence` = crop ids from crops.mjs, one per season, repeated.
// `soil` ratings: 0 = none, 1 = low, 2 = medium, 3 = high. They are qualitative
// agronomy knowledge, not computed from satellite data, and must be reviewed locally.
//
// The numbers (score, income, water, failed seasons) are computed in build.mjs
// from NASA POWER data by replaying each rotation over the real seasons.

export const ROTATIONS = [
  {
    id: 'wheat_mono',
    name: 'Wheat after wheat',
    current: true,
    sequence: ['wheat'],
    soil: { nitrogen: 0, cover: 1, organic_matter: 1, pest_break: 0, forage: 1 },
    why: 'Continuous cereal is the baseline the other strategies are compared with.',
    benefits: [
      'Established market and simple to manage',
      'Farmers already have the seeds, equipment and experience',
    ],
    risks: [
      'In our simulation, wheat is the crop most hurt by spring heat and dry seasons',
      'Growing the same cereal every year can build up cereal pests and root diseases',
      'Relies on nitrogen fertiliser, since no legume adds nitrogen to the soil',
    ],
    gaps: [
      'How common continuous wheat is locally, actual fertiliser use and yields',
      'Local pest pressure',
      'Soil cover, organic matter and forage depend on how residues are managed',
    ],
    sources: [
      { label: 'Morocco cereal guide (crop rotations)', url: 'https://admin.ardna.org/files/contenus_files/ticket_file641196ed6f8cc-N891-R%C3%A9f%C3%A9rentiel-c%C3%A9r%C3%A9ales-MEP-HB-29_05_2017-%28final%29.pdf' },
      { label: 'INRA, farming systems', url: 'https://www.inra.org.ma/sites/default/files/sustainable_farming_system11.pdf' },
    ],
  },
  {
    id: 'wheat_chickpea',
    name: 'Wheat → Chickpea',
    sequence: ['wheat', 'chickpea'],
    soil: { nitrogen: 2, cover: 1, organic_matter: 1, pest_break: 2, forage: 0 },
    why: 'Spring chickpea is a legume that diversifies a cereal sequence and can fix nitrogen from the air.',
    benefits: [
      'Can leave nitrogen for the next wheat crop, so potentially less fertiliser',
      'May help interrupt specific cereal disease cycles',
      'High value per kg, a second source of income',
    ],
    risks: [
      'Chickpea is sensitive to heat in May and to ascochyta blight in wet springs',
      'Harvest is more labour intensive, prices vary more than wheat',
    ],
    gaps: [
      'Nitrogen benefit depends on nodulation and residue management',
      'Local chickpea prices and demand',
      'Disease pressure in the farmer\'s area',
    ],
    sources: [
      { label: 'INRA, farming systems and cereal-legume evidence', url: 'https://www.inra.org.ma/sites/default/files/sustainable_farming_system11.pdf' },
      { label: 'INRA, crop protection guide', url: 'https://www.inra.org.ma/sites/default/files/publications/ouvrages/guidephyto2015r.pdf' },
    ],
  },
  {
    id: 'barley_faba',
    name: 'Barley → Faba bean',
    sequence: ['barley', 'faba'],
    soil: { nitrogen: 3, cover: 2, organic_matter: 2, pest_break: 2, forage: 3 },
    why: 'Barley is the most drought tolerant cereal and is harvested before the late spring heat. Faba bean is a legume that fixes a lot of nitrogen and its residues feed livestock.',
    benefits: [
      'The most resilient option in dry seasons in our simulation on NASA data',
      'Potential nitrogen benefit and organic matter from faba residues',
      'Both crops can be used as forage, useful for farms with sheep or cattle',
    ],
    risks: [
      'Barley earns less per tonne than wheat',
      'Faba bean needs more water than other legumes and is sensitive to heat at flowering',
    ],
    gaps: [
      'Whether the farm has livestock or a forage market nearby',
      'Forage and soil cover depend on whether residues are fed, grazed or retained',
      'Soil type: faba bean does poorly on very shallow soils',
    ],
    sources: [
      { label: 'Morocco cereal guide (regional rotation examples)', url: 'https://admin.ardna.org/files/contenus_files/ticket_file641196ed6f8cc-N891-R%C3%A9f%C3%A9rentiel-c%C3%A9r%C3%A9ales-MEP-HB-29_05_2017-%28final%29.pdf' },
      { label: 'INRA, farming systems', url: 'https://www.inra.org.ma/sites/default/files/sustainable_farming_system11.pdf' },
    ],
  },
  {
    id: 'wheat_lentil_barley',
    name: 'Wheat → Lentil → Barley',
    sequence: ['wheat', 'lentil', 'barley'],
    soil: { nitrogen: 2, cover: 1, organic_matter: 2, pest_break: 2, forage: 2 },
    why: 'A three-year rotation spreads the risk across three crops with different calendars and keeps wheat only one year in three.',
    benefits: [
      'Breaks the wheat cycle, though wheat and barley can share some pests and diseases',
      'Lentil fixes nitrogen and has a short cycle that escapes part of the spring heat',
      'Diversified income: no single crop failure ruins the farm',
    ],
    risks: [
      'More complex to plan: three seed types and harvest periods',
      'Lentil is sensitive to heat at flowering (March - April)',
    ],
    gaps: [
      'The exact three-year sequence is a scenario to validate locally',
      'Access to lentil seeds and buyers',
      'Equipment for harvesting legumes',
    ],
    sources: [
      { label: 'Morocco cereal guide (regional rotation examples)', url: 'https://admin.ardna.org/files/contenus_files/ticket_file641196ed6f8cc-N891-R%C3%A9f%C3%A9rentiel-c%C3%A9r%C3%A9ales-MEP-HB-29_05_2017-%28final%29.pdf' },
      { label: 'Morocco legume guide', url: 'https://www.ardna.org/fr/articles/detail?id=84' },
    ],
  },
];

export const SOIL_LABELS = {
  nitrogen: 'Adds nitrogen',
  cover: 'Covers the soil (less erosion)',
  organic_matter: 'Builds organic matter',
  pest_break: 'Breaks pest and disease cycles',
  forage: 'Feeds livestock',
};
