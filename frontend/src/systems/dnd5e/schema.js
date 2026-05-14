export const DND5E_ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];

export const DND5E_SKILLS = [
  { key: "acrobatics",    label: "Acrobacia",        ability: "dex" },
  { key: "animalHandling",label: "Lidar c/ Animais",  ability: "wis" },
  { key: "arcana",        label: "Arcanismo",         ability: "int" },
  { key: "athletics",     label: "Atletismo",         ability: "str" },
  { key: "deception",     label: "Enganação",         ability: "cha" },
  { key: "history",       label: "História",          ability: "int" },
  { key: "insight",       label: "Intuição",          ability: "wis" },
  { key: "intimidation",  label: "Intimidação",       ability: "cha" },
  { key: "investigation", label: "Investigação",      ability: "int" },
  { key: "medicine",      label: "Medicina",          ability: "wis" },
  { key: "nature",        label: "Natureza",          ability: "int" },
  { key: "perception",    label: "Percepção",         ability: "wis" },
  { key: "performance",   label: "Performance",       ability: "cha" },
  { key: "persuasion",    label: "Persuasão",         ability: "cha" },
  { key: "religion",      label: "Religião",          ability: "int" },
  { key: "sleightOfHand", label: "Prestidigitação",  ability: "dex" },
  { key: "stealth",       label: "Furtividade",       ability: "dex" },
  { key: "survival",      label: "Sobrevivência",     ability: "wis" },
];

export function createDnd5eSheet(name = "Personagem") {
  const skills = {};
  DND5E_SKILLS.forEach((s) => { skills[s.key] = false; });

  return {
    name,
    class: "",
    subclass: "",
    level: 1,
    race: "",
    background: "",
    alignment: "",
    xp: 0,
    playerName: "",
    proficiencyBonus: 2,
    inspiration: false,

    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
    skills,

    ac: 10,
    initiative: 0,
    speed: 30,
    hp: { max: 0, current: 0, temp: 0 },
    hitDice: { total: 1, remaining: 1, die: "d8" },
    deathSaves: { successes: 0, failures: 0 },

    attacks: [],

    spellcasting: { ability: "", saveDC: 8, attackBonus: 0 },
    spellSlots: {
      1: { total: 0, used: 0 }, 2: { total: 0, used: 0 }, 3: { total: 0, used: 0 },
      4: { total: 0, used: 0 }, 5: { total: 0, used: 0 }, 6: { total: 0, used: 0 },
      7: { total: 0, used: 0 }, 8: { total: 0, used: 0 }, 9: { total: 0, used: 0 },
    },
    spells: { cantrips: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] },

    equipment: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },

    features: [],

    personality: { traits: "", ideals: "", bonds: "", flaws: "" },
    appearance: { age: "", height: "", weight: "", eyes: "", skin: "", hair: "", backstory: "" },
    otherProficiencies: "",
    languages: "",

    multiclasses: [],
    appliedRaceBonuses: {},
  };
}
