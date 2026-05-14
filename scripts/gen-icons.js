#!/usr/bin/env node
// Gera todos os artefatos de ícone do InnKeeper a partir de innkeeper.png
// Uso: node scripts/gen-icons.js  (a partir da raiz do repo)

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const ROOT   = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(ROOT, "innkeeper.png");
const WEB    = resolve(ROOT, "frontend", "public");
const ANDROID_RES = resolve(ROOT, "mobile", "android", "app", "src", "main", "res");

// Web favicon sizes (todos vão para um único .ico)
const FAVICON_SIZES = [16, 32, 48, 64, 128, 256];

// Android mipmap densities
const MIPMAP = [
  { folder: "mipmap-mdpi",    launcher: 48,  foreground: 108 },
  { folder: "mipmap-hdpi",    launcher: 72,  foreground: 162 },
  { folder: "mipmap-xhdpi",   launcher: 96,  foreground: 216 },
  { folder: "mipmap-xxhdpi",  launcher: 144, foreground: 324 },
  { folder: "mipmap-xxxhdpi", launcher: 192, foreground: 432 },
];

async function resizePng(src, size) {
  return sharp(src).resize(size, size).png().toBuffer();
}

async function main() {
  console.log("InnKeeper Icon Generator");
  console.log(`Source: ${SOURCE}`);
  console.log("");

  // ── Web ──────────────────────────────────────────────────────────────────

  // icon.png 512×512
  const icon512 = await resizePng(SOURCE, 512);
  writeFileSync(resolve(WEB, "icon.png"), icon512);
  console.log("✓ frontend/public/icon.png  (512×512)");

  // favicon.ico (multi-size)
  const faviconPngs = await Promise.all(FAVICON_SIZES.map((s) => resizePng(SOURCE, s)));
  const icoBuffer   = await toIco(faviconPngs);
  writeFileSync(resolve(WEB, "favicon.ico"), icoBuffer);
  console.log(`✓ frontend/public/favicon.ico  (${FAVICON_SIZES.join(", ")} px)`);

  // ── Android ──────────────────────────────────────────────────────────────

  for (const { folder, launcher, foreground } of MIPMAP) {
    const dir = resolve(ANDROID_RES, folder);
    mkdirSync(dir, { recursive: true });

    const launcherBuf = await resizePng(SOURCE, launcher);
    writeFileSync(resolve(dir, "ic_launcher.png"),         launcherBuf);
    writeFileSync(resolve(dir, "ic_launcher_round.png"),   launcherBuf);

    const fgBuf = await resizePng(SOURCE, foreground);
    writeFileSync(resolve(dir, "ic_launcher_foreground.png"), fgBuf);

    console.log(`✓ ${folder}/  (launcher ${launcher}px, foreground ${foreground}px)`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
