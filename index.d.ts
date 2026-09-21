export interface ResolutionPx {
  readonly width: number;
  readonly height: number;
}

export interface IPhone {
  id: string;
  product_id: string;
  state: 'closed' | 'open' | null;
  name: string;
  also_known_as: readonly string[];
  family: string;
  announced: string;
  released: string;
  height_mm: number;
  width_mm: number;
  depth_mm: number;
  weight_g: number;
  height_in: number;
  width_in: number;
  depth_in: number;
  weight_oz: number;
  display_in: number;
  resolution_px: ResolutionPx;
  ppi: number;
  url: string;
  source_url: string;
  dates_source_url: string;
}

export interface Units {
  readonly length: 'mm';
  readonly mass: 'g';
  readonly display: 'in';
}

export interface Meta {
  schema_version: 1;
  name: string;
  description: string;
  license: string;
  homepage: string;
  source: string;
  units: Units;
  verified: string;
  notes: readonly string[];
  count: number;
}

export const phones: readonly IPhone[];
export const meta: Meta;
export function getPhone(id: string): IPhone | undefined;
export function findPhones(query: string): IPhone[];
export function getProduct(productId: string): IPhone[];
