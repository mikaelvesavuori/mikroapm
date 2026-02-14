import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PikoDBStorage } from '../../src/storage/PikoDBStorage.js';
import { createTestDb, cleanupTestDb } from '../helpers/testUtils.js';

describe('PikoDBStorage', () => {
  let storage;

  beforeEach(() => {
    storage = createTestDb('pikodb-storage');
  });

  afterEach(() => {
    cleanupTestDb(storage);
  });

  describe('init', () => {
    it('should initialize database', async () => {
      await storage.init();

      expect(storage.db).toBeDefined();
    });

    it('should only initialize once', async () => {
      await storage.init();
      const firstDb = storage.db;

      await storage.init();
      const secondDb = storage.db;

      expect(firstDb).toBe(secondDb);
    });
  });

  describe('get and put', () => {
    it('should store and retrieve text values', async () => {
      await storage.put('test-key', 'test-value');

      const value = await storage.get('test-key');

      expect(value).toBe('test-value');
    });

    it('should store and retrieve JSON values', async () => {
      const data = { name: 'test', count: 42, active: true };

      await storage.put('json-key', JSON.stringify(data));

      const value = await storage.get('json-key', 'json');

      expect(value).toEqual(data);
    });

    it('should return null for non-existent keys', async () => {
      const value = await storage.get('non-existent-key');

      expect(value).toBeNull();
    });

    it('should handle object values', async () => {
      const data = { foo: 'bar', baz: 123 };

      await storage.put('object-key', data);

      const value = await storage.get('object-key', 'json');

      expect(value).toEqual(data);
    });

    it('should overwrite existing values', async () => {
      await storage.put('key', 'value1');
      await storage.put('key', 'value2');

      const value = await storage.get('key');

      expect(value).toBe('value2');
    });

    it('should handle expiration', async () => {
      await storage.put('expiring-key', 'value', { expirationTtl: 1 });

      const immediate = await storage.get('expiring-key');
      expect(immediate).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const afterExpiration = await storage.get('expiring-key');
      expect(afterExpiration).toBeNull();
    }, 3000);
  });

  describe('delete', () => {
    it('should delete existing keys', async () => {
      await storage.put('delete-me', 'value');

      await storage.delete('delete-me');

      const value = await storage.get('delete-me');
      expect(value).toBeNull();
    });

    it('should not throw on deleting non-existent keys', async () => {
      await expect(storage.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await storage.put('key1', 'value1');
      await storage.put('key2', 'value2');
      await storage.put('prefix:key1', 'value3');
      await storage.put('prefix:key2', 'value4');
      await storage.put('other:key1', 'value5');
    });

    it('should list all keys', async () => {
      const result = await storage.list();

      expect(result.keys).toHaveLength(5);
      expect(result.keys.map(k => k.name)).toContain('key1');
      expect(result.keys.map(k => k.name)).toContain('key2');
    });

    it('should filter by prefix', async () => {
      const result = await storage.list({ prefix: 'prefix:' });

      expect(result.keys).toHaveLength(2);
      expect(result.keys.map(k => k.name)).toContain('prefix:key1');
      expect(result.keys.map(k => k.name)).toContain('prefix:key2');
    });

    it('should limit results', async () => {
      const result = await storage.list({ limit: 2 });

      expect(result.keys).toHaveLength(2);
    });

    it('should combine prefix and limit', async () => {
      const result = await storage.list({ prefix: 'prefix:', limit: 1 });

      expect(result.keys).toHaveLength(1);
      expect(result.keys[0].name).toMatch(/^prefix:/);
    });

    it('should return empty array when no matches', async () => {
      const result = await storage.list({ prefix: 'nonexistent:' });

      expect(result.keys).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      await storage.put('normal-key', 'value');
      await storage.put('expiring-key', 'value', { expirationTtl: 1 });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      await storage.cleanup();

      const normal = await storage.get('normal-key');
      const expired = await storage.get('expiring-key');

      expect(normal).toBe('value');
      expect(expired).toBeNull();
    }, 3000);
  });

  describe('concurrent operations', () => {
    it('should handle concurrent reads and writes', async () => {
      const operations = [];

      for (let i = 0; i < 10; i++) {
        operations.push(storage.put(`key${i}`, `value${i}`));
      }

      await Promise.all(operations);

      const reads = [];
      for (let i = 0; i < 10; i++) {
        reads.push(storage.get(`key${i}`));
      }

      const values = await Promise.all(reads);

      for (let i = 0; i < 10; i++) {
        expect(values[i]).toBe(`value${i}`);
      }
    });
  });

  describe('large values', () => {
    it('should handle large JSON objects', async () => {
      const largeObject = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: `Data for item ${i}`
        }))
      };

      await storage.put('large-object', JSON.stringify(largeObject));

      const retrieved = await storage.get('large-object', 'json');

      expect(retrieved).toEqual(largeObject);
      expect(retrieved.items).toHaveLength(1000);
    });
  });
});
