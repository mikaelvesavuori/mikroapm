import { StorageInterface } from "./StorageInterface.js";

/**
 * Cloudflare KV Storage implementation
 * Wraps the KV namespace binding for Cloudflare Workers
 */
export class KVStorage extends StorageInterface {
  constructor(kvNamespace) {
    super();
    this.kv = kvNamespace;
  }

  async get(key, type = "text") {
    return this.kv.get(key, type);
  }

  async put(key, value, options = {}) {
    return this.kv.put(key, value, options);
  }

  async delete(key) {
    return this.kv.delete(key);
  }

  async list(options = {}) {
    return this.kv.list(options);
  }
}
