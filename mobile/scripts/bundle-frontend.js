#!/usr/bin/env node
// Garante que o build do frontend (frontend/dist) existe e esta atualizado.
//
// NAO copia dist pra mobile/www/ -- a www/ contem so a boot page (index.html
// + cordova.js) que redireciona pro Express embarcado depois que o Node sobe.
// O dist React real vai pra nodejs-assets/nodejs-project/frontend-dist via
// bundle-backend.js, e e servido pelo Express embarcado.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const FRONTEND = path.join(ROOT, "frontend");
const DIST = path.join(FRONTEND, "dist");

function log(msg) {
  process.stdout.write(`[bundle-frontend] ${msg}\n`);
}

function main() {
  if (!fs.existsSync(path.join(FRONTEND, "package.json"))) {
    process.stderr.write(`[bundle-frontend] FALTA: ${FRONTEND}\n`);
    process.exit(1);
  }

  log("Rodando vite build...");
  execSync("npm run build", {
    cwd: FRONTEND,
    stdio: "inherit",
  });

  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    process.stderr.write(`[bundle-frontend] vite build nao gerou ${DIST}/index.html\n`);
    process.exit(1);
  }

  log("OK. frontend/dist/ atualizado.");
}

main();
