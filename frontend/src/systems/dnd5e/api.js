import { api } from "../../services/api.js";

export const dnd5eApi = {
  searchSpells: (q) => api.search("dnd5e", "spells", q),
  searchItems:  (q) => api.search("dnd5e", "equipment", q),
  searchFeats:  (q) => api.search("dnd5e", "features", q),
  searchMonsters: (q) => api.search("dnd5e", "monsters", q),
};
