const { Router } = require("express");
const { searchDnd5e, getClassFeatures, getSubclasses, getSubclassFeatures, getRaceDetails, getBackgroundDetails, searchClassSpells } = require("../systems/dnd5eProxy");
const { searchPf2e, searchClassFeats } = require("../systems/pf2eSearch");
const { searchDaggerheart, getClassCards } = require("../systems/daggerheartProxy");

const router = Router();

router.get("/dnd5e", async (req, res) => {
  const { type = "spells", search = "", class: cls = "", level = "20", index = "", maxlevel = "0" } = req.query;
  try {
    if (type === "classfeatures") {
      const results = await getClassFeatures(cls.toLowerCase(), Number(level));
      return res.json({ results });
    }
    if (type === "subclasses") {
      const slug = (index || cls).toLowerCase();
      if (!slug) return res.json({ results: [] });
      return res.json(await getSubclasses(slug));
    }
    if (type === "subclassfeatures") {
      const results = await getSubclassFeatures(cls.toLowerCase(), Number(level));
      return res.json({ results });
    }
    if (type === "racedetail") {
      const data = await getRaceDetails(index.toLowerCase());
      return data ? res.json(data) : res.status(404).json({ error: "Not found" });
    }
    if (type === "backgrounddetail") {
      const data = await getBackgroundDetails(index.toLowerCase());
      return data ? res.json(data) : res.status(404).json({ error: "Not found" });
    }
    if (type === "classspells") {
      const spells = await searchClassSpells(cls.toLowerCase(), search, Number(maxlevel));
      return res.json({ results: spells });
    }
    const results = await searchDnd5e(type, search);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message, results: [] });
  }
});

router.get("/pf2e", (req, res) => {
  const { type = "spells", search = "", class: cls = "", level = "0" } = req.query;
  try {
    if (type === "classfeats") {
      const results = searchClassFeats(cls, Number(level) || undefined);
      return res.json({ results });
    }
    const results = searchPf2e(type, search);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message, results: [] });
  }
});

router.get("/daggerheart", async (req, res) => {
  const { type = "cards", search = "", class: cls = "" } = req.query;
  try {
    if (type === "classcards") {
      const results = await getClassCards(cls);
      return res.json({ results });
    }
    const results = await searchDaggerheart(type, search);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message, results: [] });
  }
});

module.exports = router;
