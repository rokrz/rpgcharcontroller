const fs = require("fs");
const fsp = require("fs").promises;
const { DB_PATH, DATA_DIR } = require("./paths");

fs.mkdirSync(DATA_DIR, { recursive: true });

const defaultData = { sheets: [] };

const db = {
  data: null,
  async read() {
    try {
      const text = await fsp.readFile(DB_PATH, "utf8");
      this.data = JSON.parse(text);
    } catch (err) {
      if (err.code === "ENOENT") this.data = null;
      else throw err;
    }
  },
  async write() {
    const tmp = `${DB_PATH}.${process.pid}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(this.data, null, 2), "utf8");
    await fsp.rename(tmp, DB_PATH);
  },
};

async function initDB() {
  await db.read();
  if (!db.data) db.data = { ...defaultData };
  if (!db.data.sheets) db.data.sheets = [];
  await db.write();
}

module.exports = { db, initDB };
