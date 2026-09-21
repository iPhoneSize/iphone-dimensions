import { copyFile, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './csv.mjs';
import { validateCsvRows, validateDataset } from './schema.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data');
const jsonPath = join(dataDir, 'iphones.json');
const csvPath = join(dataDir, 'iphones.csv');
const jsonTemp = join(dataDir, 'iphones.json.tmp');
const csvTemp = join(dataDir, 'iphones.csv.tmp');
const jsonBak = join(dataDir, 'iphones.json.bak');
const csvBak = join(dataDir, 'iphones.csv.bak');

const jsonUrl = 'https://iphonesize.com/data/iphones.json';
const csvUrl = 'https://iphonesize.com/data/iphones.csv';
const maxBytes = 5 * 1024 * 1024;

const phoneFields = [
  'id',
  'product_id',
  'state',
  'name',
  'also_known_as',
  'family',
  'announced',
  'released',
  'height_mm',
  'width_mm',
  'depth_mm',
  'weight_g',
  'height_in',
  'width_in',
  'depth_in',
  'weight_oz',
  'display_in',
  'resolution_px',
  'ppi',
  'url',
  'source_url',
  'dates_source_url',
];

const metaFields = [
  'schema_version',
  'name',
  'description',
  'license',
  'homepage',
  'source',
  'verified',
  'notes',
  'units',
  'count',
];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sameValue(left, right) {
  if (left === right) {
    return true;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }
    for (let i = 0; i < left.length; i += 1) {
      if (left[i] !== right[i]) {
        return false;
      }
    }
    return true;
  }
  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }
    for (const key of leftKeys) {
      if (left[key] !== right[key]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

async function download(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
  const finalUrl = new URL(response.url);
  if (finalUrl.hostname !== 'iphonesize.com') {
    await response.body.cancel();
    throw new Error(`Refusing final URL host ${finalUrl.hostname}`);
  }
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const declared = response.headers.get('content-length');
  if (declared !== null && Number(declared) > maxBytes) {
    await response.body.cancel();
    throw new Error(`Response exceeds 5 MB cap (${declared} bytes)`);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) {
      break;
    }
    received += next.value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new Error('Response exceeds 5 MB cap');
    }
    chunks.push(next.value);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function phoneMap(data) {
  const map = new Map();
  const phones = data && Array.isArray(data.phones) ? data.phones : [];
  for (const phone of phones) {
    if (phone && typeof phone.id === 'string') {
      map.set(phone.id, phone);
    }
  }
  return map;
}

function changedFields(before, after) {
  const fields = [];
  const seen = new Set();
  for (const field of phoneFields) {
    seen.add(field);
    if (!sameValue(before[field], after[field])) {
      fields.push(field);
    }
  }
  const keys = Object.keys(before).concat(Object.keys(after));
  for (const key of keys) {
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    if (!sameValue(before[key], after[key])) {
      fields.push(key);
    }
  }
  return fields;
}

function formatList(items) {
  if (items.length === 0) {
    return '(none)';
  }
  return items.join(', ');
}

function printSummary(oldData, newData) {
  const oldPhones = phoneMap(oldData);
  const newPhones = phoneMap(newData);
  const added = [];
  const removed = [];
  const changed = [];

  for (const phone of newData.phones) {
    if (!oldPhones.has(phone.id)) {
      added.push(phone.id);
    }
  }
  const oldList = oldData && Array.isArray(oldData.phones) ? oldData.phones : [];
  for (const phone of oldList) {
    if (phone && typeof phone.id === 'string' && !newPhones.has(phone.id)) {
      removed.push(phone.id);
    }
  }
  for (const phone of newData.phones) {
    const previous = oldPhones.get(phone.id);
    if (previous === undefined) {
      continue;
    }
    const fields = changedFields(previous, phone);
    if (fields.length > 0) {
      changed.push({ id: phone.id, fields });
    }
  }

  const metadata = [];
  for (const field of metaFields) {
    const before = oldData ? oldData[field] : undefined;
    if (!sameValue(before, newData[field])) {
      metadata.push(field);
    }
  }

  const oldCount = oldList.length;
  console.log(`old count: ${oldCount}`);
  console.log(`new count: ${newData.phones.length}`);
  console.log(`added: ${formatList(added)}`);
  console.log(`removed: ${formatList(removed)}`);
  if (changed.length === 0) {
    console.log('changed: (none)');
  } else {
    console.log('changed:');
    for (const item of changed) {
      console.log(`${item.id}: ${item.fields.join(', ')}`);
    }
  }
  console.log(`metadata: ${formatList(metadata)}`);
}

async function removeIfExists(path) {
  try {
    await unlink(path);
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function replacePair(jsonText, csvText) {
  let backedUp = false;
  let committed = false;
  let restored = false;
  try {
    await writeFile(jsonTemp, jsonText);
    await writeFile(csvTemp, csvText);
    await copyFile(jsonPath, jsonBak);
    await copyFile(csvPath, csvBak);
    backedUp = true;
    await rename(jsonTemp, jsonPath);
    await rename(csvTemp, csvPath);
    committed = true;
  } catch (error) {
    if (backedUp && !committed) {
      await copyFile(jsonBak, jsonPath);
      await copyFile(csvBak, csvPath);
      restored = true;
    }
    throw error;
  } finally {
    await removeIfExists(jsonTemp);
    await removeIfExists(csvTemp);
    if (committed || restored) {
      await removeIfExists(jsonBak);
      await removeIfExists(csvBak);
    }
  }
}

try {
  const oldText = await readFile(jsonPath, 'utf8');
  const oldData = JSON.parse(oldText);
  const [jsonText, csvText] = await Promise.all([download(jsonUrl), download(csvUrl)]);
  const data = JSON.parse(jsonText);
  validateDataset(data);
  validateCsvRows(parseCsv(csvText), data.phones);
  await replacePair(jsonText, csvText);
  printSummary(oldData, data);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
