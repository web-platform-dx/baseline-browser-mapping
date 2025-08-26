import { getAllVersions } from "../src/index";

import { writeFileSync } from "fs";

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
  "./static/all_versions_array_with_supports.json",
  JSON.stringify(getAllVersions({ useSupports: true })),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/all_versions_object_with_supports.json",
  JSON.stringify(
    getAllVersions({
      outputFormat: "object",
      useSupports: true,
    }),
  ),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/all_versions_with_supports.csv",
  getAllVersions({
    outputFormat: "csv",
    useSupports: true,
  }).toString(),
  { encoding: "utf-8" },
);

// Write with downstream versions
writeFileSync(
  "./static/with_downstream/all_versions_array.json",
  JSON.stringify(
    getAllVersions({
      includeDownstreamBrowsers: true,
      includeKaiOS: true,
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
      includeKaiOS: true,
    }),
  ),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/with_downstream/all_versions.csv",
  getAllVersions({
    outputFormat: "csv",
    includeDownstreamBrowsers: true,
    includeKaiOS: true,
  }).toString(),
  { encoding: "utf-8" },
);

writeFileSync(
  "./static/with_downstream/all_versions_array_with_supports.json",
  JSON.stringify(
    getAllVersions({
      includeDownstreamBrowsers: true,
      includeKaiOS: true,
      useSupports: true,
    }),
  ),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/with_downstream/all_versions_object_with_supports.json",
  JSON.stringify(
    getAllVersions({
      outputFormat: "object",
      includeDownstreamBrowsers: true,
      includeKaiOS: true,
      useSupports: true,
    }),
  ),
  { encoding: "utf-8" },
);
writeFileSync(
  "./static/with_downstream/all_versions_with_supports.csv",
  getAllVersions({
    outputFormat: "csv",
    includeDownstreamBrowsers: true,
    includeKaiOS: true,
    useSupports: true,
  }).toString(),
  { encoding: "utf-8" },
);

console.log("finished running refresh-static");
