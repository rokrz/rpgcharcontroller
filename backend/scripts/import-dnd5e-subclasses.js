// scripts/import-dnd5e-subclasses.js
//
// Baixa todas as subclasses D&D 5e da Open5e API v2 e grava em
// src/data/dnd5e_subclasses.json, agrupadas por classe.
// Uso: npm run import-dnd5e-subclasses

const fs = require("fs").promises;
const path = require("path");

const OPEN5E_BASE = "https://api.open5e.com/v2";
const OUT = path.join(__dirname, "..", "src", "data", "dnd5e_subclasses.json");
const HTTP_TIMEOUT_MS = 30_000;
const DELAY_MS = 200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "InnKeeper-import" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchAllPages(baseUrl) {
  const results = [];
  let url = `${baseUrl}?limit=100`;
  let page = 0;
  while (url) {
    page++;
    process.stdout.write(`  página ${page}… `);
    const data = await fetchJson(url);
    const items = Array.isArray(data.results) ? data.results : [];
    results.push(...items);
    console.log(`+${items.length} (total ${results.length})`);
    url = data.next || null;
    if (url) await sleep(DELAY_MS);
  }
  return results;
}

// Mapa de slugs de classe da Open5e → chave usada no frontend
const CLASS_SLUG_MAP = {
  artificer: "artificer",
  barbarian: "barbarian",
  bard:      "bard",
  cleric:    "cleric",
  druid:     "druid",
  fighter:   "fighter",
  monk:      "monk",
  paladin:   "paladin",
  ranger:    "ranger",
  rogue:     "rogue",
  sorcerer:  "sorcerer",
  warlock:   "warlock",
  wizard:    "wizard",
};

function extractClassSlug(raw) {
  // Open5e v2: archetype_class pode ser string "classes/barbarian" ou objeto {slug}
  const ref = raw.archetype_class || raw.character_class || "";
  const slug = typeof ref === "string"
    ? ref.split("/").filter(Boolean).pop() || ""
    : (ref.slug || ref.key || "");
  return slug.toLowerCase();
}

function extractSource(raw) {
  const doc = raw.document || {};
  return doc.title_short || doc.short_name || doc.slug || "";
}

async function main() {
  console.log("Buscando subclasses D&D 5e (Open5e v2)…\n");

  let rawList = [];
  try {
    rawList = await fetchAllPages(`${OPEN5E_BASE}/subclasses`);
  } catch (err) {
    console.error(`Falha ao buscar da Open5e: ${err.message}`);
    console.log("Usando lista de fallback embutida…");
    rawList = FALLBACK;
  }

  const grouped = {};
  for (const raw of rawList) {
    const classKey = CLASS_SLUG_MAP[extractClassSlug(raw)];
    if (!classKey) continue;

    if (!grouped[classKey]) grouped[classKey] = [];
    const index = (raw.slug || raw.key || "").toLowerCase();
    const name  = raw.name || index;
    const source = extractSource(raw);
    if (!index) continue;

    grouped[classKey].push({ index, name, source });
  }

  // Ordena cada lista por nome
  for (const cls of Object.keys(grouped)) {
    grouped[cls].sort((a, b) => a.name.localeCompare(b.name));
  }

  const total = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(grouped, null, 2), "utf8");

  console.log(`\nGravadas ${total} subclasses em ${path.relative(process.cwd(), OUT)}`);
  console.log("Reinicie o backend para carregá-las.");
}

// Fallback caso a API esteja fora do ar — mesma lista do Booker, nomes em inglês
const FALLBACK = [
  // Artificer (TCE)
  { slug: "alchemist",    name: "Alchemist",    archetype_class: "artificer", document: { short_name: "TCE" } },
  { slug: "armorer",      name: "Armorer",      archetype_class: "artificer", document: { short_name: "TCE" } },
  { slug: "artillerist",  name: "Artillerist",  archetype_class: "artificer", document: { short_name: "TCE" } },
  { slug: "battle-smith", name: "Battle Smith", archetype_class: "artificer", document: { short_name: "TCE" } },
  // Barbarian
  { slug: "berserker",           name: "Path of the Berserker",           archetype_class: "barbarian", document: { short_name: "PHB" } },
  { slug: "totem-warrior",       name: "Path of the Totem Warrior",       archetype_class: "barbarian", document: { short_name: "PHB" } },
  { slug: "ancestral-guardian",  name: "Path of the Ancestral Guardian",  archetype_class: "barbarian", document: { short_name: "XGE" } },
  { slug: "storm-herald",        name: "Path of the Storm Herald",        archetype_class: "barbarian", document: { short_name: "XGE" } },
  { slug: "zealot",              name: "Path of the Zealot",              archetype_class: "barbarian", document: { short_name: "XGE" } },
  { slug: "beast",               name: "Path of the Beast",               archetype_class: "barbarian", document: { short_name: "TCE" } },
  { slug: "wild-magic-barbarian",name: "Path of Wild Magic",              archetype_class: "barbarian", document: { short_name: "TCE" } },
  { slug: "lore",                name: "College of Lore",                 archetype_class: "bard",      document: { short_name: "PHB" } },
  { slug: "valor",               name: "College of Valor",                archetype_class: "bard",      document: { short_name: "PHB" } },
  { slug: "glamour",             name: "College of Glamour",              archetype_class: "bard",      document: { short_name: "XGE" } },
  { slug: "swords",              name: "College of Swords",               archetype_class: "bard",      document: { short_name: "XGE" } },
  { slug: "whispers",            name: "College of Whispers",             archetype_class: "bard",      document: { short_name: "XGE" } },
  { slug: "creation",            name: "College of Creation",             archetype_class: "bard",      document: { short_name: "TCE" } },
  { slug: "eloquence",           name: "College of Eloquence",            archetype_class: "bard",      document: { short_name: "TCE" } },
  { slug: "death",               name: "Death Domain",                    archetype_class: "cleric",    document: { short_name: "PHB" } },
  { slug: "knowledge",           name: "Knowledge Domain",                archetype_class: "cleric",    document: { short_name: "PHB" } },
  { slug: "life",                name: "Life Domain",                     archetype_class: "cleric",    document: { short_name: "PHB" } },
  { slug: "light",               name: "Light Domain",                    archetype_class: "cleric",    document: { short_name: "PHB" } },
  { slug: "nature",              name: "Nature Domain",                   archetype_class: "cleric",    document: { short_name: "PHB" } },
  { slug: "tempest",             name: "Tempest Domain",                  archetype_class: "cleric",    document: { short_name: "PHB" } },
  { slug: "trickery",            name: "Trickery Domain",                 archetype_class: "cleric",    document: { short_name: "PHB" } },
  { slug: "war",                 name: "War Domain",                      archetype_class: "cleric",    document: { short_name: "PHB" } },
  { slug: "forge",               name: "Forge Domain",                    archetype_class: "cleric",    document: { short_name: "XGE" } },
  { slug: "grave",               name: "Grave Domain",                    archetype_class: "cleric",    document: { short_name: "XGE" } },
  { slug: "order",               name: "Order Domain",                    archetype_class: "cleric",    document: { short_name: "TCE" } },
  { slug: "peace",               name: "Peace Domain",                    archetype_class: "cleric",    document: { short_name: "TCE" } },
  { slug: "twilight",            name: "Twilight Domain",                 archetype_class: "cleric",    document: { short_name: "TCE" } },
  { slug: "land",                name: "Circle of the Land",              archetype_class: "druid",     document: { short_name: "PHB" } },
  { slug: "moon",                name: "Circle of the Moon",              archetype_class: "druid",     document: { short_name: "PHB" } },
  { slug: "dreams",              name: "Circle of Dreams",                archetype_class: "druid",     document: { short_name: "XGE" } },
  { slug: "shepherd",            name: "Circle of the Shepherd",          archetype_class: "druid",     document: { short_name: "XGE" } },
  { slug: "spores",              name: "Circle of Spores",                archetype_class: "druid",     document: { short_name: "TCE" } },
  { slug: "stars",               name: "Circle of Stars",                 archetype_class: "druid",     document: { short_name: "TCE" } },
  { slug: "wildfire",            name: "Circle of Wildfire",              archetype_class: "druid",     document: { short_name: "TCE" } },
  { slug: "battle-master",       name: "Battle Master",                   archetype_class: "fighter",   document: { short_name: "PHB" } },
  { slug: "champion",            name: "Champion",                        archetype_class: "fighter",   document: { short_name: "PHB" } },
  { slug: "eldritch-knight",     name: "Eldritch Knight",                 archetype_class: "fighter",   document: { short_name: "PHB" } },
  { slug: "arcane-archer",       name: "Arcane Archer",                   archetype_class: "fighter",   document: { short_name: "XGE" } },
  { slug: "cavalier",            name: "Cavalier",                        archetype_class: "fighter",   document: { short_name: "XGE" } },
  { slug: "samurai",             name: "Samurai",                         archetype_class: "fighter",   document: { short_name: "XGE" } },
  { slug: "psi-warrior",         name: "Psi Warrior",                     archetype_class: "fighter",   document: { short_name: "TCE" } },
  { slug: "rune-knight",         name: "Rune Knight",                     archetype_class: "fighter",   document: { short_name: "TCE" } },
  { slug: "echo-knight",         name: "Echo Knight",                     archetype_class: "fighter",   document: { short_name: "EGW" } },
  { slug: "four-elements",       name: "Way of the Four Elements",        archetype_class: "monk",      document: { short_name: "PHB" } },
  { slug: "open-hand",           name: "Way of the Open Hand",            archetype_class: "monk",      document: { short_name: "PHB" } },
  { slug: "shadow",              name: "Way of Shadow",                   archetype_class: "monk",      document: { short_name: "PHB" } },
  { slug: "drunken-master",      name: "Way of the Drunken Master",       archetype_class: "monk",      document: { short_name: "XGE" } },
  { slug: "kensei",              name: "Way of the Kensei",               archetype_class: "monk",      document: { short_name: "XGE" } },
  { slug: "sun-soul",            name: "Way of the Sun Soul",             archetype_class: "monk",      document: { short_name: "XGE" } },
  { slug: "mercy",               name: "Way of Mercy",                    archetype_class: "monk",      document: { short_name: "TCE" } },
  { slug: "astral-self",         name: "Way of the Astral Self",          archetype_class: "monk",      document: { short_name: "TCE" } },
  { slug: "devotion",            name: "Oath of Devotion",                archetype_class: "paladin",   document: { short_name: "PHB" } },
  { slug: "ancients",            name: "Oath of the Ancients",            archetype_class: "paladin",   document: { short_name: "PHB" } },
  { slug: "vengeance",           name: "Oath of Vengeance",               archetype_class: "paladin",   document: { short_name: "PHB" } },
  { slug: "oathbreaker",         name: "Oathbreaker",                     archetype_class: "paladin",   document: { short_name: "PHB" } },
  { slug: "conquest",            name: "Oath of Conquest",                archetype_class: "paladin",   document: { short_name: "XGE" } },
  { slug: "redemption",          name: "Oath of Redemption",              archetype_class: "paladin",   document: { short_name: "XGE" } },
  { slug: "glory",               name: "Oath of Glory",                   archetype_class: "paladin",   document: { short_name: "TCE" } },
  { slug: "watchers",            name: "Oath of the Watchers",            archetype_class: "paladin",   document: { short_name: "TCE" } },
  { slug: "beast-master",        name: "Beast Master",                    archetype_class: "ranger",    document: { short_name: "PHB" } },
  { slug: "hunter",              name: "Hunter",                          archetype_class: "ranger",    document: { short_name: "PHB" } },
  { slug: "gloom-stalker",       name: "Gloom Stalker",                   archetype_class: "ranger",    document: { short_name: "XGE" } },
  { slug: "horizon-walker",      name: "Horizon Walker",                  archetype_class: "ranger",    document: { short_name: "XGE" } },
  { slug: "monster-slayer",      name: "Monster Slayer",                  archetype_class: "ranger",    document: { short_name: "XGE" } },
  { slug: "fey-wanderer",        name: "Fey Wanderer",                    archetype_class: "ranger",    document: { short_name: "TCE" } },
  { slug: "swarmkeeper",         name: "Swarmkeeper",                     archetype_class: "ranger",    document: { short_name: "TCE" } },
  { slug: "arcane-trickster",    name: "Arcane Trickster",                archetype_class: "rogue",     document: { short_name: "PHB" } },
  { slug: "assassin",            name: "Assassin",                        archetype_class: "rogue",     document: { short_name: "PHB" } },
  { slug: "thief",               name: "Thief",                           archetype_class: "rogue",     document: { short_name: "PHB" } },
  { slug: "inquisitive",         name: "Inquisitive",                     archetype_class: "rogue",     document: { short_name: "XGE" } },
  { slug: "mastermind",          name: "Mastermind",                      archetype_class: "rogue",     document: { short_name: "XGE" } },
  { slug: "scout",               name: "Scout",                           archetype_class: "rogue",     document: { short_name: "XGE" } },
  { slug: "swashbuckler",        name: "Swashbuckler",                    archetype_class: "rogue",     document: { short_name: "XGE" } },
  { slug: "phantom",             name: "Phantom",                         archetype_class: "rogue",     document: { short_name: "TCE" } },
  { slug: "soulknife",           name: "Soulknife",                       archetype_class: "rogue",     document: { short_name: "TCE" } },
  { slug: "draconic",            name: "Draconic Bloodline",              archetype_class: "sorcerer",  document: { short_name: "PHB" } },
  { slug: "wild-magic",          name: "Wild Magic",                      archetype_class: "sorcerer",  document: { short_name: "PHB" } },
  { slug: "divine-soul",         name: "Divine Soul",                     archetype_class: "sorcerer",  document: { short_name: "XGE" } },
  { slug: "shadow-magic",        name: "Shadow Magic",                    archetype_class: "sorcerer",  document: { short_name: "XGE" } },
  { slug: "storm-sorcery",       name: "Storm Sorcery",                   archetype_class: "sorcerer",  document: { short_name: "XGE" } },
  { slug: "aberrant-mind",       name: "Aberrant Mind",                   archetype_class: "sorcerer",  document: { short_name: "TCE" } },
  { slug: "clockwork-soul",      name: "Clockwork Soul",                  archetype_class: "sorcerer",  document: { short_name: "TCE" } },
  { slug: "archfey",             name: "The Archfey",                     archetype_class: "warlock",   document: { short_name: "PHB" } },
  { slug: "fiend",               name: "The Fiend",                       archetype_class: "warlock",   document: { short_name: "PHB" } },
  { slug: "great-old-one",       name: "The Great Old One",               archetype_class: "warlock",   document: { short_name: "PHB" } },
  { slug: "celestial",           name: "The Celestial",                   archetype_class: "warlock",   document: { short_name: "XGE" } },
  { slug: "hexblade",            name: "The Hexblade",                    archetype_class: "warlock",   document: { short_name: "XGE" } },
  { slug: "fathomless",          name: "The Fathomless",                  archetype_class: "warlock",   document: { short_name: "TCE" } },
  { slug: "genie",               name: "The Genie",                       archetype_class: "warlock",   document: { short_name: "TCE" } },
  { slug: "abjuration",          name: "School of Abjuration",            archetype_class: "wizard",    document: { short_name: "PHB" } },
  { slug: "conjuration",         name: "School of Conjuration",           archetype_class: "wizard",    document: { short_name: "PHB" } },
  { slug: "divination",          name: "School of Divination",            archetype_class: "wizard",    document: { short_name: "PHB" } },
  { slug: "enchantment",         name: "School of Enchantment",           archetype_class: "wizard",    document: { short_name: "PHB" } },
  { slug: "evocation",           name: "School of Evocation",             archetype_class: "wizard",    document: { short_name: "PHB" } },
  { slug: "illusion",            name: "School of Illusion",              archetype_class: "wizard",    document: { short_name: "PHB" } },
  { slug: "necromancy",          name: "School of Necromancy",            archetype_class: "wizard",    document: { short_name: "PHB" } },
  { slug: "transmutation",       name: "School of Transmutation",         archetype_class: "wizard",    document: { short_name: "PHB" } },
  { slug: "bladesinging",        name: "Bladesinging",                    archetype_class: "wizard",    document: { short_name: "SCAG" } },
  { slug: "war-magic",           name: "War Magic",                       archetype_class: "wizard",    document: { short_name: "XGE" } },
  { slug: "chronurgy",           name: "Chronurgy Magic",                 archetype_class: "wizard",    document: { short_name: "EGW" } },
  { slug: "graviturgy",          name: "Graviturgy Magic",                archetype_class: "wizard",    document: { short_name: "EGW" } },
  { slug: "order-of-scribes",    name: "Order of Scribes",                archetype_class: "wizard",    document: { short_name: "TCE" } },
];

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
