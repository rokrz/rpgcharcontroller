"use strict";

const {
  Router
} = require("express");
const {
  searchDnd5e,
  getClassFeatures,
  getSubclasses,
  getSubclassFeatures,
  getRaceDetails,
  getBackgroundDetails,
  getClassDetails,
  searchClassSpells,
  searchClassSpellsUnion,
  getRaceList,
  searchFeats,
  paginate
} = require("../systems/dnd5eProxy");
const {
  searchPf2e,
  searchClassFeats
} = require("../systems/pf2eSearch");
const {
  searchDaggerheart,
  getClassCards
} = require("../systems/daggerheartProxy");
const router = Router();
router.get("/dnd5e", async (req, res) => {
  const {
    type = "spells",
    search = "",
    class: cls = "",
    level = "20",
    index = "",
    maxlevel = "0",
    page = "1",
    limit = "20"
  } = req.query;
  const pg = Math.max(1, Number(page) || 1);
  const lm = Math.min(100, Math.max(1, Number(limit) || 20));
  try {
    if (type === "classfeatures") {
      const all = await getClassFeatures(cls.toLowerCase(), Number(level));
      return res.json(paginate(all, pg, lm));
    }
    if (type === "subclasses") {
      const slug = (index || cls).toLowerCase();
      if (!slug) return res.json({
        results: []
      });
      return res.json(await getSubclasses(slug));
    }
    if (type === "subclassfeatures") {
      const all = await getSubclassFeatures(cls.toLowerCase(), Number(level));
      return res.json(paginate(all, pg, lm));
    }
    if (type === "racelist") {
      return res.json({
        results: getRaceList()
      });
    }
    if (type === "racedetail") {
      const data = await getRaceDetails(index.toLowerCase());
      return data ? res.json(data) : res.status(404).json({
        error: "Not found"
      });
    }
    if (type === "backgrounddetail") {
      const data = await getBackgroundDetails(index.toLowerCase());
      return data ? res.json(data) : res.status(404).json({
        error: "Not found"
      });
    }
    if (type === "classdetail") {
      const data = await getClassDetails(index.toLowerCase());
      return data ? res.json(data) : res.status(404).json({
        error: "Not found"
      });
    }
    if (type === "classspells") {
      const data = await searchClassSpells(cls.toLowerCase(), search, Number(maxlevel), pg, lm);
      return res.json(data);
    }
    if (type === "classspellsunion") {
      const slugs = (cls || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      if (!slugs.length) return res.json({
        results: [],
        total: 0,
        totalPages: 0,
        page: pg
      });
      const data = await searchClassSpellsUnion(slugs, search, Number(maxlevel), pg, lm);
      return res.json(data);
    }
    if (type === "feats") {
      return res.json(paginate(searchFeats(search), pg, lm));
    }
    const data = await searchDnd5e(type, search, pg, lm);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      results: []
    });
  }
});
router.get("/pf2e", (req, res) => {
  const {
    type = "spells",
    search = "",
    class: cls = "",
    level = "0"
  } = req.query;
  try {
    if (type === "classfeats") {
      const results = searchClassFeats(cls, Number(level) || undefined);
      return res.json({
        results
      });
    }
    const results = searchPf2e(type, search);
    res.json({
      results
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      results: []
    });
  }
});
router.get("/daggerheart", async (req, res) => {
  const {
    type = "cards",
    search = "",
    class: cls = ""
  } = req.query;
  try {
    if (type === "classcards") {
      const results = await getClassCards(cls);
      return res.json({
        results
      });
    }
    const results = await searchDaggerheart(type, search);
    res.json({
      results
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      results: []
    });
  }
});
module.exports = router;