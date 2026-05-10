const path = require("path");
const os = require("os");

const DEFAULT_DATA_DIR =
  process.env.RPG_DATA_DIR ||
  (process.env.APPDATA
    ? path.join(process.env.APPDATA, "RPGCharController")
    : path.join(os.homedir(), ".rpg-char-controller"));

module.exports = {
  DATA_DIR: DEFAULT_DATA_DIR,
  DB_PATH: path.join(DEFAULT_DATA_DIR, "db.json"),
  PF2E_DATA_DIR: path.join(__dirname, "..", "..", "data", "pf2e"),
};
