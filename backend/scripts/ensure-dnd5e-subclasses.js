// scripts/ensure-dnd5e-subclasses.js
//
// Garante que as subclasses D&D 5e existem antes de iniciar o servidor.
// Se o arquivo já está no lugar, sai silenciosamente.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const TARGET = path.join(__dirname, "..", "src", "data", "dnd5e_subclasses.json");
const IMPORT_SCRIPT = path.join(__dirname, "import-dnd5e-subclasses.js");

if (fs.existsSync(TARGET)) {
  console.log(`[ensure-dnd5e-subclasses] ${path.basename(TARGET)} já existe, pulando download.`);
  process.exit(0);
}

console.log(`[ensure-dnd5e-subclasses] ${path.basename(TARGET)} não encontrado — baixando subclasses D&D 5e…`);
const result = spawnSync(process.execPath, [IMPORT_SCRIPT], { stdio: "inherit" });

if (result.status !== 0) {
  console.warn("[ensure-dnd5e-subclasses] Download falhou. O servidor pode não listar subclasses.");
}

process.exit(0);
