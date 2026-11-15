// NASA GIBS satellite layers (https://gibs.earthdata.nasa.gov), no key needed.
// Spring 2018 was a wet season in the region, spring 2023 a dry one (NASA POWER).
const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

export const NASA_LAYERS = [
  {
    id: 'ndvi',
    label: 'Vegetation (MODIS NDVI)',
    label_fr: 'Végétation (MODIS NDVI)',
    source: 'NASA MODIS Terra, monthly NDVI, April',
    source_fr: 'NASA MODIS Terra, NDVI mensuel, avril',
    layer: 'MODIS_Terra_L3_NDVI_Monthly',
    matrix: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
    dates: { wet: '2018-04-01', dry: '2023-04-01' },
    legend: { low: 'Bare / stressed', low_fr: 'Nu / stressé', high: 'Dense, healthy crops', high_fr: 'Cultures denses et saines', gradient: 'linear-gradient(90deg,#c9b48c,#e3dc7a,#8cc04a,#3f8f2a,#0e5a1c)' },
    explain:
      'NDVI measures how green and dense vegetation is, from satellite light reflected by leaves. In April, wheat and barley should be at their greenest.',
    explain_fr:
      'Le NDVI mesure à quel point la végétation est verte et dense, à partir de la lumière que les feuilles renvoient vers le satellite. En avril, le blé et l’orge devraient être au plus vert.',
  },
  {
    id: 'smap',
    label: 'Soil moisture (SMAP)',
    label_fr: 'Humidité du sol (SMAP)',
    source: 'NASA SMAP Level 4, root zone soil moisture, early April',
    source_fr: 'NASA SMAP niveau 4, humidité du sol dans la zone racinaire, début avril',
    layer: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture',
    matrix: 'GoogleMapsCompatible_Level6',
    maxZoom: 6,
    dates: { wet: '2018-04-07', dry: '2023-04-06' },
    legend: { low: 'Dry soil', low_fr: 'Sol sec', high: 'Wet soil', high_fr: 'Sol humide', gradient: 'linear-gradient(90deg,#f2e600,#7cc23a,#1f9e5a,#25d0e0,#1238d9)' },
    explain:
      'SMAP is a NASA satellite that measures soil moisture from space. This layer estimates the water available in the root zone, where crops drink.',
    explain_fr:
      'SMAP est un satellite de la NASA qui mesure l’humidité du sol depuis l’espace. Cette couche estime l’eau disponible dans la zone des racines, là où les cultures boivent.',
  },
];

export const SEASONS = [
  { id: 'wet', label: 'Spring 2018 (wet year)', label_fr: 'Printemps 2018 (année humide)' },
  { id: 'dry', label: 'Spring 2023 (dry year)', label_fr: 'Printemps 2023 (année sèche)' },
];

export function tileUrl(def, season) {
  return `${GIBS}/${def.layer}/default/${def.dates[season]}/${def.matrix}/{level}/{row}/{col}.png`;
}
