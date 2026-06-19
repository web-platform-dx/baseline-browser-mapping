import { getAllVersions, getCompatibleVersions } from "./dist/index2.js";

console.log(
  getAllVersions({
    includeDownstreamBrowsers: true,
    includeKaiOS: true,
    outputFormat: "csv",
  }),
);
