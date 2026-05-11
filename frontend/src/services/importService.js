import { createDnd5eSheet } from "../systems/dnd5e/schema.js";
import { createPf2eSheet } from "../systems/pf2e/schema.js";
import { createDaggerheartSheet } from "../systems/daggerheart/schema.js";

function normalizeItemsIn(items) {
  return (items || []).map((e) =>
    typeof e === "string"
      ? { name: e, quantity: 1, weight: "", notes: "" }
      : { name: e.name || "", quantity: e.quantity ?? 1, weight: e.weight || "", notes: e.notes || "" }
  );
}

function fromBookerDnd5e(player) {
  const base = createDnd5eSheet(player.name || "Personagem");
  return {
    system: "dnd5e",
    data: {
      ...base,
      name:        player.name        || "",
      playerName:  player.player_name || "",
      class:       player.class       || "",
      level:       player.level       || 1,
      race:        player.race        || "",
      alignment:   player.alignment   || "",
      background:  player.background  || "",
      abilities: {
        str: player.strength     ?? 10,
        dex: player.dexterity    ?? 10,
        con: player.constitution ?? 10,
        int: player.intelligence ?? 10,
        wis: player.wisdom       ?? 10,
        cha: player.charisma     ?? 10,
      },
      hp:        { max: player.maxHp ?? 0, current: player.maxHp ?? 0, temp: 0 },
      ac:        player.ca ?? 10,
      initiative: player.initiative ?? 0,
      speed:     player.speed?.walk ?? 30,
      languages: player.languages || "",
      equipment: normalizeItemsIn(player.items),
    },
  };
}

function fromBookerPf2e(player) {
  const base = createPf2eSheet(player.name || "Personagem");
  return {
    system: "pf2e",
    data: {
      ...base,
      name:       player.name       || "",
      class:      player.class      || "",
      level:      player.level      || 1,
      ancestry:   player.race       || "",
      alignment:  player.alignment  || "",
      background: player.background || "",
      abilities: {
        str: player.strength     ?? 10,
        dex: player.dexterity    ?? 10,
        con: player.constitution ?? 10,
        int: player.intelligence ?? 10,
        wis: player.wisdom       ?? 10,
        cha: player.charisma     ?? 10,
      },
      hp:        { max: player.maxHp ?? 0, current: player.maxHp ?? 0, wounded: 0, dying: 0 },
      ac:        player.ca ?? 10,
      speed:     player.speed?.walk ?? 25,
      notes:     player.notes || "",
      inventory: normalizeItemsIn(player.items),
    },
  };
}

function fromBookerDaggerheart(player) {
  const base = createDaggerheartSheet(player.name || "Personagem");
  return {
    system: "daggerheart",
    data: {
      ...base,
      name:      player.name       || "",
      class:     player.class      || "",
      level:     player.level      || 1,
      ancestry:  player.race       || "",
      community: player.background || "",
      strength:  player.strength     ?? 0,
      agility:   player.dexterity    ?? 0,
      instinct:  player.constitution ?? 0,
      knowledge: player.intelligence ?? 0,
      presence:  player.wisdom       ?? 0,
      finesse:   player.charisma     ?? 0,
      hp:        { max: player.maxHp ?? 6, current: player.maxHp ?? 6 },
      evasion:   player.ca ?? 10,
      notes:     player.notes || "",
      inventory: normalizeItemsIn(player.items),
    },
  };
}

const BOOKER_IMPORTERS = {
  dnd5e:       fromBookerDnd5e,
  pf2e:        fromBookerPf2e,
  daggerheart: fromBookerDaggerheart,
};

function fromBookerPlayer(player) {
  const sys = (player.system || "dnd5e").toLowerCase();
  return (BOOKER_IMPORTERS[sys] || fromBookerDnd5e)(player);
}

// Returns array of {system, data} ready for api.createSheet
export function parseImportFile(json) {
  if (json.source === "rpg-char-controller" && json.sheet) {
    const s = json.sheet;
    return [{ system: s.system, data: s.data }];
  }
  if (json.kind === "player") {
    return [fromBookerPlayer(json)];
  }
  if (Array.isArray(json.players) && json.players.length > 0) {
    return json.players.map(fromBookerPlayer);
  }
  if (Array.isArray(json.campaigns) && Array.isArray(json.players)) {
    return json.players.map(fromBookerPlayer);
  }
  throw new Error("Formato de arquivo não reconhecido. Esperado: RPGChar nativo, jogador Booker ou exportação completa do Booker.");
}
