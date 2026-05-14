const path = require("path");
const express = require("express");
const cors = require("cors");
const { initDB } = require("./data/db");
const sheetsRouter = require("./routes/sheets");
const proxyRouter = require("./routes/proxy");

const app = express();
app.use(cors());
app.use(express.json({ limit: "4mb" }));

app.use("/api/sheets", sheetsRouter);
app.use("/api/proxy", proxyRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

async function start({ port = 3001, frontendDist = null } = {}) {
  await initDB();
  if (frontendDist) {
    app.use(express.static(frontendDist));
    app.get("*", (req, res) =>
      res.sendFile(path.join(frontendDist, "index.html"))
    );
  }
  return new Promise((resolve, reject) => {
    const server = app.listen(port, "127.0.0.1", () => {
      resolve({ port: server.address().port, server });
    });
    server.on("error", reject);
  });
}

module.exports = { app, start };

if (require.main === module) {
  start({ port: process.env.PORT || 3001 })
    .then(({ port }) =>
      console.log(`RPG Char Controller backend na porta ${port}`)
    )
    .catch((err) => {
      console.error("Erro ao inicializar DB:", err);
      process.exit(1);
    });
}
