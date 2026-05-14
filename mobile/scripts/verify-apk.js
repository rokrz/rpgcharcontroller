#!/usr/bin/env node
// Post-build sanity check: garante que o APK produzido contem
// lib/arm64-v8a/libnode.so. Sem esse arquivo, phones reais (quase
// universalmente arm64-v8a) bootam direto pra splash de erro porque
// dlopen do libnode.so falha dentro do NodeJS.java sem log util no WebView.
//
// Implementa um leitor minimo de ZIP central directory (sem dependencias).
// APKs sao ZIPs validos; o central directory fica no fim do arquivo.

const fs = require("fs");
const path = require("path");

const REQUIRED_ENTRY = "lib/arm64-v8a/libnode.so";

function findEocd(buf) {
  // End-of-central-directory signature: 0x06054b50 = "PK\x05\x06".
  // EOCD fica entre 22 bytes (sem comentario) e 22+65535 bytes do fim.
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  return -1;
}

function listZipEntries(apkPath) {
  const fd = fs.openSync(apkPath, "r");
  try {
    const stats = fs.fstatSync(fd);
    const tailSize = Math.min(stats.size, 22 + 65535);
    const tail = Buffer.alloc(tailSize);
    fs.readSync(fd, tail, 0, tailSize, stats.size - tailSize);

    const eocdRel = findEocd(tail);
    if (eocdRel < 0) {
      throw new Error("EOCD nao encontrado: arquivo nao parece ZIP/APK valido");
    }

    const cdSize = tail.readUInt32LE(eocdRel + 12);
    const cdOffset = tail.readUInt32LE(eocdRel + 16);
    if (cdOffset === 0xffffffff || cdSize === 0xffffffff) {
      throw new Error("APK em formato ZIP64 nao suportado por este verificador");
    }

    const cd = Buffer.alloc(cdSize);
    fs.readSync(fd, cd, 0, cdSize, cdOffset);

    const entries = [];
    let p = 0;
    while (p < cd.length) {
      if (cd.readUInt32LE(p) !== 0x02014b50) break;
      const nameLen = cd.readUInt16LE(p + 28);
      const extraLen = cd.readUInt16LE(p + 30);
      const commentLen = cd.readUInt16LE(p + 32);
      const name = cd.slice(p + 46, p + 46 + nameLen).toString("utf8");
      entries.push(name);
      p += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  } finally {
    fs.closeSync(fd);
  }
}

function findApk(variant) {
  const dir = path.resolve(
    __dirname,
    "..",
    "android",
    "app",
    "build",
    "outputs",
    "apk",
    variant
  );
  if (!fs.existsSync(dir)) {
    throw new Error(
      `Pasta de output nao existe: ${dir}\nRode 'npm run gradle:${variant}' antes.`
    );
  }
  const apks = fs.readdirSync(dir).filter((f) => f.endsWith(".apk"));
  if (apks.length === 0) {
    throw new Error(`Nenhum APK encontrado em ${dir}`);
  }
  // Em geral so tem um APK por variant; se houver multiplos, usa o primeiro
  // por ordem alfabetica (estavel pra logs).
  apks.sort();
  return path.join(dir, apks[0]);
}

function main() {
  const variant = (process.argv[2] || "debug").toLowerCase();
  if (variant !== "debug" && variant !== "release") {
    process.stderr.write(
      `[verify-apk] variant invalida: ${variant} (use debug|release)\n`
    );
    process.exit(2);
  }

  const apk = findApk(variant);
  process.stdout.write(`[verify-apk] inspecionando ${apk}\n`);
  const entries = listZipEntries(apk);

  const abis = entries
    .filter((e) => e.startsWith("lib/") && e.endsWith("/libnode.so"))
    .map((e) => e.split("/")[1]);
  process.stdout.write(
    `[verify-apk] ABIs com libnode.so: ${abis.length ? abis.join(", ") : "(nenhum)"}\n`
  );

  if (!entries.includes(REQUIRED_ENTRY)) {
    process.stderr.write(
      `[verify-apk] FALHA: ${REQUIRED_ENTRY} nao esta no APK.\n` +
        `  Phones reais sao quase sempre arm64-v8a. Sem esse libnode.so, o APK\n` +
        `  boota pra splash de erro porque o dlopen falha dentro do NodeJS.java.\n` +
        `  Investigue:\n` +
        `   1. mobile/scripts/sync-nodejs-mobile.js esta sobrescrevendo a pasta jniLibs?\n` +
        `   2. node_modules/nodejs-mobile-cordova/install/binaries/<abi>/libnode.so.gz existe?\n` +
        `   3. mobile/android/app/build.gradle tem 'abiFilters' restringindo ABIs?\n`
    );
    process.exit(1);
  }

  process.stdout.write(`[verify-apk] OK: ${REQUIRED_ENTRY} presente.\n`);
}

main();
