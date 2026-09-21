export interface IPhone {
  id: string;
  product_id: string;
  state?: 'folded' | 'unfolded';
  name: string;
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
  resolution_px: {
    width: number;
    height: number;
  };
  ppi?: number;
  compare_url: string;
  source_url: string;
  verified: string;
}

export interface Meta {
  schema_version: number;
  name: string;
  description: string;
  license: string;
  homepage: string;
  source: string;
  units: {
    length: string;
    mass: string;
    display: string;
  };
  count: number;
}

export interface Comparison {
  a: IPhone;
  b: IPhone;
  delta: {
    height_mm: number;
    width_mm: number;
    depth_mm: number;
    weight_g: number;
  };
}

export const phones: readonly IPhone[];
export const meta: Meta;
export function getPhone(id: string): IPhone | undefined;
export function findPhones(query: string): IPhone[];
export function compare(idA: string, idB: string): Comparison | undefined;
