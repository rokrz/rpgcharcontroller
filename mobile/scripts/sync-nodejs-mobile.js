#!/usr/bin/env node
// Shim que substitui o "cordova prepare" pra o nodejs-mobile-cordova num
// projeto Capacitor.
//
// CONTEXTO: o plugin nodejs-mobile-cordova (0.4.3) e desenhado pra Cordova
// classico, onde "cordova prepare" copia os arquivos nativos do plugin
// (CMakeLists, .cpp, libnode.so.gz, NodeJS.java, assets) pra dentro do
// projeto Android (platforms/android/app/libs/cdvnodejsmobile/, etc).
//
// Capacitor 6 nao roda esses hooks. Auto-link do Capacitor copia so a parte
// JS (www/nodejs_apis.js → app/src/main/assets/public/plugins/...) e adiciona
// o `apply from:` do build.gradle do plugin. Mas o plugin's build.gradle
// referencia `libs/cdvnodejsmobile/CMakeLists.txt` e libnode.so via cmake +
// flatDir -- precisamos dos arquivos no lugar fisicamente.
//
// Esse script faz exatamente o que o "before-plugin-install.js" + as
// declaracoes <source-file> do plugin.xml fariam num projeto Cordova:
//
// 1. Copia CMakeLists.txt + native-lib.cpp + cordova-bridge.{h,cpp}
//    pra app/libs/cdvnodejsmobile/.
// 2. Copia libs/android/libnode/{bin,include} pra app/libs/cdvnodejsmobile/libnode/.
// 3. Gunzipa libnode.so.gz → libnode.so por ABI (armeabi-v7a, arm64-v8a, x86, x86_64).
// 4. Copia src/android/java/com/.../NodeJS.java pra app/src/main/java/.
// 5. Copia install/nodejs-mobile-cordova-assets/* pra app/src/main/assets/.
//
// Idempotente: re-rodar limpa e recopia. Roda dentro do build:mobile pipeline,
// depois de cap:sync e antes de gradle:debug.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const MOBILE_ROOT = path.resolve(__dirname, "..");
const PLUGIN_DIR = path.join(MOBILE_ROOT, "node_modules", "nodejs-mobile-cordova");
const APP_DIR = path.join(MOBILE_ROOT, "android", "app");
const APP_JAVA_DIR = path.join(APP_DIR, "src", "main", "java");
const APP_ASSETS_DIR = path.join(APP_DIR, "src", "main", "assets");
// Capacitor "apply from:" injeta o build.gradle do plugin em DOIS modulos
// (:app e :capacitor-cordova-android-plugins). Os dois precisam:
//   - libs/cdvnodejsmobile/ (CMakeLists.txt + .cpp + libnode/) pro
//     externalNativeBuild compilar
//   - src/main/assets/www/ stub pra checke de projectWWW passar
// Repetir os arquivos custa duplicar a compilacao C++ (~30s extra) mas e a
// forma mais simples de fazer o auto-link do Capacitor 6 funcionar com esse
// plugin Cordova.
const CDV_PLUGINS_DIR = path.join(MOBILE_ROOT, "android", "capacitor-cordova-android-plugins");
const CDV_PLUGINS_ASSETS_DIR = path.join(CDV_PLUGINS_DIR, "src", "main", "assets");
const TARGET_LIB_DIRS = [
  path.join(APP_DIR, "libs", "cdvnodejsmobile"),
  path.join(CDV_PLUGINS_DIR, "libs", "cdvnodejsmobile"),
];

const ABIS = ["armeabi-v7a", "arm64-v8a", "x86", "x86_64"];

function log(msg) {
  process.stdout.write(`[sync-nodejs-mobile] ${msg}\n`);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dst) {
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

function copyDir(src, dst) {
  ensureDir(dst);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else if (entry.isFile()) fs.copyFileSync(s, d);
  }
}

function gunzipFile(srcGz, dst) {
  const data = fs.readFileSync(srcGz);
  const out = zlib.gunzipSync(data);
  ensureDir(path.dirname(dst));
  fs.writeFileSync(dst, out);
}

function ensureExists(p, hint) {
  if (!fs.existsSync(p)) {
    process.stderr.write(`[sync-nodejs-mobile] FALTA: ${p}\n  ${hint}\n`);
    process.exit(1);
  }
}

function main() {
  ensureExists(PLUGIN_DIR, "Rode `npm install` em mobile/ antes.");
  ensureExists(APP_DIR, "Rode `npm run cap:add` em mobile/ antes.");

  // 1+2+3: copia CMakeLists/.cpp/.h + libnode include/bin pros DOIS modulos.
  for (const libDir of TARGET_LIB_DIRS) {
    log(`Sincronizando ${path.relative(MOBILE_ROOT, libDir)} ...`);
    if (fs.existsSync(libDir)) fs.rmSync(libDir, { recursive: true, force: true });
    ensureDir(libDir);

    copyFile(
      path.join(PLUGIN_DIR, "src", "android", "CMakeLists.txt"),
      path.join(libDir, "CMakeLists.txt")
    );
    copyFile(
      path.join(PLUGIN_DIR, "src", "android", "jni", "native-lib.cpp"),
      path.join(libDir, "native-lib.cpp")
    );
    copyFile(
      path.join(PLUGIN_DIR, "src", "common", "cordova-bridge", "cordova-bridge.h"),
      path.join(libDir, "cordova-bridge.h")
    );
    copyFile(
      path.join(PLUGIN_DIR, "src", "common", "cordova-bridge", "cordova-bridge.cpp"),
      path.join(libDir, "cordova-bridge.cpp")
    );
    copyDir(
      path.join(PLUGIN_DIR, "libs", "android", "libnode", "include"),
      path.join(libDir, "libnode", "include")
    );
    for (const abi of ABIS) {
      const srcGz = path.join(
        PLUGIN_DIR,
        "libs",
        "android",
        "libnode",
        "bin",
        abi,
        "libnode.so.gz"
      );
      if (!fs.existsSync(srcGz)) {
        process.stderr.write(`  pulei ${abi}: ${srcGz} nao existe\n`);
        continue;
      }
      gunzipFile(srcGz, path.join(libDir, "libnode", "bin", abi, "libnode.so"));
    }
  }

  // 4. NodeJS.java vai no modulo capacitor-cordova-android-plugins, NAO em
  // :app. Razao: NodeJS.java extends org.apache.cordova.CordovaPlugin, e a
  // dependencia "org.apache.cordova:framework" e "implementation" (nao "api")
  // no plugins module, entao nao e transitiva pra :app. Mantendo no proprio
  // plugins module o classpath fica certo.
  log("Copiando NodeJS.java pro modulo capacitor-cordova-android-plugins...");
  const javaSrc = path.join(
    PLUGIN_DIR,
    "src",
    "android",
    "java",
    "com",
    "janeasystems",
    "cdvnodejsmobile",
    "NodeJS.java"
  );
  const javaDst = path.join(
    CDV_PLUGINS_DIR,
    "src",
    "main",
    "java",
    "com",
    "janeasystems",
    "cdvnodejsmobile",
    "NodeJS.java"
  );
  copyFile(javaSrc, javaDst);
  // Limpar copia errada do app/src/main/java se sobrou de uma rodada anterior.
  const staleAppJava = path.join(APP_JAVA_DIR, "com", "janeasystems");
  if (fs.existsSync(staleAppJava)) {
    fs.rmSync(staleAppJava, { recursive: true, force: true });
  }

  // 5. Copia o nodejs-project real pra assets/www/nodejs-project/ no :app.
  //
  // Em Cordova classico isso era feito por um hook before_plugin_install.js
  // que pegava nodejs-assets/nodejs-project/ e copiava pra
  // platforms/android/app/src/main/assets/www/nodejs-project/. Capacitor 6
  // NAO executa hooks Cordova, entao replicamos manualmente.
  //
  // NodeJS.java em runtime (PROJECT_ROOT = "www/nodejs-project") faz
  // copyAssetFolder pra unpack no filesDir do app. Sem o conteudo real aqui,
  // o startup falha com FileNotFoundException: www/nodejs-project.
  //
  // Pre-requisito: bundle-backend.js ja rodou e populou nodejs-assets/.
  const NODEJS_PROJECT_SRC = path.join(MOBILE_ROOT, "nodejs-assets", "nodejs-project");
  ensureExists(
    path.join(NODEJS_PROJECT_SRC, "main.js"),
    "Rode `npm run bundle` em mobile/ antes (bundle-backend.js popula nodejs-assets/)."
  );

  const appProjectDst = path.join(APP_ASSETS_DIR, "www", "nodejs-project");
  log(`Copiando nodejs-project (${path.relative(MOBILE_ROOT, NODEJS_PROJECT_SRC)} -> assets/www/nodejs-project)...`);
  if (fs.existsSync(appProjectDst)) fs.rmSync(appProjectDst, { recursive: true, force: true });
  copyDir(NODEJS_PROJECT_SRC, appProjectDst);

  // No modulo capacitor-cordova-android-plugins basta um stub: o build.gradle
  // do plugin verifica file().exists() em assets/www/ e shouldRebuildNativeModules
  // (que e "0" porque nao temos arquivos .gyp). Stub satisfaz sem inflar duas
  // copias do projeto no APK.
  log("Stub em capacitor-cordova-android-plugins/.../assets/www/...");
  const cdvStubProject = path.join(CDV_PLUGINS_ASSETS_DIR, "www", "nodejs-project");
  ensureDir(cdvStubProject);
  fs.writeFileSync(
    path.join(CDV_PLUGINS_ASSETS_DIR, "www", "STUB_README.txt"),
    "Stub para satisfazer checks no build.gradle do plugin nodejs-mobile-cordova.\n" +
      "O nodejs-project real vive em :app/src/main/assets/www/nodejs-project/.\n"
  );

  // 6. Assets builtin_modules. Replica o que o `<source-file ... target-dir="assets/"/>`
  // do plugin.xml fazia em Cordova: copia o DIR inteiro `nodejs-mobile-cordova-assets/`
  // pra dentro de assets/, PRESERVANDO o nome do dir pai. NodeJS.java procura em
  // `assets/nodejs-mobile-cordova-assets/builtin_modules/...` (constantes
  // BUILTIN_ASSETS / BUILTIN_MODULES no plugin nativo).
  log("Copiando nodejs-mobile-cordova-assets/ pra assets/...");
  const assetSrc = path.join(PLUGIN_DIR, "install", "nodejs-mobile-cordova-assets");
  const assetDst = path.join(APP_ASSETS_DIR, "nodejs-mobile-cordova-assets");
  if (fs.existsSync(assetSrc)) {
    if (fs.existsSync(assetDst)) fs.rmSync(assetDst, { recursive: true, force: true });
    copyDir(assetSrc, assetDst);
  }
  // Limpar resíduo de versões anteriores do script que copiavam direto pra
  // assets/builtin_modules/ (sem o dir pai). Sem isso fica lixo no APK.
  const staleBuiltin = path.join(APP_ASSETS_DIR, "builtin_modules");
  if (fs.existsSync(staleBuiltin)) {
    log("Removendo resíduo legado: assets/builtin_modules/");
    fs.rmSync(staleBuiltin, { recursive: true, force: true });
  }

  log("OK. nodejs-mobile-cordova nativo sincronizado.");
}

main();
