import modify from "rollup-plugin-modify";
import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";
import terser from "@rollup/plugin-terser";

const replaceOutput = `const urls = ["https://cdn.jsdelivr.net/npm/@mdn/browser-compat-data", "https://cdn.jsdelivr.net/npm/baseline-browser-mapping/dist/data/downstream-browsers.json", "https://cdn.jsdelivr.net/npm/web-features/data.json"];
const [bcdBrowsers, otherBrowsers, webFeatures] = await Promise.all(urls.map(async url => {
  const resp = await fetch(url);
  return resp.json();
  }
));
const features = webFeatures.features;`;

export default [
  // Default export for node.js contexts
  {
    input: "src/index.ts",
    output: {
      format: "es",
      file: "dist/index.js",
    },
    plugins: [
      typescript({ tsconfig: "./tsconfig.json" }),
      modify({
        find: "../data",
        replace: "./data",
      }),
      copy({
        targets: [
          { src: "src/data/downstream-browsers.json", dest: "dist/data" },
        ],
      }),
    ],
  },
  // Fetch version that loads from web
  {
    input: "src/scripts/baseline-browser-versions.ts",
    output: {
      format: "es",
      file: "dist/baseline-browser-mapping.js",
    },
    plugins: [
      // Remove all the import statements that won't work in browser contexts
      modify({
        find: 'import { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\n',
        replace: "",
      }),
      modify({
        find: 'import { features } from "web-features";',
        replace: "",
      }),
      modify({
        find: 'const bcdBrowsers = require("@mdn/browser-compat-data");',
        replace: "",
      }),
      // And replace them with the fetch-based import code from above
      modify({
        find: 'const otherBrowsers = require("../data/downstream-browsers.json");',
        replace: replaceOutput,
      }),
      typescript({ tsconfig: "./tsconfig.json" }),
      terser(),
    ],
  },
];
