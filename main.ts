// Leonida Trophy Guide — entrypoint (Node 22, standard library only).
// The guide itself is plain static files in app/ (index.html, style.css, app.js,
// data/trophies.json and data/roadmap.json) plus 3–4 screenshots in screenshots/.
// This program hands the entry in: it copies app/ and screenshots/ beside this
// file into the output directory and writes dossier.json there with the vendored
// make.fun library, which is what the judge reads. vendor/makefun-frontend.ts is
// the kit's copy and is left untouched — the scorer rebuilds the dossier with its
// own copy and the two must match byte for byte.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  const shotsOut = join(outputDir, 'screenshots');
  mkdirSync(shotsOut, { recursive: true });
  const shotsIn = join(repoRoot, 'screenshots');
  if (existsSync(shotsIn)) cpSync(shotsIn, shotsOut, { recursive: true });

  // The gate's caps: at most 4 screenshots, each at most 256 KiB; app/ at most
  // 993 files and directories and 48 MiB. The dossier text is capped at 160 KiB.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

handIn();
