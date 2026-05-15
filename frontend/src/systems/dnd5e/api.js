import { api } from "../../services/api.js";

export const dnd5eApi = {
  searchSpells: (q, pg = 1) => api.search("dnd5e", "spells", q, pg),
  searchItems:  (q, pg = 1) => api.search("dnd5e", "equipment", q, pg),
  searchFeats:  (q, pg = 1) => api.search("dnd5e", "feats", q, pg),
  searchClassFeatures: (q, pg = 1) => api.search("dnd5e", "features", q, pg),
  searchMonsters: (q, pg = 1) => api.search("dnd5e", "monsters", q, pg),
};
