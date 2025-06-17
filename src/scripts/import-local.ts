// import { createRequire } from "node:module";
// const require = createRequire(import.meta.url);

import bcdBrowsers from "@mdn/browser-compat-data" with { type: "json" };
import otherBrowsers from "./downstream-browsers.js";
import { features } from "web-features";

export { bcdBrowsers, otherBrowsers, features };
