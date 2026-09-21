import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { compare, findPhones, getPhone, meta, phones } from '../index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('count matches meta.count', () => {
  assert.equal(phones.length, meta.count);
});

test('every id is unique', () => {
  const ids = phones.map((phone) => phone.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every entry has positive height, width, depth, and weight', () => {
  for (const phone of phones) {
    assert.ok(phone.height_mm > 0, phone.id);
    assert.ok(phone.width_mm > 0, phone.id);
    assert.ok(phone.depth_mm > 0, phone.id);
    assert.ok(phone.weight_g > 0, phone.id);
  }
});

test('every source_url hostname is www.apple.com or support.apple.com', () => {
  for (const phone of phones) {
    const hostname = new URL(phone.source_url).hostname;
    assert.ok(
      hostname === 'www.apple.com' || hostname === 'support.apple.com',
      `${phone.id}: ${hostname}`,
    );
  }
});

test('JSON and CSV have the same ids in the same order', () => {
  const csv = readFileSync(join(root, 'data', 'iphones.csv'), 'utf8');
  const lines = csv.split('\n');
  const csvIds = [];
  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i];
    if (line.endsWith('\r')) {
      line = line.slice(0, -1);
    }
    if (line.length === 0) {
      continue;
    }
    if (i === 0) {
      continue;
    }
    csvIds.push(line.split(',')[0]);
  }
  assert.equal(csvIds.length, phones.length);
  for (let i = 0; i < phones.length; i += 1) {
    assert.equal(csvIds[i], phones[i].id);
  }
});

test("getPhone('iphone-15-pro') is 146.6 x 70.6 x 8.25 mm and 187 g", () => {
  const phone = getPhone('iphone-15-pro');
  assert.equal(phone.height_mm, 146.6);
  assert.equal(phone.width_mm, 70.6);
  assert.equal(phone.depth_mm, 8.25);
  assert.equal(phone.weight_g, 187);
});

test("compare('iphone-16', 'iphone-duo').delta.width_mm is positive", () => {
  const result = compare('iphone-16', 'iphone-duo');
  assert.ok(result.delta.width_mm > 0);
});

test("findPhones('mini') returns at least 2", () => {
  const found = findPhones('mini');
  assert.ok(found.length >= 2);
});
