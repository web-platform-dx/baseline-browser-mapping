// import { createRequire } from "node:module";
// const require = createRequire(import.meta.url);

import bcdBrowsers from "@mdn/browser-compat-data" with { type: "json" };
import otherBrowsers from "../data/downstream-browsers.json" with { type: "json" };
import { features } from "web-features";

export { bcdBrowsers, otherBrowsers, features };
