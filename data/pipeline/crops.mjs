// Crop requirements used by the rule-based model.
// IMPORTANT: these are first estimates (FAO crop water needs + typical Moroccan
// yields and prices). The data scientist / an agronomist should check and refine them.
//
// months: growing months (1 = Jan). Seasons cross the new year, e.g. [11,12,1,2,3,4,5].
// critical_months: months where heat hurts the most (flowering / grain filling).
// water_need_mm: water needed over the growing months for full yield.
// heat_limit_c: mean daily max temperature in critical months above which yield drops.
// yield_t_ha: [bad year, good year] for this system in Morocco.

export const CROPS = [
  {
    id: 'wheat', name: 'Wheat', system: 'rainfed',
    months: [11, 12, 1, 2, 3, 4, 5], critical_months: [4, 5],
    planting_window: 'Nov 1 - Dec 15', harvest_window: 'May - Jun',
    water_need_mm: 450, heat_limit_c: 26,
    yield_t_ha: [0.4, 3.0], price_mad_per_kg: 3.0, cost_mad_per_ha: 4500,
    notes: 'Main cereal of the region. Hurt by dry springs and heat during grain filling (Apr - May).',
  },
  {
    id: 'barley', name: 'Barley', system: 'rainfed',
    months: [11, 12, 1, 2, 3, 4, 5], critical_months: [3, 4],
    planting_window: 'Nov 1 - Dec 15', harvest_window: 'May',
    water_need_mm: 350, heat_limit_c: 27,
    yield_t_ha: [0.3, 2.2], price_mad_per_kg: 2.8, cost_mad_per_ha: 3800,
    notes: 'More drought tolerant than wheat and harvested earlier, so it escapes some of the late heat.',
  },
  {
    id: 'chickpea', name: 'Chickpea', system: 'rainfed',
    months: [1, 2, 3, 4, 5, 6], critical_months: [4, 5],
    planting_window: 'Jan - Feb', harvest_window: 'Jun',
    water_need_mm: 300, heat_limit_c: 28,
    yield_t_ha: [0.2, 1.3], price_mad_per_kg: 12.0, cost_mad_per_ha: 7000,
    notes: 'Fixes nitrogen, good in rotation after cereals. High value per kg.',
  },
  {
    id: 'lentil', name: 'Lentil', system: 'rainfed',
    months: [12, 1, 2, 3, 4, 5], critical_months: [3, 4],
    planting_window: 'Dec - Jan', harvest_window: 'May',
    water_need_mm: 300, heat_limit_c: 25,
    yield_t_ha: [0.2, 1.1], price_mad_per_kg: 12.0, cost_mad_per_ha: 7000,
    notes: 'Short cycle legume, sensitive to heat at flowering.',
  },
  {
    id: 'faba', name: 'Faba bean', system: 'rainfed',
    months: [11, 12, 1, 2, 3, 4], critical_months: [2, 3],
    planting_window: 'Nov', harvest_window: 'Apr - May',
    water_need_mm: 400, heat_limit_c: 23,
    yield_t_ha: [0.4, 1.6], price_mad_per_kg: 8.0, cost_mad_per_ha: 6500,
    notes: 'Needs more water than other legumes, sensitive to heat at flowering.',
  },
  {
    id: 'olive', name: 'Olive', system: 'perennial',
    months: [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9], critical_months: [5, 6],
    planting_window: 'Perennial (plant Nov - Mar)', harvest_window: 'Oct - Dec',
    water_need_mm: 600, heat_limit_c: 34,
    yield_t_ha: [1.0, 5.0], price_mad_per_kg: 5.0, cost_mad_per_ha: 12000,
    notes: 'Very drought tolerant once established, long-term investment (3-5 years before full yield).',
  },
  {
    id: 'tomato', name: 'Tomato (open field)', system: 'irrigated',
    months: [3, 4, 5, 6, 7], critical_months: [6, 7],
    planting_window: 'Mar - Apr', harvest_window: 'Jun - Aug',
    water_need_mm: 600, heat_limit_c: 33,
    yield_t_ha: [25, 60], price_mad_per_kg: 2.0, cost_mad_per_ha: 70000,
    notes: 'High income but needs full irrigation, so it depends on water access.',
  },
];

// Sources checked by the data scientist (docs/for-data-scientist and data-science/handoff/review).
const CEREAL_GUIDE = { label: 'Morocco cereal guide, Table 11', url: 'https://admin.ardna.org/files/contenus_files/ticket_file641196ed6f8cc-N891-R%C3%A9f%C3%A9rentiel-c%C3%A9r%C3%A9ales-MEP-HB-29_05_2017-%28final%29.pdf' };
const FAO_WATER = { label: 'FAO, crop water needs (Table 5)', url: 'https://www.fao.org/4/s2022e/s2022e02.htm' };
const FAO56 = { label: 'FAO-56, crop evapotranspiration', url: 'https://www.fao.org/4/x0490e/x0490e0b.htm' };
const LEGUME_GUIDE = { label: 'Morocco legume guide', url: 'https://www.ardna.org/fr/articles/detail?id=84' };

export const CROP_SOURCES = {
  wheat: [CEREAL_GUIDE, FAO_WATER, FAO56],
  barley: [CEREAL_GUIDE, FAO_WATER, FAO56],
  chickpea: [{ label: 'INRA, spring chickpea', url: 'https://www.inra.org.ma/sites/default/files/06903.pdf' }, LEGUME_GUIDE],
  lentil: [LEGUME_GUIDE],
  faba: [LEGUME_GUIDE, { label: 'INRA, crop protection guide', url: 'https://www.inra.org.ma/sites/default/files/publications/ouvrages/guidephyto2015r.pdf' }],
  olive: [{ label: 'INRA, olive guide', url: 'https://www.inra.org.ma/sites/default/files/publications/ouvrages/olivierkafacifr.pdf' }, FAO56],
  tomato: [FAO_WATER, FAO56],
};
