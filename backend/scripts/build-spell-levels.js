#!/usr/bin/env node
// Fetches all D&D 5e spells from the API and writes a { [index]: level } mapping
// to src/data/dnd5e_spell_levels.json. Run this once (or to refresh):
//   node backend/scripts/build-spell-levels.js

const fs = require("fs");
const path = require("path");

const BASE = "https://www.dnd5eapi.co/api/2014/spells";
const OUT = path.join(__dirname, "../src/data/dnd5e_spell_levels.json");

async function fetchAll() {
  let results = [];
  let url = `${BASE}?limit=500`;
  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    const json = await res.json();
    results = results.concat(json.results || []);
    url = json.next ? `https://www.dnd5eapi.co${json.next}` : null;
  }
  return results;
}

async function fetchSpellLevel(urlPath) {
  const res = await fetch(`https://www.dnd5eapi.co${urlPath}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.level ?? null;
}

(async () => {
  console.log("Fetching spell list...");
  const refs = await fetchAll();
  console.log(`Found ${refs.length} spells. Fetching levels in batches...`);

  const map = {};
  const BATCH = 20;
  for (let i = 0; i < refs.length; i += BATCH) {
    const batch = refs.slice(i, i + BATCH);
    const levels = await Promise.all(batch.map((r) => fetchSpellLevel(r.url)));
    batch.forEach((r, j) => {
      if (levels[j] !== null) map[r.index] = levels[j];
    });
    process.stdout.write(`\r  ${Math.min(i + BATCH, refs.length)}/${refs.length}`);
  }
  console.log("\nWriting output...");
  fs.writeFileSync(OUT, JSON.stringify(map, null, 2), "utf8");
  console.log(`Done. ${Object.keys(map).length} spells written to ${OUT}`);
})().catch((e) => { console.error(e); process.exit(1); });
