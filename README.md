# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/tataapri/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/tataapri/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5 — every guide written in its own words with its sources, a roadmap to the platinum, missable flags, filters, a spoiler-free mode, and a checklist that saves your progress in the browser. Static files only: it runs with the network off.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Or serve `app/` with any static file server — `app/index.html` is the guide.

## What it does

- **All 55 trophies** with their official names, descriptions and grades, plus a guide for each: how to earn it, steps, difficulty, and whether it can be missed. 28 are hidden on PlayStation; 4 are missable.
- **Roadmap to the platinum** in six stages, built from the official descriptions.
- **Tracker**: tick trophies off, progress saved in localStorage, export to a file and import it back.
- **Filters** by kind (story, missable, collectibles, activities, side, online), grade and earned state, plus search and sorting.
- **Spoiler-free mode**: story trophies stay hidden until you earn them.
- **Fully offline**: every file it loads lives under `app/`; it makes no network requests.

---

<sub>Entered on [make.fun](https://make.fun/?ref=h4jr1wgm&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
