const urls: { jsdelivr: string; unpkg: string; packageName: string }[] = [
  {
    jsdelivr: "https://cdn.jsdelivr.net/npm/@mdn/browser-compat-data",
    unpkg: "https://unpkg.com/@mdn/browser-compat-data",
    packageName: "@mdn/browser-compat-data",
  },
  {
    jsdelivr:
      "https://cdn.jsdelivr.net/npm/baseline-browser-mapping/dist/data/downstream-browsers.json",
    unpkg:
      "https://unpkg.com/baseline-browser-mapping/dist/data/downstream-browsers.json",
    packageName: "../data/downstream-browsers.json",
  },
  {
    jsdelivr: "https://cdn.jsdelivr.net/npm/web-features/data.json",
    unpkg: "https://unpkg.com/web-features/data.json",
    packageName: "web-features",
  },
];

let failed = false;

let [bcdBrowsers, otherBrowsers, features]: any = await Promise.all(
  urls.map(async ({ jsdelivr, unpkg, packageName }) => {
    let response;
    try {
      response = await fetch(jsdelivr);
      // return response;
    } catch {
      console.error(
        `There was a problem requesting data from jsdelivr for ${packageName}`,
      );
    }
    if (response?.ok) {
      return response.json();
    }
    try {
      response = await fetch(unpkg);
      // return response;
    } catch {
      console.error(
        `There was a problem requesting data from unpkg for ${packageName}`,
      );
    }
    if (response?.ok) {
      return response.json();
    } else {
      failed = true;
      return "failed";
    }
  }),
);

if (failed && typeof window != "undefined") {
  throw new Error(
    "could not import critical resources from network, please check network traffic for failed requests.",
  );
}

const dataInput = {
  bcdBrowsers: bcdBrowsers.browsers,
  otherBrowsers: otherBrowsers.browsers,
  features: features.features,
};

import {
  getCompatibleVersionsBase,
  getAllVersionsBase,
  Options,
  AllVersionsOptions,
} from "./scripts/baseline-browser-versions.js";

/**
 * Returns browser versions compatible with specified Baseline targets.
 * Defaults to returning the minimum versions of the core browser set that support Baseline Widely available.
 * Takes an optional configuraation object `Object` with four optional properties:
 * - `listAllCompatibleVersions`: `false` (default) or `false`
 * - `includeDownstreamBrowsers`: `false` (default) or `false`
 * - `widelyAvailableOnDate`: date in format `YYYY-MM-DD`
 * - `targetYear`: year in format `YYYY`
 */
const getCompatibleVersions = (userInput: Options) => {
  return getCompatibleVersionsBase(dataInput, userInput);
};

/**
 * Returns all browser versions known to this module with their level of Baseline support either as an `Array` or a `String` CSV.
 * Takes an object as an argument with two optional properties:
 * - `includeDownstreamBrowsers`: `true` (default) or `false`
 * - `outputFormat`: `array` (default), `object` or `csv`
 */
const getAllVersions = (userInput: AllVersionsOptions) => {
  return getAllVersionsBase(dataInput, userInput);
};

export { getCompatibleVersions, getAllVersions };
