import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jsonPath = join(root, 'data', 'iphones.json');
const csvPath = join(root, 'data', 'iphones.csv');

const jsonUrl = 'https://iphonesize.com/data/iphones.json';
const csvUrl = 'https://iphonesize.com/data/iphones.csv';

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

try {
  const oldText = await readFile(jsonPath, 'utf8');
  const oldData = JSON.parse(oldText);
  const oldCount = oldData.phones.length;

  const [jsonText, csvText] = await Promise.all([
    download(jsonUrl),
    download(csvUrl),
  ]);

  const data = JSON.parse(jsonText);
  if (data.schema_version !== 1) {
    throw new Error(`Unexpected schema_version: ${data.schema_version}`);
  }
  if (!Array.isArray(data.phones) || data.phones.length === 0) {
    throw new Error('phones must be a non-empty array');
  }

  await writeFile(jsonPath, jsonText);
  await writeFile(csvPath, csvText);

  console.log(`old count: ${oldCount}`);
  console.log(`new count: ${data.phones.length}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
