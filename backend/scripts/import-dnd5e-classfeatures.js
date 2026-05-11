// scripts/import-dnd5e-classfeatures.js
//
// Baixa todas as class features SRD da dnd5eapi.co e grava em
// src/data/dnd5e_classfeatures_srd.json, indexadas por feature index.
// Uso: npm run import-dnd5e-classfeatures

const fs = require("fs").promises;
const path = require("path");

const DND5E_BASE = "https://www.dnd5eapi.co/api/2014";
const OUT = path.join(__dirname, "..", "src", "data", "dnd5e_classfeatures_srd.json");
const HTTP_TIMEOUT_MS = 30_000;
const DELAY_MS = 100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  console.log("Buscando lista de features SRD (dnd5eapi.co)…");

  const list = await fetchJson(`${DND5E_BASE}/features?limit=500`);
  const refs = list.results || [];
  console.log(`  ${refs.length} features encontradas na lista.`);

  const indexed = {};
  let done = 0;

  for (const ref of refs) {
    try {
      await sleep(DELAY_MS);
      const raw = await fetchJson(`https://www.dnd5eapi.co${ref.url}`);
      indexed[raw.index] = {
        index:       raw.index,
        name:        raw.name,
        level:       raw.level,
        class:       raw.class?.name || null,
        subclass:    raw.subclass?.name || null,
        description: (raw.desc || []).join("\n\n"),
      };
      done++;
      if (done % 50 === 0) process.stdout.write(`  ${done}/${refs.length}\n`);
    } catch (err) {
      console.warn(`  Falha em ${ref.url}: ${err.message}`);
    }
  }

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(indexed, null, 2), "utf8");
  console.log(`\nGravadas ${done} features em ${path.relative(process.cwd(), OUT)}`);
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
