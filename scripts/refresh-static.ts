import { getAllVersions } from "../src/scripts/baseline-browser-versions";

import { readFileSync, writeFileSync } from "fs";

// Write core versions
writeFileSync(
  "./static/all_versions_array.json",
  JSON.stringify(getAllVersions()),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/all_versions_object.json",
  JSON.stringify(getAllVersions({ outputFormat: "object" })),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/all_versions.csv",
  getAllVersions({ outputFormat: "csv" }).toString(),
  { encoding: "utf-8" },
);

writeFileSync(
  "./static/all_versions_array_with_na.json",
  JSON.stringify(getAllVersions({ includeNewlyAvailable: true })),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/all_versions_object_with_na.json",
  JSON.stringify(
    getAllVersions({
      outputFormat: "object",
      includeNewlyAvailable: true,
    }),
  ),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/all_versions_with_na.csv",
  getAllVersions({
    outputFormat: "csv",
    includeNewlyAvailable: true,
  }).toString(),
  { encoding: "utf-8" },
);

// Write with downstream versions
writeFileSync(
  "./static/with_downstream/all_versions_array.json",
  JSON.stringify(
    getAllVersions({
      includeDownstreamBrowsers: true,
    }),
  ),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/with_downstream/all_versions_object.json",
  JSON.stringify(
    getAllVersions({
      outputFormat: "object",
      includeDownstreamBrowsers: true,
    }),
  ),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/with_downstream/all_versions.csv",
  getAllVersions({
    outputFormat: "csv",
    includeDownstreamBrowsers: true,
  }).toString(),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/with_downstream/all_versions_array_with_na.json",
  JSON.stringify(
    getAllVersions({
      includeDownstreamBrowsers: true,
      includeNewlyAvailable: true,
    }),
  ),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/with_downstream/all_versions_object_with_na.json",
  JSON.stringify(
    getAllVersions({
      outputFormat: "object",
      includeDownstreamBrowsers: true,
      includeNewlyAvailable: true,
    }),
  ),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/with_downstream/all_versions_with_na.csv",
  getAllVersions({
    outputFormat: "csv",
    includeDownstreamBrowsers: true,
    includeNewlyAvailable: true,
  }).toString(),
  { encoding: "utf-8" },
);
