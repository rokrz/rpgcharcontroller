export function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function toNativeJson(sheet) {
  return {
    source: "innkeeper",
    version: 1,
    exportedAt: new Date().toISOString(),
    sheet,
  };
}

function normalizeItemsOut(items) {
  return (items || []).map((e) =>
    typeof e === "string" ? { name: e, quantity: 1 } : { name: e.name || "", quantity: e.quantity ?? 1 }
  );
}

function dnd5eToBooker(data) {
  const ab = data.abilities || {};
  return {
    kind: "player",
    system: "dnd5e",
    name: data.name || "",
    player_name: data.playerName || "",
    class: data.class || "",
    level: data.level || 1,
    race: data.race || "",
    alignment: data.alignment || "",
    background: data.background || "",
    strength:     ab.str ?? 10,
    dexterity:    ab.dex ?? 10,
    constitution: ab.con ?? 10,
    intelligence: ab.int ?? 10,
    wisdom:       ab.wis ?? 10,
    charisma:     ab.cha ?? 10,
    maxHp: data.hp?.max ?? 0,
    ca: data.ac ?? 10,
    initiative: data.initiative ?? null,
    speed: { walk: data.speed ?? 30 },
    languages: data.languages || "",
    items: normalizeItemsOut(data.equipment),
    notes: [data.personality?.traits, data.personality?.ideals, data.personality?.bonds, data.personality?.flaws]
      .filter(Boolean).join("\n"),
  };
}

function pf2eToBooker(data) {
  const ab = data.abilities || {};
  return {
    kind: "player",
    system: "pf2e",
    name: data.name || "",
    player_name: "",
    class: data.class || "",
    level: data.level || 1,
    race: data.ancestry || "",
    alignment: data.alignment || "",
    background: data.background || "",
    strength:     ab.str ?? 10,
    dexterity:    ab.dex ?? 10,
    constitution: ab.con ?? 10,
    intelligence: ab.int ?? 10,
    wisdom:       ab.wis ?? 10,
    charisma:     ab.cha ?? 10,
    maxHp: data.hp?.max ?? 0,
    ca: data.ac ?? 10,
    initiative: null,
    speed: { walk: data.speed ?? 25 },
    languages: "",
    items: normalizeItemsOut(data.inventory),
    notes: data.notes || "",
  };
}

function daggerheartToBooker(data) {
  const ancestry = typeof data.ancestry === "object" && data.ancestry !== null
    ? [data.ancestry.primary, data.ancestry.secondary].filter(Boolean).join(" + ")
    : (data.ancestry || "");
  return {
    kind: "player",
    system: "daggerheart",
    name: data.name || "",
    player_name: "",
    class: data.class || "",
    level: data.level || 1,
    race: ancestry,
    alignment: "",
    background: data.community || "",
    strength:     data.strength ?? 0,
    dexterity:    data.agility  ?? 0,
    constitution: data.instinct ?? 0,
    intelligence: data.knowledge ?? 0,
    wisdom:       data.presence ?? 0,
    charisma:     data.finesse  ?? 0,
    maxHp: data.hp?.max ?? 6,
    ca: data.evasion ?? 10,
    initiative: null,
    speed: { walk: 0 },
    languages: "",
    items: normalizeItemsOut(data.inventory),
    notes: data.notes || "",
  };
}

const BOOKER_MAPPERS = {
  dnd5e:        dnd5eToBooker,
  pf2e:         pf2eToBooker,
  daggerheart:  daggerheartToBooker,
};

export function toBookerJson(sheet) {
  const mapper = BOOKER_MAPPERS[sheet.system] || dnd5eToBooker;
  return mapper(sheet.data || {});
}
