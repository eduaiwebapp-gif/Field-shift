"""Export the JSON and GeoJSON files consumed by the Field Shift frontend."""

import json
import shutil
from pathlib import Path

from nasa_power import POINTS_FILE


PROJECT = Path(__file__).resolve().parents[1]
SITE_TO_REGION = {"settat": "chaouia", "doukkala": "doukkala"}
SITE_FILES = ("recommendations.json", "planting_ml.json", "planting_outlook.json", "climate_point.geojson")


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    target = PROJECT / "handoff" / "field-shift"
    points = read_json(POINTS_FILE)
    copies = {POINTS_FILE: target / POINTS_FILE.name}
    for point in points["features"]:
        site_id = point["properties"]["site_id"]
        region_id = SITE_TO_REGION[site_id]
        site_dir = PROJECT / "outputs" / site_id
        names = list(SITE_FILES)
        if (site_dir / "irrigation_demo.json").is_file():
            names.append("irrigation_demo.json")
        for name in names:
            source = site_dir / name
            document = read_json(source)
            if name.endswith(".geojson"):
                site_ids = {feature["properties"]["site_id"] for feature in document["features"]}
            else:
                site_ids = {document["site_id"]}
            if site_ids != {site_id}:
                raise ValueError(f"{source} does not match site {site_id}.")
            copies[source] = target / region_id / name

    for source, destination in copies.items():
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
    print(f"Exported {len(copies)} files to {target}")


if __name__ == "__main__":
    main()
