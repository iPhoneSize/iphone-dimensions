# iphone-dimensions

Apple's published dimensions for every iPhone since the iPhone 7, as JSON, CSV and an npm package. Height, width, depth, weight, display size, resolution and pixel density, with the Apple page each row was checked against.

This is the data behind [iphonesize.com](https://iphonesize.com), which draws any of these phones next to each other at true scale in 3D. The full table is also a plain web page at [iphonesize.com/data](https://iphonesize.com/data).

| Phone | Height | Width | Depth | Weight | Display |
| --- | --- | --- | --- | --- | --- |
| iPhone Duo (closed) | 117.8 mm | 84.1 mm | 11.3 mm | 254 g | 5.4 in |
| iPhone Duo (open) | 117.8 mm | 164.6 mm | 5.2 mm | 254 g | 7.6 in |
| iPhone 18 Pro Max | 163.4 mm | 78 mm | 8.75 mm | 249 g | 6.9 in |
| iPhone 18 Pro | 150 mm | 71.9 mm | 8.75 mm | 211 g | 6.3 in |
| iPhone Air | 156.2 mm | 74.7 mm | 5.64 mm | 165 g | 6.5 in |
| iPhone 16 | 147.6 mm | 71.6 mm | 7.8 mm | 170 g | 6.1 in |
| iPhone 13 mini | 131.5 mm | 64.2 mm | 7.65 mm | 141 g | 5.4 in |
| iPhone SE (3rd generation) | 138.4 mm | 67.3 mm | 7.3 mm | 144 g | 4.7 in |
| iPhone 7 | 138.3 mm | 67.1 mm | 7.1 mm | 138 g | 4.7 in |

The folding iPhone Duo has two rows, one closed and one open. They share a `product_id`.

## Get the data

Straight from the site, with open CORS:

```
https://iphonesize.com/data/iphones.json
https://iphonesize.com/data/iphones.csv
```

From npm:

```
npm install iphone-dimensions
```

```js
import { phones, getPhone, findPhones, getProduct } from 'iphone-dimensions';

getPhone('iphone-15-pro');
// { name: 'iPhone 15 Pro', height_mm: 146.6, width_mm: 70.6, depth_mm: 8.25, weight_g: 187, ppi: 460, ... }

findPhones('17 air');      // finds "iPhone Air", which many people call the 17 Air
getProduct('iphone-duo');  // both Duo rows, closed first
```

Works with `import` and `require`, in Node 18 or later, and in bundlers and browsers. No dependencies. The raw files are exported too: `iphone-dimensions/data/iphones.json` and `iphone-dimensions/data/iphones.csv`.

## Fields

| Field | Meaning |
| --- | --- |
| `id` | Stable slug for the row |
| `product_id` | Same as `id`, except the Duo's two rows share one |
| `state` | `closed` or `open` for the Duo, `null` for every other phone |
| `name` | Apple's own marketing name |
| `also_known_as` | Other names people use, such as "iPhone 17 Air" for the iPhone Air |
| `family` | The generation the phone belongs to |
| `announced`, `released` | ISO dates, from Apple Newsroom. `released` is first availability |
| `height_mm`, `width_mm`, `depth_mm`, `weight_g` | As Apple publishes them |
| `height_in`, `width_in`, `depth_in`, `weight_oz` | Calculated from the metric values, 2 decimals |
| `display_in` | Apple's marketed display diagonal |
| `resolution_px`, `ppi` | Pixels, and Apple's stated pixel density |
| `url` | The phone's page on iphonesize.com |
| `source_url` | The Apple tech-specs page the measurements were checked against |
| `dates_source_url` | The Apple Newsroom page the dates were checked against |

Rows follow the site's lineup order. The top-level `verified` field is the date the measurements were last checked, and `notes` repeats the caveats below in machine-readable form.

## Where the numbers come from

The metric measurements, display size, resolution and pixel density are the values Apple publishes on its tech-specs pages at apple.com and support.apple.com. The dates come from Apple Newsroom. Each row links to both.

Three things are ours, not Apple's. The `id` slugs are ours. The inch and ounce values are calculated from Apple's metric figures, so they can differ from Apple's own rounded imperial numbers by 0.01. And `ppi` is Apple's stated figure, which can differ by a few pixels per inch from what you get by dividing the resolution by the marketed diagonal, because the marketed diagonal is rounded.

Depth is the body only. Apple's consumer tech-specs pages do not list how far the camera protrudes, and this dataset leaves out anything measured or estimated.

**Do not use this to make cases or accessories.** It has no tolerances, button positions, port locations or camera keep-outs. Apple publishes [dimensional drawings](https://developer.apple.com/accessories/dimensional-drawings/) for that.

## Corrections and updates

The files in `data/` and `dist/` are generated. `data/` is copied from the iphonesize.com build with `npm run sync`, which validates both files before replacing them as a pair, and `dist/` is built from `data/`. Please do not edit either by hand in a pull request. If a number is wrong, open an issue with a link to the Apple page and it gets fixed at the source.

Versions follow semver: a patch is a corrected fact or a docs change, a minor adds phones or optional fields, and a major removes or renames a field or changes what one means. New iPhones are added once Apple's spec page is up and checked.

## Licence

The code is MIT licensed. The data is a table of facts Apple publishes, and you are free to use it for anything. This licence cannot grant rights that belong to Apple, and nothing here is Apple's text or imagery. If you publish something built on it, a link back to [iphonesize.com](https://iphonesize.com) is appreciated.

Not affiliated with Apple. iPhone is a trademark of Apple Inc.
