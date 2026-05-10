import { createDnd5eSheet } from "./dnd5e/schema.js";
import { createPf2eSheet } from "./pf2e/schema.js";
import { createDaggerheartSheet } from "./daggerheart/schema.js";

export const SYSTEMS = {
  dnd5e: {
    id: "dnd5e",
    label: "D&D 5e",
    description: "Dungeons & Dragons 5ª Edição",
    color: "text-cond-debuff",
    badge: "debuff",
    createSheet: createDnd5eSheet,
  },
  pf2e: {
    id: "pf2e",
    label: "PF2e",
    description: "Pathfinder 2ª Edição",
    color: "text-cond-burn",
    badge: "burn",
    createSheet: createPf2eSheet,
  },
  daggerheart: {
    id: "daggerheart",
    label: "Daggerheart",
    description: "Daggerheart por Darrington Press",
    color: "text-cond-magic",
    badge: "magic",
    createSheet: createDaggerheartSheet,
  },
};

export const SYSTEM_LIST = Object.values(SYSTEMS);
