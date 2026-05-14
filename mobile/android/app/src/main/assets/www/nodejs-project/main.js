// Entry do Node embarcado no APK (executado pelo nodejs-mobile-cordova).
//
// Fluxo:
// 1. WebView (boot page em www/index.html) chama `nodejs.start("main.js")`.
// 2. Plugin sobe esta runtime Node em thread separada do APK.
// 3. WebView envia o caminho do diretorio gravavel privado via canal:
//      cordova.channel.post("data-dir", "/data/data/com.rpgcharcontroller.app/files/RPGCharController")
// 4. Recebemos esse path aqui, setamos `process.env.RPG_DATA_DIR` ANTES de
//    requerer o backend (paths.js le essa env no module load).
// 5. Iniciamos o Express com `port: 0` (SO escolhe porta livre) e
//    `frontendDist` apontando pra cópia do dist React embarcada (set pelo
//    bundle-backend.js).
// 6. Quando o Express chama listen callback, postamos a porta de volta pro
//    WebView via `cordova.channel.post("server-ready", { port })`.
// 7. Boot page faz `window.location.href = "http://127.0.0.1:" + port`.

const path = require("path");
const cordova = require("cordova-bridge");

// Polyfill de crypto.randomUUID -- nodejs-mobile-cordova 0.4.3 empacota Node 12,
// que NAO tem randomUUID (chegou no 14.17).
// Implementacao RFC 4122 v4 baseada em randomBytes.
const cryptoLib = require("crypto");
if (typeof cryptoLib.randomUUID !== "function") {
  cryptoLib.randomUUID = function () {
    const b = cryptoLib.randomBytes(16);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = b.toString("hex");
    return (
      h.slice(0, 8) +
      "-" +
      h.slice(8, 12) +
      "-" +
      h.slice(12, 16) +
      "-" +
      h.slice(16, 20) +
      "-" +
      h.slice(20)
    );
  };
}

// Caminho da copia do frontend dist embarcada (bundle-backend.js coloca aqui).
const FRONTEND_DIST = path.join(__dirname, "frontend-dist");

let serverHandle = null;

cordova.channel.on("data-dir", async (dataDir) => {
  if (serverHandle) {
    cordova.channel.post("log", "Servidor ja rodando, ignorando data-dir");
    return;
  }

  try {
    process.env.RPG_DATA_DIR = dataDir;
    cordova.channel.post("log", `RPG_DATA_DIR = ${dataDir}`);

    // Require do backend SO depois de setar a env -- paths.js le no top-level.
    const { start } = require("./src/app.js");

    const { port, server } = await start({
      port: 0,
      frontendDist: FRONTEND_DIST,
    });
    serverHandle = server;

    cordova.channel.post("server-ready", { port });
    cordova.channel.post("log", `Express ouvindo em 127.0.0.1:${port}`);
  } catch (err) {
    cordova.channel.post("server-error", {
      message: err.message,
      stack: err.stack,
    });
  }
});

// Sinal de heartbeat pro WebView confirmar que o Node subiu.
cordova.channel.post("node-ready");
