import { StorageInterface } from "./StorageInterface.js";

/**
 * PikoDB Storage implementation for server environments
 * Uses PikoDB for lightweight file-based persistence
 * @see https://github.com/mikaelvesavuori/pikodb
 */
export class PikoDBStorage extends StorageInterface {
  constructor(dbPath = "./data/mikroapm") {
    super();
    this.dbPath = dbPath;
    this.db = null;
  }

  async init() {
    if (this.db) return;

    const { PikoDB } = await import("pikodb");
    this.db = new PikoDB({ databaseDirectory: this.dbPath });
    await this.db.start();
  }

  async get(key, type = "text") {
    await this.init();
    const result = await this.db.get("records", key);

    if (result === undefined || result === null) return null;

    // PikoDB returns { d: data, v: version, t: timestamp, x: expiration }
    // Extract the actual data from the 'd' field
    const value = typeof result === "object" && result.d !== undefined ? result.d : result;

    if (value === undefined || value === null) return null;

    if (type === "json") {
      try {
        return typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        return null;
      }
    }

    return typeof value === "string" ? value : JSON.stringify(value);
  }

  async put(key, value, options = {}) {
    await this.init();

    const storedValue = typeof value === "string" ? value : JSON.stringify(value);

    const expiration = options.expirationTtl
      ? Date.now() + options.expirationTtl * 1000
      : undefined;

    await this.db.write("records", key, storedValue, expiration);
  }

  async delete(key) {
    await this.init();
    await this.db.delete("records", key);
  }

  async list(options = {}) {
    await this.init();

    const allEntries = await this.db.get("records");

    if (!allEntries || !Array.isArray(allEntries)) return { keys: [] };

    let keys = allEntries
      .map((entry) => {
        const key = Array.isArray(entry) ? entry[0] : entry;
        return { name: key };
      })
      .filter((item) => {
        if (options.prefix && !item.name.startsWith(options.prefix)) return false;
        return true;
      });

    if (options.limit && options.limit > 0) {
      keys = keys.slice(0, options.limit);
    }

    return { keys };
  }

  async cleanup() {
    await this.init();
    await this.db.cleanupAllExpired();
  }
}
