// NASA GIBS satellite layers (https://gibs.earthdata.nasa.gov), no key needed.
// Spring 2018 was a wet season in the region, spring 2023 a dry one (NASA POWER).
const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

export const NASA_LAYERS = [
  {
    id: 'ndvi',
    label: 'Vegetation (MODIS NDVI)',
    source: 'NASA MODIS Terra, monthly NDVI, April',
    layer: 'MODIS_Terra_L3_NDVI_Monthly',
    matrix: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
    dates: { wet: '2018-04-01', dry: '2023-04-01' },
    legend: { low: 'Bare / stressed', high: 'Dense, healthy crops', gradient: 'linear-gradient(90deg,#c9b48c,#e3dc7a,#8cc04a,#3f8f2a,#0e5a1c)' },
    explain:
      'NDVI measures how green and dense vegetation is, from satellite light reflected by leaves. In April, wheat and barley should be at their greenest.',
  },
  {
    id: 'smap',
    label: 'Soil moisture (SMAP)',
    source: 'NASA SMAP Level 4, root zone soil moisture, early April',
    layer: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture',
    matrix: 'GoogleMapsCompatible_Level6',
    maxZoom: 6,
    dates: { wet: '2018-04-07', dry: '2023-04-06' },
    legend: { low: 'Dry soil', high: 'Wet soil', gradient: 'linear-gradient(90deg,#f2e600,#7cc23a,#1f9e5a,#25d0e0,#1238d9)' },
    explain:
      'SMAP is a NASA satellite that measures soil moisture from space. This layer estimates the water available in the root zone, where crops drink.',
  },
];

export const SEASONS = [
  { id: 'wet', label: 'Spring 2018 (wet year)' },
  { id: 'dry', label: 'Spring 2023 (dry year)' },
];

export function tileUrl(def, season) {
  return `${GIBS}/${def.layer}/default/${def.dates[season]}/${def.matrix}/{level}/{row}/{col}.png`;
}
