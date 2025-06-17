//@ts-ignore
import bcdBrowsers from "@mdn/browser-compat-data" assert { type: "json" };
import otherBrowsers from "./downstream-browsers.js";
import { features } from "web-features";

export { bcdBrowsers, otherBrowsers, features };
