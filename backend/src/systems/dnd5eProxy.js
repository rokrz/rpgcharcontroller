const path = require("path");
const fs = require("fs");

// Node 12 (nodejs-mobile-cordova) nao tem fetch() nativo; Node 18+ tem.
// Polyfill usando modulos nativos para evitar dependencia externa no bundle mobile.
if (typeof fetch === "undefined") {
  global.fetch = function (url, opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      var parsed = new URL(url);
      var lib = parsed.protocol === "https:" ? require("https") : require("http");
      var options = {
        hostname: parsed.hostname,
        path: parsed.pathname + (parsed.search || ""),
        method: opts.method || "GET",
        headers: opts.headers || {},
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      };
      var req = lib.request(options, function (res) {
        var chunks = [];
        res.on("data", function (chunk) { chunks.push(chunk); });
        res.on("end", function () {
          var body = Buffer.concat(chunks).toString("utf8");
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: function () { return Promise.resolve(JSON.parse(body)); },
            text: function () { return Promise.resolve(body); },
          });
        });
      });
      req.on("error", reject);
      if (opts.body) req.write(opts.body);
      req.end();
    });
  };
}

const DND5E_BASE = "https://www.dnd5eapi.co/api/2014";
const LOCAL_SUBCLASSES = require(path.join(__dirname, "../data/dnd5e_subclasses.json"));
const RACES_PATH = path.join(__dirname, "../data/dnd5e_races.json");

const SUPPLEMENT_PATH = path.join(__dirname, "../data/dnd5e_supplement.json");
const SUPPLEMENT = fs.existsSync(SUPPLEMENT_PATH)
  ? JSON.parse(fs.readFileSync(SUPPLEMENT_PATH, "utf8"))
  : { class: {}, subclass: {} };

const RACE_SUPPLEMENT_PATH = path.join(__dirname, "../data/dnd5e_race_supplement.json");
const RACE_SUPPLEMENT = fs.existsSync(RACE_SUPPLEMENT_PATH)
  ? JSON.parse(fs.readFileSync(RACE_SUPPLEMENT_PATH, "utf8"))
  : {};

const BG_SUPPLEMENT_PATH = path.join(__dirname, "../data/dnd5e_backgrounds_supplement.json");
const BG_SUPPLEMENT = fs.existsSync(BG_SUPPLEMENT_PATH)
  ? JSON.parse(fs.readFileSync(BG_SUPPLEMENT_PATH, "utf8"))
  : {};

const ABILITY_NAME_MAP = {
  str: "Strength", dex: "Dexterity", con: "Constitution",
  int: "Intelligence", wis: "Wisdom", cha: "Charisma",
};

const LANGUAGE_PT = {
  "Common": "Comum",
  "Dwarvish": "Anão",
  "Elvish": "Élfico",
  "Giant": "Gigante",
  "Gnomish": "Gnômico",
  "Goblin": "Goblin",
  "Halfling": "Halfling",
  "Orc": "Orc",
  "Abyssal": "Abissal",
  "Celestial": "Celestial",
  "Draconic": "Dracônico",
  "Deep Speech": "Fala Profunda",
  "Infernal": "Infernal",
  "Primordial": "Primordial",
  "Sylvan": "Silvano",
  "Undercommon": "Subcomum",
};

const SKILL_NAME_PT = {
  "Acrobatics": "Acrobacia",
  "Animal Handling": "Lidar c/ Animais",
  "Arcana": "Arcanismo",
  "Athletics": "Atletismo",
  "Deception": "Enganação",
  "History": "História",
  "Insight": "Intuição",
  "Intimidation": "Intimidação",
  "Investigation": "Investigação",
  "Medicine": "Medicina",
  "Nature": "Natureza",
  "Perception": "Percepção",
  "Performance": "Performance",
  "Persuasion": "Persuasão",
  "Religion": "Religião",
  "Sleight of Hand": "Prestidigitação",
  "Stealth": "Furtividade",
  "Survival": "Sobrevivência",
};

const SRD_FEATURES_PATH = path.join(__dirname, "../data/dnd5e_classfeatures_srd.json");
let SRD_FEATURES = null;
function getSrdFeatures() {
  if (!SRD_FEATURES && fs.existsSync(SRD_FEATURES_PATH)) {
    SRD_FEATURES = JSON.parse(fs.readFileSync(SRD_FEATURES_PATH, "utf8"));
  }
  return SRD_FEATURES || {};
}

function supplementToFeature(f) {
  return {
    index: f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: f.name,
    type: "features",
    level: f.level,
    description: f.description || "",
  };
}

function getSupplementClassFeatures(slug, maxLevel) {
  const entries = (SUPPLEMENT.class || {})[slug] || [];
  return entries
    .filter((f) => f.level <= maxLevel)
    .map(supplementToFeature);
}

function getSupplementSubclassFeatures(slug, maxLevel) {
  const entries = (SUPPLEMENT.subclass || {})[slug] || [];
  return entries
    .filter((f) => f.level <= maxLevel)
    .map(supplementToFeature);
}

function getSrdClassFeaturesByClass(className, maxLevel) {
  const srd = getSrdFeatures();
  return Object.values(srd)
    .filter(
      (f) =>
        f.class &&
        f.class.toLowerCase() === className.toLowerCase() &&
        !f.subclass &&
        f.level <= maxLevel
    )
    .map((f) => ({ ...f, type: "features" }));
}

function getSrdSubclassFeaturesByName(subclassName, maxLevel) {
  const srd = getSrdFeatures();
  return Object.values(srd)
    .filter(
      (f) =>
        f.subclass &&
        f.subclass.toLowerCase() === subclassName.toLowerCase() &&
        f.level <= maxLevel
    )
    .map((f) => ({ ...f, type: "features" }));
}

const TYPE_MAP = {
  spells:    "spells",
  equipment: "equipment",
  features:  "features",
  monsters:  "monsters",
  classes:   "classes",
  races:     "races",
};

async function searchDnd5e(type, query) {
  const endpoint = TYPE_MAP[type] || type;
  const url = `${DND5E_BASE}/${endpoint}?name=${encodeURIComponent(query)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`D&D 5e API error: ${res.status}`);
  const json = await res.json();

  const items = (json.results || []).slice(0, 20);

  if (!query || items.length === 0) {
    return items.map((item) => ({
      index: item.index,
      name: item.name,
      url: item.url,
    }));
  }

  const detailed = await Promise.allSettled(
    items.slice(0, 10).map((item) =>
      fetch(`https://www.dnd5eapi.co${item.url}`).then((r) => r.json())
    )
  );

  return detailed
    .filter((r) => r.status === "fulfilled")
    .map((r) => normalizeResult(r.value, type));
}

function normalizeResult(raw, type) {
  const base = { index: raw.index, name: raw.name, type };

  if (type === "spells") {
    return {
      ...base,
      school: raw.school?.name,
      level: raw.level,
      castingTime: raw.casting_time,
      range: raw.range,
      components: raw.components?.join(", "),
      duration: raw.duration,
      concentration: raw.concentration,
      ritual: raw.ritual,
      description: raw.desc?.join("\n\n"),
      higherLevel: raw.higher_level?.join("\n\n"),
    };
  }

  if (type === "equipment") {
    return {
      ...base,
      category: raw.equipment_category?.name,
      cost: raw.cost ? `${raw.cost.quantity} ${raw.cost.unit}` : undefined,
      weight: raw.weight,
      damage: raw.damage ? `${raw.damage.damage_dice} ${raw.damage.damage_type?.name}` : undefined,
      armorClass: raw.armor_class,
      description: raw.desc?.join("\n\n"),
      properties: raw.properties?.map((p) => p.name).join(", "),
    };
  }

  if (type === "features") {
    return {
      ...base,
      class: raw.class?.name,
      subclass: raw.subclass?.name,
      level: raw.level,
      description: raw.desc?.join("\n\n"),
    };
  }

  if (type === "monsters") {
    return {
      ...base,
      type: raw.type,
      cr: raw.challenge_rating,
      hp: raw.hit_points,
      ac: raw.armor_class?.[0]?.value,
      description: raw.special_abilities?.map((a) => `**${a.name}**: ${a.desc}`).join("\n\n"),
    };
  }

  return { ...base, description: raw.desc?.join("\n\n") || raw.description };
}

const classFeatureCache = {};

async function getClassFeatures(slug, maxLevel = 20) {
  const cacheKey = `${slug}-${maxLevel}`;
  if (classFeatureCache[cacheKey]) return classFeatureCache[cacheKey];

  // 1. Supplement (non-SRD committed data)
  const supplementFeatures = getSupplementClassFeatures(slug, maxLevel);

  // 2. SRD local cache — look up by matching class name (slug → title-case)
  const className = slug.charAt(0).toUpperCase() + slug.slice(1);
  const srdFeatures = getSrdClassFeaturesByClass(className, maxLevel);

  // Merge: supplement entries take priority (they may overlap with SRD)
  const supplementNames = new Set(supplementFeatures.map((f) => f.name.toLowerCase()));
  const merged = [
    ...supplementFeatures,
    ...srdFeatures.filter((f) => !supplementNames.has(f.name.toLowerCase())),
  ];

  if (merged.length > 0) {
    merged.sort((a, b) => (a.level || 0) - (b.level || 0));
    classFeatureCache[cacheKey] = merged;
    return merged;
  }

  // 3. API fallback
  const levelResults = await Promise.all(
    Array.from({ length: maxLevel }, (_, i) =>
      fetch(`${DND5E_BASE}/classes/${slug}/levels/${i + 1}/features`)
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .catch(() => ({ results: [] }))
    )
  );

  const refs = levelResults.flatMap((r, i) =>
    (r.results || []).map((f) => ({ ...f, level: i + 1 }))
  );

  const details = await Promise.allSettled(
    refs.slice(0, 30).map((f) =>
      fetch(`https://www.dnd5eapi.co${f.url}`)
        .then((r) => r.json())
        .then((raw) => ({ ...normalizeResult(raw, "features"), level: f.level }))
    )
  );

  const results = details
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  classFeatureCache[cacheKey] = results;
  return results;
}

const subclassCache = {};
const subclassFeatureCache = {};

async function getSubclassFeatures(subclassSlug, maxLevel = 20) {
  const cacheKey = `${subclassSlug}-${maxLevel}`;
  if (subclassFeatureCache[cacheKey]) return subclassFeatureCache[cacheKey];

  // 1. Supplement (non-SRD committed data) — keyed by slug
  const supplementFeatures = getSupplementSubclassFeatures(subclassSlug, maxLevel);
  if (supplementFeatures.length > 0) {
    const sorted = supplementFeatures.sort((a, b) => (a.level || 0) - (b.level || 0));
    subclassFeatureCache[cacheKey] = sorted;
    return sorted;
  }

  // 2. SRD local cache — look for matching subclass name
  // Derive a display name from the slug for matching
  const LOCAL_SUBCLASS_NAMES = {
    "lore": "College of Lore", "valor": "College of Valor",
    "berserker": "Berserker", "totem-warrior": "Totem Warrior",
    "life": "Life", "light": "Light", "nature": "Nature",
    "knowledge": "Knowledge", "trickery": "Trickery", "war": "War",
    "tempest": "Tempest", "death": "Death",
    "land": "Land", "moon": "Moon",
    "champion": "Champion", "battle-master": "Battle Master", "eldritch-knight": "Eldritch Knight",
    "open-hand": "Open Hand", "shadow": "Shadow", "four-elements": "Four Elements",
    "devotion": "Devotion", "ancients": "Ancients", "vengeance": "Vengeance", "oathbreaker": "Oathbreaker",
    "beast-master": "Beast Master", "hunter": "Hunter",
    "arcane-trickster": "Arcane Trickster", "assassin": "Assassin", "thief": "Thief",
    "draconic": "Draconic Bloodline", "wild-magic": "Wild Magic",
    "archfey": "Archfey", "fiend": "Fiend", "great-old-one": "Great Old One",
    "abjuration": "Abjuration", "conjuration": "Conjuration", "divination": "Divination",
    "enchantment": "Enchantment", "evocation": "Evocation", "illusion": "Illusion",
    "necromancy": "Necromancy", "transmutation": "Transmutation",
  };
  const subclassName = LOCAL_SUBCLASS_NAMES[subclassSlug];
  if (subclassName) {
    const srdFeatures = getSrdSubclassFeaturesByName(subclassName, maxLevel);
    if (srdFeatures.length > 0) {
      const sorted = srdFeatures.sort((a, b) => (a.level || 0) - (b.level || 0));
      subclassFeatureCache[cacheKey] = sorted;
      return sorted;
    }
  }

  // 3. API fallback
  const res = await fetch(`${DND5E_BASE}/subclasses/${subclassSlug}/features`);
  if (!res.ok) return [];
  const json = await res.json();
  const refs = json.results || [];

  const details = await Promise.allSettled(
    refs.slice(0, 20).map((f) =>
      fetch(`https://www.dnd5eapi.co${f.url}`)
        .then((r) => r.json())
        .then((raw) => normalizeResult(raw, "features"))
    )
  );

  const results = details
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((f) => !maxLevel || (f.level || 0) <= maxLevel);

  subclassFeatureCache[cacheKey] = results;
  return results;
}
const raceCache = {};
const bgCache = {};
const classDetailCache = {};
const classSpellListCache = {};

const MAIN_RACES = new Set(["dragonborn","dwarf","elf","gnome","half-elf","half-orc","halfling","human","tiefling"]);

async function getSubclasses(classSlug) {
  if (subclassCache[classSlug]) return subclassCache[classSlug];

  const local = LOCAL_SUBCLASSES[classSlug];
  if (local && local.length > 0) {
    const result = { results: local.map((s) => ({ index: s.index, name: s.name, source: s.source })) };
    subclassCache[classSlug] = result;
    return result;
  }

  const res = await fetch(`${DND5E_BASE}/classes/${classSlug}/subclasses`);
  if (!res.ok) return { results: [] };
  const json = await res.json();
  const result = { results: (json.results || []).map((s) => ({ index: s.index, name: s.name })) };
  subclassCache[classSlug] = result;
  return result;
}

function apiSkillToKey(index) {
  return index.replace("skill-", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function normalizeTraitDetails(raw, isSubrace) {
  const profs = raw.starting_proficiencies || raw.racial_traits_proficiencies || [];
  return {
    index: raw.index,
    name: raw.name,
    speed: raw.speed,
    darkvision: raw.darkvision,
    size: raw.size,
    abilityBonuses: (raw.ability_bonuses || []).map((b) => ({
      abilityName: ABILITY_NAME_MAP[b.ability_score?.index] || b.ability_score?.name,
      bonus: b.bonus,
    })),
    skillProficiencies: profs
      .filter((p) => p.index.startsWith("skill-"))
      .map((p) => {
        const name = (p.name || "").replace("Skill: ", "");
        return { key: apiSkillToKey(p.index), name: SKILL_NAME_PT[name] || name };
      }),
    otherProficiencies: profs
      .filter((p) => !p.index.startsWith("skill-"))
      .map((p) => p.name),
    languages: (raw.languages || []).map((l) => LANGUAGE_PT[l.name] || l.name),
    languageDesc: raw.language_desc,
    traits: (raw.racial_traits || raw.traits || []).map((t) => t.name),
  };
}

async function getRaceDetails(raceIndex) {
  if (raceCache[raceIndex]) return raceCache[raceIndex];

  if (RACE_SUPPLEMENT[raceIndex]) {
    raceCache[raceIndex] = RACE_SUPPLEMENT[raceIndex];
    return RACE_SUPPLEMENT[raceIndex];
  }

  const isSubrace = !MAIN_RACES.has(raceIndex);
  const endpoint = isSubrace
    ? `${DND5E_BASE}/subraces/${raceIndex}`
    : `${DND5E_BASE}/races/${raceIndex}`;
  const res = await fetch(endpoint);
  if (!res.ok) return null;
  const raw = await res.json();
  const result = normalizeTraitDetails(raw, isSubrace);
  raceCache[raceIndex] = result;
  return result;
}

async function getClassDetails(slug) {
  if (classDetailCache[slug]) return classDetailCache[slug];
  const res = await fetch(`${DND5E_BASE}/classes/${slug}`);
  if (!res.ok) return null;
  const raw = await res.json();
  const proficiencyChoices = (raw.proficiency_choices || [])
    .map((choice) => {
      const options = (choice.from?.options || [])
        .filter((o) => o.item?.index?.startsWith("skill-"))
        .map((o) => ({ key: apiSkillToKey(o.item.index), name: (o.item.name || "").replace("Skill: ", "") }));
      return options.length > 0 ? { choose: choice.choose, from: options } : null;
    })
    .filter(Boolean);
  const savingThrows = (raw.saving_throws || []).map((st) =>
    st.index.replace("saving-throw-", "")
  );
  const result = { index: slug, name: raw.name, proficiencyChoices, savingThrows };
  classDetailCache[slug] = result;
  return result;
}

async function getBackgroundDetails(bgIndex) {
  if (bgCache[bgIndex]) return bgCache[bgIndex];

  if (BG_SUPPLEMENT[bgIndex]) {
    bgCache[bgIndex] = BG_SUPPLEMENT[bgIndex];
    return BG_SUPPLEMENT[bgIndex];
  }

  const res = await fetch(`${DND5E_BASE}/backgrounds/${bgIndex}`);
  if (!res.ok) return null;
  const raw = await res.json();
  const profs = raw.starting_proficiencies || [];
  const result = {
    index: bgIndex,
    name: raw.name,
    skillProficiencies: profs
      .filter((p) => p.index.startsWith("skill-"))
      .map((p) => {
        const name = (p.name || "").replace("Skill: ", "");
        return { key: apiSkillToKey(p.index), name: SKILL_NAME_PT[name] || name };
      }),
    otherProficiencies: profs
      .filter((p) => !p.index.startsWith("skill-"))
      .map((p) => p.name),
    languageOptions: raw.language_options?.choose || 0,
    feature: raw.feature
      ? { name: raw.feature.name, desc: (raw.feature.desc || []).join("\n") }
      : null,
  };
  bgCache[bgIndex] = result;
  return result;
}

async function searchClassSpells(classSlug, query, maxSpellLevel) {
  const listKey = `spells-${classSlug}`;
  let refs;
  if (classSpellListCache[listKey]) {
    refs = classSpellListCache[listKey];
  } else {
    const res = await fetch(`${DND5E_BASE}/classes/${classSlug}/spells`);
    if (!res.ok) return [];
    const json = await res.json();
    refs = json.results || [];
    classSpellListCache[listKey] = refs;
  }

  const q = (query || "").toLowerCase();
  const filtered = q ? refs.filter((r) => r.name.toLowerCase().includes(q)) : refs;
  const top = filtered.slice(0, 15);

  const details = await Promise.allSettled(
    top.map((r) =>
      fetch(`https://www.dnd5eapi.co${r.url}`)
        .then((res) => res.json())
        .then((raw) => normalizeResult(raw, "spells"))
    )
  );

  let spells = details.filter((r) => r.status === "fulfilled").map((r) => r.value);
  if (maxSpellLevel > 0) spells = spells.filter((s) => (s.level ?? 0) <= maxSpellLevel);
  return spells;
}

function getRaceList() {
  if (!fs.existsSync(RACES_PATH)) return [];
  return JSON.parse(fs.readFileSync(RACES_PATH, "utf8"));
}

module.exports = {
  searchDnd5e,
  getClassFeatures,
  getSubclasses,
  getRaceList,
  getSubclassFeatures,
  getRaceDetails,
  getBackgroundDetails,
  getClassDetails,
  searchClassSpells,
};
