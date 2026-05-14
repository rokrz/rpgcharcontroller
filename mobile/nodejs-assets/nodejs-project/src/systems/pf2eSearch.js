"use strict";

const path = require("path");
const fs = require("fs");
const {
  PF2E_DATA_DIR
} = require("../data/paths");
const cache = {};
function loadJson(filename) {
  if (cache[filename]) return cache[filename];
  const file = path.join(PF2E_DATA_DIR, filename);
  if (!fs.existsSync(file)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    cache[filename] = Array.isArray(data) ? data : data.spell || data.item || data.feat || data.action || [];
    return cache[filename];
  } catch {
    return [];
  }
}
const TYPE_FILES = {
  spells: "spells.json",
  items: "items.json",
  feats: "feats.json",
  actions: "actions.json"
};
function searchPf2e(type, query) {
  const filename = TYPE_FILES[type];
  if (!filename) return [];
  const data = loadJson(filename);
  const q = query.toLowerCase();
  return data.filter(entry => {
    const name = (entry.name || "").toLowerCase();
    return !q || name.includes(q);
  }).slice(0, 20).map(entry => normalizePf2e(entry, type));
}
function normalizePf2e(raw, type) {
  var _raw$name;
  const base = {
    index: (_raw$name = raw.name) === null || _raw$name === void 0 ? void 0 : _raw$name.toLowerCase().replace(/\s+/g, "-"),
    name: raw.name,
    type
  };
  if (type === "spells") {
    var _raw$traditions, _raw$traits, _raw$cast, _raw$range, _raw$area, _raw$duration, _raw$description;
    return {
      ...base,
      level: raw.level,
      tradition: (_raw$traditions = raw.traditions) === null || _raw$traditions === void 0 ? void 0 : _raw$traditions.join(", "),
      traits: (_raw$traits = raw.traits) === null || _raw$traits === void 0 ? void 0 : _raw$traits.join(", "),
      castingTime: (_raw$cast = raw.cast) === null || _raw$cast === void 0 ? void 0 : _raw$cast.value,
      range: (_raw$range = raw.range) === null || _raw$range === void 0 ? void 0 : _raw$range.value,
      area: (_raw$area = raw.area) === null || _raw$area === void 0 ? void 0 : _raw$area.value,
      duration: (_raw$duration = raw.duration) === null || _raw$duration === void 0 ? void 0 : _raw$duration.value,
      description: (_raw$description = raw.description) === null || _raw$description === void 0 ? void 0 : _raw$description.value
    };
  }
  if (type === "items") {
    var _raw$level, _raw$price, _raw$bulk, _raw$traits2, _raw$description2;
    return {
      ...base,
      category: raw.category,
      level: (_raw$level = raw.level) === null || _raw$level === void 0 ? void 0 : _raw$level.value,
      price: (_raw$price = raw.price) === null || _raw$price === void 0 ? void 0 : _raw$price.value,
      bulk: (_raw$bulk = raw.bulk) === null || _raw$bulk === void 0 ? void 0 : _raw$bulk.value,
      traits: (_raw$traits2 = raw.traits) === null || _raw$traits2 === void 0 || (_raw$traits2 = _raw$traits2.value) === null || _raw$traits2 === void 0 ? void 0 : _raw$traits2.join(", "),
      description: (_raw$description2 = raw.description) === null || _raw$description2 === void 0 ? void 0 : _raw$description2.value
    };
  }
  if (type === "feats") {
    var _raw$level2, _raw$prerequisites, _raw$traits3, _raw$description3;
    return {
      ...base,
      level: (_raw$level2 = raw.level) === null || _raw$level2 === void 0 ? void 0 : _raw$level2.value,
      prerequisites: (_raw$prerequisites = raw.prerequisites) === null || _raw$prerequisites === void 0 || (_raw$prerequisites = _raw$prerequisites.value) === null || _raw$prerequisites === void 0 ? void 0 : _raw$prerequisites.map(p => p.value).join(", "),
      traits: (_raw$traits3 = raw.traits) === null || _raw$traits3 === void 0 || (_raw$traits3 = _raw$traits3.value) === null || _raw$traits3 === void 0 ? void 0 : _raw$traits3.join(", "),
      description: (_raw$description3 = raw.description) === null || _raw$description3 === void 0 ? void 0 : _raw$description3.value
    };
  }
  if (type === "actions") {
    var _raw$actionType, _raw$traits4, _raw$description4;
    return {
      ...base,
      actionType: (_raw$actionType = raw.actionType) === null || _raw$actionType === void 0 ? void 0 : _raw$actionType.value,
      traits: (_raw$traits4 = raw.traits) === null || _raw$traits4 === void 0 || (_raw$traits4 = _raw$traits4.value) === null || _raw$traits4 === void 0 ? void 0 : _raw$traits4.join(", "),
      description: (_raw$description4 = raw.description) === null || _raw$description4 === void 0 ? void 0 : _raw$description4.value
    };
  }
  return base;
}
function searchClassFeats(className, maxLevel) {
  const data = loadJson("feats.json");
  const cls = (className || "").toLowerCase();
  return data.filter(entry => {
    var _entry$traits, _entry$level;
    const traits = (((_entry$traits = entry.traits) === null || _entry$traits === void 0 ? void 0 : _entry$traits.value) || []).map(t => t.toLowerCase());
    const levelOk = !maxLevel || (((_entry$level = entry.level) === null || _entry$level === void 0 ? void 0 : _entry$level.value) || 0) <= maxLevel;
    return traits.includes(cls) && levelOk;
  }).slice(0, 40).map(entry => normalizePf2e(entry, "feats"));
}
module.exports = {
  searchPf2e,
  searchClassFeats
};