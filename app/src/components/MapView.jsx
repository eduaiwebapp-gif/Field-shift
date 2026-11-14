import { useEffect, useRef } from 'react';
import Map from '@arcgis/core/Map';
import SceneOrMapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Circle from '@arcgis/core/geometry/Circle';
import Point from '@arcgis/core/geometry/Point';

// ArcGIS map of the selected region (satellite imagery + region outline).
// TODO data scientist: replace the circle with the real region boundary from the Africa GeoPortal.
export default function MapView({ regions, regionId, onSelect }) {
  const divRef = useRef(null);
  const viewRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const layer = new GraphicsLayer();
    const map = new Map({ basemap: 'hybrid', layers: [layer] });
    const view = new SceneOrMapView({
      container: divRef.current,
      map,
      center: [-7.9, 32.85],
      zoom: 7,
      ui: { components: ['zoom', 'attribution'] },
      popupEnabled: false,
    });
    viewRef.current = view;
    layerRef.current = layer;
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
            color: selected ? [234, 179, 8, 0.25] : [255, 255, 255, 0.08],
            outline: { color: selected ? [250, 204, 21, 1] : [255, 255, 255, 0.7], width: selected ? 2.5 : 1.2 },
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
            haloColor: [0, 0, 0, 0.8],
            haloSize: 1.5,
            font: { size: 12, weight: 'bold', family: 'sans-serif' },
          },
          attributes: { id: r.id },
        }),
      );
    }
    const sel = regions.find((r) => r.id === regionId);
    if (sel) view.when(() => view.goTo({ center: [sel.lon, sel.lat], zoom: 8 }, { duration: 800 }).catch(() => {}));
  }, [regions, regionId]);

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
