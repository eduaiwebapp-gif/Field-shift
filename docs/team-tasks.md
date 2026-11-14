# Team tasks until the deadline

Messages ready to send in the group or in private.

---

## To the data scientist

The app is live: https://field-shift-self.vercel.app and the repo is https://github.com/eduaiwebapp-gif/Field-shift (send me your GitHub username so I add you).

The NASA POWER pipeline is in `data/`. `npm run all` downloads the data for Chaouia and Doukkala and rebuilds the JSON the app reads. What I need from you, in this order:

1. Check the crop values in `data/pipeline/crops.mjs` (water needs, heat limits, yields, prices, costs). They're first estimates. Fix anything that looks off and tell me what source you used, it goes in the submission.
2. Check the scoring logic in `data/pipeline/build.mjs` and tell me if something doesn't make sense scientifically.
3. If you have time: replace the region circles with the real boundaries from the Morocco Africa GeoPortal.

Any change pushed to `main` goes live automatically. Run `npm run all` before pushing so the app gets the new data.

---

## To the engineer

The app is live: https://field-shift-self.vercel.app (Field sensor tab). Send me your GitHub username so I add you to the repo.

Everything for the sensor is in `sensor/`: the ESP32 code, the wiring and the parts list. What I need, in this order:

1. A short video (10-15 s) of the sensor: dry soil in a pot, then water it and show the values going up. If you don't have the parts, a Simulink simulation of the sensor + an irrigation rule works too.
2. A SOLIDWORKS render of the enclosure (stake in the ground, waterproof box, small solar panel if you can).
3. Check the parts list and prices in `sensor/README.md` (I put about 150 MAD total).

Send me the video and the render as soon as you have them, they go in the demo video and the slides.

---

## For me

- [ ] Fill the team names in the slides and in `docs/submission.md`
- [ ] Record the demo video with `docs/video-script.md`
- [ ] Add the engineer's sensor clip and render
- [ ] Make the GitHub repo public before submitting
- [ ] Share the slides (Share menu) so the judges can open them, or download them as PDF/PowerPoint
- [ ] Submit with the text in `docs/submission.md`, a few hours before the deadline
