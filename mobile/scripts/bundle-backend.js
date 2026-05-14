#!/usr/bin/env node
// Copia backend/src + frontend/dist pra dentro de
// nodejs-assets/nodejs-project, e instala node_modules de prod.
//
// O nodejs-mobile-cordova vai pegar tudo dentro de nodejs-assets/nodejs-project
// e empacotar no APK (extraido em runtime no /data/data/<pkg>/files do dispositivo).
//
// Esse script e idempotente: limpa antes de copiar pra evitar sobras de build
// anteriores.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const babel = require("@babel/core");

const ROOT = path.resolve(__dirname, "..", "..");

// nodejs-mobile-cordova 0.4.3 empacota Node 12. Precisamos transpilar todo
// .js do backend pra remover features ES2020+ (??, ?., ?.()) e
// subpath imports (fs/promises, node:crypto).
//
// dev/web consomem o source moderno direto; so o bundle Android passa
// pelo Babel. Express, cors e uuid em node_modules sao ES5 e copiados sem transform.
const BABEL_OPTS = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "12" },
        // Nao injeta core-js -- Node 12 ja tem todas as runtime APIs que o
        // codigo usa (fora randomUUID, polyfilled em main.js).
        useBuiltIns: false,
        modules: "commonjs",
      },
    ],
  ],
  babelrc: false,
  configFile: false,
  sourceMaps: false,
  compact: false,
};

const BACKEND_ROOT = path.join(ROOT, "backend");
const SRC_BACKEND = path.join(BACKEND_ROOT, "src");
const SRC_FRONTEND_DIST = path.join(ROOT, "frontend", "dist");

const TARGET_ROOT = path.resolve(__dirname, "..", "nodejs-assets", "nodejs-project");
const TARGET_SRC = path.join(TARGET_ROOT, "src");
const TARGET_FRONTEND = path.join(TARGET_ROOT, "frontend-dist");
const TARGET_NODE_MODULES = path.join(TARGET_ROOT, "node_modules");

function log(msg) {
  process.stdout.write(`[bundle-backend] ${msg}\n`);
}

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(src, dst);
    } else if (entry.isFile()) {
      fs.copyFileSync(src, dst);
    }
  }
}

// Igual ao copyDir mas roda Babel em arquivos .js. JSON e outros arquivos
// sao copiados intactos.
function transpileDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) {
      transpileDir(src, dst);
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".js")) {
        const result = babel.transformFileSync(src, BABEL_OPTS);
        fs.writeFileSync(dst, result.code);
      } else {
        fs.copyFileSync(src, dst);
      }
    }
  }
}

function ensure(checkPath, hint) {
  if (!fs.existsSync(checkPath)) {
    process.stderr.write(`[bundle-backend] FALTA: ${checkPath}\n  ${hint}\n`);
    process.exit(1);
  }
}

function main() {
  ensure(SRC_BACKEND, "Backend nao encontrado. Esperado em backend/src/.");
  ensure(
    SRC_FRONTEND_DIST,
    "Build do frontend nao encontrado. Rode 'npm run build --prefix frontend' antes."
  );

  log("Limpando bundles antigos...");
  rmrf(TARGET_SRC);
  rmrf(TARGET_FRONTEND);
  rmrf(TARGET_NODE_MODULES);

  log(`Transpilando backend (target Node 12): ${SRC_BACKEND} -> ${TARGET_SRC}`);
  transpileDir(SRC_BACKEND, TARGET_SRC);

  log(`Copiando frontend dist: ${SRC_FRONTEND_DIST} -> ${TARGET_FRONTEND}`);
  copyDir(SRC_FRONTEND_DIST, TARGET_FRONTEND);

  log("Instalando deps prod (express + cors + uuid)...");
  execSync("npm install --omit=dev --no-audit --no-fund", {
    cwd: TARGET_ROOT,
    stdio: "inherit",
  });

  // Sanity check: arquivos chave precisam existir no destino.
  // fetch() é polyfillado com https/http nativos — sem node-fetch.
  const expected = [
    path.join(TARGET_SRC, "app.js"),
    path.join(TARGET_SRC, "data", "paths.js"),
    path.join(TARGET_FRONTEND, "index.html"),
    path.join(TARGET_NODE_MODULES, "express"),
    path.join(TARGET_NODE_MODULES, "cors"),
    path.join(TARGET_NODE_MODULES, "uuid"),
  ];
  for (const p of expected) {
    if (!fs.existsSync(p)) {
      process.stderr.write(`[bundle-backend] sanity check falhou: ${p}\n`);
      process.exit(1);
    }
  }

  log("OK. Bundle pronto em nodejs-assets/nodejs-project/.");
}

main();
