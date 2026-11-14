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
    why: 'This is the most common practice in the region today. It is the baseline the other strategies are compared with.',
    benefits: [
      'Known market, guaranteed reference price and simple to manage',
      'Farmers already have the seeds, equipment and experience',
    ],
    risks: [
      'Wheat is the crop most hurt by spring heat and dry seasons in the NASA data',
      'Growing the same cereal every year builds up pests and root diseases (Hessian fly, root rot) and depletes soil nitrogen',
      'Needs more nitrogen fertiliser every year',
    ],
    gaps: [
      'Actual fertiliser use and yields on each farm',
      'Local pest pressure',
    ],
  },
  {
    id: 'wheat_chickpea',
    name: 'Wheat → Chickpea',
    sequence: ['wheat', 'chickpea'],
    soil: { nitrogen: 2, cover: 1, organic_matter: 1, pest_break: 2, forage: 0 },
    why: 'Chickpea is a legume that fixes nitrogen from the air and is sown in late winter, after the wettest months, so it uses rain that wheat cannot.',
    benefits: [
      'Leaves nitrogen in the soil for the next wheat crop, so less fertiliser',
      'Breaks the cereal disease and pest cycle',
      'High value per kg, a second source of income',
    ],
    risks: [
      'Chickpea is sensitive to heat in May and to ascochyta blight in wet springs',
      'Harvest is more labour intensive, prices vary more than wheat',
    ],
    gaps: [
      'Local chickpea prices and demand',
      'Disease pressure in the farmer\'s area',
    ],
  },
  {
    id: 'barley_faba',
    name: 'Barley → Faba bean',
    sequence: ['barley', 'faba'],
    soil: { nitrogen: 3, cover: 2, organic_matter: 2, pest_break: 2, forage: 3 },
    why: 'Barley is the most drought tolerant cereal and is harvested before the late spring heat. Faba bean is a legume that fixes a lot of nitrogen and its residues feed livestock.',
    benefits: [
      'The most resilient option in dry seasons according to the NASA data',
      'Strong nitrogen fixation and organic matter from faba residues',
      'Both crops can be used as forage, useful for farms with sheep or cattle',
    ],
    risks: [
      'Barley earns less per tonne than wheat',
      'Faba bean needs more water than other legumes and is sensitive to heat at flowering',
    ],
    gaps: [
      'Whether the farm has livestock or a forage market nearby',
      'Soil type: faba bean does poorly on very shallow soils',
    ],
  },
  {
    id: 'wheat_lentil_barley',
    name: 'Wheat → Lentil → Barley',
    sequence: ['wheat', 'lentil', 'barley'],
    soil: { nitrogen: 2, cover: 1, organic_matter: 2, pest_break: 3, forage: 2 },
    why: 'A three-year rotation spreads the risk across three crops with different calendars and keeps wheat only one year in three.',
    benefits: [
      'Longest break in the cereal pest cycle',
      'Lentil fixes nitrogen and has a short cycle that escapes part of the spring heat',
      'Diversified income: no single crop failure ruins the farm',
    ],
    risks: [
      'More complex to plan: three seed types and harvest periods',
      'Lentil is sensitive to heat at flowering (March - April)',
    ],
    gaps: [
      'Access to lentil seeds and buyers',
      'Equipment for harvesting legumes',
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
