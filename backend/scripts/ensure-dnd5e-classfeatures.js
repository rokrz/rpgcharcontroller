// scripts/ensure-dnd5e-classfeatures.js
//
// Garante que o cache local de class features SRD existe antes de iniciar o servidor.
// O supplement (dados não-SRD) está sempre em src/data/dnd5e_supplement.json (commitado).

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const TARGET = path.join(__dirname, "..", "src", "data", "dnd5e_classfeatures_srd.json");
const IMPORT_SCRIPT = path.join(__dirname, "import-dnd5e-classfeatures.js");

if (fs.existsSync(TARGET)) {
  console.log(`[ensure-dnd5e-classfeatures] ${path.basename(TARGET)} já existe, pulando download.`);
  process.exit(0);
}

console.log(`[ensure-dnd5e-classfeatures] ${path.basename(TARGET)} não encontrado — baixando features SRD…`);
const result = spawnSync(process.execPath, [IMPORT_SCRIPT], { stdio: "inherit" });

if (result.status !== 0) {
  console.warn("[ensure-dnd5e-classfeatures] Download falhou. Features SRD não estarão disponíveis localmente.");
}

process.exit(0);
