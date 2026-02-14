#!/usr/bin/env node

/**
 * Cleanup script for PikoDB storage
 * Removes expired records
 */

import { PikoDBStorage } from '../src/storage/PikoDBStorage.js';

const dbPath = process.argv[2] || './data/mikroapm';

async function cleanup() {
  console.log(`Cleaning up expired records in ${dbPath}...`);

  const storage = new PikoDBStorage(dbPath);
  await storage.init();
  await storage.cleanup();

  console.log('Cleanup complete!');
}

cleanup().catch(console.error);
