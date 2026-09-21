import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dataset = require('./data/iphones.json');

const { phones: phoneList, ...rest } = dataset;

export const phones = Object.freeze(phoneList);
export const meta = rest;

export function getPhone(id) {
  for (const phone of phones) {
    if (phone.id === id) {
      return phone;
    }
  }
  return undefined;
}

export function findPhones(query) {
  const needle = query.toLowerCase();
  const matches = [];
  for (const phone of phones) {
    if (
      phone.name.toLowerCase().includes(needle) ||
      phone.id.toLowerCase().includes(needle)
    ) {
      matches.push(phone);
    }
  }
  return matches;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

export function compare(idA, idB) {
  const a = getPhone(idA);
  const b = getPhone(idB);
  if (a === undefined || b === undefined) {
    return undefined;
  }
  return {
    a,
    b,
    delta: {
      height_mm: round2(b.height_mm - a.height_mm),
      width_mm: round2(b.width_mm - a.width_mm),
      depth_mm: round2(b.depth_mm - a.depth_mm),
      weight_g: round2(b.weight_g - a.weight_g),
    },
  };
}
