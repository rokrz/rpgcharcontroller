// scripts/import-dnd5e-races.js
//
// Baixa raças e subraças D&D 5e da dnd5eapi.co e complementa com raças
// oficiais não-SRD (VGTM, MTF, TCE, Eberron) via fallback embutido.
// Grava em src/data/dnd5e_races.json como array plano.
// Uso: npm run import-dnd5e-races

const fs = require("fs").promises;
const path = require("path");

const DND5E_BASE = "https://www.dnd5eapi.co/api/2014";
const OUT = path.join(__dirname, "..", "src", "data", "dnd5e_races.json");
const HTTP_TIMEOUT_MS = 30_000;

async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "InnKeeper-import" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

const SRD_RACE_NAMES_PT = {
  dragonborn: "Draconato",
  dwarf:      "Anão",
  elf:        "Elfo",
  gnome:      "Gnomo",
  "half-elf": "Meio-Elfo",
  "half-orc": "Meio-Orc",
  halfling:   "Halfling",
  human:      "Humano",
  tiefling:   "Tiefling",
};

const SRD_SUBRACE_NAMES_PT = {
  "high-elf":            "Elfo Alto",
  "hill-dwarf":          "Anão da Colina",
  "lightfoot-halfling":  "Halfling Pé-Leve",
  "rock-gnome":          "Gnomo das Rochas",
};

// Raças oficiais não presentes no SRD
const NON_SRD_RACES = [
  // PHB subraças não cobertas pela API
  { index: "mountain-dwarf",    name: "Anão da Montanha",    source: "PHB",   type: "subrace" },
  { index: "wood-elf",          name: "Elfo da Floresta",    source: "PHB",   type: "subrace" },
  { index: "dark-elf",          name: "Drow",                source: "PHB",   type: "subrace" },
  { index: "forest-gnome",      name: "Gnomo da Floresta",   source: "PHB",   type: "subrace" },
  { index: "stout-halfling",    name: "Halfling Robusto",    source: "PHB",   type: "subrace" },
  { index: "black-dragonborn",  name: "Draconato Negro",     source: "PHB",   type: "subrace" },
  { index: "blue-dragonborn",   name: "Draconato Azul",      source: "PHB",   type: "subrace" },
  { index: "brass-dragonborn",  name: "Draconato Bronze",    source: "PHB",   type: "subrace" },
  { index: "bronze-dragonborn", name: "Draconato Latão",     source: "PHB",   type: "subrace" },
  { index: "copper-dragonborn", name: "Draconato Cobre",     source: "PHB",   type: "subrace" },
  { index: "gold-dragonborn",   name: "Draconato Dourado",   source: "PHB",   type: "subrace" },
  { index: "green-dragonborn",  name: "Draconato Verde",     source: "PHB",   type: "subrace" },
  { index: "red-dragonborn",    name: "Draconato Vermelho",  source: "PHB",   type: "subrace" },
  { index: "silver-dragonborn", name: "Draconato Prateado",  source: "PHB",   type: "subrace" },
  { index: "white-dragonborn",  name: "Draconato Branco",    source: "PHB",   type: "subrace" },
  // Volo's Guide to Monsters
  { index: "aasimar",           name: "Aasimar",             source: "VGTM",  type: "race" },
  { index: "firbolg",           name: "Firbolg",             source: "VGTM",  type: "race" },
  { index: "goliath",           name: "Goliath",             source: "VGTM",  type: "race" },
  { index: "kenku",             name: "Kenku",               source: "VGTM",  type: "race" },
  { index: "lizardfolk",        name: "Lagartixa",           source: "VGTM",  type: "race" },
  { index: "tabaxi",            name: "Tabaxi",              source: "VGTM",  type: "race" },
  { index: "triton",            name: "Tritão",              source: "VGTM",  type: "race" },
  { index: "yuan-ti-pureblood", name: "Yuan-ti Puro-Sangue", source: "VGTM",  type: "race" },
  // Mordenkainen's Tome of Foes
  { index: "githyanki",         name: "Githyanki",           source: "MTF",   type: "race" },
  { index: "githzerai",         name: "Githzerai",           source: "MTF",   type: "race" },
  { index: "eladrin",           name: "Eladrin",             source: "MTF",   type: "subrace" },
  { index: "sea-elf",           name: "Elfo do Mar",         source: "MTF",   type: "subrace" },
  { index: "shadar-kai",        name: "Shadar-kai",          source: "MTF",   type: "subrace" },
  // Tasha's Cauldron of Everything
  { index: "custom-lineage",    name: "Linhagem Customizada", source: "TCE",  type: "race" },
  // Eberron: Rising from the Last War
  { index: "changeling",        name: "Mutante",             source: "ERLW",  type: "race" },
  { index: "kalashtar",         name: "Kalashtar",           source: "ERLW",  type: "race" },
  { index: "shifter",           name: "Lúpino",              source: "ERLW",  type: "race" },
  { index: "warforged",         name: "Forjado de Guerra",   source: "ERLW",  type: "race" },
  // Wild Beyond the Witchlight
  { index: "fairy",             name: "Fada",                source: "WBtW",  type: "race" },
  { index: "harengon",          name: "Harengon",            source: "WBtW",  type: "race" },
];

async function main() {
  const races = [];

  // 1. Raças principais do SRD
  console.log("Buscando raças principais (dnd5eapi.co)…");
  try {
    const json = await fetchJson(`${DND5E_BASE}/races`);
    for (const r of json.results || []) {
      races.push({
        index:  r.index,
        name:   SRD_RACE_NAMES_PT[r.index] || r.name,
        source: "PHB",
        type:   "race",
      });
      console.log(`  + ${r.index}`);
    }
  } catch (err) {
    console.warn(`  ! Falha: ${err.message}`);
  }

  // 2. Subraças do SRD
  console.log("\nBuscando subraças (dnd5eapi.co)…");
  try {
    const json = await fetchJson(`${DND5E_BASE}/subraces`);
    for (const r of json.results || []) {
      races.push({
        index:  r.index,
        name:   SRD_SUBRACE_NAMES_PT[r.index] || r.name,
        source: "PHB",
        type:   "subrace",
      });
      console.log(`  + ${r.index}`);
    }
  } catch (err) {
    console.warn(`  ! Falha: ${err.message}`);
  }

  // 3. Raças não-SRD (fallback embutido)
  console.log("\nAdicionando raças não-SRD (VGTM, MTF, TCE, Eberron)…");
  const existingIndexes = new Set(races.map((r) => r.index));
  for (const r of NON_SRD_RACES) {
    if (!existingIndexes.has(r.index)) {
      races.push(r);
      console.log(`  + ${r.index} (${r.source})`);
    }
  }

  races.sort((a, b) => a.name.localeCompare(b.name, "pt"));

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(races, null, 2), "utf8");
  console.log(`\nGravadas ${races.length} raças em ${path.relative(process.cwd(), OUT)}`);
  console.log("Reinicie o backend para carregá-las.");
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
