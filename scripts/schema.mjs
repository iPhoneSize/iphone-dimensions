const TOP_KEYS = [
  'schema_version',
  'name',
  'description',
  'license',
  'license_url',
  'homepage',
  'source',
  'verified',
  'notes',
  'units',
  'count',
  'site_models_count',
  'historic_count',
  'phones',
];

const PHONE_KEYS = [
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
  'model_identifiers',
  'model_numbers',
  'model_identifiers_source',
];

const NUMBER_KEYS = [
  'height_mm',
  'width_mm',
  'depth_mm',
  'weight_g',
  'height_in',
  'width_in',
  'depth_in',
  'weight_oz',
  'display_in',
  'ppi',
];

const STRING_KEYS = [
  'id',
  'product_id',
  'name',
  'family',
  'announced',
  'released',
  'source_url',
  'dates_source_url',
];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sameKeySet(value, expected) {
  const keys = Object.keys(value);
  if (keys.length !== expected.length) {
    return false;
  }
  for (const key of expected) {
    if (!Object.hasOwn(value, key)) {
      return false;
    }
  }
  return true;
}

function isWholeNumber(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function validateStringArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  for (let i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== 'string') {
      throw new Error(`${label}[${i}] must be a string`);
    }
  }
}

export function validateDataset(data) {
  if (!isPlainObject(data)) {
    throw new Error('Dataset must be an object');
  }
  if (!sameKeySet(data, TOP_KEYS)) {
    throw new Error('Dataset keys do not match schema_version 2');
  }
  if (data.schema_version !== 2) {
    throw new Error(`Unexpected schema_version: ${data.schema_version}`);
  }
  for (const key of ['name', 'description', 'license', 'license_url', 'homepage', 'source', 'verified']) {
    if (typeof data[key] !== 'string') {
      throw new Error(`${key} must be a string`);
    }
  }
  if (!Array.isArray(data.notes)) {
    throw new Error('notes must be an array');
  }
  for (let i = 0; i < data.notes.length; i += 1) {
    if (typeof data.notes[i] !== 'string') {
      throw new Error(`notes[${i}] must be a string`);
    }
  }
  if (!isPlainObject(data.units) || !sameKeySet(data.units, ['length', 'mass', 'display'])) {
    throw new Error('units must be length, mass, and display');
  }
  if (data.units.length !== 'mm' || data.units.mass !== 'g' || data.units.display !== 'in') {
    throw new Error('units must be mm, g, and in');
  }
  if (!Array.isArray(data.phones) || data.phones.length === 0) {
    throw new Error('phones must be a non-empty array');
  }
  if (data.count !== data.phones.length) {
    throw new Error(`count ${data.count} does not match phones.length ${data.phones.length}`);
  }
  if (!isWholeNumber(data.site_models_count)) {
    throw new Error('site_models_count must be a non-negative integer');
  }
  if (!isWholeNumber(data.historic_count)) {
    throw new Error('historic_count must be a non-negative integer');
  }
  if (data.site_models_count + data.historic_count !== data.phones.length) {
    throw new Error(
      `site_models_count ${data.site_models_count} + historic_count ${data.historic_count} does not match phones.length ${data.phones.length}`,
    );
  }

  const seen = new Set();
  for (let i = 0; i < data.phones.length; i += 1) {
    validatePhone(data.phones[i], i, seen, data.site_models_count);
  }
}

function validatePhone(phone, index, seen, siteModelsCount) {
  const label = `phones[${index}]`;
  if (!isPlainObject(phone)) {
    throw new Error(`${label} must be an object`);
  }
  if (!sameKeySet(phone, PHONE_KEYS)) {
    throw new Error(`${label} keys do not match the phone schema`);
  }
  for (const key of STRING_KEYS) {
    if (typeof phone[key] !== 'string') {
      throw new Error(`${label}.${key} must be a string`);
    }
  }
  const historic = index >= siteModelsCount;
  if (phone.url === null) {
    if (!historic) {
      throw new Error(`${label}.url must be a string on a site row`);
    }
  } else if (typeof phone.url !== 'string') {
    throw new Error(`${label}.url must be a string or null`);
  }
  if (phone.state !== 'closed' && phone.state !== 'open' && phone.state !== null) {
    throw new Error(`${label}.state must be closed, open, or null`);
  }
  validateStringArray(phone.also_known_as, `${label}.also_known_as`);
  validateStringArray(phone.model_identifiers, `${label}.model_identifiers`);
  validateStringArray(phone.model_numbers, `${label}.model_numbers`);
  if (phone.model_identifiers_source !== 'apple' && phone.model_identifiers_source !== 'secondary') {
    throw new Error(`${label}.model_identifiers_source must be apple or secondary`);
  }
  for (const key of NUMBER_KEYS) {
    if (typeof phone[key] !== 'number' || !Number.isFinite(phone[key])) {
      throw new Error(`${label}.${key} must be a finite number`);
    }
  }
  if (!isPlainObject(phone.resolution_px) || !sameKeySet(phone.resolution_px, ['width', 'height'])) {
    throw new Error(`${label}.resolution_px must be width and height`);
  }
  if (typeof phone.resolution_px.width !== 'number' || !Number.isFinite(phone.resolution_px.width)) {
    throw new Error(`${label}.resolution_px.width must be a finite number`);
  }
  if (typeof phone.resolution_px.height !== 'number' || !Number.isFinite(phone.resolution_px.height)) {
    throw new Error(`${label}.resolution_px.height must be a finite number`);
  }
  if (phone.id.length === 0) {
    throw new Error(`${label}.id must not be empty`);
  }
  if (seen.has(phone.id)) {
    throw new Error(`Duplicate id ${phone.id}`);
  }
  seen.add(phone.id);
}

export function validateCsvRows(rows, phones) {
  if (rows.length === 0) {
    throw new Error('CSV is empty');
  }
  let idIndex = -1;
  for (let i = 0; i < rows[0].length; i += 1) {
    if (rows[0][i] === 'id') {
      if (idIndex !== -1) {
        throw new Error('CSV has more than one id column');
      }
      idIndex = i;
    }
  }
  if (idIndex === -1) {
    throw new Error('CSV has no id column');
  }
  const dataRows = rows.slice(1);
  if (dataRows.length !== phones.length) {
    throw new Error(`CSV has ${dataRows.length} rows and JSON has ${phones.length}`);
  }
  for (let i = 0; i < dataRows.length; i += 1) {
    if (dataRows[i].length !== rows[0].length) {
      throw new Error(`CSV row ${i + 2} has ${dataRows[i].length} columns`);
    }
    if (dataRows[i][idIndex] !== phones[i].id) {
      throw new Error(`CSV id ${dataRows[i][idIndex]} does not match JSON id ${phones[i].id}`);
    }
  }
}
