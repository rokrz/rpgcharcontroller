export const PF2E_ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];

export const PF2E_RANKS = ["Sem Treino", "Treinado", "Especialista", "Mestre", "Lendário"];

export const PF2E_SKILLS = [
  { key: "acrobatics",    label: "Acrobacia",       ability: "dex" },
  { key: "arcana",        label: "Arcanismo",        ability: "int" },
  { key: "athletics",     label: "Atletismo",        ability: "str" },
  { key: "crafting",      label: "Ofício",           ability: "int" },
  { key: "deception",     label: "Enganação",        ability: "cha" },
  { key: "diplomacy",     label: "Diplomacia",       ability: "cha" },
  { key: "intimidation",  label: "Intimidação",      ability: "cha" },
  { key: "medicine",      label: "Medicina",         ability: "wis" },
  { key: "nature",        label: "Natureza",         ability: "wis" },
  { key: "occultism",     label: "Ocultismo",        ability: "int" },
  { key: "performance",   label: "Performance",      ability: "cha" },
  { key: "religion",      label: "Religião",         ability: "wis" },
  { key: "society",       label: "Sociedade",        ability: "int" },
  { key: "stealth",       label: "Furtividade",      ability: "dex" },
  { key: "survival",      label: "Sobrevivência",    ability: "wis" },
  { key: "thievery",      label: "Ladinagem",        ability: "dex" },
];

export function createPf2eSheet(name = "Personagem") {
  const skills = {};
  PF2E_SKILLS.forEach((s) => { skills[s.key] = { rank: 0, ability: s.ability }; });

  return {
    name,
    class: "",
    ancestry: "",
    heritage: "",
    background: "",
    level: 1,
    deity: "",
    alignment: "",

    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },

    hp: { max: 0, current: 0, wounded: 0, dying: 0 },
    ac: 10,
    classDC: 10,
    perception: { rank: 0 },
    speed: 25,

    saves: { fort: { rank: 0 }, ref: { rank: 0 }, will: { rank: 0 } },
    skills,

    actions: [],

    spellcasting: { tradition: "", type: "prepared", ability: "" },
    spells: { cantrips: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [] },
    focusPoints: { max: 0, current: 0 },

    inventory: [],
    currency: { cp: 0, sp: 0, gp: 0 },

    feats: { ancestry: [], class: [], general: [], skill: [], bonus: [] },

    conditions: [],
    notes: "",
  };
}
