const path = require("path");
const fs = require("fs");
const { PF2E_DATA_DIR } = require("../data/paths");

const cache = {};

function loadJson(filename) {
  if (cache[filename]) return cache[filename];
  const file = path.join(PF2E_DATA_DIR, filename);
  if (!fs.existsSync(file)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    cache[filename] = Array.isArray(data) ? data : (data.spell || data.item || data.feat || data.action || []);
    return cache[filename];
  } catch {
    return [];
  }
}

const TYPE_FILES = {
  spells:  "spells.json",
  items:   "items.json",
  feats:   "feats.json",
  actions: "actions.json",
};

function searchPf2e(type, query) {
  const filename = TYPE_FILES[type];
  if (!filename) return [];

  const data = loadJson(filename);
  const q = query.toLowerCase();

  return data
    .filter((entry) => {
      const name = (entry.name || "").toLowerCase();
      return !q || name.includes(q);
    })
    .slice(0, 20)
    .map((entry) => normalizePf2e(entry, type));
}

function normalizePf2e(raw, type) {
  const base = {
    index: raw.name?.toLowerCase().replace(/\s+/g, "-"),
    name: raw.name,
    type,
  };

  if (type === "spells") {
    return {
      ...base,
      level: raw.level,
      tradition: raw.traditions?.join(", "),
      traits: raw.traits?.join(", "),
      castingTime: raw.cast?.value,
      range: raw.range?.value,
      area: raw.area?.value,
      duration: raw.duration?.value,
      description: raw.description?.value,
    };
  }

  if (type === "items") {
    return {
      ...base,
      category: raw.category,
      level: raw.level?.value,
      price: raw.price?.value,
      bulk: raw.bulk?.value,
      traits: raw.traits?.value?.join(", "),
      description: raw.description?.value,
    };
  }

  if (type === "feats") {
    return {
      ...base,
      level: raw.level?.value,
      prerequisites: raw.prerequisites?.value?.map((p) => p.value).join(", "),
      traits: raw.traits?.value?.join(", "),
      description: raw.description?.value,
    };
  }

  if (type === "actions") {
    return {
      ...base,
      actionType: raw.actionType?.value,
      traits: raw.traits?.value?.join(", "),
      description: raw.description?.value,
    };
  }

  return base;
}

function searchClassFeats(className, maxLevel) {
  const data = loadJson("feats.json");
  const cls = (className || "").toLowerCase();
  return data
    .filter((entry) => {
      const traits = (entry.traits?.value || []).map((t) => t.toLowerCase());
      const levelOk = !maxLevel || (entry.level?.value || 0) <= maxLevel;
      return traits.includes(cls) && levelOk;
    })
    .slice(0, 40)
    .map((entry) => normalizePf2e(entry, "feats"));
}

module.exports = { searchPf2e, searchClassFeats };
