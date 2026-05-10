const express = require("express");
const cors = require("cors");
const { initDB } = require("./data/db");
const sheetsRouter = require("./routes/sheets");
const proxyRouter = require("./routes/proxy");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "4mb" }));

app.use("/api/sheets", sheetsRouter);
app.use("/api/proxy", proxyRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`RPG Char Controller backend na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erro ao inicializar DB:", err);
    process.exit(1);
  });

module.exports = app;
