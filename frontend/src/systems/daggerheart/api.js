import { api } from "../../services/api.js";

export const daggerheartApi = {
  searchCards:  (q) => api.search("daggerheart", "cards", q),
  searchDomains: (q) => api.search("daggerheart", "domains", q),
};
