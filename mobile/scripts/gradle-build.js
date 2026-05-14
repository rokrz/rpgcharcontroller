#!/usr/bin/env node
// Launcher cross-platform pra `gradlew assembleX`. O script anterior usava
// `./gradlew` direto no npm script, que so roda em sh -- no cmd do Windows
// quebra com "'.' nao e reconhecido como um comando interno". Aqui detectamos
// o SO e chamamos gradlew.bat ou ./gradlew com o cwd certo.
//
// Tambem detecta Java incompativel: o wrapper esta pinado em Gradle 8.2.1, que
// suporta no maximo Java 19. Se o JAVA do sistema for mais novo (>= 20), tenta
// localizar um JDK 17/21 instalado e usa ele via JAVA_HOME no subprocess.

const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

const variant = (process.argv[2] || "debug").toLowerCase();
if (variant !== "debug" && variant !== "release") {
  process.stderr.write(`[gradle-build] variant invalida: ${variant} (use debug|release)\n`);
  process.exit(2);
}
const task = `assemble${variant.charAt(0).toUpperCase()}${variant.slice(1)}`;

const isWin = process.platform === "win32";
const androidDir = path.resolve(__dirname, "..", "android");
const wrapper = path.join(androidDir, isWin ? "gradlew.bat" : "gradlew");

const MAX_SUPPORTED_JAVA = 19; // Gradle 8.2.1
const COMPATIBLE_MAJORS = [17, 21, 19, 11];

function readJavaMajor(javaCmd) {
  const r = spawnSync(javaCmd, ["-version"], { encoding: "utf8" });
  const out = (r.stderr || "") + (r.stdout || "");
  const m = out.match(/version "(\d+)/);
  return m ? Number(m[1]) : null;
}

function findCompatibleJdk() {
  if (!isWin) return null;
  const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
  const roots = [
    path.join(programFiles, "Eclipse Adoptium"),
    path.join(programFiles, "Java"),
    path.join(programFiles, "Microsoft", "jdk"),
  ];
  const found = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root)) {
      const m = entry.match(/jdk-?(\d+)/i);
      if (m && COMPATIBLE_MAJORS.includes(Number(m[1]))) {
        found.push({ major: Number(m[1]), path: path.join(root, entry) });
      }
    }
  }
  for (const major of COMPATIBLE_MAJORS) {
    const hit = found.find((f) => f.major === major);
    if (!hit) continue;
    const javaExe = path.join(hit.path, "bin", "java.exe");
    if (readJavaMajor(javaExe) === major) return hit.path;
  }
  return null;
}

const env = { ...process.env };
if (!env.JAVA_HOME) {
  const sysJava = readJavaMajor("java");
  if (sysJava !== null && sysJava > MAX_SUPPORTED_JAVA) {
    const jdk = findCompatibleJdk();
    if (!jdk) {
      process.stderr.write(
        `[gradle-build] Java ${sysJava} detectado no PATH, mas Gradle 8.2.1 (pinado em gradle-wrapper.properties) suporta no maximo Java ${MAX_SUPPORTED_JAVA}.\n` +
        `Instale um JDK 17 ou 21 (ex: Eclipse Adoptium) ou setea variavel JAVA_HOME pra um JDK compativel antes de rodar.\n`
      );
      process.exit(3);
    }
    process.stdout.write(`[gradle-build] Java ${sysJava} incompativel com Gradle 8.2.1. Usando JDK em: ${jdk}\n`);
    env.JAVA_HOME = jdk;
    env.PATH = path.join(jdk, "bin") + path.delimiter + (env.PATH || "");
  }
}

// Deleta APKs existentes desta variant antes do gradle pra forcar regeneracao.
// Sem isso, o incremental build do Gradle pode marcar a task como UP-TO-DATE
// (hash de inputs identico ao build anterior, ja que bundle/sync sao
// deterministicos) e pular o packaging — deixando o APK com mtime antigo e
// gerando confusao "rodei o build, por que o APK nao atualizou?". Custo: ~0s.
const apkOutputDir = path.join(androidDir, "app", "build", "outputs", "apk", variant);
if (fs.existsSync(apkOutputDir)) {
  for (const entry of fs.readdirSync(apkOutputDir)) {
    if (entry.endsWith(".apk")) {
      const apkPath = path.join(apkOutputDir, entry);
      fs.unlinkSync(apkPath);
      process.stdout.write(`[gradle-build] Removendo APK existente: ${entry}\n`);
    }
  }
}

const result = spawnSync(wrapper, [task], {
  cwd: androidDir,
  stdio: "inherit",
  shell: isWin,
  env,
});

if (result.error) {
  process.stderr.write(`[gradle-build] falhou: ${result.error.message}\n`);
  process.exit(1);
}
process.exit(result.status ?? 1);
