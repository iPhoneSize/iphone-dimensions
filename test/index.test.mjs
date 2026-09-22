import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseCsv } from '../scripts/csv.mjs';
import { CSV_COLUMNS, rowCells } from '../scripts/table.mjs';
import { findPhones, getByIdentifier, getByModelNumber, getPhone, getProduct, meta, phones } from '../dist/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(join(root, 'data', 'iphones.json'), 'utf8'));

function round2(value) {
  return Math.round(value * 100) / 100;
}

function isIsoDate(value) {
  if (typeof value !== 'string' || value.length !== 10) {
    return false;
  }
  const parts = value.split('-');
  if (parts.length !== 3) {
    return false;
  }
  if (parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2) {
    return false;
  }
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 1) {
      const code = part.charCodeAt(i);
      if (code < 48 || code > 57) {
        return false;
      }
    }
  }
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function appleHost(url) {
  const hostname = new URL(url).hostname;
  return hostname === 'www.apple.com' || hostname === 'support.apple.com';
}

test('count matches the phone list', () => {
  assert.equal(raw.schema_version, 2);
  assert.equal(meta.schema_version, 2);
  assert.equal(raw.count, 56);
  assert.equal(raw.phones.length, 56);
  assert.equal(raw.site_models_count, 43);
  assert.equal(raw.historic_count, 13);
  assert.equal(meta.site_models_count, 43);
  assert.equal(meta.historic_count, 13);
  assert.equal(raw.count, raw.phones.length);
  assert.equal(meta.count, phones.length);
  assert.equal(phones.length, raw.phones.length);
  assert.equal(typeof meta.license_url, 'string');
  assert.equal(meta.license_url.length > 0, true);
});

test('every id is unique', () => {
  const ids = raw.phones.map((phone) => phone.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every CSV cell matches the JSON value', () => {
  const csv = readFileSync(join(root, 'data', 'iphones.csv'), 'utf8');
  const rows = parseCsv(csv);
  assert.deepEqual(rows[0], CSV_COLUMNS);
  assert.equal(rows.length - 1, raw.phones.length);
  for (let i = 0; i < raw.phones.length; i += 1) {
    const phone = raw.phones[i];
    const actual = rows[i + 1];
    const expected = rowCells(phone);
    assert.equal(actual.length, expected.length, phone.id);
    for (let column = 0; column < expected.length; column += 1) {
      assert.equal(actual[column], expected[column], `${phone.id} ${CSV_COLUMNS[column]}`);
    }
  }
});

test('CSV parser keeps quoted commas, quotes, and line breaks', () => {
  const rows = parseCsv('"a,b","say ""hi""","line1\nline2"\r\nplain,x,y\n');
  assert.deepEqual(rows, [
    ['a,b', 'say "hi"', 'line1\nline2'],
    ['plain', 'x', 'y'],
  ]);
});

test('inches and ounces match the metric conversion', () => {
  for (const phone of raw.phones) {
    assert.equal(phone.height_in, round2(phone.height_mm / 25.4), phone.id);
    assert.equal(phone.width_in, round2(phone.width_mm / 25.4), phone.id);
    assert.equal(phone.depth_in, round2(phone.depth_mm / 25.4), phone.id);
    assert.equal(phone.weight_oz, round2(phone.weight_g / 28.3495), phone.id);
  }
});

test('announced and released are ISO dates in order', () => {
  for (const phone of raw.phones) {
    assert.equal(isIsoDate(phone.announced), true, phone.id);
    assert.equal(isIsoDate(phone.released), true, phone.id);
    assert.equal(phone.announced <= phone.released, true, phone.id);
  }
});

test('source URLs are Apple hosts', () => {
  for (const phone of raw.phones) {
    assert.equal(appleHost(phone.source_url), true, `${phone.id} ${phone.source_url}`);
    assert.equal(appleHost(phone.dates_source_url), true, `${phone.id} ${phone.dates_source_url}`);
  }
});

test('url is null only on historic rows', () => {
  assert.equal(raw.site_models_count + raw.historic_count, raw.phones.length);
  for (let i = 0; i < raw.phones.length; i += 1) {
    const phone = raw.phones[i];
    if (i < raw.site_models_count) {
      assert.equal(typeof phone.url, 'string', phone.id);
      assert.equal(phone.url.startsWith('https://iphonesize.com/'), true, phone.id);
    } else {
      assert.equal(phone.url, null, phone.id);
    }
  }
});

test('every phone has identifier arrays and an allowed source', () => {
  for (const phone of raw.phones) {
    assert.equal(Array.isArray(phone.model_identifiers), true, phone.id);
    assert.equal(Array.isArray(phone.model_numbers), true, phone.id);
    for (const identifier of phone.model_identifiers) {
      assert.equal(typeof identifier, 'string', phone.id);
    }
    for (const modelNumber of phone.model_numbers) {
      assert.equal(typeof modelNumber, 'string', phone.id);
    }
    assert.equal(
      phone.model_identifiers_source === 'apple' || phone.model_identifiers_source === 'secondary',
      true,
      phone.id,
    );
  }
});

test('iPhone Duo rows share product, height, and weight', () => {
  const rows = raw.phones.filter((phone) => phone.product_id === 'iphone-duo');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].product_id, rows[1].product_id);
  assert.equal(rows[0].height_mm, rows[1].height_mm);
  assert.equal(rows[0].weight_g, rows[1].weight_g);
  assert.equal(rows[0].state, 'closed');
  assert.equal(rows[1].state, 'open');
});

test('iphone-15-pro is 146.6 x 70.6 x 8.25 mm, 187 g, 460 ppi', () => {
  const phone = getPhone('iphone-15-pro');
  assert.equal(phone.height_mm, 146.6);
  assert.equal(phone.width_mm, 70.6);
  assert.equal(phone.depth_mm, 8.25);
  assert.equal(phone.weight_g, 187);
  assert.equal(phone.ppi, 460);
});

test('iphone-17e was announced 2026-03-02 and released 2026-03-11', () => {
  const phone = getPhone('iphone-17e');
  assert.equal(phone.announced, '2026-03-02');
  assert.equal(phone.released, '2026-03-11');
});

test('iphone-xr was announced 2018-09-12', () => {
  const phone = getPhone('iphone-xr');
  assert.equal(phone.announced, '2018-09-12');
  assert.equal(phone.height_mm, 150.9);
  assert.equal(phone.width_mm, 75.7);
  assert.equal(phone.depth_mm, 8.3);
  assert.equal(phone.weight_g, 194);
});

test('iphone-12-mini was released 2020-11-13', () => {
  const phone = getPhone('iphone-12-mini');
  assert.equal(phone.released, '2020-11-13');
  assert.equal(phone.height_mm, 131.5);
  assert.equal(phone.width_mm, 64.2);
  assert.equal(phone.depth_mm, 7.4);
  assert.equal(phone.weight_g, 135);
});

test('iphone-14-plus was released 2022-10-07', () => {
  const phone = getPhone('iphone-14-plus');
  assert.equal(phone.released, '2022-10-07');
  assert.equal(phone.height_mm, 160.8);
  assert.equal(phone.width_mm, 78.1);
  assert.equal(phone.depth_mm, 7.8);
  assert.equal(phone.weight_g, 203);
});

test('iphone-17-air is named iPhone Air', () => {
  const phone = getPhone('iphone-17-air');
  assert.equal(phone.name, 'iPhone Air');
  assert.equal(phone.also_known_as.includes('iPhone 17 Air'), true);
});

test('iphone-7 is 138.3 x 67.1 x 7.1 mm and 138 g', () => {
  const phone = getPhone('iphone-7');
  assert.equal(phone.height_mm, 138.3);
  assert.equal(phone.width_mm, 67.1);
  assert.equal(phone.depth_mm, 7.1);
  assert.equal(phone.weight_g, 138);
  assert.equal(phone.announced, '2016-09-07');
});

test('ESM and CommonJS builds return the same phone count', () => {
  const result = spawnSync(process.execPath, [
    '-e',
    "console.log(require('./dist/index.cjs').phones.length)",
  ], {
    cwd: root,
    encoding: 'utf8',
    timeout: 1000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), String(phones.length));
});

test("findPhones('17 air') finds iphone-17-air", () => {
  const found = findPhones('17 air');
  const ids = found.map((phone) => phone.id);
  assert.equal(ids.includes('iphone-17-air'), true);
});

test("getProduct('iphone-duo') returns closed then open", () => {
  const rows = getProduct('iphone-duo');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].state, 'closed');
  assert.equal(rows[1].state, 'open');
  assert.equal(rows[0].id, 'iphone-duo');
});

test('iphone-2007 is 115 x 61 x 11.6 mm, 135 g, released 2007-06-29', () => {
  const phone = getPhone('iphone-2007');
  assert.equal(phone.height_mm, 115);
  assert.equal(phone.width_mm, 61);
  assert.equal(phone.depth_mm, 11.6);
  assert.equal(phone.weight_g, 135);
  assert.equal(phone.released, '2007-06-29');
  assert.equal(phone.model_identifiers_source, 'secondary');
});

test("getByIdentifier('iPhone16,1') is iphone-15-pro", () => {
  const phone = getByIdentifier('iPhone16,1');
  assert.equal(phone.id, 'iphone-15-pro');
});

test("getByModelNumber('A3101') is iphone-15-pro", () => {
  assert.equal(getByModelNumber('A3101').id, 'iphone-15-pro');
  assert.equal(getByModelNumber('a3101').id, 'iphone-15-pro');
});

test("findPhones matches a model identifier and an A-number", () => {
  const byIdentifier = findPhones('iPhone16,1').map((phone) => phone.id);
  const byNumber = findPhones('A3101').map((phone) => phone.id);
  assert.equal(byIdentifier.includes('iphone-15-pro'), true);
  assert.equal(byNumber.includes('iphone-15-pro'), true);
});

test('mutation of a phone throws in strict mode', () => {
  const phone = getPhone('iphone-15-pro');
  assert.equal(Object.isFrozen(phone), true);
  assert.equal(Object.isFrozen(phone.resolution_px), true);
  assert.equal(Object.isFrozen(phone.also_known_as), true);
  assert.equal(Object.isFrozen(phone.model_identifiers), true);
  assert.equal(Object.isFrozen(phone.model_numbers), true);
  assert.equal(Object.isFrozen(meta), true);
  assert.throws(() => {
    phone.name = 'changed';
  }, TypeError);
});

test('dist/data.js has no node: import', () => {
  const source = readFileSync(join(root, 'dist', 'data.js'), 'utf8');
  assert.equal(source.includes('node:'), false);
});
