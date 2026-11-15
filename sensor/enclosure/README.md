# Sensor enclosure (3D model)

3D model of the field unit by Amine Morine (mechatronics).

![Exploded view](enclosure_en.png)

| Part | Role |
|---|---|
| Solar panel | Charges the battery in the field |
| Translucent lid | Screwed down on the gasket |
| Sealing gasket | Keeps rain and dust out |
| ESP32 + battery | Reads the probe, sends the readings over Wi-Fi |
| IP65 waterproof enclosure | Cable gland for the probe lead, flanges to fix it on a stake |
| Soil moisture probe | Capacitive, sits in the root zone |

## Known limits, next version

- The render shows one cable gland (probe). The solar panel lead needs a second gland so the box stays IP65.
- A translucent lid in the Moroccan sun can push the inside above 60 °C, too hot for a LiPo battery. Next version: opaque UV-resistant lid or a LiFePO4 cell.
- Deep sleep between readings, one reading every 30 minutes.
- Wi-Fi rarely reaches the middle of a field: a LoRa radio would carry the readings to the farm.

Files: `enclosure_render_original.jpg` (render as exported, French labels), `enclosure_en.png` and `enclosure_fr.png` (corrected labels with one line per part, used in the app and the slides).
