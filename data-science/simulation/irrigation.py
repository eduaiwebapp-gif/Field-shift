"""Export two illustrative soil-moisture scenarios for the Doukkala app panel."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEMO_THRESHOLD = 0.20


def main():
    reading_template = json.loads(
        (ROOT / "contracts" / "soil_reading.example.json").read_text(encoding="utf-8")
    )
    scenarios = []
    for name, moisture in (("Dry soil", 0.14), ("Wet soil", 0.28)):
        review = moisture < DEMO_THRESHOLD
        reading = {
            **reading_template,
            "site_id": "doukkala",
            "volumetric_water_content_m3_m3": moisture,
        }
        scenarios.append({
            "name": name,
            "soil_reading": reading,
            "irrigation": {
                "crop_id": "wheat",
                "source": "simulated",
                "as_of": reading["measured_at"],
                "action": "review" if review else "hold",
                "reason": ("Below the demo moisture threshold." if review
                           else "At or above the demo moisture threshold."),
            },
        })

    output = ROOT / "outputs" / "doukkala" / "irrigation_demo.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({
        "schema_version": "1.0",
        "site_id": "doukkala",
        "mode": "simulated",
        "demo_threshold_m3_m3": DEMO_THRESHOLD,
        "scenarios": scenarios,
    }, indent=2) + "\n", encoding="utf-8")
    print(f"Simulation written to {output}")


if __name__ == "__main__":
    main()
