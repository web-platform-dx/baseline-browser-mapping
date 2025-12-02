#!/usr/bin/env node

import { parseArgs } from "node:util";
import { exit } from "node:process";

import { getCompatibleVersions } from "./index.js";

const args = process.argv.slice(2);

const { values } = parseArgs({
  args,
  options: {
    "target-year": { type: "string" },
    "widely-available-on-date": { type: "string" },
    "include-downstream-browsers": { type: "boolean" },
    "list-all-compatible-versions": { type: "boolean" },
    "include-kaios": { type: "boolean" },
    "suppress-warnings": { type: "boolean" },
    "override-last-updated": { type: "string" },
    help: { type: "boolean", short: "h" },
  },
  strict: true,
});

if (values.help) {
  console.log(
    `
Get Baseline Widely available browser versions or Baseline year browser versions.

Usage: baseline-browser-mapping [options]

Options:
      --target-year                   Pass a year between 2015 and the current year to get browser versions compatible 
                                      with all Newly Available features as of the end of the year specified.
      --widely-available-on-date      Pass a date in the format 'YYYY-MM-DD' to get versions compatible with Widely 
                                      available on the specified date.
      --include-downstream-browsers   Whether to include browsers that use the same engines as a core Baseline browser.
      --include-kaios                 Whether to include KaiOS in downstream browsers.  Requires --include-downstream-browsers.
      --list-all-compatible-versions  Whether to include only the minimum compatible browser versions or all compatible versions.
      --suppress-warnings             Supress potential warnings about data staleness when using a very recent feature cut off date.
      --override-last-updated         Override the last updated date for the baseline data for debugging purposes.
  -h, --help                          Show help

Examples:
  npx baseline-browser-mapping --target-year 2020
  npx baseline-browser-mapping --widely-available-on-date 2023-04-05
  npx baseline-browser-mapping --include-downstream-browsers
  npx baseline-browser-mapping --list-all-compatible-versions
`.trim(),
  );
  exit(0);
}

console.log(
  getCompatibleVersions({
    targetYear: values["target-year"]
      ? Number.parseInt(values["target-year"])
      : undefined,
    widelyAvailableOnDate: values["widely-available-on-date"],
    includeDownstreamBrowsers: values["include-downstream-browsers"],
    listAllCompatibleVersions: values["list-all-compatible-versions"],
    includeKaiOS: values["include-kaios"],
    suppressWarnings: values["suppress-warnings"],
    overrideLastUpdated: values["override-last-updated"]
      ? Number.parseInt(values["override-last-updated"])
      : undefined,
  }),
);
