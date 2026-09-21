export const CSV_COLUMNS = [
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
  'resolution_width_px',
  'resolution_height_px',
  'ppi',
  'url',
  'source_url',
  'dates_source_url',
];

function cellText(value) {
  if (value === null || value === '') {
    return '';
  }
  if (typeof value === 'number') {
    return JSON.stringify(value);
  }
  return value;
}

export function rowCells(phone) {
  return [
    cellText(phone.id),
    cellText(phone.product_id),
    cellText(phone.state),
    cellText(phone.name),
    phone.also_known_as.join(' | '),
    cellText(phone.family),
    cellText(phone.announced),
    cellText(phone.released),
    cellText(phone.height_mm),
    cellText(phone.width_mm),
    cellText(phone.depth_mm),
    cellText(phone.weight_g),
    cellText(phone.height_in),
    cellText(phone.width_in),
    cellText(phone.depth_in),
    cellText(phone.weight_oz),
    cellText(phone.display_in),
    cellText(phone.resolution_px.width),
    cellText(phone.resolution_px.height),
    cellText(phone.ppi),
    cellText(phone.url),
    cellText(phone.source_url),
    cellText(phone.dates_source_url),
  ];
}
