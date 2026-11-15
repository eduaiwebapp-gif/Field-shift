import { useEffect, useRef } from 'react';
import Map from '@arcgis/core/Map';
import EsriMapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import WebTileLayer from '@arcgis/core/layers/WebTileLayer';
import Circle from '@arcgis/core/geometry/Circle';
import Point from '@arcgis/core/geometry/Point';
import { NASA_LAYERS, tileUrl } from '../lib/nasaLayers';

const REGION_ZOOM = 8;

// ArcGIS map of the selected region, with optional NASA GIBS satellite layers.
// Next step: replace the circles with the real region boundaries from the Africa GeoPortal.
export default function MapView({ regions, regionId, onSelect, nasa }) {
  const divRef = useRef(null);
  const viewRef = useRef(null);
  const layerRef = useRef(null);
  const mapRef = useRef(null);
  const nasaRef = useRef(null);

  useEffect(() => {
    const layer = new GraphicsLayer();
    const map = new Map({ basemap: 'hybrid', layers: [layer] });
    const view = new EsriMapView({
      container: divRef.current,
      map,
      center: [-7.9, 32.85],
      zoom: 7,
      ui: { components: ['zoom', 'attribution'] },
      popupEnabled: false,
    });
    viewRef.current = view;
    layerRef.current = layer;
    mapRef.current = map;
    if (import.meta.env.DEV) window.__view = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // draw regions, highlight the selected one
  useEffect(() => {
    const layer = layerRef.current;
    const view = viewRef.current;
    if (!layer || !view || !regions) return;
    layer.removeAll();
    for (const r of regions) {
      const selected = r.id === regionId;
      const center = new Point({ longitude: r.lon, latitude: r.lat });
      layer.add(
        new Graphic({
          geometry: new Circle({ center, radius: r.radius_km, radiusUnit: 'kilometers', geodesic: true }),
          symbol: {
            type: 'simple-fill',
            color: selected && !nasa ? [234, 179, 8, 0.25] : [0, 0, 0, 0],
            outline: { color: selected ? [250, 204, 21, 1] : [255, 255, 255, 0.8], width: selected ? 2.5 : 1.2 },
          },
          attributes: { id: r.id },
        }),
      );
      layer.add(
        new Graphic({
          geometry: center,
          symbol: {
            type: 'text',
            text: r.name.split(' (')[0],
            color: 'white',
            haloColor: [0, 0, 0, 0.85],
            haloSize: 1.5,
            font: { size: 12, weight: 'bold', family: 'sans-serif' },
          },
          attributes: { id: r.id },
        }),
      );
    }
    const sel = regions.find((r) => r.id === regionId);
    const zoom = nasa ? NASA_LAYERS.find((l) => l.id === nasa.id).maxZoom : REGION_ZOOM;
    if (sel) view.when(() => view.goTo({ center: [sel.lon, sel.lat], zoom }, { duration: 800 }).catch(() => {}));
  }, [regions, regionId, nasa]);

  // NASA satellite layer
  useEffect(() => {
    const map = mapRef.current;
    const view = viewRef.current;
    if (!map || !view) return;
    if (nasaRef.current) {
      map.remove(nasaRef.current);
      nasaRef.current = null;
    }
    if (!nasa) {
      view.constraints.maxZoom = -1;
      return;
    }
    const def = NASA_LAYERS.find((l) => l.id === nasa.id);
    const tiles = new WebTileLayer({
      urlTemplate: tileUrl(def, nasa.season),
      copyright: 'NASA GIBS',
      opacity: 0.8,
    });
    view.constraints.maxZoom = def.maxZoom;
    map.add(tiles, 0); // above the basemap, under the region outlines
    nasaRef.current = tiles;
  }, [nasa]);

  // click a region to select it
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const handle = view.on('click', async (event) => {
      const hit = await view.hitTest(event);
      const g = hit.results.find((r) => r.graphic?.attributes?.id)?.graphic;
      if (g) onSelect(g.attributes.id);
    });
    return () => handle.remove();
  }, [onSelect]);

  return <div className="map" ref={divRef} aria-label="Map of the selected region" />;
}
