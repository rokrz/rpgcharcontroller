// scripts/ensure-dnd5e-races.js
//
// Garante que a lista de raças D&D 5e existe antes de iniciar o servidor.
// Se o arquivo já está no lugar, sai silenciosamente.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const TARGET = path.join(__dirname, "..", "src", "data", "dnd5e_races.json");
const IMPORT_SCRIPT = path.join(__dirname, "import-dnd5e-races.js");

if (fs.existsSync(TARGET)) {
  console.log(`[ensure-dnd5e-races] ${path.basename(TARGET)} já existe, pulando download.`);
  process.exit(0);
}

console.log(`[ensure-dnd5e-races] ${path.basename(TARGET)} não encontrado — baixando raças D&D 5e…`);
const result = spawnSync(process.execPath, [IMPORT_SCRIPT], { stdio: "inherit" });

if (result.status !== 0) {
  console.warn("[ensure-dnd5e-races] Download falhou. Raças SRD básicas ainda estarão disponíveis.");
}

process.exit(0);
