import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const bcdBrowsers = require("@mdn/browser-compat-data");
const otherBrowsers = require("../data/downstream-browsers.json");
import { features } from "web-features";

const dataInput = {
  bcdBrowsers: bcdBrowsers.browsers,
  otherBrowsers: otherBrowsers.browsers,
  features: features,
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
