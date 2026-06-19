import { getAllVersions, getCompatibleVersions } from "./dist/index.js";
import bcd from "@mdn/browser-compat-data" with { type: "json" };

console.log(
  getAllVersions({
    includeDownstreamBrowsers: true,
    includeKaiOS: true,
    outputFormat: "csv",
  }),
);

// console.log(bcd.browsers.chrome.releases);
