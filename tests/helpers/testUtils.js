import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { PikoDBStorage } from '../../src/storage/PikoDBStorage.js';

/**
 * Create a temporary test database
 */
export function createTestDb(name = 'test') {
  const dbPath = `./tests/tmp/${name}-${Date.now()}`;

  if (existsSync(dbPath)) {
    rmSync(dbPath, { recursive: true, force: true });
  }

  mkdirSync(dbPath, { recursive: true });

  return new PikoDBStorage(dbPath);
}

/**
 * Clean up a test database
 */
export function cleanupTestDb(storage) {
  if (storage && storage.dbPath && existsSync(storage.dbPath)) {
    rmSync(storage.dbPath, { recursive: true, force: true });
  }
}

/**
 * Clean up all test databases
 */
export function cleanupAllTestDbs() {
  const tmpDir = './tests/tmp';
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
