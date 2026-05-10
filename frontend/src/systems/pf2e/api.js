import { api } from "../../services/api.js";

export const pf2eApi = {
  searchSpells: (q) => api.search("pf2e", "spells", q),
  searchItems:  (q) => api.search("pf2e", "items", q),
  searchFeats:  (q) => api.search("pf2e", "feats", q),
  searchActions: (q) => api.search("pf2e", "actions", q),
};
