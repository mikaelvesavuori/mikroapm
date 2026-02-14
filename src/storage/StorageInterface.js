/**
 * Storage interface for MikroAPM
 * Implement this interface for different storage backends (KV, PikoDB, etc.)
 */
export class StorageInterface {
  /**
   * Get a value by key
   * @param {string} key
   * @param {string} [type='text'] - 'text' or 'json'
   * @returns {Promise<any>}
   */
  async get(_key, _type = "text") {
    throw new Error("Not implemented");
  }

  /**
   * Store a value
   * @param {string} key
   * @param {string} value
   * @param {Object} [options]
   * @param {number} [options.expirationTtl] - TTL in seconds
   * @returns {Promise<void>}
   */
  async put(_key, _value, _options = {}) {
    throw new Error("Not implemented");
  }

  /**
   * Delete a key
   * @param {string} key
   * @returns {Promise<void>}
   */
  async delete(_key) {
    throw new Error("Not implemented");
  }

  /**
   * List keys with optional prefix
   * @param {Object} [options]
   * @param {string} [options.prefix]
   * @param {number} [options.limit]
   * @returns {Promise<{keys: Array<{name: string}>}>}
   */
  async list(_options = {}) {
    throw new Error("Not implemented");
  }
}
