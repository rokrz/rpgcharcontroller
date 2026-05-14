"use strict";

const {
  Router
} = require("express");
const {
  v4: uuidv4
} = require("uuid");
const {
  db
} = require("../data/db");
const router = Router();
router.get("/", (req, res) => {
  res.json(db.data.sheets);
});
router.get("/:id", (req, res) => {
  const sheet = db.data.sheets.find(s => s.id === req.params.id);
  if (!sheet) return res.status(404).json({
    error: "Ficha não encontrada"
  });
  res.json(sheet);
});
router.post("/", async (req, res) => {
  const {
    system,
    data
  } = req.body;
  if (!system || !data) return res.status(400).json({
    error: "system e data são obrigatórios"
  });
  const sheet = {
    id: uuidv4(),
    system,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data
  };
  db.data.sheets.push(sheet);
  await db.write();
  res.status(201).json(sheet);
});
router.put("/:id", async (req, res) => {
  var _req$body$data;
  const idx = db.data.sheets.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({
    error: "Ficha não encontrada"
  });
  db.data.sheets[idx] = {
    ...db.data.sheets[idx],
    data: (_req$body$data = req.body.data) !== null && _req$body$data !== void 0 ? _req$body$data : req.body,
    updatedAt: new Date().toISOString()
  };
  await db.write();
  res.json(db.data.sheets[idx]);
});
router.delete("/:id", async (req, res) => {
  const idx = db.data.sheets.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({
    error: "Ficha não encontrada"
  });
  db.data.sheets.splice(idx, 1);
  await db.write();
  res.json({
    ok: true
  });
});
module.exports = router;