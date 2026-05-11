export const DH_TRAITS = [
  { key: "agility",   label: "Agilidade" },
  { key: "strength",  label: "Força" },
  { key: "finesse",   label: "Finesse" },
  { key: "instinct",  label: "Instinto" },
  { key: "presence",  label: "Presença" },
  { key: "knowledge", label: "Conhecimento" },
];

export const DH_DOMAINS = [
  "Arcana", "Blade", "Bone", "Codex", "Grace", "Midnight",
  "Sage", "Splendor", "Valor", "Wanderer",
];

export function createDaggerheartSheet(name = "Personagem") {
  const traits = {};
  DH_TRAITS.forEach((t) => { traits[t.key] = 0; });

  return {
    name,
    class: "",
    subclass: "",
    ancestry: { primary: "", secondary: "" },
    community: "",
    level: 1,
    pronouns: "",
    xpThreshold: 0,

    ...traits,

    evasion: 10,
    armorScore: 0,
    armorSlots: { total: 0, marked: 0 },

    hp: { max: 6, current: 6 },
    stress: { max: 6, current: 0 },
    hope: 0,
    fear: 0,

    proficiency: 1,

    experiences: [],

    domainCards: [],

    classFeatures: {
      foundation: { name: "", description: "" },
      specialty: { name: "", description: "" },
      mastery: { name: "", description: "" },
    },

    inventory: [],
    gold: 0,

    conditions: [],
    backstory: "",
    connections: "",
    notes: "",
  };
}
