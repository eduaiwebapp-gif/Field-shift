// NASA Blue Marble satellite mosaic of Morocco (NASA GIBS tiles, zoom 6), with the two study regions.
const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/default/GoogleMapsCompatible_Level8';
const Z = 6;
const X0 = 28;
const Y0 = 24;
const COLS = 5;
const ROWS = 4;
const T = 256;

function toPx(lon, lat) {
  const n = 2 ** Z;
  const x = ((lon + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(Math.PI / 4 + r / 2)) / Math.PI) / 2) * n;
  return [(x - X0) * T, (y - Y0) * T];
}

export default function HeroBackdrop({ regions, regionId }) {
  const sel = regions?.find((r) => r.id === regionId) || { lon: -7.62, lat: 33.0 };
  const [ax, ay] = toPx(sel.lon, sel.lat);
  const tiles = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      tiles.push(<img key={`${x}-${y}`} src={`${GIBS}/${Z}/${Y0 + y}/${X0 + x}.jpg`} alt="" width={T} height={T} loading="eager" decoding="async" />);
    }
  }
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop-pan" style={{ left: `calc(88% - ${ax}px)`, top: `calc(84% - ${ay}px)` }}>
        <div className="backdrop-tiles">{tiles}</div>
        {regions?.map((r) => {
          const [x, y] = toPx(r.lon, r.lat);
          const on = r.id === regionId;
          return (
            <div key={r.id} className={`bd-marker ${on ? 'on' : ''}`} style={{ left: x, top: y }}>
              <span className="bd-ring" />
              <span className="bd-dot" />
              <span className="bd-label">{r.name.split(' (')[0]}</span>
            </div>
          );
        })}
      </div>
      <div className="backdrop-shade" />
      <span className="backdrop-credit">NASA Blue Marble · GIBS</span>
    </div>
  );
}
