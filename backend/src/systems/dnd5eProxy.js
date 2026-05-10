const path = require("path");
const DND5E_BASE = "https://www.dnd5eapi.co/api/2014";
const LOCAL_SUBCLASSES = require(path.join(__dirname, "../data/dnd5e_subclasses.json"));

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
      abilityName: b.ability_score?.name,
      bonus: b.bonus,
    })),
    skillProficiencies: profs
      .filter((p) => p.index.startsWith("skill-"))
      .map((p) => ({ key: apiSkillToKey(p.index), name: (p.name || "").replace("Skill: ", "") })),
    otherProficiencies: profs
      .filter((p) => !p.index.startsWith("skill-"))
      .map((p) => p.name),
    languages: (raw.languages || []).map((l) => l.name),
    languageDesc: raw.language_desc,
    traits: (raw.racial_traits || raw.traits || []).map((t) => t.name),
  };
}

async function getRaceDetails(raceIndex) {
  if (raceCache[raceIndex]) return raceCache[raceIndex];
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

async function getBackgroundDetails(bgIndex) {
  if (bgCache[bgIndex]) return bgCache[bgIndex];
  const res = await fetch(`${DND5E_BASE}/backgrounds/${bgIndex}`);
  if (!res.ok) return null;
  const raw = await res.json();
  const profs = raw.starting_proficiencies || [];
  const result = {
    index: bgIndex,
    name: raw.name,
    skillProficiencies: profs
      .filter((p) => p.index.startsWith("skill-"))
      .map((p) => ({ key: apiSkillToKey(p.index), name: (p.name || "").replace("Skill: ", "") })),
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

module.exports = {
  searchDnd5e,
  getClassFeatures,
  getSubclasses,
  getSubclassFeatures,
  getRaceDetails,
  getBackgroundDetails,
  searchClassSpells,
};
