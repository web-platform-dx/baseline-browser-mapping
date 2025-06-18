//@ts-ignore
import bcdBrowsers from "@mdn/browser-compat-data" assert { type: "json" };
//@ts-ignore
import otherBrowsers from "../data/downstream-browsers.json" assert { type: "json" };
import { features } from "web-features";

export { bcdBrowsers, otherBrowsers, features };
